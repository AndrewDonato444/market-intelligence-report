/**
 * Report Assembler — Layer 3
 *
 * Merges ComputedAnalytics (Layer 1) with agent narratives (Layer 2)
 * into the final 9-section report structure.
 *
 * Sections 2, 3, 7 = pure data (no agent narrative needed)
 * Sections 1, 4, 5, 8 = data + narrative
 * Sections 6, 9 = narrative only
 */

import type { AgentResult, SectionOutput } from "@/lib/agents/orchestrator";
import type { ComputedAnalytics } from "@/lib/services/market-analytics";
import type { PersonaIntelligenceOutput } from "@/lib/agents/persona-intelligence";

// --- Types ---

export interface AssembledReport {
  sections: AssembledSection[];
  metadata: AssemblyMetadata;
}

export interface AssembledSection {
  sectionNumber: number;
  sectionType: string;
  title: string;
  content: unknown;
}

export interface AssemblyMetadata {
  generatedAt: string;
  totalDurationMs: number;
  agentDurations: Record<string, number>;
  confidence: ComputedAnalytics["confidence"];
  sectionCount: number;
}

export interface AssemblyDurations {
  fetchMs: number;
  computeMs: number;
  agentDurations: Record<string, number>;
}

// --- Constants ---

export const DISCLAIMER_TEXT =
  "This report is generated using publicly available data, proprietary analytics, " +
  "and AI-assisted narrative generation. While every effort is made to ensure accuracy, " +
  "the information herein should not be considered a substitute for professional real estate " +
  "appraisal or legal counsel. Market conditions are inherently dynamic and past performance " +
  "does not guarantee future results. Data sources include public records, MLS feeds, and " +
  "third-party analytics platforms. Confidence levels reflect data completeness and freshness " +
  "at time of generation.";

export const NEW_SECTION_TYPES = [
  "executive_briefing",
  "market_insights_index",
  "luxury_market_dashboard",
  "neighborhood_intelligence",
  "the_narrative",
  "forward_look",
  "comparative_positioning",
  "strategic_benchmark",
  "disclaimer_methodology",
  "persona_intelligence",
] as const;

export type NewSectionType = (typeof NEW_SECTION_TYPES)[number];

// --- Persona Framing ---

export interface PersonaFraming {
  personaName: string;
  perspective: string;
  emphasis: string[];
  deEmphasis: string[];
  toneGuidance: string;
}

// --- Assembly ---

/**
 * Assembles the final 9-section report from computed analytics and agent results.
 */
export function assembleReport(
  analytics: ComputedAnalytics,
  agentResults: Record<string, AgentResult>,
  durations: AssemblyDurations
): AssembledReport {
  const insightNarrative = extractNarrative(agentResults, "insight-generator");
  const forecastNarrative = extractNarrative(agentResults, "forecast-modeler");
  const polishNarrative = extractNarrative(agentResults, "polish-agent");

  // Extract persona intelligence output (if available and not skipped)
  const personaFraming = extractPersonaFraming(agentResults);
  const personaOutput = extractPersonaIntelligenceOutput(agentResults);

  const sections: AssembledSection[] = [
    // Section 1: Executive Briefing (data + insight-generator narrative)
    {
      sectionNumber: 1,
      sectionType: "executive_briefing",
      title: "Executive Briefing",
      content: {
        headline: {
          medianPrice: analytics.market.medianPrice,
          totalProperties: analytics.market.totalProperties,
          rating: analytics.market.rating,
          yoyPriceChange: analytics.yoy.medianPriceChange,
        },
        narrative: insightNarrative?.executiveBriefing ?? null,
        confidence: analytics.confidence,
        dataAsOfDate: analytics.dataAsOfDate ?? null,
        metricExplainers: {
          marketRating: "Overall market health based on growth, liquidity, and risk indicators",
          medianPrice: "50th percentile sale price across all luxury transactions in the analysis period",
          yoyChange: "Year-over-year change in median sale price compared to the same period last year",
          properties: "Total luxury property transactions included in this analysis",
        },
        timing: {
          buyers: (insightNarrative?.insights as Record<string, unknown>)?.executiveSummary
            ? ((insightNarrative!.insights as Record<string, unknown>).executiveSummary as Record<string, unknown>)?.timing
              ? (((insightNarrative!.insights as Record<string, unknown>).executiveSummary as Record<string, unknown>).timing as Record<string, string>).buyers ?? null
              : null
            : null,
          sellers: (insightNarrative?.insights as Record<string, unknown>)?.executiveSummary
            ? ((insightNarrative!.insights as Record<string, unknown>).executiveSummary as Record<string, unknown>)?.timing
              ? (((insightNarrative!.insights as Record<string, unknown>).executiveSummary as Record<string, unknown>).timing as Record<string, string>).sellers ?? null
              : null
            : null,
        },
        personaFraming,
      },
    },

    // Section 2: Market Insights Index (pure data)
    {
      sectionNumber: 2,
      sectionType: "market_insights_index",
      title: "Market Insights Index",
      content: {
        insightsIndex: analytics.insightsIndex,
      },
    },

    // Section 3: Luxury Market Dashboard (pure data)
    {
      sectionNumber: 3,
      sectionType: "luxury_market_dashboard",
      title: "Luxury Market Dashboard",
      content: {
        dashboard: analytics.dashboard,
        detailMetrics: analytics.detailMetrics,
      },
    },

    // Section 4: Neighborhood Intelligence (data + insight-generator narrative)
    {
      sectionNumber: 4,
      sectionType: "neighborhood_intelligence",
      title: "Neighborhood Intelligence",
      content: {
        neighborhoods: analytics.neighborhoods,
        narrative: insightNarrative?.neighborhoodAnalysis ?? null,
      },
    },

    // Section 5: The Narrative (insight-generator narrative + data context)
    {
      sectionNumber: 5,
      sectionType: "the_narrative",
      title: "The Narrative",
      content: {
        editorial: insightNarrative?.editorial ?? null,
        themes: insightNarrative?.themes ?? [],
        marketContext: {
          segments: analytics.segments,
          yoy: analytics.yoy,
          rating: analytics.market.rating,
        },
        personaFraming,
      },
    },

    // Section 6: Forward Look (forecast-modeler narrative)
    {
      sectionNumber: 6,
      sectionType: "forward_look",
      title: "Forward Look",
      content: {
        forecast: forecastNarrative?.forecast ?? null,
        guidance: forecastNarrative?.guidance ?? null,
        personaFraming,
      },
    },

    // Section 7: Comparative Positioning (pure data)
    {
      sectionNumber: 7,
      sectionType: "comparative_positioning",
      title: "Comparative Positioning",
      content: {
        peerComparisons: analytics.peerComparisons,
        peerRankings: analytics.peerRankings,
      },
    },

    // Section 8: Strategic Benchmark (data + polish-agent narrative)
    {
      sectionNumber: 8,
      sectionType: "strategic_benchmark",
      title: "Strategic Benchmark",
      content: {
        scorecard: analytics.scorecard,
        narrative: polishNarrative?.strategicBrief ?? null,
        personaFraming,
      },
    },

    // Section 9: Disclaimer & Methodology (template + confidence)
    {
      sectionNumber: 9,
      sectionType: "disclaimer_methodology",
      title: "Disclaimer & Methodology",
      content: {
        disclaimer: DISCLAIMER_TEXT,
        methodology: polishNarrative?.methodology ?? null,
        confidence: analytics.confidence,
        dataSources: buildDataSourcesSummary(analytics),
      },
    },
  ];

  // Section 10: Persona Intelligence Briefing (only when persona output exists)
  if (personaOutput) {
    sections.push({
      sectionNumber: 10,
      sectionType: "persona_intelligence",
      title: "Persona Intelligence Briefing",
      content: {
        strategy: "hybrid",
        personas: personaOutput.personas,
        blended: personaOutput.blended,
        meta: personaOutput.meta,
      },
    });
  }

  // Compute totals
  const agentDurationsTotal = Object.values(durations.agentDurations).reduce(
    (sum, d) => sum + d,
    0
  );
  const totalDurationMs = durations.fetchMs + durations.computeMs + agentDurationsTotal;

  return {
    sections,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDurationMs,
      agentDurations: durations.agentDurations,
      confidence: analytics.confidence,
      sectionCount: sections.length,
    },
  };
}

// --- Helpers ---

/**
 * Extract narrative content from an agent's result.
 * Returns the metadata object (which agents use to store narrative outputs)
 * or null if the agent didn't produce results.
 */
function extractNarrative(
  results: Record<string, AgentResult>,
  agentName: string
): Record<string, unknown> | null {
  const result = results[agentName];
  if (!result) return null;
  return (result.metadata as Record<string, unknown>) ?? null;
}

/**
 * Extract the primary persona's narrative overlay as a PersonaFraming object.
 * Returns null if persona-intelligence agent didn't run or was skipped.
 */
function extractPersonaFraming(
  results: Record<string, AgentResult>
): PersonaFraming | null {
  const output = extractPersonaIntelligenceOutput(results);
  if (!output || output.personas.length === 0) return null;

  // Primary persona is first (selectionOrder=1)
  const primary = output.personas[0];
  return {
    personaName: primary.personaName,
    perspective: primary.narrativeOverlay.perspective,
    emphasis: primary.narrativeOverlay.emphasis,
    deEmphasis: primary.narrativeOverlay.deEmphasis,
    toneGuidance: primary.narrativeOverlay.toneGuidance,
  };
}

/**
 * Extract PersonaIntelligenceOutput from agent results.
 * Returns null if persona-intelligence agent didn't run, was skipped, or has no output.
 */
function extractPersonaIntelligenceOutput(
  results: Record<string, AgentResult>
): PersonaIntelligenceOutput | null {
  const result = results["persona-intelligence"];
  if (!result) return null;

  const meta = result.metadata as Record<string, unknown>;
  // Skip if persona agent reported skipped
  if (meta.skipped) return null;

  const output = meta.personaIntelligence as PersonaIntelligenceOutput | undefined;
  if (!output || !output.personas || output.personas.length === 0) return null;

  return output;
}

function buildDataSourcesSummary(
  analytics: ComputedAnalytics
): Array<{ name: string; status: string }> {
  const sources: Array<{ name: string; status: string }> = [
    {
      name: "RealEstateAPI (Property Search)",
      status: analytics.confidence.staleDataSources.some((s) =>
        s.includes("search")
      )
        ? "stale"
        : "fresh",
    },
    {
      name: "RealEstateAPI (Property Detail)",
      status: analytics.confidence.staleDataSources.some((s) =>
        s.includes("detail")
      )
        ? "stale"
        : analytics.confidence.detailCoverage > 0
          ? "fresh"
          : "unavailable",
    },
    {
      name: "ScrapingDog (Local Search)",
      status: analytics.confidence.staleDataSources.some((s) =>
        s.includes("scrapingdog")
      )
        ? "stale"
        : "fresh",
    },
  ];

  return sources;
}
