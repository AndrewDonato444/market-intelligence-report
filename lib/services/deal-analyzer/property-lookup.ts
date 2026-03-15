import {
  searchProperties,
  getPropertyDetail,
  type PropertySummary,
  type PropertyDetail,
  type PropertySearchParams,
} from "@/lib/connectors/realestateapi";
import type { DealPropertyData } from "@/lib/db/schema";
import { computeMotivatedSellerSignals } from "./motivated-seller";
import {
  validatePropertyGeography,
  validateCountyMatch,
} from "./geo-validation";

type MarketGeography = {
  city: string;
  state: string;
  county?: string;
  region?: string;
  zipCodes?: string[];
};

export type LookupResult = {
  property: DealPropertyData;
  sellerSignals: ReturnType<typeof computeMotivatedSellerSignals>;
  sellerScore: number;
  stale: boolean;
};

export type LookupError = {
  status: number;
  error: string;
};

/**
 * Look up a property by address within a market's geography.
 * Chains REAPI PropertySearch → geographic validation → PropertyDetail → transform → score.
 */
export async function lookupProperty(
  address: string,
  marketGeography: MarketGeography,
  marketName: string,
  options?: { userId?: string }
): Promise<LookupResult | LookupError> {
  // Step 1: Search for the property
  const searchParams: PropertySearchParams = {
    city: marketGeography.city,
    state: marketGeography.state,
  };

  let searchResult;
  try {
    searchResult = await searchProperties(searchParams, {
      userId: options?.userId,
    });
  } catch {
    return {
      status: 502,
      error: "Property data service temporarily unavailable",
    };
  }

  // Filter search results by address similarity
  const trimmedAddress = address.trim().toLowerCase();
  let candidates = searchResult.properties;

  if (candidates.length === 0) {
    return { status: 404, error: "No property found matching this address" };
  }

  // Pick best match by address similarity
  const bestMatch = pickBestMatch(candidates, trimmedAddress);

  // Step 2: Geographic validation (using search result city/state)
  const geoCheck = validatePropertyGeography(bestMatch, marketGeography);
  if (!geoCheck.valid) {
    return { status: 422, error: geoCheck.reason! };
  }

  // Step 3: Get full property detail
  let detail: PropertyDetail;
  try {
    detail = await getPropertyDetail(bestMatch.id, {
      userId: options?.userId,
    });
  } catch {
    return {
      status: 502,
      error: "Property data service temporarily unavailable",
    };
  }

  // Step 3b: Strict county validation (if market has county)
  if (marketGeography.county) {
    const propertyCounty = detail.propertyInfo?.address?.county;
    if (!validateCountyMatch(propertyCounty, marketGeography.county)) {
      return {
        status: 422,
        error: `This property isn't in your ${marketName} market area`,
      };
    }
  }

  // Step 4: Transform to DealPropertyData
  const property = transformToPropertyData(detail);

  // Step 5: Compute motivated seller signals
  const sellerSignals = computeMotivatedSellerSignals(detail);

  return {
    property,
    sellerSignals,
    sellerScore: sellerSignals.totalScore,
    stale: detail.stale || searchResult.stale,
  };
}

/**
 * Pick the best matching property from search results based on address similarity.
 */
function pickBestMatch(
  candidates: PropertySummary[],
  searchAddress: string
): PropertySummary {
  if (candidates.length === 1) return candidates[0];

  // Simple scoring: longest common substring ratio
  let bestScore = -1;
  let bestCandidate = candidates[0];

  for (const candidate of candidates) {
    const candidateAddr = candidate.address?.toLowerCase() ?? "";
    const score = addressSimilarity(searchAddress, candidateAddr);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Simple address similarity score (0-1).
 * Counts matching words between the two addresses.
 */
function addressSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/[\s,]+/).filter(Boolean));
  const wordsB = new Set(b.split(/[\s,]+/).filter(Boolean));
  let matches = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }
  return wordsA.size === 0 ? 0 : matches / wordsA.size;
}

/**
 * Transform REAPI PropertyDetail to our DealPropertyData schema type.
 */
function transformToPropertyData(detail: PropertyDetail): DealPropertyData {
  const info = detail.propertyInfo;
  const addr = info?.address;
  const tax = detail.taxInfo;
  const lot = detail.lotInfo;

  return {
    id: detail.id,
    address: addr?.address ?? detail.address,
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    zip: addr?.zip ?? "",
    county: addr?.county ?? "",
    subdivision: lot?.subdivision ?? undefined,
    propertyType: detail.propertyType ?? "Unknown",
    bedrooms: info?.bedrooms ?? undefined,
    bathrooms: info?.bathrooms ?? undefined,
    squareFeet: info?.sqft ?? undefined,
    lotSize: lot?.lotSquareFeet ?? info?.lotSquareFeet ?? undefined,
    yearBuilt: info?.yearBuilt ?? undefined,
    estimatedValue: detail.estimatedValue ?? undefined,
    lastSaleDate: detail.lastSaleDate ?? undefined,
    lastSaleAmount: detail.lastSalePrice ?? undefined,
    pricePerSqFt: info?.pricePerSquareFoot ?? undefined,
    ownerOccupied: detail.flags?.ownerOccupied,
    inherited: isInherited(detail),
    adjustableRate: isAdjustableRate(detail),
    saleHistory: (detail.saleHistory ?? []).map((s) => ({
      date: s.date,
      amount: s.price,
      buyer: s.buyerNames ?? undefined,
      seller: s.sellerNames ?? undefined,
    })),
    mortgageHistory: (detail.currentMortgages ?? []).map((m) => ({
      amount: m.amount,
      rate: m.interestRate ?? undefined,
      lender: m.lenderName ?? undefined,
      originationDate: m.documentDate ?? undefined,
      type: m.loanType ?? undefined,
    })),
    taxAssessment: tax?.assessedValue ?? undefined,
    annualTaxes: tax?.taxAmount ? parseFloat(tax.taxAmount) : undefined,
    floodZone: detail.flags?.floodZone ? "Yes" : "No",
  };
}

function isInherited(detail: PropertyDetail): boolean {
  const docType =
    detail.saleHistory?.[0]?.documentType?.toLowerCase() ?? "";
  return ["probate", "estate", "inheritance", "executor", "personal representative"].some(
    (kw) => docType.includes(kw)
  );
}

function isAdjustableRate(detail: PropertyDetail): boolean {
  return (
    detail.currentMortgages?.[0]?.interestRateType?.toUpperCase() === "ARM"
  );
}
