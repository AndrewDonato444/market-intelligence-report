/**
 * Competitive Analyst Agent
 *
 * @deprecated v2 pipeline no longer uses this agent. Peer market comparison
 * is now handled by:
 *   - Layer 0: data-fetcher.ts (fetches peer data)
 *   - Layer 1: market-analytics.ts (computePeerComparisons)
 *   - Layer 3: report-assembler.ts (comparative_positioning section)
 *
 * This file is kept for backward compatibility but is not registered
 * in the v2 pipeline.
 *
 * Original behavior:
 * Compares the target market against peer luxury markets.
 * Fetches property data for each peer, computes comparable metrics
 * using the same functions as the Data Analyst, then uses Claude
 * to generate strategic positioning narratives.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentContext,
  AgentDefinition,
  AgentResult,
  SectionOutput,
} from "@/lib/agents/orchestrator";
import type { DataAnalystOutput } from "@/lib/agents/data-analyst";
import {
  computeSegmentMetrics,
  computeYoY,
  assignRating,
} from "@/lib/agents/data-analyst";
import {
  searchProperties,
  buildSearchParamsFromMarket,
  type PropertySummary,
} from "@/lib/connectors/realestateapi";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

// --- Output types ---

export interface CompetitiveAnalystOutput {
  positioning: {
    narrative: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  peerComparisons: PeerComparison[];
  rankings: MarketRanking[];
}

export interface PeerComparison {
  peerName: string;
  medianPrice: number;
  medianPricePerSqft: number | null;
  totalProperties: number;
  rating: string;
  relativePerformance: string;
}

export interface MarketRanking {
  metric: string;
  targetRank: number;
  totalMarkets: number;
  narrative: string;
}

// --- Peer data summary (computed, not from Claude) ---

interface PeerAnalysis {
  name: string;
  geography: { city: string; state: string };
  totalProperties: number;
  medianPrice: number;
  averagePrice: number;
  medianPricePerSqft: number | null;
  totalVolume: number;
  rating: string;
  yoy: {
    medianPriceChange: number | null;
    volumeChange: number | null;
    pricePerSqftChange: number | null;
  };
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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

async function fetchPeerAnalysis(
  peer: { name: string; geography: { city: string; state: string } },
  context: AgentContext
): Promise<PeerAnalysis> {
  const searchParams = buildSearchParamsFromMarket({
    geography: peer.geography,
    luxuryTier: context.market.luxuryTier,
    priceFloor: context.market.priceFloor,
    priceCeiling: context.market.priceCeiling,
    propertyTypes: context.market.propertyTypes ?? null,
  });

  const result = await searchProperties(searchParams, {
    userId: context.userId,
    reportId: context.reportId,
  });

  const { properties } = result;

  // Compute metrics using same functions as data-analyst
  const prices = properties
    .map((p: PropertySummary) => p.price ?? p.lastSalePrice)
    .filter((p: number | null | undefined): p is number => p != null);

  const psf = properties
    .filter((p: PropertySummary) => p.price != null && p.sqft != null)
    .map((p: PropertySummary) => p.price! / p.sqft!);

  // YoY
  const currentYear = new Date().getFullYear();
  const currentYearProps = properties.filter((p: PropertySummary) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === currentYear;
  });
  const priorYearProps = properties.filter((p: PropertySummary) => {
    if (!p.lastSaleDate) return false;
    return new Date(p.lastSaleDate).getFullYear() === currentYear - 1;
  });

  const yoy = computeYoY(currentYearProps, priorYearProps);
  const rating = assignRating(
    yoy.medianPriceChange,
    yoy.volumeChange,
    properties.length
  );

  return {
    name: peer.name,
    geography: peer.geography,
    totalProperties: properties.length,
    medianPrice: median(prices),
    averagePrice: average(prices),
    medianPricePerSqft: psf.length > 0 ? median(psf) : null,
    totalVolume: prices.reduce((sum: number, p: number) => sum + p, 0),
    rating,
    yoy,
  };
}

function buildNoPeersResult(start: number): AgentResult {
  const section: SectionOutput = {
    sectionType: "competitive_market_analysis",
    title: "Competitive Market Analysis",
    content: {
      positioning: {
        narrative:
          "No peer markets have been defined for competitive comparison. Define peer markets in your market configuration to enable competitive analysis.",
        strengths: [],
        weaknesses: [],
        opportunities: [],
      },
      peerComparisons: [],
      rankings: [],
    },
  };

  return {
    agentName: "competitive-analyst",
    sections: [section],
    metadata: { noPeers: true, peersFetched: 0, peersSkipped: [] },
    durationMs: Date.now() - start,
  };
}

function buildSystemPrompt(): string {
  return `You are a senior luxury real estate competitive analyst. You compare luxury markets against peer markets to identify strategic positioning, competitive advantages, and market opportunities.

Your output must be valid JSON matching the exact schema requested. Do not include markdown, code fences, or any text outside the JSON object.

Guidelines:
- Compare markets on objective metrics (median price, volume, price/sqft, YoY growth)
- Identify genuine strengths and weaknesses based on data differences
- Frame opportunities as actionable intelligence for luxury agents
- Use professional financial language appropriate for high-net-worth advisory`;
}

function buildUserPrompt(
  context: AgentContext,
  targetAnalysis: DataAnalystOutput,
  peers: PeerAnalysis[]
): string {
  const { market } = context;
  const tierLabel = TIER_LABELS[market.luxuryTier] || market.luxuryTier;

  const targetSummary = `TARGET MARKET: ${market.name}
Location: ${market.geography.city}, ${market.geography.state}
Tier: ${tierLabel}
Total Properties: ${targetAnalysis.market.totalProperties}
Median Price: ${formatCurrency(targetAnalysis.market.medianPrice)}
Average Price: ${formatCurrency(targetAnalysis.market.averagePrice)}
Median Price/SqFt: ${targetAnalysis.market.medianPricePerSqft ? `$${targetAnalysis.market.medianPricePerSqft}` : "N/A"}
Total Volume: ${formatCurrency(targetAnalysis.market.totalVolume)}
Overall Rating: ${targetAnalysis.market.rating}
YoY Median Price Change: ${formatPercent(targetAnalysis.yoy.medianPriceChange)}
YoY Volume Change: ${formatPercent(targetAnalysis.yoy.volumeChange)}
YoY Price/SqFt Change: ${formatPercent(targetAnalysis.yoy.pricePerSqftChange)}`;

  const peerSummaries = peers
    .map(
      (p) => `PEER MARKET: ${p.name}
Location: ${p.geography.city}, ${p.geography.state}
Total Properties: ${p.totalProperties}
Median Price: ${formatCurrency(p.medianPrice)}
Average Price: ${formatCurrency(p.averagePrice)}
Median Price/SqFt: ${p.medianPricePerSqft ? `$${p.medianPricePerSqft}` : "N/A"}
Total Volume: ${formatCurrency(p.totalVolume)}
Rating: ${p.rating}
YoY Median Price Change: ${formatPercent(p.yoy.medianPriceChange)}
YoY Volume Change: ${formatPercent(p.yoy.volumeChange)}`
    )
    .join("\n\n");

  return `Compare the following target luxury market against its peer markets and provide competitive analysis.

${targetSummary}

${peerSummaries}

Respond with a JSON object matching this exact schema:
{
  "positioning": {
    "narrative": "2-3 paragraph competitive positioning analysis",
    "strengths": ["2-4 competitive strengths vs peers"],
    "weaknesses": ["1-3 competitive weaknesses vs peers"],
    "opportunities": ["2-3 opportunities based on competitive gaps"]
  },
  "peerComparisons": [
    {
      "peerName": "Market name",
      "medianPrice": number,
      "medianPricePerSqft": number or null,
      "totalProperties": number,
      "rating": "rating letter",
      "relativePerformance": "1-2 sentence comparison"
    }
  ],
  "rankings": [
    {
      "metric": "Metric name",
      "targetRank": number (1-based),
      "totalMarkets": number (target + peers),
      "narrative": "1 sentence ranking context"
    }
  ]
}

Include rankings for: Median Price, YoY Price Growth, Transaction Volume, and Price per SqFt.`;
}

// --- Main execution ---

export async function executeCompetitiveAnalyst(
  context: AgentContext
): Promise<AgentResult> {
  const start = Date.now();

  // Check abort signal
  if (context.abortSignal.aborted) {
    const error = new Error(
      "Competitive Analyst aborted before execution"
    );
    (error as Error & { retriable: boolean }).retriable = false;
    throw error;
  }

  // Read upstream data analyst output
  const dataAnalystResult = context.upstreamResults["data-analyst"];
  if (!dataAnalystResult) {
    throw new Error(
      "Competitive Analyst requires data-analyst upstream results"
    );
  }

  const targetAnalysis = dataAnalystResult.metadata
    .analysis as DataAnalystOutput;

  // Check for peer markets
  const peerMarkets = context.market.peerMarkets;
  if (!peerMarkets || peerMarkets.length === 0) {
    return buildNoPeersResult(start);
  }

  // Fetch data for each peer market
  const peerAnalyses: PeerAnalysis[] = [];
  const peersSkipped: string[] = [];

  for (const peer of peerMarkets) {
    // Check abort between fetches
    if (context.abortSignal.aborted) {
      const error = new Error(
        "Competitive Analyst aborted during peer data fetch"
      );
      (error as Error & { retriable: boolean }).retriable = false;
      throw error;
    }

    try {
      const analysis = await fetchPeerAnalysis(peer, context);
      peerAnalyses.push(analysis);
    } catch {
      peersSkipped.push(peer.name);
    }
  }

  // If all peers failed, return no-peers-like result
  if (peerAnalyses.length === 0) {
    return {
      agentName: "competitive-analyst",
      sections: [
        {
          sectionType: "competitive_market_analysis",
          title: "Competitive Market Analysis",
          content: {
            positioning: {
              narrative:
                "Unable to fetch peer market data for competitive comparison. All peer market data requests failed.",
              strengths: [],
              weaknesses: [],
              opportunities: [],
            },
            peerComparisons: [],
            rankings: [],
          },
        },
      ],
      metadata: {
        peersFetched: 0,
        peersSkipped,
        competitiveAnalysis: null,
      },
      durationMs: Date.now() - start,
    };
  }

  // Build prompt and call Claude
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(context, targetAnalysis, peerAnalyses);

  let competitiveAnalysis: CompetitiveAnalystOutput;
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      competitiveAnalysis = JSON.parse(stripJsonFences(text)) as CompetitiveAnalystOutput;
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

    const status = (err as { status?: number }).status;
    const retriable = status === 429 || status === 500 || status === 503;
    const wrappedError = new Error(
      (err as Error).message || "Claude API error"
    );
    (wrappedError as Error & { retriable: boolean }).retriable = retriable;
    throw wrappedError;
  }

  // Build section
  const section: SectionOutput = {
    sectionType: "competitive_market_analysis",
    title: "Competitive Market Analysis",
    content: competitiveAnalysis,
  };

  return {
    agentName: "competitive-analyst",
    sections: [section],
    metadata: {
      competitiveAnalysis,
      peersFetched: peerAnalyses.length,
      peersSkipped,
    },
    durationMs: Date.now() - start,
  };
}

// --- Agent Definition (for pipeline registration) ---

export const competitiveAnalystAgent: AgentDefinition = {
  name: "competitive-analyst",
  description:
    "Compares target market against peer luxury markets with positioning analysis via Claude",
  dependencies: ["data-analyst"],
  execute: executeCompetitiveAnalyst,
};
