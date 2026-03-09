import { env } from "@/lib/config/env";
import * as cache from "@/lib/services/cache";
import { logApiCall } from "@/lib/services/api-usage";

const BASE_URL = "https://api.realestateapi.com";

// --- Public Types ---

export interface PropertySearchParams {
  city: string;
  state: string;
  zipCodes?: string[];
  priceMin?: number;
  priceMax?: number;
  propertyTypes?: string[];
  limit?: number;
  offset?: number;
}

export interface PropertySummary {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  yearBuilt: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
}

export interface PropertySearchResult {
  properties: PropertySummary[];
  total: number;
  stale: boolean;
}

export interface PropertyDetail {
  id: string;
  address: string;
  owner: { name: string; mailingAddress: string } | null;
  saleHistory: Array<{ date: string; price: number }>;
  mortgage: { amount: number; lender: string; date: string } | null;
  valuation: { estimated: number; low: number; high: number } | null;
  lotSize: number | null;
  sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  stale: boolean;
}

export interface CompProperty {
  address: string;
  price: number;
  sqft: number | null;
  pricePerSqft: number | null;
  distance: number | null;
  similarity: number | null;
}

export interface CompsResult {
  subjectProperty: string;
  comps: CompProperty[];
  avm: { estimated: number; low: number; high: number } | null;
  stale: boolean;
}

export interface ConnectorOptions {
  userId?: string;
  reportId?: string;
}

// --- Market-to-params mapping ---

interface MarketLike {
  geography: { city: string; state: string; zipCodes?: string[] };
  luxuryTier: string;
  priceFloor: number;
  priceCeiling?: number | null;
  propertyTypes?: string[] | null;
}

export function buildSearchParamsFromMarket(market: MarketLike): PropertySearchParams {
  return {
    city: market.geography.city,
    state: market.geography.state,
    zipCodes: market.geography.zipCodes,
    priceMin: market.priceFloor,
    priceMax: market.priceCeiling ?? undefined,
    propertyTypes: market.propertyTypes ?? undefined,
  };
}

// --- Internal helpers ---

async function apiRequest<T>(
  endpoint: string,
  body: Record<string, unknown>,
  options: ConnectorOptions = {}
): Promise<{ data: T; responseTimeMs: number }> {
  const startTime = Date.now();

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "x-api-key": env.REALESTATEAPI_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseTimeMs = Date.now() - startTime;

  if (!response.ok) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "realestateapi",
        endpoint,
        statusCode: response.status,
        responseTimeMs,
        cached: false,
      });
    }
    throw new Error(
      `RealEstateAPI error: ${response.status} ${response.statusText} for ${endpoint}`
    );
  }

  const data = (await response.json()) as T;
  return { data, responseTimeMs };
}

// --- Search Properties ---

interface RawSearchResponse {
  status: number;
  resultCount: number;
  data: Array<{
    id: string;
    address: { full: string; city: string; state: string; zip: string };
    summary: {
      proptype: string | null;
      yearbuilt: number | null;
      sqft: number | null;
      beds: number | null;
      baths: number | null;
    };
    sale: { saledate: string | null; saleprice: number | null } | null;
  }>;
}

function parseSearchResults(raw: RawSearchResponse): { properties: PropertySummary[]; total: number } {
  const properties: PropertySummary[] = (raw.data || []).map((p) => ({
    id: p.id,
    address: p.address?.full || "",
    city: p.address?.city || "",
    state: p.address?.state || "",
    zip: p.address?.zip || "",
    price: p.sale?.saleprice ?? null,
    sqft: p.summary?.sqft ?? null,
    bedrooms: p.summary?.beds ?? null,
    bathrooms: p.summary?.baths ?? null,
    propertyType: p.summary?.proptype ?? null,
    yearBuilt: p.summary?.yearbuilt ?? null,
    lastSaleDate: p.sale?.saledate ?? null,
    lastSalePrice: p.sale?.saleprice ?? null,
  }));
  return { properties, total: raw.resultCount || properties.length };
}

export async function searchProperties(
  params: PropertySearchParams,
  options: ConnectorOptions = {}
): Promise<PropertySearchResult> {
  const cacheKey = cache.buildKey("reapi", "property-search", {
    city: params.city,
    state: params.state,
    ...(params.zipCodes && { zips: params.zipCodes.join(",") }),
    ...(params.priceMin && { priceMin: params.priceMin }),
    ...(params.priceMax && { priceMax: params.priceMax }),
    ...(params.propertyTypes && { types: params.propertyTypes.join(",") }),
    ...(params.limit && { limit: params.limit }),
    ...(params.offset && { offset: params.offset }),
  });

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "realestateapi",
        endpoint: "/v2/PropertySearch",
        cached: true,
      });
    }
    return { ...(cached as { properties: PropertySummary[]; total: number }), stale: false };
  }

  // Build request body
  const body: Record<string, unknown> = {
    city: params.city,
    state: params.state,
  };
  if (params.zipCodes?.length) body.zip = params.zipCodes;
  if (params.priceMin) body.sale_price_min = params.priceMin;
  if (params.priceMax) body.sale_price_max = params.priceMax;
  if (params.propertyTypes?.length) body.property_type = params.propertyTypes;
  if (params.limit) body.size = params.limit;
  if (params.offset) body.start = params.offset;

  try {
    const { data: raw, responseTimeMs } = await apiRequest<RawSearchResponse>(
      "/v2/PropertySearch",
      body,
      options
    );

    const result = parseSearchResults(raw);
    await cache.set(cacheKey, "realestateapi", result);

    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "realestateapi",
        endpoint: "/v2/PropertySearch",
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
      return { ...(stale as { properties: PropertySummary[]; total: number }), stale: true };
    }
    throw error;
  }
}

// --- Property Detail ---

interface RawDetailResponse {
  status: number;
  data: {
    id: string;
    address: { full: string };
    owner: { name: string; mailingAddress: string } | null;
    summary: {
      proptype: string | null;
      yearbuilt: number | null;
      sqft: number | null;
      beds: number | null;
      baths: number | null;
      lotsize: number | null;
    };
    sale: Array<{ saledate: string; saleprice: number }> | null;
    mortgage: { amount: number; lender: string; date: string } | null;
    valuation: { estimated: number; low: number; high: number } | null;
  };
}

function parseDetail(raw: RawDetailResponse): Omit<PropertyDetail, "stale"> {
  const d = raw.data;
  return {
    id: d.id,
    address: d.address?.full || "",
    owner: d.owner || null,
    saleHistory: (d.sale || []).map((s) => ({ date: s.saledate, price: s.saleprice })),
    mortgage: d.mortgage || null,
    valuation: d.valuation || null,
    lotSize: d.summary?.lotsize ?? null,
    sqft: d.summary?.sqft ?? null,
    bedrooms: d.summary?.beds ?? null,
    bathrooms: d.summary?.baths ?? null,
    yearBuilt: d.summary?.yearbuilt ?? null,
    propertyType: d.summary?.proptype ?? null,
  };
}

export async function getPropertyDetail(
  propertyId: string,
  options: ConnectorOptions = {}
): Promise<PropertyDetail> {
  const cacheKey = cache.buildKey("reapi", "property-detail", { id: propertyId });

  const cached = await cache.get(cacheKey);
  if (cached) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "realestateapi",
        endpoint: "/v2/PropertyDetail",
        cached: true,
      });
    }
    return { ...(cached as Omit<PropertyDetail, "stale">), stale: false };
  }

  try {
    const { data: raw, responseTimeMs } = await apiRequest<RawDetailResponse>(
      "/v2/PropertyDetail",
      { id: propertyId },
      options
    );

    const result = parseDetail(raw);
    await cache.set(cacheKey, "realestateapi", result);

    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "realestateapi",
        endpoint: "/v2/PropertyDetail",
        statusCode: 200,
        responseTimeMs,
        cached: false,
      });
    }

    return { ...result, stale: false };
  } catch (error) {
    const stale = await cache.get(cacheKey + ":stale");
    if (stale) {
      return { ...(stale as Omit<PropertyDetail, "stale">), stale: true };
    }
    throw error;
  }
}

// --- Property Comps ---

interface RawCompsResponse {
  status: number;
  data: {
    subject: { address: string };
    comps: Array<{
      address: string;
      saleprice: number;
      sqft: number | null;
      pricePerSqft: number | null;
      distance: number | null;
      similarity: number | null;
    }>;
    avm: { estimated: number; low: number; high: number } | null;
  };
}

function parseComps(raw: RawCompsResponse): Omit<CompsResult, "stale"> {
  return {
    subjectProperty: raw.data.subject?.address || "",
    comps: (raw.data.comps || []).map((c) => ({
      address: c.address,
      price: c.saleprice,
      sqft: c.sqft ?? null,
      pricePerSqft: c.pricePerSqft ?? null,
      distance: c.distance ?? null,
      similarity: c.similarity ?? null,
    })),
    avm: raw.data.avm || null,
  };
}

export async function getPropertyComps(
  address: string,
  options: ConnectorOptions = {}
): Promise<CompsResult> {
  const cacheKey = cache.buildKey("reapi", "property-comps", { address });

  const cached = await cache.get(cacheKey);
  if (cached) {
    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "realestateapi",
        endpoint: "/v3/PropertyComps",
        cached: true,
      });
    }
    return { ...(cached as Omit<CompsResult, "stale">), stale: false };
  }

  try {
    const { data: raw, responseTimeMs } = await apiRequest<RawCompsResponse>(
      "/v3/PropertyComps",
      { address, comps: true },
      options
    );

    const result = parseComps(raw);
    await cache.set(cacheKey, "realestateapi", result);

    if (options.userId) {
      await logApiCall({
        userId: options.userId,
        reportId: options.reportId,
        provider: "realestateapi",
        endpoint: "/v3/PropertyComps",
        statusCode: 200,
        responseTimeMs,
        cached: false,
      });
    }

    return { ...result, stale: false };
  } catch (error) {
    const stale = await cache.get(cacheKey + ":stale");
    if (stale) {
      return { ...(stale as Omit<CompsResult, "stale">), stale: true };
    }
    throw error;
  }
}
