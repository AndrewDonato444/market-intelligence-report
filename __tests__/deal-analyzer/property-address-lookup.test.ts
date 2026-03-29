/**
 * Property Address Lookup Tests
 *
 * Tests for POST /api/deal-analyzer/lookup
 * Spec: .specs/features/deal-analyzer/property-address-lookup.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

// --- Auth mock ---
const mockGetAuthUserId = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: () => mockGetAuthUserId(),
}));

// --- REAPI connector mock ---
const mockSearchProperties = jest.fn();
const mockGetPropertyDetail = jest.fn();
jest.mock("@/lib/connectors/realestateapi", () => ({
  searchProperties: (...args: unknown[]) => mockSearchProperties(...args),
  getPropertyDetail: (...args: unknown[]) => mockGetPropertyDetail(...args),
}));

// --- DB mock ---
let mockDbSelectResult: unknown = [];
jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: () => makeChain(() => mockDbSelectResult),
    };
  },
  schema: {
    markets: {
      id: "markets.id",
      userId: "markets.user_id",
      name: "markets.name",
      geography: "markets.geography",
      deletedAt: "markets.deleted_at",
    },
  },
}));

function makeChain(result: () => unknown) {
  const chain = (): unknown =>
    new Proxy(
      {},
      {
        get(_, prop) {
          if (String(prop) === "then") {
            return (resolve: (v: unknown) => void) => resolve(result());
          }
          return (..._args: unknown[]) => chain();
        },
      }
    );
  return chain();
}

// --- Test helpers ---

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/deal-analyzer/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const MARKET_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000099";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000088";

const NAPLES_MARKET = {
  id: MARKET_ID,
  userId: USER_ID,
  name: "Naples, FL — $6M+",
  geography: { city: "Naples", state: "FL" },
  deletedAt: null,
};

const COLLIER_MARKET = {
  ...NAPLES_MARKET,
  geography: { city: "Naples", state: "FL", county: "Collier" },
};

const SEARCH_RESULT_NAPLES = {
  properties: [
    {
      id: "prop-001",
      address: "4100 Gulf Shore Blvd N",
      city: "Naples",
      state: "FL",
      zip: "34103",
      price: 8500000,
      sqft: 4200,
      bedrooms: 4,
      bathrooms: 4,
      propertyType: "SFR",
      yearBuilt: 2005,
      lastSaleDate: "2020-06-15",
      lastSalePrice: 7200000,
    },
  ],
  total: 1,
  stale: false,
};

const SEARCH_RESULT_MARCO = {
  properties: [
    {
      id: "prop-002",
      address: "2000 Royal Marco Way",
      city: "Marco Island",
      state: "FL",
      zip: "34145",
      price: 6500000,
      sqft: 3800,
      bedrooms: 3,
      bathrooms: 3,
      propertyType: "SFR",
      yearBuilt: 2010,
      lastSaleDate: "2019-03-10",
      lastSalePrice: 5500000,
    },
  ],
  total: 1,
  stale: false,
};

const SEARCH_RESULT_MIAMI = {
  properties: [
    {
      id: "prop-003",
      address: "100 S Pointe Dr",
      city: "Miami Beach",
      state: "FL",
      zip: "33139",
      price: 12000000,
      sqft: 5000,
      bedrooms: 5,
      bathrooms: 5,
      propertyType: "CONDO",
      yearBuilt: 2018,
      lastSaleDate: "2022-01-05",
      lastSalePrice: 11000000,
    },
  ],
  total: 1,
  stale: false,
};

const FULL_PROPERTY_DETAIL = {
  id: "prop-001",
  address: "4100 Gulf Shore Blvd N",
  propertyType: "SFR",
  stale: false,
  propertyInfo: {
    address: {
      address: "4100 Gulf Shore Blvd N",
      city: "Naples",
      state: "FL",
      zip: "34103",
      county: "Collier",
      label: "4100 Gulf Shore Blvd N, Naples, FL 34103",
    },
    latitude: 26.223,
    longitude: -81.807,
    sqft: 4200,
    bedrooms: 4,
    bathrooms: 4,
    partialBathrooms: 1,
    yearBuilt: 2005,
    stories: 2,
    construction: "Concrete Block",
    pool: true,
    fireplace: false,
    garageType: "Attached",
    garageSquareFeet: 600,
    heatingType: "Central",
    airConditioningType: "Central",
    lotSquareFeet: 15000,
    pricePerSquareFoot: 2024,
    propertyUse: "Single Family Residential",
  },
  flags: {
    absenteeOwner: true,
    ownerOccupied: false,
    corporateOwned: false,
    investorBuyer: false,
    vacant: false,
    freeClear: false,
    highEquity: true,
    cashBuyer: false,
    cashSale: false,
    mlsActive: false,
    mlsPending: false,
    mlsSold: true,
    preForeclosure: false,
    auction: false,
    floodZone: false,
  },
  estimatedValue: 8800000,
  estimatedEquity: 6600000,
  equityPercent: 0.75,
  lastSaleDate: "2020-06-15",
  lastSalePrice: 7200000,
  ownerInfo: {
    ownerName: "Robert Linekin",
    ownerType: "Individual",
    mailingAddress: "123 Park Ave, New York, NY 10001",
    ownershipLengthMonths: 60,
  },
  taxInfo: {
    assessedValue: 7500000,
    assessedLandValue: 3000000,
    assessedImprovementValue: 4500000,
    marketValue: 8500000,
    taxAmount: "95000",
    assessmentYear: 2025,
  },
  lotInfo: {
    apn: "12345678",
    lotAcres: 0.34,
    lotSquareFeet: 15000,
    zoning: "RSF-4",
    landUse: "Single Family",
    legalDescription: "LOT 5 BLK A GULF SHORE ESTATES",
    subdivision: "Gulf Shore Estates",
  },
  saleHistory: [
    {
      date: "2020-06-15",
      price: 7200000,
      buyerNames: "Robert Linekin",
      sellerNames: "Estate of James Whitfield",
      documentType: "Probate",
      transactionType: "Sale",
      purchaseMethod: "Conventional",
    },
    {
      date: "2005-03-01",
      price: 3500000,
      buyerNames: "James Whitfield",
      sellerNames: "Gulf Shore Development LLC",
      documentType: "Warranty Deed",
      transactionType: "Sale",
      purchaseMethod: "Cash",
    },
  ],
  currentMortgages: [
    {
      amount: 4000000,
      interestRate: 4.5,
      interestRateType: "ARM",
      loanType: "Conventional",
      lenderName: "Wells Fargo",
      documentDate: "2020-06-15",
      position: "1st",
    },
    {
      amount: 800000,
      interestRate: 6.25,
      interestRateType: "Fixed",
      loanType: "HELOC",
      lenderName: "Chase",
      documentDate: "2023-01-10",
      position: "2nd",
    },
  ],
  mlsHistory: [],
  schools: [],
  neighborhood: null,
  linkedProperties: [],
};

// --- Tests ---

describe("Property Address Lookup: POST /api/deal-analyzer/lookup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockGetAuthUserId.mockResolvedValue(USER_ID);
    mockDbSelectResult = [NAPLES_MARKET];
    mockSearchProperties.mockResolvedValue(SEARCH_RESULT_NAPLES);
    mockGetPropertyDetail.mockResolvedValue(FULL_PROPERTY_DETAIL);
  });

  // ==========================================
  // Section 1: Input Validation (Scenarios 16, 17, 26, 27)
  // ==========================================

  describe("Section 1: Input Validation", () => {
    it("API-DAL-01: rejects request with missing address (Scenario 17)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(makeRequest({ marketId: MARKET_ID }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/address.*required/i);
    });

    it("API-DAL-02: rejects request with empty address string (Scenario 27)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(makeRequest({ address: "", marketId: MARKET_ID }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/address.*required/i);
    });

    it("API-DAL-03: rejects request with missing marketId (Scenario 16)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({ address: "4100 Gulf Shore Blvd N, Naples, FL" })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/marketId.*required/i);
    });

    it("API-DAL-04: trims whitespace from address (Scenario 26)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "  4100 Gulf Shore Blvd N, Naples, FL  ",
          marketId: MARKET_ID,
        })
      );
      // Whitespace-padded address should still resolve successfully
      expect(res.status).toBe(200);
      // PropertySearch should still be called (address trimmed before matching)
      expect(mockSearchProperties).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Section 2: Auth & Access Control (Scenarios 18, 19, 20)
  // ==========================================

  describe("Section 2: Auth & Access Control", () => {
    it("API-DAL-05: rejects unauthenticated request (Scenario 20)", async () => {
      mockGetAuthUserId.mockResolvedValue(null);
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(401);
    });

    it("API-DAL-06: returns 404 for non-existent market (Scenario 18)", async () => {
      mockDbSelectResult = [];
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: "00000000-0000-0000-0000-000000000999",
        })
      );
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toMatch(/market.*not found/i);
    });

    it("API-DAL-07: returns 403 when market belongs to different user (Scenario 19)", async () => {
      mockDbSelectResult = [{ ...NAPLES_MARKET, userId: OTHER_USER_ID }];
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/access/i);
    });
  });

  // ==========================================
  // Section 3: Happy Path (Scenario 1)
  // ==========================================

  describe("Section 3: Happy Path", () => {
    it("API-DAL-08: returns enriched property data on valid lookup (Scenario 1)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL 34103",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();

      // Property data shape
      expect(body.property).toBeDefined();
      expect(body.property.id).toBe("prop-001");
      expect(body.property.address).toBe("4100 Gulf Shore Blvd N");
      expect(body.property.city).toBe("Naples");
      expect(body.property.state).toBe("FL");

      // Seller signals shape
      expect(body.sellerSignals).toBeDefined();
      expect(body.sellerScore).toBeGreaterThanOrEqual(0);
      expect(body.sellerScore).toBeLessThanOrEqual(100);
    });

    it("API-DAL-09: calls PropertySearch then PropertyDetail in sequence", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(mockSearchProperties).toHaveBeenCalledTimes(1);
      expect(mockGetPropertyDetail).toHaveBeenCalledTimes(1);
      // PropertyDetail called with the ID from search results
      expect(mockGetPropertyDetail).toHaveBeenCalledWith(
        "prop-001",
        expect.anything()
      );
    });
  });

  // ==========================================
  // Section 4: Geographic Validation (Scenarios 2, 3)
  // ==========================================

  describe("Section 4: Geographic Validation", () => {
    it("API-DAL-10: allows property in same city/state as market (Scenario 1)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(200);
    });

    it("API-DAL-11: allows property in different city when county matches (Scenario 2)", async () => {
      mockDbSelectResult = [COLLIER_MARKET];
      mockSearchProperties.mockResolvedValue(SEARCH_RESULT_MARCO);
      // Marco Island PropertyDetail with Collier county
      mockGetPropertyDetail.mockResolvedValue({
        ...FULL_PROPERTY_DETAIL,
        id: "prop-002",
        propertyInfo: {
          ...FULL_PROPERTY_DETAIL.propertyInfo,
          address: {
            address: "2000 Royal Marco Way",
            city: "Marco Island",
            state: "FL",
            zip: "34145",
            county: "Collier",
            label: null,
          },
        },
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "2000 Royal Marco Way, Marco Island, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(200);
    });

    it("API-DAL-12: rejects property outside market geography (Scenario 3)", async () => {
      mockSearchProperties.mockResolvedValue(SEARCH_RESULT_MIAMI);
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "100 S Pointe Dr, Miami Beach, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toMatch(/isn't in your.*Naples/i);
    });

    it("API-DAL-13: no PropertyDetail call when geo validation fails (Scenario 3)", async () => {
      mockSearchProperties.mockResolvedValue(SEARCH_RESULT_MIAMI);
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      await POST(
        makeRequest({
          address: "100 S Pointe Dr, Miami Beach, FL",
          marketId: MARKET_ID,
        })
      );
      expect(mockGetPropertyDetail).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Section 5: Address Not Found (Scenario 4)
  // ==========================================

  describe("Section 5: Address Not Found", () => {
    it("API-DAL-14: returns 404 when REAPI finds no properties (Scenario 4)", async () => {
      mockSearchProperties.mockResolvedValue({
        properties: [],
        total: 0,
        stale: false,
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "99999 Nonexistent Rd, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toMatch(/no property found/i);
    });
  });

  // ==========================================
  // Section 6: Multiple Results (Scenario 5)
  // ==========================================

  describe("Section 6: Multiple Results", () => {
    it("API-DAL-15: picks best match from multiple search results (Scenario 5)", async () => {
      mockSearchProperties.mockResolvedValue({
        properties: [
          { ...SEARCH_RESULT_NAPLES.properties[0], id: "prop-A", address: "100 Gulf Shore Dr" },
          { ...SEARCH_RESULT_NAPLES.properties[0], id: "prop-B", address: "100 Gulf Shore Blvd N" },
          { ...SEARCH_RESULT_NAPLES.properties[0], id: "prop-C", address: "1000 Gulf Shore Way" },
        ],
        total: 3,
        stale: false,
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      await POST(
        makeRequest({
          address: "100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      // Should call PropertyDetail for the best match (only 1 call)
      expect(mockGetPropertyDetail).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // Section 7: Data Mapping (Scenarios 6, 7, 25)
  // ==========================================

  describe("Section 7: Data Mapping to DealPropertyData", () => {
    it("API-DAL-16: maps PropertyDetail to DealPropertyData shape (Scenario 25)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      const p = body.property;

      expect(p.id).toBe("prop-001");
      expect(p.address).toBe("4100 Gulf Shore Blvd N");
      expect(p.city).toBe("Naples");
      expect(p.state).toBe("FL");
      expect(p.zip).toBe("34103");
      expect(p.county).toBe("Collier");
      expect(p.subdivision).toBe("Gulf Shore Estates");
      expect(p.propertyType).toBe("SFR");
      expect(p.bedrooms).toBe(4);
      expect(p.bathrooms).toBe(4);
      expect(p.squareFeet).toBe(4200);
      expect(p.lotSize).toBe(15000);
      expect(p.yearBuilt).toBe(2005);
      expect(p.estimatedValue).toBe(8800000);
      expect(p.lastSaleDate).toBe("2020-06-15");
      expect(p.lastSaleAmount).toBe(7200000);
      expect(p.pricePerSqFt).toBe(2024);
      expect(p.ownerOccupied).toBe(false);
      expect(p.taxAssessment).toBe(7500000);
      expect(p.annualTaxes).toBe(95000);
      expect(p.floodZone).toBe("No");
    });

    it("API-DAL-17: maps sale history correctly (Scenario 6)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      const history = body.property.saleHistory;

      expect(history).toHaveLength(2);
      // Newest first
      expect(history[0].date).toBe("2020-06-15");
      expect(history[0].amount).toBe(7200000);
      expect(history[0].buyer).toBe("Robert Linekin");
      expect(history[0].seller).toBe("Estate of James Whitfield");
      expect(history[1].date).toBe("2005-03-01");
      expect(history[1].amount).toBe(3500000);
    });

    it("API-DAL-18: maps mortgage history correctly (Scenario 7)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      const mortgages = body.property.mortgageHistory;

      expect(mortgages).toHaveLength(2);
      expect(mortgages[0].amount).toBe(4000000);
      expect(mortgages[0].rate).toBe(4.5);
      expect(mortgages[0].lender).toBe("Wells Fargo");
      expect(mortgages[0].type).toBe("Conventional");
      expect(mortgages[1].amount).toBe(800000);
      expect(mortgages[1].lender).toBe("Chase");
    });

    it("API-DAL-19: computes inherited flag from sale history (Scenario 25)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      // saleHistory[0].documentType is "Probate" → inherited = true
      expect(body.property.inherited).toBe(true);
    });

    it("API-DAL-20: computes adjustableRate flag from mortgages (Scenario 25)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      // currentMortgages[0].interestRateType is "ARM" → adjustableRate = true
      expect(body.property.adjustableRate).toBe(true);
    });
  });

  // ==========================================
  // Section 8: Motivated Seller Scoring (Scenarios 8-15)
  // ==========================================

  describe("Section 8: Motivated Seller Scoring", () => {
    it("API-DAL-21: fires inherited signal from probate document (Scenario 8)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerSignals.inherited.fired).toBe(true);
      expect(body.sellerSignals.inherited.weight).toBe(20);
    });

    it("API-DAL-22: fires non-owner-occupied signal (Scenario 9)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerSignals.nonOwnerOccupied.fired).toBe(true);
      expect(body.sellerSignals.nonOwnerOccupied.weight).toBe(15);
    });

    it("API-DAL-23: fires adjustable rate signal (Scenario 10)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerSignals.adjustableRate.fired).toBe(true);
      expect(body.sellerSignals.adjustableRate.weight).toBe(15);
    });

    it("API-DAL-24: fires long hold period signal (Scenario 11)", async () => {
      // 60 months = 5 years — NOT > 10 years, so should NOT fire
      // Let's set ownership to 180 months (15 years) to fire
      mockGetPropertyDetail.mockResolvedValue({
        ...FULL_PROPERTY_DETAIL,
        ownerInfo: {
          ...FULL_PROPERTY_DETAIL.ownerInfo,
          ownershipLengthMonths: 180,
        },
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerSignals.longHoldPeriod.fired).toBe(true);
      expect(body.sellerSignals.longHoldPeriod.weight).toBe(20);
      expect(body.sellerSignals.longHoldPeriod.yearsHeld).toBe(15);
    });

    it("API-DAL-25: does NOT fire long hold period when < 10 years", async () => {
      // Default fixture has ownershipLengthMonths: 60 (5 years)
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerSignals.longHoldPeriod.fired).toBe(false);
    });

    it("API-DAL-26: fires HELOC pattern signal with 2+ mortgages (Scenario 12)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerSignals.helocPattern.fired).toBe(true);
      expect(body.sellerSignals.helocPattern.weight).toBe(15);
      expect(body.sellerSignals.helocPattern.mortgageCount).toBe(2);
    });

    it("API-DAL-27: fires high equity signal when > 60% (Scenario 13)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      // equityPercent = 0.75 (75%) > 60%
      expect(body.sellerSignals.highEquity.fired).toBe(true);
      expect(body.sellerSignals.highEquity.weight).toBe(15);
      expect(body.sellerSignals.highEquity.equityPercent).toBe(75);
    });

    it("API-DAL-28: returns score 0 when no signals fire (Scenario 14)", async () => {
      mockGetPropertyDetail.mockResolvedValue({
        ...FULL_PROPERTY_DETAIL,
        flags: {
          ...FULL_PROPERTY_DETAIL.flags,
          ownerOccupied: true,
          highEquity: false,
        },
        equityPercent: 0.2,
        ownerInfo: {
          ...FULL_PROPERTY_DETAIL.ownerInfo,
          ownershipLengthMonths: 24,
        },
        saleHistory: [
          {
            ...FULL_PROPERTY_DETAIL.saleHistory[0],
            documentType: "Warranty Deed",
          },
        ],
        currentMortgages: [
          {
            ...FULL_PROPERTY_DETAIL.currentMortgages[0],
            interestRateType: "Fixed",
          },
        ],
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerScore).toBe(0);
      expect(body.sellerSignals.inherited.fired).toBe(false);
      expect(body.sellerSignals.nonOwnerOccupied.fired).toBe(false);
      expect(body.sellerSignals.adjustableRate.fired).toBe(false);
      expect(body.sellerSignals.longHoldPeriod.fired).toBe(false);
      expect(body.sellerSignals.helocPattern.fired).toBe(false);
      expect(body.sellerSignals.highEquity.fired).toBe(false);
    });

    it("API-DAL-29: returns score 100 when all signals fire (Scenario 15)", async () => {
      mockGetPropertyDetail.mockResolvedValue({
        ...FULL_PROPERTY_DETAIL,
        flags: {
          ...FULL_PROPERTY_DETAIL.flags,
          ownerOccupied: false,
          highEquity: true,
        },
        equityPercent: 0.85,
        ownerInfo: {
          ...FULL_PROPERTY_DETAIL.ownerInfo,
          ownershipLengthMonths: 180,
        },
        saleHistory: [
          {
            ...FULL_PROPERTY_DETAIL.saleHistory[0],
            documentType: "Probate",
          },
        ],
        currentMortgages: [
          {
            ...FULL_PROPERTY_DETAIL.currentMortgages[0],
            interestRateType: "ARM",
          },
          FULL_PROPERTY_DETAIL.currentMortgages[1],
          {
            amount: 200000,
            interestRate: 7.0,
            interestRateType: "Fixed",
            loanType: "HELOC",
            lenderName: "BofA",
            documentDate: "2024-06-01",
            position: "3rd",
          },
        ],
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      const body = await res.json();
      expect(body.sellerScore).toBe(100);
      expect(body.sellerSignals.inherited.fired).toBe(true);
      expect(body.sellerSignals.nonOwnerOccupied.fired).toBe(true);
      expect(body.sellerSignals.adjustableRate.fired).toBe(true);
      expect(body.sellerSignals.longHoldPeriod.fired).toBe(true);
      expect(body.sellerSignals.helocPattern.fired).toBe(true);
      expect(body.sellerSignals.highEquity.fired).toBe(true);
    });
  });

  // ==========================================
  // Section 9: REAPI Errors (Scenarios 21, 22)
  // ==========================================

  describe("Section 9: REAPI Error Handling", () => {
    it("API-DAL-30: returns 502 when PropertySearch fails (Scenario 21)", async () => {
      mockSearchProperties.mockRejectedValue(
        new Error("RealEstateAPI error: 500 Internal Server Error")
      );
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toMatch(/property data service.*unavailable/i);
    });

    it("API-DAL-31: returns 502 when PropertyDetail fails (Scenario 22)", async () => {
      mockGetPropertyDetail.mockRejectedValue(
        new Error("RealEstateAPI error: 500 Internal Server Error")
      );
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toMatch(/property data service.*unavailable/i);
    });
  });

  // ==========================================
  // Section 10: Caching (Scenarios 23, 24)
  // ==========================================

  describe("Section 10: Caching Behavior", () => {
    it("API-DAL-32: uses cached response when available (Scenario 23)", async () => {
      // The REAPI connector handles caching internally.
      // If stale=false, it means cache was used or API returned fresh data.
      mockSearchProperties.mockResolvedValue({
        ...SEARCH_RESULT_NAPLES,
        stale: false,
      });
      mockGetPropertyDetail.mockResolvedValue({
        ...FULL_PROPERTY_DETAIL,
        stale: false,
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(200);
    });

    it("API-DAL-33: returns stale flag when using fallback cache (Scenario 24)", async () => {
      mockGetPropertyDetail.mockResolvedValue({
        ...FULL_PROPERTY_DETAIL,
        stale: true,
      });
      const { POST } = await import("@/app/api/deal-analyzer/lookup/route");
      const res = await POST(
        makeRequest({
          address: "4100 Gulf Shore Blvd N, Naples, FL",
          marketId: MARKET_ID,
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stale).toBe(true);
    });
  });
});
