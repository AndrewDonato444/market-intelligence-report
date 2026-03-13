/**
 * Grok / xAI Connector — X Social Sentiment via x_search
 *
 * Uses the xAI Responses API with the x_search tool to synthesize
 * social sentiment from X posts about a luxury real estate market.
 *
 * Returns an XSentimentBrief (not raw posts — Grok synthesizes across posts).
 * Fully optional: returns null if XAI_API_KEY is not set.
 */

import * as cache from "@/lib/services/cache";
import { logApiCall } from "@/lib/services/api-usage";

// --- Public Types ---

export interface XSentimentBrief {
  /** 2-3 paragraph synthesis of X social sentiment about this market */
  summary: string;
  /** Bullish themes from X posts (e.g., "strong buyer demand", "inventory tightening") */
  bullThemes: string[];
  /** Bearish/contrarian signals from X posts (e.g., "insurance costs rising", "price corrections") */
  bearSignals: string[];
  /** Notable direct quotes or paraphrased observations from X posts */
  notableQuotes: Array<{
    text: string;
    attribution: string;
  }>;
  /** Overall sentiment direction */
  sentiment: "positive" | "negative" | "mixed" | "neutral";
  /** The query used to generate this brief */
  query: string;
  /** Whether this data was served from stale cache */
  stale: boolean;
}

export interface GrokConnectorOptions {
  userId?: string;
  reportId?: string;
}

// --- Constants ---

const XAI_API_URL = "https://api.x.ai/v1/responses";
const GROK_MODEL = "grok-4";

// --- Helpers ---

/**
 * Build the search prompt for Grok x_search from market geography.
 */
export function buildXSentimentQuery(market: {
  city: string;
  state: string;
}): string {
  return `Search X for posts about the ${market.city}, ${market.state} luxury real estate market from the last 30 days. Synthesize the social sentiment into a structured intelligence brief.

Focus on:
1. What real estate professionals, brokers, and industry accounts are saying
2. Specific price points, deal flow, or market statistics mentioned
3. Contrarian or bearish takes that traditional news might not surface
4. Notable broker quotes or insider observations
5. Buyer/seller sentiment and demand signals

Return a JSON object with this exact schema:
{
  "summary": "2-3 paragraph synthesis of the overall X sentiment about this market",
  "bullThemes": ["3-5 bullish themes or positive signals found in posts"],
  "bearSignals": ["2-4 bearish signals, risks, or contrarian views found in posts"],
  "notableQuotes": [
    { "text": "paraphrased or direct observation from a post", "attribution": "account name or description" }
  ],
  "sentiment": "positive|negative|mixed|neutral"
}

IMPORTANT: Return ONLY the JSON object. No markdown, no code fences, no additional text.
If there are very few relevant posts, note that in the summary and provide what signal you can find.`;
}

/**
 * Compute date range strings for the last 30 days.
 */
function computeDateRange(): { fromDate: string; toDate: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { fromDate: fmt(from), toDate: fmt(to) };
}

// --- Main function ---

/**
 * Search X social sentiment via Grok x_search for a luxury real estate market.
 *
 * Returns null (no throw) if:
 * - XAI_API_KEY is not set
 * - API call fails and no stale cache is available
 *
 * This ensures the pipeline works identically without the key.
 */
export async function searchXSentiment(
  market: { city: string; state: string },
  options: GrokConnectorOptions = {}
): Promise<XSentimentBrief | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const query = buildXSentimentQuery(market);
  const cacheKey = cache.buildKey("grok", "x_sentiment", {
    city: market.city,
    state: market.state,
  });

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "grok",
        endpoint: "/v1/responses",
        cached: true,
      });
    }
    return {
      ...(cached as Omit<XSentimentBrief, "stale">),
      stale: false,
    };
  }

  // Call xAI Responses API
  const { fromDate, toDate } = computeDateRange();
  const startTime = Date.now();

  try {
    const payload = {
      model: GROK_MODEL,
      input: [{ role: "user", content: query }],
      tools: [
        {
          type: "x_search",
          from_date: fromDate,
          to_date: toDate,
        },
      ],
    };

    const res = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!res.ok) {
      const text = await res.text();

      if (options.userId) {
        await logApiCall({
          userId: options.userId,
          reportId: options.reportId,
          provider: "grok",
          endpoint: "/v1/responses",
          statusCode: res.status,
          responseTimeMs,
          cached: false,
        });
      }

      throw new Error(`Grok API error: HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();

    // Extract text output from response structure:
    // output[] → type "message" → content[] → type "output_text" → text
    const output = data.output ?? [];
    const textBlocks = output
      .filter((o: Record<string, unknown>) => o.type === "message")
      .flatMap((o: Record<string, unknown>) => (o.content as Array<Record<string, unknown>>) ?? [])
      .filter((c: Record<string, unknown>) => c.type === "output_text")
      .map((c: Record<string, unknown>) => c.text as string);

    const responseText = textBlocks.join("\n");

    if (!responseText) {
      throw new Error("Grok returned empty response text");
    }

    // Parse JSON from response (strip any accidental markdown fences)
    let parsed: Omit<XSentimentBrief, "query" | "stale">;
    try {
      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(
        `Failed to parse Grok response as JSON: ${responseText.slice(0, 200)}`
      );
    }

    const result: Omit<XSentimentBrief, "stale"> = {
      summary: parsed.summary ?? "",
      bullThemes: parsed.bullThemes ?? [],
      bearSignals: parsed.bearSignals ?? [],
      notableQuotes: parsed.notableQuotes ?? [],
      sentiment: parsed.sentiment ?? "neutral",
      query: `${market.city}, ${market.state} luxury real estate`,
    };

    // Cache result (7-day TTL via SOURCE_TTLS.grok)
    await cache.set(cacheKey, "grok", result);
    // Stale fallback copy (14-day window)
    await cache.set(cacheKey + ":stale", "grok", result, 1209600);

    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "grok",
        endpoint: "/v1/responses",
        statusCode: 200,
        responseTimeMs,
        cached: false,
      });
    }

    return { ...result, stale: false };
  } catch (error) {
    console.warn(
      `[grok] X sentiment fetch failed: ${error instanceof Error ? error.message : String(error)}`
    );

    // Try stale fallback
    const stale = await cache.get(cacheKey + ":stale");
    if (stale) {
      return {
        ...(stale as Omit<XSentimentBrief, "stale">),
        stale: true,
      };
    }

    // No stale cache — return null (pipeline continues without X sentiment)
    return null;
  }
}
