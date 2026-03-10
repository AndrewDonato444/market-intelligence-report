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
  propertyType: string | null;
  stale: boolean;

  // --- Core property info ---
  propertyInfo: {
    address: {
      address: string;
      city: string;
      state: string;
      zip: string;
      county: string | null;
      label: string | null;
    };
    latitude: number | null;
    longitude: number | null;
    sqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    partialBathrooms: number | null;
    yearBuilt: number | null;
    stories: number | null;
    construction: string | null;
    pool: boolean;
    fireplace: boolean;
    garageType: string | null;
    garageSquareFeet: number | null;
    heatingType: string | null;
    airConditioningType: string | null;
    lotSquareFeet: number | null;
    pricePerSquareFoot: number | null;
    propertyUse: string | null;
  } | null;

  // --- Root level flags ---
  flags: {
    absenteeOwner: boolean;
    ownerOccupied: boolean;
    corporateOwned: boolean;
    investorBuyer: boolean;
    vacant: boolean;
    freeClear: boolean;
    highEquity: boolean;
    cashBuyer: boolean;
    cashSale: boolean;
    mlsActive: boolean;
    mlsPending: boolean;
    mlsSold: boolean;
    preForeclosure: boolean;
    auction: boolean;
    floodZone: boolean;
  };

  // --- Valuation ---
  estimatedValue: number | null;
  estimatedEquity: number | null;
  equityPercent: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;

  // --- Owner info ---
  ownerInfo: {
    ownerName: string | null;
    ownerType: string | null;
    mailingAddress: string | null;
    ownershipLengthMonths: number | null;
  } | null;

  // --- Tax info ---
  taxInfo: {
    assessedValue: number | null;
    assessedLandValue: number | null;
    assessedImprovementValue: number | null;
    marketValue: number | null;
    taxAmount: string | null;
    assessmentYear: number | null;
  } | null;

  // --- Lot info ---
  lotInfo: {
    apn: string | null;
    lotAcres: number | null;
    lotSquareFeet: number | null;
    zoning: string | null;
    landUse: string | null;
    legalDescription: string | null;
    subdivision: string | null;
  } | null;

  // --- Sale history ---
  saleHistory: Array<{
    date: string;
    price: number;
    buyerNames: string | null;
    sellerNames: string | null;
    documentType: string | null;
    transactionType: string | null;
    purchaseMethod: string | null;
  }>;

  // --- Current mortgages ---
  currentMortgages: Array<{
    amount: number;
    interestRate: number | null;
    interestRateType: string | null;
    loanType: string | null;
    lenderName: string | null;
    documentDate: string | null;
    position: string | null;
  }>;

  // --- MLS history ---
  mlsHistory: Array<{
    price: string | null;
    status: string | null;
    statusDate: string | null;
    daysOnMarket: string | null;
    agentName: string | null;
    agentOffice: string | null;
    beds: number | null;
    baths: number | null;
  }>;

  // --- Demographics (zip level) ---
  demographics: {
    medianIncome: string | null;
    suggestedRent: string | null;
    fmrYear: string | null;
  } | null;

  // --- Schools ---
  schools: Array<{
    name: string;
    type: string | null;
    grades: string | null;
    rating: string | null;
    parentRating: string | null;
    enrollment: string | null;
  }>;

  // --- Neighborhood ---
  neighborhood: {
    name: string | null;
    type: string | null;
  } | null;

  // --- Flood zone ---
  floodZoneType: string | null;
  floodZoneDescription: string | null;

  // --- Linked properties (portfolio) ---
  linkedProperties: {
    totalOwned: string | null;
    totalValue: string | null;
    totalEquity: string | null;
    ids: string[];
  } | null;
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
    const errorBody = await response.text().catch(() => "(could not read body)");
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
      `RealEstateAPI error: ${response.status} ${response.statusText} for ${endpoint} | Body: ${errorBody}`
    );
  }

  const data = (await response.json()) as T;
  return { data, responseTimeMs };
}

// --- Search Properties ---

interface RawSearchResponse {
  statusCode: number;
  resultCount: number;
  data: Array<{
    id: string | number;
    address: { address: string; city: string; state: string; zip: string };
    propertyType: string | null;
    yearBuilt: number | null;
    squareFeet: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    lastSaleDate: string | null;
    lastSaleAmount: number | string | null;
    estimatedValue: number | null;
  }>;
}

/** Safely parse a value that may be a string or number to a number. */
function toNumber(val: number | string | null | undefined): number | null {
  if (val == null) return null;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? null : n;
}

function parseSearchResults(raw: RawSearchResponse): { properties: PropertySummary[]; total: number } {
  const properties: PropertySummary[] = (raw.data || []).map((p) => {
    const salePrice = toNumber(p.lastSaleAmount);
    return {
      id: String(p.id),
      address: p.address?.address || "",
      city: p.address?.city || "",
      state: p.address?.state || "",
      zip: p.address?.zip || "",
      price: salePrice ?? toNumber(p.estimatedValue) ?? null,
      sqft: p.squareFeet ?? null,
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      propertyType: p.propertyType ?? null,
      yearBuilt: p.yearBuilt ?? null,
      lastSaleDate: p.lastSaleDate ?? null,
      lastSalePrice: salePrice,
    };
  });
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
  if (params.priceMin) body.last_sale_price_min = params.priceMin;
  if (params.priceMax) body.last_sale_price_max = params.priceMax;
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

// Raw response matches REAPI Property Detail structure
// See .specs/learnings/reapi-property-detail-schema.md for full reference
interface RawDetailResponse {
  status: number;
  data: {
    id: string | number;
    propertyType: string | null;
    // Root level flags
    absenteeOwner?: boolean;
    ownerOccupied?: boolean;
    corporateOwned?: boolean;
    investorBuyer?: boolean;
    vacant?: boolean;
    freeClear?: boolean;
    highEquity?: boolean;
    cashBuyer?: boolean;
    cashSale?: boolean;
    mlsActive?: boolean;
    mlsPending?: boolean;
    mlsSold?: boolean;
    preForeclosure?: boolean;
    auction?: boolean;
    floodZone?: boolean;
    floodZoneType?: string | null;
    floodZoneDescription?: string | null;
    // Root level values
    estimatedValue?: number | null;
    estimatedEquity?: number | null;
    equityPercent?: number | null;
    lastSaleDate?: string | null;
    lastSalePrice?: string | number | null;
    // Nested objects
    propertyInfo?: {
      address?: {
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
        county?: string;
        label?: string;
      };
      latitude?: number;
      longitude?: number;
      livingSquareFeet?: number;
      buildingSquareFeet?: number;
      bedrooms?: number;
      bathrooms?: number;
      partialBathrooms?: number;
      yearBuilt?: number;
      stories?: number;
      construction?: string;
      pool?: boolean;
      fireplace?: boolean;
      garageType?: string;
      garageSquareFeet?: number;
      heatingType?: string;
      airConditioningType?: string;
      lotSquareFeet?: number;
      pricePerSquareFoot?: number;
      propertyUse?: string;
    };
    ownerInfo?: {
      owner1FullName?: string;
      owner1Type?: string;
      mailAddress?: { label?: string };
      ownershipLength?: number;
    };
    taxInfo?: {
      assessedValue?: number;
      assessedLandValue?: number;
      assessedImprovementValue?: string | number;
      marketValue?: number;
      taxAmount?: string;
      assessmentYear?: number;
      year?: number;
    };
    lotInfo?: {
      apn?: string;
      lotAcres?: number;
      lotSquareFeet?: number;
      zoning?: string;
      landUse?: string;
      legalDescription?: string;
      subdivision?: string;
    };
    saleHistory?: Array<{
      saleDate?: string;
      saleAmount?: number;
      buyerNames?: string;
      sellerNames?: string;
      documentType?: string;
      transactionType?: string;
      purchaseMethod?: string;
    }>;
    currentMortgages?: Array<{
      amount?: number;
      interestRate?: number;
      interestRateType?: string;
      loanType?: string;
      lenderName?: string;
      documentDate?: string;
      position?: string;
    }>;
    mlsHistory?: Array<{
      price?: string;
      status?: string;
      statusDate?: string;
      daysOnMarket?: string;
      agentName?: string;
      agentOffice?: string;
      beds?: number;
      baths?: number;
    }>;
    demographics?: {
      medianIncome?: string;
      suggestedRent?: string;
      fmrYear?: string;
    };
    schools?: Array<{
      name: string;
      type?: string;
      grades?: string;
      rating?: string;
      parentRating?: string;
      enrollment?: string;
    }>;
    neighborhood?: {
      name?: string;
      type?: string;
    };
    linkedProperties?: {
      totalOwned?: string;
      totalValue?: string;
      totalEquity?: string;
      ids?: string[];
    };
  };
}

function parseDetail(raw: RawDetailResponse): Omit<PropertyDetail, "stale"> {
  const d = raw.data;
  const pi = d.propertyInfo;
  const addr = pi?.address;

  return {
    id: String(d.id),
    address: addr?.label || addr?.address || "",
    propertyType: d.propertyType ?? null,

    propertyInfo: pi ? {
      address: {
        address: addr?.address || "",
        city: addr?.city || "",
        state: addr?.state || "",
        zip: addr?.zip || "",
        county: addr?.county ?? null,
        label: addr?.label ?? null,
      },
      latitude: pi.latitude ?? null,
      longitude: pi.longitude ?? null,
      sqft: pi.livingSquareFeet ?? pi.buildingSquareFeet ?? null,
      bedrooms: pi.bedrooms ?? null,
      bathrooms: pi.bathrooms ?? null,
      partialBathrooms: pi.partialBathrooms ?? null,
      yearBuilt: pi.yearBuilt ?? null,
      stories: pi.stories ?? null,
      construction: pi.construction ?? null,
      pool: pi.pool ?? false,
      fireplace: pi.fireplace ?? false,
      garageType: pi.garageType ?? null,
      garageSquareFeet: pi.garageSquareFeet ?? null,
      heatingType: pi.heatingType ?? null,
      airConditioningType: pi.airConditioningType ?? null,
      lotSquareFeet: pi.lotSquareFeet ?? null,
      pricePerSquareFoot: pi.pricePerSquareFoot ?? null,
      propertyUse: pi.propertyUse ?? null,
    } : null,

    flags: {
      absenteeOwner: d.absenteeOwner ?? false,
      ownerOccupied: d.ownerOccupied ?? false,
      corporateOwned: d.corporateOwned ?? false,
      investorBuyer: d.investorBuyer ?? false,
      vacant: d.vacant ?? false,
      freeClear: d.freeClear ?? false,
      highEquity: d.highEquity ?? false,
      cashBuyer: d.cashBuyer ?? false,
      cashSale: d.cashSale ?? false,
      mlsActive: d.mlsActive ?? false,
      mlsPending: d.mlsPending ?? false,
      mlsSold: d.mlsSold ?? false,
      preForeclosure: d.preForeclosure ?? false,
      auction: d.auction ?? false,
      floodZone: d.floodZone ?? false,
    },

    estimatedValue: d.estimatedValue ?? null,
    estimatedEquity: d.estimatedEquity ?? null,
    equityPercent: d.equityPercent ?? null,
    lastSaleDate: d.lastSaleDate ?? null,
    lastSalePrice: d.lastSalePrice != null ? Number(d.lastSalePrice) : null,

    ownerInfo: d.ownerInfo ? {
      ownerName: d.ownerInfo.owner1FullName ?? null,
      ownerType: d.ownerInfo.owner1Type ?? null,
      mailingAddress: d.ownerInfo.mailAddress?.label ?? null,
      ownershipLengthMonths: d.ownerInfo.ownershipLength ?? null,
    } : null,

    taxInfo: d.taxInfo ? {
      assessedValue: d.taxInfo.assessedValue ?? null,
      assessedLandValue: d.taxInfo.assessedLandValue ?? null,
      assessedImprovementValue: d.taxInfo.assessedImprovementValue != null
        ? Number(d.taxInfo.assessedImprovementValue) : null,
      marketValue: d.taxInfo.marketValue ?? null,
      taxAmount: d.taxInfo.taxAmount ?? null,
      assessmentYear: d.taxInfo.year ?? d.taxInfo.assessmentYear ?? null,
    } : null,

    lotInfo: d.lotInfo ? {
      apn: d.lotInfo.apn ?? null,
      lotAcres: d.lotInfo.lotAcres ?? null,
      lotSquareFeet: d.lotInfo.lotSquareFeet ?? null,
      zoning: d.lotInfo.zoning ?? null,
      landUse: d.lotInfo.landUse ?? null,
      legalDescription: d.lotInfo.legalDescription ?? null,
      subdivision: d.lotInfo.subdivision ?? null,
    } : null,

    saleHistory: (d.saleHistory || []).map((s) => ({
      date: s.saleDate || "",
      price: s.saleAmount ?? 0,
      buyerNames: s.buyerNames ?? null,
      sellerNames: s.sellerNames ?? null,
      documentType: s.documentType ?? null,
      transactionType: s.transactionType ?? null,
      purchaseMethod: s.purchaseMethod ?? null,
    })),

    currentMortgages: (d.currentMortgages || []).map((m) => ({
      amount: m.amount ?? 0,
      interestRate: m.interestRate ?? null,
      interestRateType: m.interestRateType ?? null,
      loanType: m.loanType ?? null,
      lenderName: m.lenderName ?? null,
      documentDate: m.documentDate ?? null,
      position: m.position ?? null,
    })),

    mlsHistory: (d.mlsHistory || []).map((mls) => ({
      price: mls.price ?? null,
      status: mls.status ?? null,
      statusDate: mls.statusDate ?? null,
      daysOnMarket: mls.daysOnMarket ?? null,
      agentName: mls.agentName ?? null,
      agentOffice: mls.agentOffice ?? null,
      beds: mls.beds ?? null,
      baths: mls.baths ?? null,
    })),

    demographics: d.demographics ? {
      medianIncome: d.demographics.medianIncome ?? null,
      suggestedRent: d.demographics.suggestedRent ?? null,
      fmrYear: d.demographics.fmrYear ?? null,
    } : null,

    schools: (d.schools || []).map((s) => ({
      name: s.name,
      type: s.type ?? null,
      grades: s.grades ?? null,
      rating: s.rating ?? null,
      parentRating: s.parentRating ?? null,
      enrollment: s.enrollment ?? null,
    })),

    neighborhood: d.neighborhood ? {
      name: d.neighborhood.name ?? null,
      type: d.neighborhood.type ?? null,
    } : null,

    floodZoneType: d.floodZoneType ?? null,
    floodZoneDescription: d.floodZoneDescription ?? null,

    linkedProperties: d.linkedProperties ? {
      totalOwned: d.linkedProperties.totalOwned ?? null,
      totalValue: d.linkedProperties.totalValue ?? null,
      totalEquity: d.linkedProperties.totalEquity ?? null,
      ids: d.linkedProperties.ids ?? [],
    } : null,
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
      { address },
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
