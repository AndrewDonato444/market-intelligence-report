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
import {
  searchXSentiment,
  type XSentimentBrief,
} from "@/lib/connectors/grok";
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
    /** Detailed records for top-N properties by price (both periods combined) */
    details: PropertyDetail[];
    /** Details fetched for current-period properties only */
    currentPeriodDetails: PropertyDetail[];
    /** Details fetched for prior-period properties only */
    priorPeriodDetails: PropertyDetail[];
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
  /** X social sentiment brief from Grok x_search (optional, null if XAI_API_KEY not set) */
  xSentiment?: XSentimentBrief | null;
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

  // --- Step 1: Fetch target market properties (two date-bounded searches) ---
  checkAbort(abortSignal);

  const searchParams = buildSearchParamsFromMarket(market);
  const periods = computePeriodBounds();
  let currentPeriodProps: PropertySummary[] = [];
  let priorPeriodProps: PropertySummary[] = [];
  let targetStale = false;

  try {
    // Current period (last 12 months)
    const currentResult = await searchProperties(
      { ...searchParams, lastSaleDateMin: periods.current.min, lastSaleDateMax: periods.current.max },
      connectorOpts
    );
    currentPeriodProps = currentResult.properties;
    if (currentResult.stale) targetStale = true;
    apiCalls++;

    // Prior period (12–24 months ago)
    const priorResult = await searchProperties(
      { ...searchParams, lastSaleDateMin: periods.prior.min, lastSaleDateMax: periods.prior.max },
      connectorOpts
    );
    priorPeriodProps = priorResult.properties;
    if (priorResult.stale) targetStale = true;
    apiCalls++;
  } catch (err) {
    // Target market fetch is fatal — rethrow
    throw new Error(
      `Failed to fetch target market properties: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const targetProperties = [...currentPeriodProps, ...priorPeriodProps];
  if (targetStale) staleDataSources.push("realestateapi:search");

  // --- Step 2: Fetch property details for both period cohorts ---
  checkAbort(abortSignal);

  const detailsPerCohort = Math.max(Math.floor(topNDetails / 2), 3);

  const currentDetails = await fetchPropertyDetails(
    currentPeriodProps,
    detailsPerCohort,
    connectorOpts,
    abortSignal,
    errors
  );
  const priorDetails = await fetchPropertyDetails(
    priorPeriodProps,
    detailsPerCohort,
    connectorOpts,
    abortSignal,
    errors
  );

  apiCalls += currentDetails.callCount + priorDetails.callCount;
  if (currentDetails.stale || priorDetails.stale) staleDataSources.push("realestateapi:detail");

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

  // --- Step 7: Fetch X social sentiment (optional — requires XAI_API_KEY) ---
  checkAbort(abortSignal);

  let xSentiment: XSentimentBrief | null = null;
  try {
    xSentiment = await searchXSentiment(
      { city: market.geography.city, state: market.geography.state },
      connectorOpts
    );
    if (xSentiment) {
      apiCalls++;
      if (xSentiment.stale) staleDataSources.push("grok:x_sentiment");
    }
  } catch (err) {
    errors.push({
      source: "grok",
      endpoint: "/v1/responses",
      error: `X sentiment: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  return {
    targetMarket: {
      properties: targetProperties,
      stale: targetStale,
      details: [...currentDetails.records, ...priorDetails.records],
      currentPeriodDetails: currentDetails.records,
      priorPeriodDetails: priorDetails.records,
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
    xSentiment,
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

/**
 * Minimum peer markets for comparative positioning. If the user configured
 * fewer, we auto-source additional peers from neighboring cities in the
 * same state at the same price tier.
 */
const MIN_PEER_MARKETS = 3;

/**
 * Adjacent-city lookup by state. Used to auto-fill peer markets when user
 * configured fewer than MIN_PEER_MARKETS. Maps state abbreviations to
 * arrays of luxury-market cities (ordered by relevance). The target city
 * is excluded automatically.
 */
const STATE_LUXURY_CITIES: Record<string, string[]> = {
  FL: ["Naples", "Miami Beach", "Palm Beach", "Fort Lauderdale", "Sarasota", "Jupiter", "Boca Raton", "Key Biscayne", "Coral Gables", "St. Petersburg"],
  NY: ["Manhattan", "Hamptons", "Scarsdale", "Rye", "Westchester", "Great Neck", "Garden City", "Cold Spring Harbor", "Sag Harbor", "Brooklyn Heights"],
  CA: ["Beverly Hills", "Malibu", "Pacific Palisades", "La Jolla", "Montecito", "Newport Beach", "Palo Alto", "Atherton", "San Francisco", "Santa Barbara"],
  TX: ["Highland Park", "River Oaks", "West Lake Hills", "Alamo Heights", "Southlake", "The Woodlands", "University Park", "Westlake", "Preston Hollow"],
  CO: ["Aspen", "Vail", "Cherry Hills Village", "Telluride", "Steamboat Springs", "Boulder", "Castle Pines", "Greenwood Village"],
  AZ: ["Scottsdale", "Paradise Valley", "Sedona", "Carefree", "Fountain Hills", "Cave Creek"],
  NJ: ["Alpine", "Short Hills", "Rumson", "Saddle River", "Englewood Cliffs", "Bernardsville", "Princeton", "Montclair"],
  CT: ["Greenwich", "Darien", "New Canaan", "Westport", "Old Greenwich", "Fairfield"],
  MA: ["Wellesley", "Newton", "Brookline", "Nantucket", "Weston", "Concord", "Hingham"],
  NC: ["Charlotte", "Raleigh", "Asheville", "Wilmington", "Chapel Hill", "Pinehurst"],
  TN: ["Nashville", "Franklin", "Brentwood", "Germantown", "Chattanooga"],
  GA: ["Buckhead", "Alpharetta", "Sea Island", "Savannah", "Roswell"],
  SC: ["Charleston", "Kiawah Island", "Hilton Head", "Greenville", "Mount Pleasant"],
  IL: ["Winnetka", "Lake Forest", "Hinsdale", "Glencoe", "Highland Park", "Naperville"],
  WA: ["Mercer Island", "Medina", "Bellevue", "Bainbridge Island", "Kirkland"],
  HI: ["Kailua", "Honolulu", "Kapalua", "Wailea", "Princeville"],
  NV: ["Las Vegas", "Henderson", "Summerlin", "Incline Village"],
  UT: ["Park City", "Salt Lake City", "Deer Valley"],
  MT: ["Big Sky", "Whitefish", "Bozeman"],
  ID: ["Sun Valley", "Ketchum", "Boise", "Coeur d'Alene"],
};

function autoSourcePeerCities(
  market: MarketData
): Array<{ name: string; geography: { city: string; state: string } }> {
  const state = market.geography.state;
  const targetCity = market.geography.city.toLowerCase();
  const cities = STATE_LUXURY_CITIES[state] ?? [];

  return cities
    .filter((c) => c.toLowerCase() !== targetCity)
    .map((city) => ({
      name: `${city} Luxury`,
      geography: { city, state },
    }));
}

async function fetchPeerMarkets(
  market: MarketData,
  connectorOpts: { userId: string; reportId: string },
  abortSignal: AbortSignal,
  errors: FetchError[]
): Promise<{ records: PeerMarketData[]; callCount: number; stale: boolean }> {
  let peers = [...(market.peerMarkets ?? [])];

  // Auto-fill if fewer than MIN_PEER_MARKETS configured
  if (peers.length < MIN_PEER_MARKETS) {
    const existingCities = new Set(peers.map((p) => p.geography.city.toLowerCase()));
    const autoPeers = autoSourcePeerCities(market)
      .filter((p) => !existingCities.has(p.geography.city.toLowerCase()));
    peers = [...peers, ...autoPeers.slice(0, MIN_PEER_MARKETS - peers.length)];
  }

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

/**
 * Compute rolling 12-month period bounds for current vs prior year comparison.
 * Returns YYYY-MM-DD date strings for each period.
 */
export function computePeriodBounds(now = new Date()): {
  current: { min: string; max: string };
  prior: { min: string; max: string };
} {
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const currentMax = fmt(now);
  const currentMin = fmt(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1));

  const priorMax = fmt(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
  const priorMin = fmt(new Date(now.getFullYear() - 2, now.getMonth(), now.getDate() + 1));

  return {
    current: { min: currentMin, max: currentMax },
    prior: { min: priorMin, max: priorMax },
  };
}
