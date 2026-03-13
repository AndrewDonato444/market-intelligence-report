/**
 * Report Assembler — Layer 3
 *
 * Merges ComputedAnalytics (Layer 1) with agent narratives (Layer 2)
 * into the final 7-section report structure (8 with persona intelligence).
 *
 * Sections 2, 3, 7 = pure data (no agent narrative needed)
 * Sections 1, 4, 5 = data + narrative
 * Section 6 = narrative only
 *
 * Note: Strategic Benchmark and Disclaimer & Methodology sections were
 * removed. Disclaimer/advisory language lives in the front-end UI.
 * Persona Intelligence is now Section 8 (when present).
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
 * Assembles the final 7-section report (8 with persona intelligence)
 * from computed analytics and agent results.
 */
export function assembleReport(
  analytics: ComputedAnalytics,
  agentResults: Record<string, AgentResult>,
  durations: AssemblyDurations
): AssembledReport {
  const insightNarrative = extractNarrative(agentResults, "insight-generator");
  const forecastNarrative = extractNarrative(agentResults, "forecast-modeler");

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
          totalVolume: analytics.market.totalVolume,
          rating: analytics.market.rating,
          yoyPriceChange: analytics.yoy.medianPriceChange,
          yoyVolumeChange: analytics.yoy.totalVolumeChange,
          yoyTransactionCountChange: analytics.yoy.volumeChange,
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

    // Section 3: Luxury Market Dashboard (data + narrative headline)
    {
      sectionNumber: 3,
      sectionType: "luxury_market_dashboard",
      title: "Luxury Market Dashboard",
      content: {
        dashboard: analytics.dashboard,
        detailMetrics: analytics.detailMetrics,
        narrative: insightNarrative?.dashboardNarrative ?? null,
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
        sourceAttribution: buildSourceAttribution(analytics),
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

  ];

  // Section 8: Persona Intelligence Briefing (only when persona output exists)
  if (personaOutput) {
    sections.push({
      sectionNumber: 8,
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
 * Build source attribution string for section 4 (Neighborhood Intelligence).
 * Returns null if no transaction data exists.
 */
function buildSourceAttribution(analytics: ComputedAnalytics): string | null {
  if (analytics.neighborhoods.length === 0 || analytics.market.totalProperties === 0) {
    return null;
  }

  const count = analytics.market.totalProperties;
  const dateStr = analytics.dataAsOfDate
    ? `, through ${new Date(analytics.dataAsOfDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
    : "";

  return `Analysis of ${count} transactions via RealEstateAPI${dateStr}`;
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

