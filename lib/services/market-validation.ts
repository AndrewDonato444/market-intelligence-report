// Pure validation logic for market definitions — no database dependencies.

export interface MarketGeography {
  city: string;
  state: string;
  county?: string;
  region?: string;
  zipCodes?: string[];
}

export interface MarketData {
  name: string;
  geography: MarketGeography;
  luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
  priceFloor: number;
  priceCeiling?: number | null;
  segments?: string[];
  propertyTypes?: string[];
  focusAreas?: string[];
}

export interface MarketValidationResult {
  success: boolean;
  errors?: Record<string, string>;
  data?: MarketData;
}

const VALID_TIERS = ["luxury", "high_luxury", "ultra_luxury"] as const;

const AVAILABLE_SEGMENTS = [
  "waterfront",
  "golf course",
  "gated community",
  "ski-in/ski-out",
  "mountain view",
  "historic district",
  "new development",
  "equestrian",
  "beachfront",
  "lakefront",
  "vineyard",
  "desert",
  "island",
];

const AVAILABLE_PROPERTY_TYPES = [
  "single_family",
  "estate",
  "condo",
  "townhouse",
  "co-op",
  "penthouse",
  "chalet",
  "villa",
  "ranch",
  "land",
];

export { AVAILABLE_SEGMENTS, AVAILABLE_PROPERTY_TYPES };

export function validateMarketData(
  data: Partial<MarketData>
): MarketValidationResult {
  const errors: Record<string, string> = {};

  // Name is required
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    errors.name = "Market name is required";
  }

  // Geography validation
  const city =
    typeof data.geography?.city === "string"
      ? data.geography.city.trim()
      : "";
  const state =
    typeof data.geography?.state === "string"
      ? data.geography.state.trim()
      : "";

  if (!city) {
    errors.city = "City is required";
  }
  if (!state) {
    errors.state = "State is required";
  }

  // Luxury tier validation
  const luxuryTier = data.luxuryTier;
  if (!luxuryTier || !VALID_TIERS.includes(luxuryTier)) {
    errors.luxuryTier =
      "Select a luxury tier: luxury, high_luxury, or ultra_luxury";
  }

  // Price floor validation
  const priceFloor = Number(data.priceFloor);
  if (isNaN(priceFloor) || priceFloor < 500000) {
    errors.priceFloor = "Price floor must be at least $500,000";
  }

  // Price ceiling validation (optional but must be > floor if set)
  let priceCeiling: number | null = null;
  if (data.priceCeiling != null && data.priceCeiling !== 0) {
    priceCeiling = Number(data.priceCeiling);
    if (isNaN(priceCeiling)) {
      errors.priceCeiling = "Price ceiling must be a valid number";
    } else if (!isNaN(priceFloor) && priceCeiling <= priceFloor) {
      errors.priceCeiling = "Price ceiling must be greater than price floor";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      geography: {
        city,
        state,
        county: data.geography?.county?.trim() || undefined,
        region: data.geography?.region?.trim() || undefined,
        zipCodes: data.geography?.zipCodes || undefined,
      },
      luxuryTier: luxuryTier!,
      priceFloor,
      priceCeiling,
      segments: data.segments || undefined,
      propertyTypes: data.propertyTypes || undefined,
      focusAreas: data.focusAreas || undefined,
    },
  };
}
