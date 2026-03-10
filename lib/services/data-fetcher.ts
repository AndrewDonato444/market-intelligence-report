/**
 * Data Fetch Service — Layer 0
 *
 * Makes ALL external API calls (REAPI, ScrapingDog) and returns
 * a compiled raw data package. No computation, no Claude calls.
 *
 * This runs BEFORE any agents, ensuring complete separation between
 * data acquisition and data processing.
 */

import type { MarketData } from "@/lib/agents/orchestrator";
import {
  searchProperties,
  getPropertyDetail,
  getPropertyComps,
  buildSearchParamsFromMarket,
  type PropertySummary,
  type PropertyDetail,
  type CompsResult,
  type PropertySearchParams,
} from "@/lib/connectors/realestateapi";
import {
  searchLocal,
  buildLocalQuery,
  searchNews,
  buildNewsQuery,
  type LocalBusiness,
  type NewsArticle,
} from "@/lib/connectors/scrapingdog";
import { registry } from "@/lib/services/data-source-registry";

// --- Types ---

export interface DataFetchOptions {
  userId: string;
  reportId: string;
  market: MarketData;
  abortSignal: AbortSignal;
  /** How many PropertyDetail calls to make for deep metrics. Default: 10 */
  topNDetails?: number;
  /** How many PropertyComps lookups to make. Default: 5 */
  representativeComps?: number;
  /** Amenity categories to search via ScrapingDog. Default: standard luxury set */
  amenityCategories?: string[];
  /** News query topics to search via ScrapingDog. Default: standard luxury set */
  newsQueries?: string[];
}

export interface CompiledMarketData {
  targetMarket: {
    /** All properties from the target market (current + prior period combined) */
    properties: PropertySummary[];
    stale: boolean;
    /** Detailed records for top-N properties by price */
    details: PropertyDetail[];
    /** Comparable property data + AVM estimates */
    comps: CompsResult[];
  };
  peerMarkets: PeerMarketData[];
  neighborhood: {
    /** Amenity data keyed by category (e.g., "luxury restaurants") */
    amenities: Record<string, LocalBusiness[]>;
  };
  /** News articles about the target and peer markets */
  news: {
    targetMarket: NewsArticle[];
    peerMarkets: Record<string, NewsArticle[]>;
    stale: boolean;
  };
  fetchMetadata: {
    totalApiCalls: number;
    totalDurationMs: number;
    staleDataSources: string[];
    errors: FetchError[];
  };
}

export interface PeerMarketData {
  name: string;
  geography: { city: string; state: string };
  properties: PropertySummary[];
  stale: boolean;
}

export interface FetchError {
  source: string;
  endpoint: string;
  error: string;
}

// --- Constants ---

const DEFAULT_TOP_N_DETAILS = 10;
const DEFAULT_REPRESENTATIVE_COMPS = 5;
const DEFAULT_AMENITY_CATEGORIES = [
  "luxury restaurants",
  "private schools",
  "golf clubs",
  "marinas",
  "art galleries",
];
const DEFAULT_NEWS_QUERIES = [
  "luxury real estate market",
  "real estate development",
];

// --- Main function ---

export async function fetchAllMarketData(
  options: DataFetchOptions
): Promise<CompiledMarketData> {
  const start = Date.now();
  const {
    userId,
    reportId,
    market,
    abortSignal,
    topNDetails = DEFAULT_TOP_N_DETAILS,
    representativeComps = DEFAULT_REPRESENTATIVE_COMPS,
    amenityCategories = DEFAULT_AMENITY_CATEGORIES,
    newsQueries = DEFAULT_NEWS_QUERIES,
  } = options;

  const connectorOpts = { userId, reportId };
  const staleDataSources: string[] = [];
  const errors: FetchError[] = [];
  let apiCalls = 0;

  // Pre-flight: log connector availability from registry
  for (const connector of registry.getAll()) {
    if (!registry.envVarsPresent(connector.name)) {
      console.warn(
        `[data-fetcher] Connector "${connector.name}" missing env vars: ${connector.requiredEnvVars.join(", ")}`
      );
    }
    const health = registry.getHealthSnapshot(connector.name);
    if (health && health.status === "unhealthy") {
      console.warn(
        `[data-fetcher] Connector "${connector.name}" is unhealthy: ${health.error ?? "unknown error"}`
      );
    }
  }

  // --- Step 1: Fetch target market properties ---
  checkAbort(abortSignal);

  const searchParams = buildSearchParamsFromMarket(market);
  let targetProperties: PropertySummary[] = [];
  let targetStale = false;

  try {
    const result = await searchProperties(searchParams, connectorOpts);
    targetProperties = result.properties;
    targetStale = result.stale;
    if (result.stale) staleDataSources.push("realestateapi:search");
    apiCalls++;
  } catch (err) {
    // Target market fetch is fatal — rethrow
    throw new Error(
      `Failed to fetch target market properties: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // --- Step 2: Fetch property details for top-N by price ---
  checkAbort(abortSignal);

  const details = await fetchPropertyDetails(
    targetProperties,
    topNDetails,
    connectorOpts,
    abortSignal,
    errors
  );
  apiCalls += details.callCount;
  if (details.stale) staleDataSources.push("realestateapi:detail");

  // --- Step 3: Fetch comps for representative properties ---
  checkAbort(abortSignal);

  const comps = await fetchPropertyComps(
    targetProperties,
    representativeComps,
    connectorOpts,
    abortSignal,
    errors
  );
  apiCalls += comps.callCount;
  if (comps.stale) staleDataSources.push("realestateapi:comps");

  // --- Step 4: Fetch peer market data ---
  checkAbort(abortSignal);

  const peerMarkets = await fetchPeerMarkets(
    market,
    connectorOpts,
    abortSignal,
    errors
  );
  apiCalls += peerMarkets.callCount;
  if (peerMarkets.stale) staleDataSources.push("realestateapi:peers");

  // --- Step 5: Fetch neighborhood amenities ---
  checkAbort(abortSignal);

  const amenities = await fetchAmenities(
    market,
    amenityCategories,
    connectorOpts,
    abortSignal,
    errors
  );
  apiCalls += amenities.callCount;
  if (amenities.stale) staleDataSources.push("scrapingdog:local");

  // --- Step 6: Fetch market news ---
  checkAbort(abortSignal);

  const news = await fetchMarketNews(
    market,
    newsQueries,
    connectorOpts,
    abortSignal,
    errors
  );
  apiCalls += news.callCount;
  if (news.stale) staleDataSources.push("scrapingdog:news");

  return {
    targetMarket: {
      properties: targetProperties,
      stale: targetStale,
      details: details.records,
      comps: comps.records,
    },
    peerMarkets: peerMarkets.records,
    neighborhood: {
      amenities: amenities.records,
    },
    news: {
      targetMarket: news.targetArticles,
      peerMarkets: news.peerArticles,
      stale: news.stale,
    },
    fetchMetadata: {
      totalApiCalls: apiCalls,
      totalDurationMs: Date.now() - start,
      staleDataSources: [...new Set(staleDataSources)],
      errors,
    },
  };
}

// --- Internal fetchers ---

async function fetchPropertyDetails(
  properties: PropertySummary[],
  topN: number,
  connectorOpts: { userId: string; reportId: string },
  abortSignal: AbortSignal,
  errors: FetchError[]
): Promise<{ records: PropertyDetail[]; callCount: number; stale: boolean }> {
  // Sort by price descending, take top N
  const sorted = [...properties]
    .sort((a, b) => ((b.price ?? b.lastSalePrice ?? 0) - (a.price ?? a.lastSalePrice ?? 0)))
    .slice(0, topN);

  const records: PropertyDetail[] = [];
  let anyStale = false;
  let callCount = 0;

  for (const prop of sorted) {
    if (abortSignal.aborted) break;
    try {
      const detail = await getPropertyDetail(prop.id, connectorOpts);
      records.push(detail);
      if (detail.stale) anyStale = true;
      callCount++;
    } catch (err) {
      errors.push({
        source: "realestateapi",
        endpoint: "/v2/PropertyDetail",
        error: `Property ${prop.id}: ${err instanceof Error ? err.message : String(err)}`,
      });
      callCount++;
    }
  }

  return { records, callCount, stale: anyStale };
}

async function fetchPropertyComps(
  properties: PropertySummary[],
  count: number,
  connectorOpts: { userId: string; reportId: string },
  abortSignal: AbortSignal,
  errors: FetchError[]
): Promise<{ records: CompsResult[]; callCount: number; stale: boolean }> {
  // Pick representative properties: highest price, lowest price, median
  const withPrice = properties.filter((p) => p.price != null || p.lastSalePrice != null);
  if (withPrice.length === 0) {
    return { records: [], callCount: 0, stale: false };
  }

  const sorted = [...withPrice].sort(
    (a, b) => ((b.price ?? b.lastSalePrice ?? 0) - (a.price ?? a.lastSalePrice ?? 0))
  );

  const selected: PropertySummary[] = [];
  // Highest
  if (sorted.length > 0) selected.push(sorted[0]);
  // Lowest
  if (sorted.length > 1) selected.push(sorted[sorted.length - 1]);
  // Median
  if (sorted.length > 2) selected.push(sorted[Math.floor(sorted.length / 2)]);
  // Fill remaining from top
  for (let i = 1; i < sorted.length && selected.length < count; i++) {
    if (!selected.includes(sorted[i])) selected.push(sorted[i]);
  }

  const records: CompsResult[] = [];
  let anyStale = false;
  let callCount = 0;

  for (const prop of selected) {
    if (abortSignal.aborted) break;
    const address = prop.address;
    try {
      const result = await getPropertyComps(address, connectorOpts);
      records.push(result);
      if (result.stale) anyStale = true;
      callCount++;
    } catch (err) {
      errors.push({
        source: "realestateapi",
        endpoint: "/v3/PropertyComps",
        error: `Address "${address}": ${err instanceof Error ? err.message : String(err)}`,
      });
      callCount++;
    }
  }

  return { records, callCount, stale: anyStale };
}

async function fetchPeerMarkets(
  market: MarketData,
  connectorOpts: { userId: string; reportId: string },
  abortSignal: AbortSignal,
  errors: FetchError[]
): Promise<{ records: PeerMarketData[]; callCount: number; stale: boolean }> {
  const peers = market.peerMarkets ?? [];
  if (peers.length === 0) {
    return { records: [], callCount: 0, stale: false };
  }

  const records: PeerMarketData[] = [];
  let anyStale = false;
  let callCount = 0;

  for (const peer of peers) {
    if (abortSignal.aborted) break;

    const peerParams: PropertySearchParams = {
      city: peer.geography.city,
      state: peer.geography.state,
      priceMin: market.priceFloor,
      priceMax: market.priceCeiling ?? undefined,
    };

    try {
      const result = await searchProperties(peerParams, connectorOpts);
      records.push({
        name: peer.name,
        geography: peer.geography,
        properties: result.properties,
        stale: result.stale,
      });
      if (result.stale) anyStale = true;
      callCount++;
    } catch (err) {
      errors.push({
        source: "realestateapi",
        endpoint: "/v2/PropertySearch",
        error: `Peer "${peer.name}": ${err instanceof Error ? err.message : String(err)}`,
      });
      callCount++;
    }
  }

  return { records, callCount, stale: anyStale };
}

async function fetchAmenities(
  market: MarketData,
  categories: string[],
  connectorOpts: { userId: string; reportId: string },
  abortSignal: AbortSignal,
  errors: FetchError[]
): Promise<{ records: Record<string, LocalBusiness[]>; callCount: number; stale: boolean }> {
  const records: Record<string, LocalBusiness[]> = {};
  let anyStale = false;
  let callCount = 0;
  const location = `${market.geography.city}, ${market.geography.state}`;

  for (const category of categories) {
    if (abortSignal.aborted) break;

    const query = buildLocalQuery(category, {
      city: market.geography.city,
      state: market.geography.state,
    });

    try {
      const result = await searchLocal(query, location, connectorOpts);
      records[category] = result.businesses;
      if (result.stale) anyStale = true;
      callCount++;
    } catch (err) {
      errors.push({
        source: "scrapingdog",
        endpoint: "/google_local",
        error: `Category "${category}": ${err instanceof Error ? err.message : String(err)}`,
      });
      records[category] = [];
      callCount++;
    }
  }

  return { records, callCount, stale: anyStale };
}

async function fetchMarketNews(
  market: MarketData,
  queries: string[],
  connectorOpts: { userId: string; reportId: string },
  abortSignal: AbortSignal,
  errors: FetchError[]
): Promise<{ targetArticles: NewsArticle[]; peerArticles: Record<string, NewsArticle[]>; callCount: number; stale: boolean }> {
  const targetArticles: NewsArticle[] = [];
  const peerArticles: Record<string, NewsArticle[]> = {};
  let anyStale = false;
  let callCount = 0;

  // Fetch news for target market
  for (const topic of queries) {
    if (abortSignal.aborted) break;
    const query = buildNewsQuery(topic, {
      city: market.geography.city,
      state: market.geography.state,
    });
    try {
      const result = await searchNews(query, {
        ...connectorOpts,
        results: 10,
        tbs: "qdr:m",
      });
      targetArticles.push(...result.articles);
      if (result.stale) anyStale = true;
      callCount++;
    } catch (err) {
      errors.push({
        source: "scrapingdog",
        endpoint: "/google_news",
        error: `News "${query}": ${err instanceof Error ? err.message : String(err)}`,
      });
      callCount++;
    }
  }

  // Fetch news for each peer market (1 query per peer to limit credit usage)
  const peers = market.peerMarkets ?? [];
  for (const peer of peers) {
    if (abortSignal.aborted) break;
    const query = buildNewsQuery(queries[0] ?? "luxury real estate market", peer.geography);
    try {
      const result = await searchNews(query, {
        ...connectorOpts,
        results: 5,
        tbs: "qdr:m",
      });
      peerArticles[peer.name] = result.articles;
      if (result.stale) anyStale = true;
      callCount++;
    } catch (err) {
      errors.push({
        source: "scrapingdog",
        endpoint: "/google_news",
        error: `Peer news "${peer.name}": ${err instanceof Error ? err.message : String(err)}`,
      });
      peerArticles[peer.name] = [];
      callCount++;
    }
  }

  return { targetArticles, peerArticles, callCount, stale: anyStale };
}

// --- Helpers ---

function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new Error("Data fetch aborted");
  }
}
