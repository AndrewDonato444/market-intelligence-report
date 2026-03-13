/**
 * Agent Output Schema + Validation
 *
 * Defines a unified schema for all agent outputs, validates pipeline
 * results, and assembles them into an ordered ReportData object for
 * downstream consumers (report templates, PDF renderer).
 *
 * SECTION_REGISTRY = v1 (5-agent pipeline, 8 sections)
 * SECTION_REGISTRY_V2 = v2 (4-layer pipeline, 9 sections)
 */

import type { AgentResult, SectionOutput } from "@/lib/agents/orchestrator";
import type { DataAnalystOutput } from "@/lib/agents/data-analyst";

// --- Section Registry ---

export interface SectionRegistryEntry {
  sectionType: string;
  sourceAgent: string;
  required: boolean;
  reportOrder: number;
}

export const SECTION_REGISTRY: SectionRegistryEntry[] = [
  {
    sectionType: "market_overview",
    sourceAgent: "insight-generator",
    required: true,
    reportOrder: 1,
  },
  {
    sectionType: "executive_summary",
    sourceAgent: "insight-generator",
    required: true,
    reportOrder: 2,
  },
  {
    sectionType: "key_drivers",
    sourceAgent: "insight-generator",
    required: true,
    reportOrder: 3,
  },
  {
    sectionType: "competitive_market_analysis",
    sourceAgent: "competitive-analyst",
    required: false,
    reportOrder: 4,
  },
  {
    sectionType: "forecasts",
    sourceAgent: "forecast-modeler",
    required: false,
    reportOrder: 5,
  },
  {
    sectionType: "strategic_summary",
    sourceAgent: "forecast-modeler",
    required: false,
    reportOrder: 6,
  },
  {
    sectionType: "polished_report",
    sourceAgent: "polish-agent",
    required: false,
    reportOrder: 7,
  },
  {
    sectionType: "methodology",
    sourceAgent: "polish-agent",
    required: false,
    reportOrder: 8,
  },
];

/**
 * v2 Section Registry — 9-section report (4-layer pipeline)
 *
 * Source is "assembler" for data-only sections (filled by report-assembler
 * from ComputedAnalytics) or the agent that provides the narrative.
 */
export const SECTION_REGISTRY_V2: SectionRegistryEntry[] = [
  { sectionType: "executive_briefing", sourceAgent: "assembler", required: true, reportOrder: 1 },
  { sectionType: "market_insights_index", sourceAgent: "assembler", required: true, reportOrder: 2 },
  { sectionType: "luxury_market_dashboard", sourceAgent: "assembler", required: true, reportOrder: 3 },
  { sectionType: "neighborhood_intelligence", sourceAgent: "assembler", required: true, reportOrder: 4 },
  { sectionType: "the_narrative", sourceAgent: "insight-generator", required: true, reportOrder: 5 },
  { sectionType: "forward_look", sourceAgent: "forecast-modeler", required: false, reportOrder: 6 },
  { sectionType: "comparative_positioning", sourceAgent: "assembler", required: true, reportOrder: 7 },
  { sectionType: "persona_intelligence", sourceAgent: "persona-intelligence", required: false, reportOrder: 8 },
];

// --- Report Data ---

export interface ReportData {
  sections: SectionOutput[];
  pullQuotes: Array<{ text: string; source: string }>;
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  generatedAt: string;
  totalDurationMs: number;
  agentDurations: Record<string, number>;
  confidence: {
    level: string;
    sampleSize: number;
    staleDataSources: string[];
  };
}

// --- Validation ---

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidateOptions {
  allowPartial?: boolean;
}

/**
 * Validates that all expected sections are present in the pipeline output.
 */
export function validatePipelineOutput(
  results: Record<string, AgentResult>,
  options: ValidateOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Collect all sections from all agents
  const allSections = new Map<string, SectionOutput>();
  for (const result of Object.values(results)) {
    for (const section of result.sections) {
      // Prefer sections from the primary source agent
      const registry = SECTION_REGISTRY.find(
        (r) => r.sectionType === section.sectionType
      );
      if (registry) {
        const existing = allSections.get(section.sectionType);
        if (
          !existing ||
          result.agentName === registry.sourceAgent
        ) {
          allSections.set(section.sectionType, section);
        }
      } else {
        allSections.set(section.sectionType, section);
      }
    }
  }

  // Check for missing sections
  for (const entry of SECTION_REGISTRY) {
    if (!allSections.has(entry.sectionType)) {
      if (entry.required) {
        errors.push(
          `Missing required section: ${entry.sectionType} (from ${entry.sourceAgent})`
        );
      } else if (!options.allowPartial) {
        errors.push(
          `Missing section: ${entry.sectionType} (from ${entry.sourceAgent})`
        );
      } else {
        warnings.push(
          `Missing optional section: ${entry.sectionType} (from ${entry.sourceAgent})`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// --- Assembly ---

/**
 * Assembles validated agent results into an ordered ReportData object.
 */
export function assembleReport(
  results: Record<string, AgentResult>
): ReportData {
  // Collect all sections, deduplicating by sectionType
  // Prefer the primary source agent for each section type
  const sectionMap = new Map<string, SectionOutput>();

  // First pass: add all sections
  for (const result of Object.values(results)) {
    for (const section of result.sections) {
      const registry = SECTION_REGISTRY.find(
        (r) => r.sectionType === section.sectionType
      );

      if (registry) {
        const existing = sectionMap.get(section.sectionType);
        if (!existing || result.agentName === registry.sourceAgent) {
          sectionMap.set(section.sectionType, section);
        }
      } else {
        // Unknown section — include as-is
        sectionMap.set(section.sectionType, section);
      }
    }
  }

  // Order sections by registry order, then unknown sections last
  const orderedSections = [...sectionMap.values()].sort((a, b) => {
    const aEntry = SECTION_REGISTRY.find(
      (r) => r.sectionType === a.sectionType
    );
    const bEntry = SECTION_REGISTRY.find(
      (r) => r.sectionType === b.sectionType
    );
    const aOrder = aEntry?.reportOrder ?? 999;
    const bOrder = bEntry?.reportOrder ?? 999;
    return aOrder - bOrder;
  });

  // Extract pull quotes from polish agent
  let pullQuotes: Array<{ text: string; source: string }> = [];
  const polishResult = results["polish-agent"];
  if (polishResult) {
    const polishedSection = polishResult.sections.find(
      (s) => s.sectionType === "polished_report"
    );
    if (polishedSection) {
      const content = polishedSection.content as {
        pullQuotes?: Array<{ text: string; source: string }>;
      };
      pullQuotes = content.pullQuotes ?? [];
    }
  }

  // Collect metadata
  const agentDurations: Record<string, number> = {};
  let totalDurationMs = 0;
  for (const [agentName, result] of Object.entries(results)) {
    agentDurations[agentName] = result.durationMs;
    totalDurationMs += result.durationMs;
  }

  // Extract confidence from data analyst
  const dataAnalystResult = results["data-analyst"];
  const analysis = dataAnalystResult?.metadata
    ?.analysis as DataAnalystOutput | undefined;

  const confidence = analysis?.confidence
    ? {
        level: analysis.confidence.level,
        sampleSize: analysis.confidence.sampleSize,
        staleDataSources: analysis.confidence.staleDataSources,
      }
    : {
        level: "unknown",
        sampleSize: 0,
        staleDataSources: [],
      };

  return {
    sections: orderedSections,
    pullQuotes,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDurationMs,
      agentDurations,
      confidence,
    },
  };
}
