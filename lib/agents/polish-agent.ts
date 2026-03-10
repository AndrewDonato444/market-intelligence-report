/**
 * Polish Agent
 *
 * Final stage in the AI pipeline. Receives upstream narratives
 * and performs an editorial pass: consistency check, tone alignment,
 * pull quote extraction, and methodology generation.
 *
 * Dependencies: insight-generator (required for narratives)
 * Optional: forecast-modeler (used if available)
 * Data: context.computedAnalytics (v2) or upstream data-analyst (v1 fallback)
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentContext,
  AgentDefinition,
  AgentResult,
  SectionOutput,
} from "@/lib/agents/orchestrator";
import type { DataAnalystOutput } from "@/lib/agents/data-analyst";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

// --- Output types ---

export interface PolishAgentOutput {
  polishedSections: Array<{
    sectionType: string;
    revisedNarrative: string;
  }>;
  pullQuotes: Array<{
    text: string;
    source: string;
  }>;
  methodology: {
    narrative: string;
    sources: string[];
    confidenceLevels: {
      dataConfidence: string;
      sampleSize: number;
      staleDataSources: string[];
    };
  };
  consistency: {
    contradictions: string[];
    notes: string[];
  };
}

// --- Helpers ---

function buildSystemPrompt(): string {
  return `You are a specialized agent handling editorial quality assurance, consistency checking, and methodology documentation for Market Intelligence Report.

YOUR ROLE:
You handle all final editorial polish work. You are the last pass before publication — you ensure tonal consistency across sections, extract compelling pull quotes, identify contradictions between upstream agent outputs, and produce transparent methodology documentation. You do not handle tasks outside this scope. If a request falls outside your specialty, respond with: "This task falls outside my editorial QA scope. Please route this to the appropriate task folder."

CONTEXT:
- This task folder belongs to project: Market Intelligence Report
- Business description: Luxury real estate market intelligence platform generating data-driven reports for strategic decision-making
- Target audience for this task: Top-producing luxury real estate agents and their high-net-worth clients who expect publication-quality deliverables

OUTPUT RULES:
- Format: Valid JSON matching the exact schema requested. Do not include markdown, code fences, or any text outside the JSON object.
- Tone: Authoritative editorial voice — confident but transparent about limitations, never promotional
- Length: Pull quotes under 30 words each (3-5 total), methodology 1-2 paragraphs, polished narratives should match the approximate length of their source sections
- Must include: Contradiction flagging between upstream sections (e.g., one section says "growth" while another implies "decline"), data-backed pull quotes that pair a specific metric with a strategic implication, transparent methodology with explicit confidence levels and data source status, consistency notes on tone and terminology
- Must avoid: Changing or inventing data/numbers from upstream sections, promotional or sales-oriented language, pull quotes without specific data backing, glossing over data limitations or low-confidence areas, altering the strategic conclusions of upstream agents

EXAMPLES OF GOOD OUTPUT:

Example 1 — Strong pull quote (specific metric + strategic implication, under 30 words):
{
  "text": "Waterfront inventory has contracted 62% year-over-year to just 34 listings — the tightest supply since 2021 — fundamentally reshaping negotiation dynamics in the segment.",
  "source": "market_overview"
}

Example 2 — Useful contradiction flagging:
{
  "contradictions": [
    "The overview section describes buyer demand as 'robust' with a 'Strong' market rating, but the forecast section projects flat-to-negative volume change (-2% to +3%) over the next 12 months. Consider aligning language: strong pricing with moderating transaction velocity."
  ],
  "notes": [
    "All sections consistently use 'luxury' rather than 'high-end' — good terminology alignment",
    "The executive summary timing recommendation for sellers aligns with the forecast base case assumptions"
  ]
}

Example 3 — Transparent methodology:
{
  "narrative": "This report synthesizes property-level data from RealEstateAPI covering active and recently sold listings within the defined market boundaries and price thresholds. Market analytics — including median pricing, segment breakdowns, and year-over-year comparisons — are computed from raw listing data. Forward-looking projections are model-generated estimates calibrated against observed trends and should not be interpreted as guarantees. All neighborhood amenity data is sourced from aggregated local search results.",
  "sources": ["RealEstateAPI (Property Search)", "RealEstateAPI (Property Detail)", "ScrapingDog (Local Search)"],
  "confidenceLevels": {
    "dataConfidence": "high",
    "sampleSize": 847,
    "staleDataSources": []
  }
}

EXAMPLES OF BAD OUTPUT:

Example 1 — Vague pull quote with no data (promotional tone):
{
  "text": "The luxury market continues to show tremendous promise for discerning buyers and sellers alike.",
  "source": "executive_summary"
}

Example 2 — Superficial consistency check that misses real issues:
{
  "contradictions": [],
  "notes": [
    "Everything looks consistent",
    "The report reads well"
  ]
}

Example 3 — Methodology that hides limitations:
{
  "narrative": "This report uses comprehensive market data and advanced AI analysis to provide accurate and reliable insights into the luxury real estate market.",
  "sources": ["Various data sources"],
  "confidenceLevels": {
    "dataConfidence": "high",
    "sampleSize": 847,
    "staleDataSources": []
  }
}`;
}

function buildUserPrompt(
  context: AgentContext,
  analysis: DataAnalystOutput,
  upstreamSections: SectionOutput[],
  missingSections: string[]
): string {
  const sectionSummaries = upstreamSections
    .map((s) => {
      const contentStr =
        typeof s.content === "string"
          ? s.content
          : JSON.stringify(s.content, null, 2);
      return `### ${s.title} (${s.sectionType})\n${contentStr}`;
    })
    .join("\n\n");

  return `Perform a final editorial polish on the following luxury market intelligence report sections for ${context.market.name} (${context.market.geography.city}, ${context.market.geography.state}).

DATA CONFIDENCE: ${analysis.confidence.level} (sample size: ${analysis.confidence.sampleSize})
${analysis.confidence.staleDataSources.length > 0 ? `STALE SOURCES: ${analysis.confidence.staleDataSources.join(", ")}` : ""}
${missingSections.length > 0 ? `\nMISSING SECTIONS (not available): ${missingSections.join(", ")}` : ""}

SECTIONS TO POLISH:
${sectionSummaries}

Respond with a JSON object matching this exact schema:
{
  "polishedSections": [
    {
      "sectionType": "section type from above",
      "revisedNarrative": "polished version of the narrative, maintaining data accuracy"
    }
  ],
  "pullQuotes": [
    {
      "text": "Concise quote under 30 words for visual callout",
      "source": "sectionType it came from"
    }
  ],
  "methodology": {
    "narrative": "1-2 paragraph methodology description",
    "sources": ["list of data sources used"],
    "confidenceLevels": {
      "dataConfidence": "${analysis.confidence.level}",
      "sampleSize": ${analysis.confidence.sampleSize},
      "staleDataSources": ${JSON.stringify(analysis.confidence.staleDataSources)}
    }
  },
  "consistency": {
    "contradictions": ["any contradictions found between sections"],
    "notes": ["general consistency observations"]
  }
}

Generate 3-5 pull quotes. Polish all available section narratives.`;
}

// --- Main execution ---

export async function executePolishAgent(
  context: AgentContext
): Promise<AgentResult> {
  const start = Date.now();

  // Check abort signal
  if (context.abortSignal.aborted) {
    const error = new Error("Polish Agent aborted before execution");
    (error as Error & { retriable: boolean }).retriable = false;
    throw error;
  }

  // Require insight-generator (core narratives)
  const insightResult = context.upstreamResults["insight-generator"];
  if (!insightResult) {
    throw new Error(
      "Polish Agent requires insight-generator upstream results"
    );
  }

  // Read confidence metadata: prefer v2 computedAnalytics, fall back to v1
  const analytics = context.computedAnalytics;
  let analysis: DataAnalystOutput | undefined;

  const defaultConfidence = {
    level: "medium" as const,
    staleDataSources: [] as string[],
    sampleSize: 0,
  };

  if (analytics) {
    analysis = {
      market: analytics.market,
      segments: analytics.segments,
      yoy: analytics.yoy,
      confidence: {
        level: analytics.confidence.level,
        staleDataSources: analytics.confidence.staleDataSources,
        sampleSize: analytics.confidence.sampleSize,
      },
    };
  } else {
    const dataAnalystResult = context.upstreamResults["data-analyst"];
    analysis = dataAnalystResult?.metadata?.analysis as DataAnalystOutput | undefined;
  }

  const confidence = analysis?.confidence ?? defaultConfidence;

  // Collect all upstream sections
  const upstreamSections: SectionOutput[] = [];
  const missingSections: string[] = [];

  // Always include insight-generator sections
  upstreamSections.push(...insightResult.sections);

  // Optional: competitive-analyst (v1 only, removed in v2)
  const competitiveResult = context.upstreamResults["competitive-analyst"];
  if (competitiveResult) {
    upstreamSections.push(...competitiveResult.sections);
  } else {
    missingSections.push("competitive_market_analysis");
  }

  // Optional: forecast-modeler
  const forecastResult = context.upstreamResults["forecast-modeler"];
  if (forecastResult) {
    upstreamSections.push(...forecastResult.sections);
  } else {
    missingSections.push("forecasts", "strategic_summary");
  }

  // Build prompt and call Claude
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    context,
    analysis ?? {
      market: {
        totalProperties: 0,
        medianPrice: 0,
        averagePrice: 0,
        medianPricePerSqft: null,
        totalVolume: 0,
        rating: "C",
      },
      segments: [],
      yoy: {
        medianPriceChange: null,
        volumeChange: null,
        pricePerSqftChange: null,
      },
      confidence: defaultConfidence,
    },
    upstreamSections,
    missingSections
  );

  let polishOutput: PolishAgentOutput;
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      temperature: 0.5, // Lower temp for editorial consistency
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      polishOutput = JSON.parse(stripJsonFences(text)) as PolishAgentOutput;
    } catch {
      const parseError = new Error(
        `Failed to parse Claude response as JSON: ${text.slice(0, 200)}`
      );
      (parseError as Error & { retriable: boolean }).retriable = true;
      throw parseError;
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "retriable" in err &&
      typeof (err as Error & { retriable: boolean }).retriable === "boolean"
    ) {
      throw err;
    }

    const status = (err as { status?: number }).status;
    const retriable = status === 429 || status === 500 || status === 503;
    const wrappedError = new Error(
      (err as Error).message || "Claude API error"
    );
    (wrappedError as Error & { retriable: boolean }).retriable = retriable;
    throw wrappedError;
  }

  // Build sections
  const sections: SectionOutput[] = [
    {
      sectionType: "polished_report",
      title: "Polished Report Content",
      content: {
        polishedSections: polishOutput.polishedSections,
        pullQuotes: polishOutput.pullQuotes,
        consistency: polishOutput.consistency,
      },
    },
    {
      sectionType: "methodology",
      title: "Methodology & Sources",
      content: polishOutput.methodology,
    },
  ];

  return {
    agentName: "polish-agent",
    sections,
    metadata: {
      polishOutput,
      missingSections: missingSections.length > 0 ? missingSections : undefined,
      // Keys for report-assembler (Layer 3)
      strategicBrief: polishOutput.polishedSections
        .map((s) => s.revisedNarrative)
        .join("\n\n"),
      methodology: polishOutput.methodology.narrative,
    },
    durationMs: Date.now() - start,
  };
}

// --- Agent Definition ---

export const polishAgent: AgentDefinition = {
  name: "polish-agent",
  description:
    "Final editorial pass — consistency, tone, pull quotes, methodology, and quality check via Claude",
  dependencies: ["insight-generator"], // v2: data via computedAnalytics, only needs insight narratives
  execute: executePolishAgent,
};
