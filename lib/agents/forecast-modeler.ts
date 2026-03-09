/**
 * Forecast Modeler Agent
 *
 * Produces forward-looking projections, confidence ratings, and
 * base/bull/bear case scenarios. Combines pre-computed analytics
 * with Claude's analytical capabilities for calibrated forecasts.
 *
 * No dependencies in v2 — all data via context.computedAnalytics.
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

export interface ForecastModelerOutput {
  projections: SegmentProjection[];
  scenarios: {
    base: ScenarioCase;
    bull: ScenarioCase;
    bear: ScenarioCase;
  };
  timing: {
    buyers: string;
    sellers: string;
  };
  outlook: {
    narrative: string;
    monitoringAreas: string[];
  };
}

export interface SegmentProjection {
  segment: string;
  sixMonth: {
    medianPrice: number;
    priceRange: { low: number; high: number };
    confidence: "high" | "medium" | "low";
  };
  twelveMonth: {
    medianPrice: number;
    priceRange: { low: number; high: number };
    confidence: "high" | "medium" | "low";
  };
}

export interface ScenarioCase {
  narrative: string;
  assumptions: string[];
  medianPriceChange: number;
  volumeChange: number;
}

// --- Helpers ---

const TIER_LABELS: Record<string, string> = {
  luxury: "Luxury ($1M–$5M)",
  high_luxury: "High Luxury ($5M–$10M)",
  ultra_luxury: "Ultra Luxury ($10M+)",
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `$${value.toLocaleString()}`;
}

function formatPercent(value: number | null): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function buildSystemPrompt(): string {
  return `You are a specialized agent handling forward-looking market projections and scenario modeling for Market Intelligence Report.

YOUR ROLE:
You handle all forecasting, projection, and scenario analysis work. You combine pre-computed market analytics with calibrated analytical reasoning to produce grounded, range-based forecasts. You do not handle tasks outside this scope. If a request falls outside your specialty, respond with: "This task falls outside my forecasting scope. Please route this to the appropriate task folder."

CONTEXT:
- This task folder belongs to project: Market Intelligence Report
- Business description: Luxury real estate market intelligence platform generating data-driven reports for strategic decision-making
- Target audience for this task: Top-producing luxury real estate agents and their high-net-worth clients making investment and timing decisions

OUTPUT RULES:
- Format: Valid JSON matching the exact schema requested. Do not include markdown, code fences, or any text outside the JSON object.
- Tone: Analytical, calibrated, and measured — a trusted forecaster who communicates uncertainty honestly
- Length: Scenario narratives 1-2 paragraphs each, outlook narrative 1-2 paragraphs, 3-5 monitoring areas, per-segment projections for 6-month and 12-month horizons
- Must include: Price ranges (never just point estimates), explicit confidence levels per projection, clearly stated assumptions for each scenario, projections grounded in the provided YoY trend data, wider confidence ranges for longer time horizons
- Must avoid: Extreme or sensational scenarios, point estimates without ranges, speculation beyond what the data supports, guarantees or certainty language ("will," "guaranteed," "certain"), vague directional statements without quantification

EXAMPLES OF GOOD OUTPUT:

Example 1 — Base case scenario:
{
  "narrative": "Continuation of the current 8.2% annual appreciation trajectory suggests the broader luxury market will sustain moderate price growth through the next 12 months, with the waterfront segment outpacing at 10-14% given its supply constraints (34 active listings vs. 89 twelve months ago). Transaction volume is likely to remain flat to slightly positive (+2-5%) as elevated mortgage rates above 6.5% continue to suppress move-up buyers while cash-heavy ultra-luxury transactions remain insulated.",
  "assumptions": [
    "Mortgage rates remain in the 6.25-7.0% range through the projection period",
    "No significant new luxury inventory enters the waterfront segment",
    "Regional employment in finance and tech sectors remains stable"
  ],
  "medianPriceChange": 0.082,
  "volumeChange": 0.03
}

Example 2 — Segment projection with appropriate range widening:
{
  "segment": "Waterfront",
  "sixMonth": {
    "medianPrice": 5350000,
    "priceRange": { "low": 5100000, "high": 5600000 },
    "confidence": "medium"
  },
  "twelveMonth": {
    "medianPrice": 5550000,
    "priceRange": { "low": 5000000, "high": 6100000 },
    "confidence": "low"
  }
}

EXAMPLES OF BAD OUTPUT:

Example 1 — Vague scenario without data grounding:
{
  "narrative": "The market will likely continue to grow as demand remains strong and the economy improves. Luxury buyers will continue to seek premium properties in desirable locations.",
  "assumptions": [
    "The economy will be good",
    "People will want to buy houses"
  ],
  "medianPriceChange": 0.05,
  "volumeChange": 0.05
}

Example 2 — Point estimate without range, overconfident:
{
  "segment": "Waterfront",
  "sixMonth": {
    "medianPrice": 5347500,
    "priceRange": { "low": 5300000, "high": 5400000 },
    "confidence": "high"
  },
  "twelveMonth": {
    "medianPrice": 5695000,
    "priceRange": { "low": 5650000, "high": 5750000 },
    "confidence": "high"
  }
}`;
}

function buildUserPrompt(
  context: AgentContext,
  analysis: DataAnalystOutput
): string {
  const { market } = context;
  const tierLabel = TIER_LABELS[market.luxuryTier] || market.luxuryTier;

  const segmentSummary = analysis.segments
    .map(
      (s) =>
        `  - ${s.name}: ${s.count} properties, median ${formatCurrency(s.medianPrice)}, ` +
        `${s.medianPricePerSqft ? `$${s.medianPricePerSqft}/sqft` : "N/A psf"}, rating: ${s.rating}` +
        `${s.lowSample ? " (LOW SAMPLE)" : ""}`
    )
    .join("\n");

  const lowConfidence =
    analysis.confidence.level === "low" ||
    analysis.yoy.medianPriceChange == null;

  return `Generate forward-looking projections for the following luxury real estate market.

MARKET: ${market.name}
LOCATION: ${market.geography.city}, ${market.geography.state}
TIER: ${tierLabel}

CURRENT METRICS:
- Total Properties: ${analysis.market.totalProperties}
- Median Price: ${formatCurrency(analysis.market.medianPrice)}
- Average Price: ${formatCurrency(analysis.market.averagePrice)}
- Median Price/SqFt: ${analysis.market.medianPricePerSqft ? `$${analysis.market.medianPricePerSqft}` : "N/A"}
- Total Volume: ${formatCurrency(analysis.market.totalVolume)}
- Overall Rating: ${analysis.market.rating}

SEGMENTS:
${segmentSummary || "  No segment data available"}

YEAR-OVER-YEAR TRENDS:
- Median Price Change: ${formatPercent(analysis.yoy.medianPriceChange)}
- Volume Change: ${formatPercent(analysis.yoy.volumeChange)}
- Price/SqFt Change: ${formatPercent(analysis.yoy.pricePerSqftChange)}

DATA CONFIDENCE: ${analysis.confidence.level} (sample: ${analysis.confidence.sampleSize})
${lowConfidence ? "\n⚠️ LOW CONFIDENCE DATA: Use wide ranges, low confidence ratings, and include explicit caveats. Do not produce specific point estimates." : ""}

Respond with a JSON object matching this exact schema:
{
  "projections": [
    {
      "segment": "segment name",
      "sixMonth": {
        "medianPrice": number,
        "priceRange": { "low": number, "high": number },
        "confidence": "high|medium|low"
      },
      "twelveMonth": {
        "medianPrice": number,
        "priceRange": { "low": number, "high": number },
        "confidence": "high|medium|low"
      }
    }
  ],
  "scenarios": {
    "base": {
      "narrative": "1-2 paragraph base case description",
      "assumptions": ["2-3 key assumptions"],
      "medianPriceChange": number (decimal, e.g. 0.06 = 6%),
      "volumeChange": number
    },
    "bull": { same structure },
    "bear": { same structure }
  },
  "timing": {
    "buyers": "Timing recommendation for buyers",
    "sellers": "Timing recommendation for sellers"
  },
  "outlook": {
    "narrative": "1-2 paragraph forward outlook",
    "monitoringAreas": ["3-5 areas to monitor over next 6-18 months"]
  }
}

${lowConfidence ? "Given low data confidence, produce broad qualitative projections only." : `Produce projections for each segment: ${analysis.segments.map((s) => s.name).join(", ")}.`}`;
}

// --- Main execution ---

export async function executeForecastModeler(
  context: AgentContext
): Promise<AgentResult> {
  const start = Date.now();

  // Check abort signal
  if (context.abortSignal.aborted) {
    const error = new Error("Forecast Modeler aborted before execution");
    (error as Error & { retriable: boolean }).retriable = false;
    throw error;
  }

  // Read analytics: prefer v2 computedAnalytics, fall back to v1 upstream
  const analytics = context.computedAnalytics;
  let analysis: DataAnalystOutput;

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
    if (!dataAnalystResult) {
      throw new Error(
        "Forecast Modeler requires computedAnalytics or data-analyst upstream results"
      );
    }
    analysis = dataAnalystResult.metadata.analysis as DataAnalystOutput;
  }

  const lowConfidence =
    analysis.confidence.level === "low" ||
    analysis.yoy.medianPriceChange == null;

  // Build prompts and call Claude
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context, analysis);

  let forecast: ForecastModelerOutput;
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      forecast = JSON.parse(text) as ForecastModelerOutput;
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
      sectionType: "forecasts",
      title: "Forward Outlook & Strategic Forecasts",
      content: {
        projections: forecast.projections,
        scenarios: forecast.scenarios,
      },
    },
    {
      sectionType: "strategic_summary",
      title: "Strategic Summary & Timing",
      content: {
        timing: forecast.timing,
        outlook: forecast.outlook,
      },
    },
  ];

  return {
    agentName: "forecast-modeler",
    sections,
    metadata: {
      forecastOutput: forecast,
      lowConfidence,
      // Keys for report-assembler (Layer 3)
      forecast: forecast.outlook.narrative,
      guidance: forecast.timing,
    },
    durationMs: Date.now() - start,
  };
}

// --- Agent Definition (for pipeline registration) ---

export const forecastModelerAgent: AgentDefinition = {
  name: "forecast-modeler",
  description:
    "Produces forward-looking projections, confidence ratings, and base/bull/bear scenarios via Claude",
  dependencies: [], // v2: no dependencies, all data via computedAnalytics
  execute: executeForecastModeler,
};
