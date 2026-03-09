import { env } from "@/lib/config/env";
import * as cache from "@/lib/services/cache";
import { logApiCall } from "@/lib/services/api-usage";

const BASE_URL = "https://api.scrapingdog.com";

// --- Public Types ---

export interface LocalBusiness {
  name: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
}

export interface LocalSearchResult {
  businesses: LocalBusiness[];
  query: string;
  stale: boolean;
}

export interface ScrapeResult {
  html: string;
  url: string;
  stale: boolean;
}

export interface ConnectorOptions {
  userId?: string;
  reportId?: string;
}

// --- Helpers ---

/**
 * Build a Google Local search query from a category and market geography.
 */
export function buildLocalQuery(
  category: string,
  market: { city: string; state: string }
): string {
  return `${category} ${market.city} ${market.state}`;
}

// --- Google Local API ---

interface RawLocalResult {
  title: string;
  type?: string;
  rating?: number;
  reviews?: number;
  address?: string;
}

interface RawLocalResponse {
  local_results?: RawLocalResult[];
}

function parseLocalResults(raw: RawLocalResponse, query: string): Omit<LocalSearchResult, "stale"> {
  const businesses: LocalBusiness[] = (raw.local_results || []).map((r) => ({
    name: r.title || "",
    category: r.type || "",
    rating: r.rating ?? null,
    reviewCount: r.reviews ?? null,
    address: r.address ?? null,
  }));
  return { businesses, query };
}

/**
 * Search Google Local via ScrapingDog for neighborhood businesses/amenities.
 */
export async function searchLocal(
  query: string,
  location: string,
  options: ConnectorOptions = {}
): Promise<LocalSearchResult> {
  const cacheKey = cache.buildKey("scrapingdog", "local", { query, location });

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "scrapingdog",
        endpoint: "/google_local",
        cached: true,
      });
    }
    return { ...(cached as Omit<LocalSearchResult, "stale">), stale: false };
  }

  // Call API — /google_local uses "location" (text), not "ll" (GPS coords)
  const params = new URLSearchParams({
    api_key: env.SCRAPINGDOG_API_KEY,
    query,
    location,
  });

  const url = `${BASE_URL}/google_local?${params.toString()}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      if (options.userId) {
        await logApiCall({
          userId: options.userId,
          reportId: options.reportId,
          provider: "scrapingdog",
          endpoint: "/google_local",
          statusCode: response.status,
          responseTimeMs,
          cached: false,
        });
      }
      throw new Error(
        `ScrapingDog error: ${response.status} ${response.statusText} for /google_local`
      );
    }

    const raw: RawLocalResponse = await response.json();
    const result = parseLocalResults(raw, query);
    await cache.set(cacheKey, "scrapingdog", result);

    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "scrapingdog",
        endpoint: "/google_local",
        statusCode: 200,
        responseTimeMs,
        cached: false,
      });
    }

    return { ...result, stale: false };
  } catch (error) {
    // Stale fallback
    const stale = await cache.get(cacheKey + ":stale");
    if (stale) {
      return { ...(stale as Omit<LocalSearchResult, "stale">), stale: true };
    }
    throw error;
  }
}

// --- Web Scraping ---

/**
 * Scrape a URL via ScrapingDog for neighborhood content.
 */
export async function scrapeUrl(
  targetUrl: string,
  options: ConnectorOptions = {}
): Promise<ScrapeResult> {
  const cacheKey = cache.buildKey("scrapingdog", "scrape", { url: targetUrl });

  const cached = await cache.get(cacheKey);
  if (cached) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "scrapingdog",
        endpoint: "/scrape",
        cached: true,
      });
    }
    return { ...(cached as { html: string; url: string }), stale: false };
  }

  const params = new URLSearchParams({
    api_key: env.SCRAPINGDOG_API_KEY,
    url: targetUrl,
  });

  const url = `${BASE_URL}/scrape?${params.toString()}`;
  const startTime = Date.now();

  try {
    const response = await fetch(url);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      if (options.userId) {
        await logApiCall({
          userId: options.userId,
          reportId: options.reportId,
          provider: "scrapingdog",
          endpoint: "/scrape",
          statusCode: response.status,
          responseTimeMs,
          cached: false,
        });
      }
      throw new Error(
        `ScrapingDog error: ${response.status} ${response.statusText} for /scrape`
      );
    }

    const html = await response.text();
    const result = { html, url: targetUrl };
    await cache.set(cacheKey, "scrapingdog", result);

    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "scrapingdog",
        endpoint: "/scrape",
        statusCode: 200,
        responseTimeMs,
        cached: false,
      });
    }

    return { ...result, stale: false };
  } catch (error) {
    const stale = await cache.get(cacheKey + ":stale");
    if (stale) {
      return { ...(stale as { html: string; url: string }), stale: true };
    }
    throw error;
  }
}
