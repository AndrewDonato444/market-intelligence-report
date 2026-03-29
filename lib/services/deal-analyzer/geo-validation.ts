import type { PropertySummary } from "@/lib/connectors/realestateapi";

type MarketGeography = {
  city: string;
  state: string;
  county?: string;
  region?: string;
  zipCodes?: string[];
};

/**
 * Validate that a property falls within a market's geography.
 *
 * Match logic (in order of specificity):
 * 1. If market has zipCodes → property zip must be in the list
 * 2. If market has county → property city doesn't need to match (county is broader)
 *    - We check county via the PropertyDetail later, but at search stage we trust
 *      state match + existence in search results
 * 3. Default: city + state must match (case-insensitive)
 *
 * For county-based markets, we do a lenient check at search time (state match only)
 * and a strict check after PropertyDetail (county match). This function handles
 * the search-time check.
 */
export function validatePropertyGeography(
  property: PropertySummary,
  geography: MarketGeography
): { valid: boolean; reason?: string } {
  const propState = property.state?.trim().toUpperCase();
  const marketState = geography.state?.trim().toUpperCase();

  // State must always match
  if (propState !== marketState) {
    return {
      valid: false,
      reason: `This property isn't in your ${geography.city}, ${geography.state} market area`,
    };
  }

  // If market specifies zipCodes, check against them
  if (geography.zipCodes && geography.zipCodes.length > 0) {
    if (geography.zipCodes.includes(property.zip)) {
      return { valid: true };
    }
    // Zip doesn't match, but city might — fall through to city check
  }

  // If market has county, allow any city within that county (state already matched)
  if (geography.county) {
    // At search time we can't verify county (PropertySearch doesn't return it).
    // We trust that a property in the same state is a candidate; the strict county
    // check happens after PropertyDetail when we have the county field.
    return { valid: true };
  }

  // Default: city must match
  const propCity = property.city?.trim().toLowerCase();
  const marketCity = geography.city?.trim().toLowerCase();

  if (propCity !== marketCity) {
    return {
      valid: false,
      reason: `This property isn't in your ${geography.city}, ${geography.state} market area`,
    };
  }

  return { valid: true };
}

/**
 * Strict county validation — called after PropertyDetail when we have
 * the property's county from REAPI.
 */
export function validateCountyMatch(
  propertyCounty: string | null | undefined,
  marketCounty: string
): boolean {
  if (!propertyCounty) return false;
  return propertyCounty.trim().toLowerCase() === marketCounty.trim().toLowerCase();
}
