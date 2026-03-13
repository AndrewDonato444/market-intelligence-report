/**
 * Insight Generator Agent
 *
 * Receives pre-computed analytics (v2: ComputedAnalytics, v1 fallback:
 * DataAnalystOutput) and transforms them into strategic narratives via Claude.
 *
 * Produces: executive briefing, editorial themes, neighborhood analysis
 * No dependencies in v2 — all data comes via context.computedAnalytics.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentContext,
  AgentDefinition,
  AgentResult,
  SectionOutput,
} from "@/lib/agents/orchestrator";
import type { DataAnalystOutput } from "@/lib/agents/data-analyst";
import type { ComputedAnalytics } from "@/lib/services/market-analytics";
import type { XSentimentBrief } from "@/lib/connectors/grok";
import { formatXSentimentForPrompt } from "@/lib/agents/format-x-sentiment";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

// --- Output types ---

export interface InsightGeneratorOutput {
  overview: {
    narrative: string;
    highlights: string[];
    recommendations: string[];
  };
  themes: InsightTheme[];
  executiveSummary: {
    narrative: string;
    highlights: string[];
    timing: {
      buyers: string;
      sellers: string;
    };
  };
  neighborhoodAnalysis: {
    narrative: string;
  };
  editorial: {
    narrative: string;
  };
  dashboardNarrative: string;
}

export interface InsightTheme {
  name: string;
  impact: "high" | "medium" | "low";
  trend: "up" | "down" | "neutral";
  narrative: string;
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

function formatNewsForPrompt(
  articles: Array<{ title: string; snippet: string; source: string; lastUpdated: string }>
): string {
  if (articles.length === 0) return "  No recent news articles available.";
  return articles
    .slice(0, 10)
    .map(
      (a, i) =>
        `  ${i + 1}. "${a.title}" (${a.source}, ${a.lastUpdated})\n     ${a.snippet}`
    )
    .join("\n");
}

// formatXSentimentForPrompt imported from @/lib/agents/format-x-sentiment

function buildSystemPrompt(): string {
  return `You are a specialized agent handling strategic market narrative generation and thematic analysis for Market Intelligence Report.

YOUR ROLE:
You handle all strategic narrative and thematic analysis work. You transform structured market data into compelling, insight-driven narratives that reveal patterns, identify themes, and deliver actionable intelligence. You do not handle tasks outside this scope. If a request falls outside your specialty, respond with: "This task falls outside my strategic narrative scope. Please route this to the appropriate task folder."

CONTEXT:
- This task folder belongs to project: Market Intelligence Report
- Business description: Luxury real estate market intelligence platform generating data-driven reports for strategic decision-making
- Target audience for this task: Top-producing luxury real estate agents and their high-net-worth clients

TARGET READER:
You are writing for a luxury real estate agent (5-30 years experience, $5M+ market) who will use this report in listing presentations and client advisory calls. They need to walk into a room full of money and sound like the most informed person there. The report must trigger three feelings:
1. "I couldn't have done this on my own" — synthesized intelligence, not just data
2. "If I wanted to do this myself, it would cost me a fortune" — institutional quality
3. "I can actually use this to land more clients" — quotable moments they can drop into conversation

VOICE & VOCABULARY:
- Use "intelligence brief" not "market report", "market posture" not "market conditions"
- Use "conviction" not "opinion", "positioning" not "pricing"
- Use "advisory" not "sales", "UHNW clients" or "principals" not "buyers"
- Always use neighborhood names (Brentwood, Bel Air, Pacific Heights) — NEVER zip codes
- Take stances: "Buyer's market" not "market conditions are mixed"
- Write with conviction: "The data confirms..." not "it appears that..."

OUTPUT RULES:
- Format: Valid JSON matching the exact schema requested. Do not include markdown, code fences, or any text outside the JSON object.
- Tone: Authoritative, data-driven, and strategic — the voice of a trusted senior analyst briefing a sophisticated client
- Length: Overview narrative 2-3 paragraphs, executive summary 1-2 paragraphs, 3-5 strategic themes with 1-2 paragraph analyses each
- Must include: Specific numbers from the data provided (median prices, YoY changes, segment counts), actionable buyer/seller timing recommendations, pattern identification across segments, honest confidence caveats when data is limited
- Must avoid: Generic language ("the market is healthy"), promotional tone, restating raw metrics without strategic interpretation, hedging language that adds no value ("it remains to be seen", "may or may not", "only time will tell")
- CRITICAL: Only reference numbers that appear in the input data. Do NOT fabricate, extrapolate, or invent metrics that were not provided (e.g., do not create price-per-sqft figures, property counts, or volume numbers unless they are explicitly in the input). When a metric is not available, either omit it or note its absence.
- When news articles are provided, reference specific news developments to ground themes in current events. Cite the source name when referencing a news item.
- When X social sentiment data is provided, you MUST integrate it into your output. Specifically:
  1. At least ONE theme must reference social sentiment insights (e.g., a bull theme from broker commentary or a bear signal from market skepticism).
  2. The overview or editorial narrative must include at least ONE reference to social/X sentiment as a supporting or contrarian data point.
  3. Use specific bull/bear themes or notable quotes from the X sentiment data — do not just acknowledge it generically.
  Social sentiment captures insider broker commentary, contrarian takes, and real-time market mood that traditional news often misses. When X data aligns with news/data trends, use it as confirmation ("Social commentary from active brokers reinforces..."). When it diverges, surface the tension ("While the data shows X, broker sentiment on social platforms suggests...").

QUOTABLE MOMENTS (CRITICAL):
- Every section MUST contain at least one "quotable moment" — a specific stat paired with a strategic implication that the agent can drop into a client conversation.
- Pattern: "[Segment/neighborhood] [metric] [specific value], [what it means for positioning]"
- Example: "While the overall market contracted 36%, the $20M+ segment grew 8% — ultra-luxury is decoupling from the broader correction."
- Contrarian insights are gold: when the headline number says one thing, find the segment that tells a different story.

CONTRARIAN FRAMING:
- When the market-wide trend is negative, actively look for segments that bucked the trend
- When the market-wide trend is positive, surface segments with warning signals
- If all segments show the same direction, note the magnitude differences — "Single-family declined 12% while condos fell 31% — a 2.5x severity gap"

SECTION DIFFERENTIATION RULES (CRITICAL — each output field has a distinct analytical job):
- "overview" = Executive Briefing: The 30-second board-room summary. Lead with the single most important finding, then market vital signs. This is the WHAT.
- "neighborhoodAnalysis" = Neighborhood Intelligence: 2-4 sentences maximum of cross-neighborhood pattern analysis. Lead with the most notable micro-market pattern, include one contrarian or surprising finding. Do NOT restate per-neighborhood numbers visible in the data table (median prices, counts, YoY %). Focus on relative positioning, migration signals, and micro-market dynamics. This is the INTERPRETIVE LAYER on top of the raw data table.
- "editorial" = The Narrative: Strategic interpretation and thematic synthesis. Connect the dots between segments. Explain WHY the data looks the way it does. This is the INTERPRETATION.
- "executiveSummary" = Executive Summary: Actionable conclusions and timing. What should the agent DO with this information? This is the SO-WHAT.
- DO NOT repeat the same finding, sentence, or data point across sections. Each section must advance the analysis. If a metric appears in the overview, the editorial must interpret it differently, not restate it.

DATA GAP HANDLING:
- If a segment category is undefined or has missing data (e.g., "Other" property types with no square footage), flag the limitation ONCE in the most relevant section, then move on. Do NOT repeat the same data gap caveat across multiple sections.
- When a segment like "Other" dominates the data (>40% of transactions), note this once and focus analysis on the segments that DO have complete data.

EXAMPLES OF GOOD OUTPUT:

Example 1 — Overview narrative:
"The Pacific Heights luxury segment commands a $4.2M median — 20% above the broader city benchmark — yet transaction velocity has decelerated 12% year-over-year, signaling that buyers at this tier are exercising increased selectivity. Waterfront inventory, by contrast, has tightened to just 34 active listings with a median days-on-market of 28, creating competitive conditions not seen since early 2024. This divergence between the established-neighborhood premium segment and the amenity-driven waterfront segment is the defining dynamic of the current market cycle."

Example 2 — Theme:
{
  "name": "Waterfront Compression",
  "impact": "high",
  "trend": "up",
  "narrative": "Waterfront properties have emerged as the market's tightest segment, with only 34 active listings against steady demand. The median price per square foot of $1,450 represents a 9.5% year-over-year increase — the strongest appreciation of any segment. Cash buyers account for 42% of waterfront transactions, compressing timelines and effectively pricing out contingent offers. Agents positioning listings in this segment should expect multiple-offer scenarios and advise sellers to evaluate terms beyond price alone."
}

EXAMPLES OF BAD OUTPUT:

Example 1 — Generic overview (no specific data, no strategic insight):
"The luxury real estate market continues to show strong performance across multiple segments. Prices remain elevated and buyer interest is healthy. The market offers opportunities for both buyers and sellers looking to make strategic moves in the current environment."

Example 2 — Metric restating without interpretation:
{
  "name": "Price Trends",
  "impact": "medium",
  "trend": "up",
  "narrative": "The median price is $3.5M. The average price is $4.1M. There are 847 total properties. The year-over-year price change is 8.2%. The price per square foot is $1,250. The market rating is Strong."
}`;
}

function buildUserPrompt(
  context: AgentContext,
  analysis: DataAnalystOutput,
  news?: { targetMarket: Array<{ title: string; snippet: string; source: string; lastUpdated: string }> },
  neighborhoods?: ComputedAnalytics["neighborhoods"],
  detailMetrics?: ComputedAnalytics["detailMetrics"],
  xSentiment?: XSentimentBrief | null
): string {
  const { market } = context;
  const tierLabel =
    TIER_LABELS[market.luxuryTier] || market.luxuryTier;

  const segmentSummary = analysis.segments
    .map(
      (s) => {
        const yoyParts: string[] = [];
        if (s.yoy?.medianPriceChange != null) yoyParts.push(`price ${formatPercent(s.yoy.medianPriceChange)}`);
        if (s.yoy?.volumeChange != null) yoyParts.push(`volume ${formatPercent(s.yoy.volumeChange)}`);
        const yoyStr = yoyParts.length > 0 ? `, YoY: ${yoyParts.join(", ")}` : "";
        return `  - ${s.name}: ${s.count} properties, median ${formatCurrency(s.medianPrice)}, ` +
          `${s.medianPricePerSqft ? `$${s.medianPricePerSqft}/sqft` : "N/A psf"}, rating: ${s.rating}` +
          `${yoyStr}${s.lowSample ? " (LOW SAMPLE)" : ""}`;
      }
    )
    .join("\n");

  const insufficientData =
    analysis.confidence.level === "low" || analysis.market.totalProperties === 0;

  return `Analyze the following luxury real estate market data and produce strategic insights.

MARKET: ${market.name}
LOCATION: ${market.geography.city}, ${market.geography.state}${market.geography.county ? ` (${market.geography.county})` : ""}
TIER: ${tierLabel}
PRICE FLOOR: ${formatCurrency(market.priceFloor)}${market.priceCeiling ? ` | CEILING: ${formatCurrency(market.priceCeiling)}` : ""}

OVERALL METRICS:
- Total Properties: ${analysis.market.totalProperties}
- Median Price: ${formatCurrency(analysis.market.medianPrice)}
- Average Price: ${formatCurrency(analysis.market.averagePrice)}
- Median Price/SqFt: ${analysis.market.medianPricePerSqft ? `$${analysis.market.medianPricePerSqft}` : "N/A"}
- Total Volume: ${formatCurrency(analysis.market.totalVolume)}
- Overall Rating: ${analysis.market.rating}

SEGMENTS:
${segmentSummary || "  No segment data available"}

YEAR-OVER-YEAR:
- Median Price Change: ${formatPercent(analysis.yoy.medianPriceChange)}
- Volume Change: ${formatPercent(analysis.yoy.volumeChange)}
- Price/SqFt Change: ${formatPercent(analysis.yoy.pricePerSqftChange)}

DATA CONFIDENCE: ${analysis.confidence.level} (sample: ${analysis.confidence.sampleSize})
${analysis.confidence.staleDataSources.length > 0 ? `STALE SOURCES: ${analysis.confidence.staleDataSources.join(", ")}` : ""}
${insufficientData ? "\n⚠️ INSUFFICIENT DATA: Provide caveated analysis. Do not fabricate specific numbers." : ""}
${neighborhoods && neighborhoods.length > 0 ? `\nNEIGHBORHOOD BREAKDOWN:\n${neighborhoods.slice(0, 8).map((n) => `  - ${n.name}: ${n.propertyCount} properties, median ${formatCurrency(n.medianPrice)}${n.medianPricePerSqft ? `, $${n.medianPricePerSqft}/sqft` : ""}${n.yoyPriceChange != null ? `, YoY ${formatPercent(n.yoyPriceChange)}` : ""}`).join("\n")}` : ""}
${detailMetrics ? `\nDETAIL METRICS:\n- Median Days on Market: ${detailMetrics.medianDaysOnMarket ?? "N/A"}\n- List-to-Sale Ratio: ${detailMetrics.listToSaleRatio != null ? `${(detailMetrics.listToSaleRatio * 100).toFixed(1)}%` : "N/A"}\n- Flood Zone %: ${detailMetrics.floodZonePercentage != null ? `${(detailMetrics.floodZonePercentage * 100).toFixed(1)}%` : "N/A"}` : ""}
${news && news.targetMarket.length > 0 ? `\nRECENT NEWS:\n${formatNewsForPrompt(news.targetMarket)}` : ""}
${xSentiment ? `\nX SOCIAL SENTIMENT (from real-time X/Twitter posts via Grok):\n${formatXSentimentForPrompt(xSentiment)}` : ""}

Respond with a JSON object matching this exact schema:
{
  "overview": {
    "narrative": "1-2 paragraph executive briefing — the WHAT (30-second board-room summary, lead with single most important finding)",
    "highlights": ["3-5 key metrics/findings as bullet points"],
    "recommendations": ["2-3 actionable recommendations"]
  },
  "themes": [
    {
      "name": "Theme name",
      "impact": "high|medium|low",
      "trend": "up|down|neutral",
      "narrative": "1-2 paragraph analysis of this theme"
    }
  ],
  "neighborhoodAnalysis": {
    "narrative": "2-4 sentences maximum of neighborhood intelligence. Lead with the single most important cross-neighborhood pattern. Include one contrarian or surprising neighborhood-level finding. Do NOT list individual neighborhood median prices, property counts, or YoY percentages visible in the data table. Focus on relative positioning, migration signals, and micro-market dynamics."
  },
  "editorial": {
    "narrative": "2-3 paragraphs of strategic interpretation — the WHY (connect dots between segments, explain what drives the patterns, thematic synthesis). Do NOT repeat the overview or neighborhood narratives."
  },
  "executiveSummary": {
    "narrative": "1-2 paragraph executive summary — the SO-WHAT (actionable conclusions, what should the agent DO with this)",
    "highlights": ["3-5 performance highlights"],
    "timing": {
      "buyers": "Timing recommendation for buyers",
      "sellers": "Timing recommendation for sellers"
    }
  },
  "dashboardNarrative": "2-3 sentences summarizing the headline story of the last 100 luxury transactions — lead with transaction count and median price, include the most significant YoY change, and end with a one-line strategic takeaway. This appears as a headline above the dashboard metrics."
}

REMINDER: Each section above must contain DIFFERENT content. overview = WHAT, neighborhoodAnalysis = EVIDENCE, editorial = WHY, executiveSummary = SO-WHAT. No sentence or finding should appear in more than one section.

${insufficientData ? "Since data is insufficient, provide honest caveats. Use 0-1 themes." : "Identify 3-5 strategic themes from the segment and YoY data."}`;
}

// --- Main execution ---

export async function executeInsightGenerator(
  context: AgentContext
): Promise<AgentResult> {
  const start = Date.now();

  // Check abort signal before starting
  if (context.abortSignal.aborted) {
    const error = new Error("Insight Generator aborted before execution");
    (error as Error & { retriable: boolean }).retriable = false;
    throw error;
  }

  // Read analytics: prefer v2 computedAnalytics, fall back to v1 upstream
  const analytics = context.computedAnalytics;
  let analysis: DataAnalystOutput;
  let insufficientData: boolean;

  if (analytics) {
    // v2 path: convert ComputedAnalytics to DataAnalystOutput shape
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
    insufficientData =
      analytics.confidence.level === "low" || analytics.market.totalProperties === 0;
  } else {
    // v1 fallback: read from upstream data-analyst
    const dataAnalystResult = context.upstreamResults["data-analyst"];
    if (!dataAnalystResult) {
      throw new Error(
        "Insight Generator requires computedAnalytics or data-analyst upstream results"
      );
    }
    analysis = dataAnalystResult.metadata.analysis as DataAnalystOutput;
    insufficientData = dataAnalystResult.metadata.insufficientData === true;
  }

  // Build prompts
  const systemPrompt = buildSystemPrompt();
  const newsData = analytics
    ? { targetMarket: analytics.news?.targetMarket ?? [] }
    : undefined;
  const userPrompt = buildUserPrompt(
    context,
    analysis,
    newsData,
    analytics?.neighborhoods,
    analytics?.detailMetrics,
    analytics?.xSentiment
  );

  // Call Claude
  let insights: InsightGeneratorOutput;
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Parse response
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      insights = JSON.parse(stripJsonFences(text)) as InsightGeneratorOutput;
    } catch {
      const parseError = new Error(
        `Failed to parse Claude response as JSON: ${text.slice(0, 200)}`
      );
      (parseError as Error & { retriable: boolean }).retriable = true;
      throw parseError;
    }
  } catch (err: unknown) {
    // Re-throw if already tagged
    if (
      err instanceof Error &&
      "retriable" in err &&
      typeof (err as Error & { retriable: boolean }).retriable === "boolean"
    ) {
      throw err;
    }

    // Tag API errors
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
      sectionType: "market_overview",
      title: "Strategic Market Overview & Insights",
      content: insights.overview,
    },
    {
      sectionType: "key_drivers",
      title: "Key Market Drivers & Strategic Themes",
      content: { themes: insights.themes },
    },
    {
      sectionType: "executive_summary",
      title: "Executive Summary",
      content: insights.executiveSummary,
    },
  ];

  return {
    agentName: "insight-generator",
    sections,
    metadata: {
      insights,
      lowConfidence: insufficientData || analysis.confidence.level === "low",
      // Keys for report-assembler (Layer 3) — each is a DISTINCT narrative
      executiveBriefing: insights.overview.narrative,
      neighborhoodAnalysis: insights.neighborhoodAnalysis?.narrative ?? insights.executiveSummary.narrative,
      editorial: insights.editorial?.narrative ?? insights.executiveSummary.narrative,
      themes: insights.themes,
      dashboardNarrative: insights.dashboardNarrative ?? null,
    },
    durationMs: Date.now() - start,
  };
}

// --- Agent Definition (for pipeline registration) ---

export const insightGeneratorAgent: AgentDefinition = {
  name: "insight-generator",
  description:
    "Transforms structured market analysis into strategic narratives, key themes, and executive summary via Claude",
  dependencies: [], // v2: no dependencies, all data via computedAnalytics
  execute: executeInsightGenerator,
};
