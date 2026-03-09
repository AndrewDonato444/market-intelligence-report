import { env } from "@/lib/config/env";
import * as cache from "@/lib/services/cache";
import { logApiCall } from "@/lib/services/api-usage";

const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations";

/**
 * Key FRED series IDs for luxury real estate market intelligence.
 */
export const FRED_SERIES = {
  MORTGAGE_30YR: "MORTGAGE30US",
  MORTGAGE_15YR: "MORTGAGE15US",
  CASE_SHILLER_NATIONAL: "CSUSHPINSA",
  MEDIAN_SALES_PRICE: "MSPUS",
  HOUSING_STARTS: "HOUST",
  UNEMPLOYMENT_RATE: "UNRATE",
  CPI: "CPIAUCSL",
  GDP: "GDP",
  FED_FUNDS_RATE: "DFF",
} as const;

export interface FredObservation {
  date: string;
  value: number | null;
}

export interface FredSeriesResult {
  seriesId: string;
  observations: FredObservation[];
  stale: boolean;
}

interface FetchSeriesOptions {
  start?: string;
  end?: string;
  userId?: string;
  reportId?: string;
}

interface FredApiResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  count: number;
  observations: Array<{
    realtime_start: string;
    realtime_end: string;
    date: string;
    value: string;
  }>;
}

/**
 * Fetch a single FRED series with cache integration.
 * Checks cache first, falls back to API, stores result in cache.
 * On API failure, returns stale cached data if available.
 */
export async function fetchSeries(
  seriesId: string,
  options: FetchSeriesOptions = {}
): Promise<FredSeriesResult> {
  const { start, end, userId, reportId } = options;
  const cacheKey = cache.buildKey("fred", "series", {
    seriesId,
    ...(start && { start }),
    ...(end && { end }),
  });

  // Check fresh cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    if (userId) {
      await logApiCall({
        userId,
        reportId,
        provider: "fred",
        endpoint: `series/observations?series_id=${seriesId}`,
        cached: true,
      });
    }
    return { ...(cached as { seriesId: string; observations: FredObservation[] }), stale: false };
  }

  // Build API URL
  const params = new URLSearchParams({
    api_key: env.FRED_API_KEY,
    series_id: seriesId,
    file_type: "json",
    sort_order: "asc",
  });
  if (start) params.set("observation_start", start);
  if (end) params.set("observation_end", end);

  const url = `${FRED_BASE_URL}?${params.toString()}`;
  const startTime = Date.now();

  const response = await fetch(url);

  if (!response.ok) {
    // Log the failed call
    if (userId) {
      await logApiCall({
        userId,
        reportId,
        provider: "fred",
        endpoint: `series/observations?series_id=${seriesId}`,
        statusCode: response.status,
        responseTimeMs: Date.now() - startTime,
        cached: false,
      });
    }

    // Try stale cache fallback
    const staleData = await cache.get(cacheKey + ":stale");
    if (staleData) {
      return {
        ...(staleData as { seriesId: string; observations: FredObservation[] }),
        stale: true,
      };
    }

    throw new Error(
      `FRED API error: ${response.status} ${response.statusText} for series ${seriesId}`
    );
  }

  const data: FredApiResponse = await response.json();
  const responseTimeMs = Date.now() - startTime;

  // Parse observations — FRED returns "." for missing values
  const observations: FredObservation[] = data.observations.map((obs) => ({
    date: obs.date,
    value: obs.value === "." ? null : parseFloat(obs.value),
  }));

  const result = { seriesId, observations };

  // Store in cache
  await cache.set(cacheKey, "fred", result);

  // Log the API call
  if (userId) {
    await logApiCall({
      userId,
      reportId,
      provider: "fred",
      endpoint: `series/observations?series_id=${seriesId}`,
      statusCode: 200,
      responseTimeMs,
      cached: false,
    });
  }

  return { ...result, stale: false };
}

/**
 * Fetch multiple FRED series in parallel.
 * Returns results for all successful fetches; failed series are omitted.
 */
export async function fetchMultipleSeries(
  seriesIds: string[],
  options: FetchSeriesOptions = {}
): Promise<FredSeriesResult[]> {
  const results = await Promise.allSettled(
    seriesIds.map((id) => fetchSeries(id, options))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<FredSeriesResult> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);
}
