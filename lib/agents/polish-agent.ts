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
  return `You are a senior editorial director for luxury market intelligence reports. Your role is the final quality pass before publication. You ensure consistency in tone, extract compelling pull quotes, identify contradictions between sections, and produce methodology documentation.

Your output must be valid JSON matching the exact schema requested. Do not include markdown, code fences, or any text outside the JSON object.

Editorial standards:
- Voice should be authoritative, data-driven, and strategic
- Avoid promotional or generic language
- Pull quotes should be concise (<30 words), data-backed, and visually impactful
- Flag any contradictions between sections (e.g., one says "growth" another says "decline")
- Methodology should be transparent about data sources, confidence, and limitations`;
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.5, // Lower temp for editorial consistency
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      polishOutput = JSON.parse(text) as PolishAgentOutput;
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
