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

export interface NewsArticle {
  title: string;
  snippet: string;
  source: string;
  lastUpdated: string;
  url: string;
}

export interface NewsSearchResult {
  articles: NewsArticle[];
  query: string;
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

/**
 * Build a Google News search query from a topic and market geography.
 */
export function buildNewsQuery(
  topic: string,
  market: { city: string; state: string }
): string {
  return `${market.city} ${market.state} ${topic}`;
}

// --- Google Local API ---

interface RawLocalResult {
  title: string;
  type?: string;
  rating?: number | string;
  reviews?: number | string;
  address?: string;
}

interface RawLocalResponse {
  local_results?: RawLocalResult[];
}

function parseLocalResults(raw: RawLocalResponse, query: string): Omit<LocalSearchResult, "stale"> {
  const businesses: LocalBusiness[] = (raw.local_results || []).map((r) => ({
    name: r.title || "",
    category: r.type || "",
    rating: r.rating != null ? Number(r.rating) || null : null,
    reviewCount: r.reviews != null ? Number(r.reviews) || null : null,
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

    const raw = await response.json();

    // ScrapingDog returns 200 with { success: false } for auth/plan errors
    if (raw.success === false) {
      throw new Error(
        `ScrapingDog error for /google_local: ${raw.message || "unknown error (success: false)"}`
      );
    }

    const result = parseLocalResults(raw as RawLocalResponse, query);
    await cache.set(cacheKey, "scrapingdog", result);
    // Stale fallback copy — survives normal TTL expiration (7-day window)
    await cache.set(cacheKey + ":stale", "scrapingdog", result, 604800);

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

    const text = await response.text();

    // ScrapingDog returns 200 with JSON { success: false } for auth/plan errors
    try {
      const maybeJson = JSON.parse(text);
      if (maybeJson.success === false) {
        throw new Error(
          `ScrapingDog error for /scrape: ${maybeJson.message || "unknown error (success: false)"}`
        );
      }
    } catch (e) {
      // Not JSON — it's actual HTML content, which is what we want
      if (e instanceof Error && e.message.startsWith("ScrapingDog error")) throw e;
    }

    const result = { html: text, url: targetUrl };
    await cache.set(cacheKey, "scrapingdog", result);
    // Stale fallback copy — survives normal TTL expiration (7-day window)
    await cache.set(cacheKey + ":stale", "scrapingdog", result, 604800);

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

// --- Google News API ---

interface RawNewsResult {
  title?: string;
  snippet?: string;
  source?: string;
  lastUpdated?: string;
  url?: string;
}

interface RawNewsResponse {
  news_results?: RawNewsResult[];
}

function parseNewsResults(raw: RawNewsResponse, query: string): Omit<NewsSearchResult, "stale"> {
  const articles: NewsArticle[] = (raw.news_results || []).map((r) => ({
    title: r.title || "",
    snippet: r.snippet || "",
    source: r.source || "",
    lastUpdated: r.lastUpdated || "",
    url: r.url || "",
  }));
  return { articles, query };
}

/**
 * Search Google News via ScrapingDog for market news articles.
 */
export async function searchNews(
  query: string,
  options: ConnectorOptions & {
    results?: number;
    country?: string;
    language?: string;
    tbs?: string;
  } = {}
): Promise<NewsSearchResult> {
  const tbs = options.tbs ?? "qdr:m";
  const cacheKey = cache.buildKey("scrapingdog", "news", { query, tbs });

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "scrapingdog",
        endpoint: "/google_news",
        cached: true,
      });
    }
    return { ...(cached as Omit<NewsSearchResult, "stale">), stale: false };
  }

  // Call API
  const params = new URLSearchParams({
    api_key: env.SCRAPINGDOG_API_KEY,
    query,
    results: String(options.results ?? 10),
    country: options.country ?? "us",
    language: options.language ?? "en",
    tbs,
  });

  const url = `${BASE_URL}/google_news?${params.toString()}`;
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
          endpoint: "/google_news",
          statusCode: response.status,
          responseTimeMs,
          cached: false,
        });
      }
      throw new Error(
        `ScrapingDog error: ${response.status} ${response.statusText} for /google_news`
      );
    }

    const raw = await response.json();

    // ScrapingDog returns 200 with { success: false } for auth/plan errors
    if (raw.success === false) {
      throw new Error(
        `ScrapingDog error for /google_news: ${raw.message || "unknown error (success: false)"}`
      );
    }

    const result = parseNewsResults(raw as RawNewsResponse, query);
    await cache.set(cacheKey, "scrapingdog", result);
    await cache.set(cacheKey + ":stale", "scrapingdog", result, 604800);

    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "scrapingdog",
        endpoint: "/google_news",
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
      return { ...(stale as Omit<NewsSearchResult, "stale">), stale: true };
    }
    throw error;
  }
}
