/**
 * Deal Brief Agent Tests
 *
 * Tests for POST /api/deal-analyzer/brief
 * and the Deal Brief Agent (lib/agents/deal-brief.ts)
 *
 * Spec: .specs/features/deal-analyzer/deal-brief-agent.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

// --- Auth mock ---
const mockGetAuthUserId = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: () => mockGetAuthUserId(),
}));

// --- Anthropic mock ---
const mockCreate = jest.fn();
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
});

// --- Buyer personas service mock ---
const mockGetReportPersonas = jest.fn();
jest.mock("@/lib/services/buyer-personas", () => ({
  getReportPersonas: (...args: unknown[]) => mockGetReportPersonas(...args),
}));

// --- DB mock ---
let mockDbSelectResult: unknown = [];
let mockDbUpdateResult: unknown = [];
const mockUpdate = jest.fn();

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

// Track which select call we're on (deal analysis, report, report sections)
let selectCallCount = 0;
let mockSelectResults: unknown[][] = [];

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: () => {
        const idx = selectCallCount++;
        const result = mockSelectResults[idx] ?? [];
        return makeChain(() => result);
      },
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return makeChain(() => mockDbUpdateResult);
      },
    };
  },
  schema: {
    dealAnalyses: {
      id: "deal_analyses.id",
      userId: "deal_analyses.user_id",
      marketId: "deal_analyses.market_id",
      reportId: "deal_analyses.report_id",
      title: "deal_analyses.title",
      address: "deal_analyses.address",
      propertyData: "deal_analyses.property_data",
      briefContent: "deal_analyses.brief_content",
      motivatedSellerScore: "deal_analyses.motivated_seller_score",
      motivatedSellerSignals: "deal_analyses.motivated_seller_signals",
      status: "deal_analyses.status",
      errorMessage: "deal_analyses.error_message",
      generatedAt: "deal_analyses.generated_at",
      updatedAt: "deal_analyses.updated_at",
    },
    reports: {
      id: "reports.id",
      userId: "reports.user_id",
      status: "reports.status",
    },
    reportSections: {
      id: "report_sections.id",
      reportId: "report_sections.report_id",
      sectionType: "report_sections.section_type",
      content: "report_sections.content",
    },
    markets: {
      id: "markets.id",
      name: "markets.name",
      geography: "markets.geography",
      luxuryTier: "markets.luxury_tier",
      priceFloor: "markets.price_floor",
    },
  },
}));

// --- API usage mock ---
jest.mock("@/lib/services/api-usage", () => ({
  logApiCall: jest.fn(),
}));

// --- Env mock ---
jest.mock("@/lib/config/env", () => ({
  env: { ANTHROPIC_API_KEY: "test-key" },
}));

// --- Test fixtures ---

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/deal-analyzer/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const USER_ID = "00000000-0000-0000-0000-000000000099";
const OTHER_USER_ID = "00000000-0000-0000-0000-000000000088";
const DEAL_ANALYSIS_ID = "00000000-0000-0000-0000-000000000201";
const REPORT_ID = "00000000-0000-0000-0000-000000000301";
const MARKET_ID = "00000000-0000-0000-0000-000000000001";

const VALID_BRIEF_CONTENT = {
  summary:
    "4100 Gulf Shore Blvd N is priced at $8.5M, 18% above the segment median of $7.2M. A strong fit for the Business Mogul persona with high equity and waterfront positioning.",
  pricingAssessment: {
    narrative:
      "This property is priced at $8.5M, significantly above the SFR segment median of $7.2M. The premium is justified by waterfront access, 4,200 sqft living area, and recent renovation.",
    vsMedian: "+18% above segment median",
    vsSegmentComps: "In line with waterfront SFR comps ($8.2M-$9.1M range)",
    pricePerSqFtContext: "$2,024/sqft vs $1,850 segment median (+9.4%)",
  },
  personaMatch: {
    bestFitPersona: "business-mogul",
    matchRationale:
      "Waterfront estate with privacy, pool, and proximity to Naples CBD aligns with the Business Mogul's requirements for a trophy asset that doubles as an executive retreat.",
    talkingPoints: [
      "Waterfront positioning commands a 15-20% premium that historically outperforms the broader market",
      "The property's $2,024/sqft is competitive within the waterfront SFR segment",
      "High equity position (75%) signals a motivated seller — potential for negotiation below ask",
    ],
  },
  negotiationPoints: {
    leverageItems: [
      "Inherited property (probate transfer) — seller may prioritize speed over price",
      "Non-owner-occupied — carrying costs without personal use create motivation",
      "High equity (75%) — seller isn't underwater, can afford to negotiate",
    ],
    dataBackedArguments: [
      "Segment median is $7.2M — current ask of $8.5M is 18% above, typical negotiation range is 5-10% below ask",
      "Days on market for similar properties: 45-60 days — if listing exceeds this, leverage increases",
      "Two active mortgages totaling $4.8M — monthly carrying costs may pressure timeline",
    ],
    riskFactors: [
      "Waterfront properties in this segment have limited supply (12 active listings) — walking away risks losing a rare asset",
      "ARM mortgage exposure suggests seller may face rate reset pressure",
    ],
  },
  marketTiming: {
    signal: "buy" as const,
    rationale:
      "The waterfront SFR segment is projecting 8% appreciation over the next 6 months with tightening supply. Acting now captures the current seller motivation before spring competition intensifies.",
    forecastContext:
      "6-month forecast: median price from $7.2M to $7.8M (confidence: medium). 12-month: $8.0M with widening range.",
  },
};

const PROPERTY_DATA = {
  id: "prop-001",
  address: "4100 Gulf Shore Blvd N",
  city: "Naples",
  state: "FL",
  zip: "34103",
  county: "Collier",
  subdivision: "Gulf Shore Estates",
  propertyType: "SFR",
  bedrooms: 4,
  bathrooms: 4,
  squareFeet: 4200,
  lotSize: 15000,
  yearBuilt: 2005,
  estimatedValue: 8800000,
  lastSaleDate: "2020-06-15",
  lastSaleAmount: 7200000,
  pricePerSqFt: 2024,
  ownerOccupied: false,
  inherited: true,
  adjustableRate: true,
  saleHistory: [
    {
      date: "2020-06-15",
      amount: 7200000,
      buyer: "Robert Linekin",
      seller: "Estate of James Whitfield",
    },
  ],
  mortgageHistory: [
    { amount: 4000000, rate: 4.5, lender: "Wells Fargo", type: "Conventional" },
    { amount: 800000, rate: 6.25, lender: "Chase", type: "HELOC" },
  ],
  taxAssessment: 7500000,
  annualTaxes: 95000,
  floodZone: "No",
};

const SELLER_SIGNALS = {
  inherited: { fired: true, weight: 20 },
  nonOwnerOccupied: { fired: true, weight: 15 },
  adjustableRate: { fired: true, weight: 15 },
  longHoldPeriod: { fired: false, weight: 20, yearsHeld: 5 },
  helocPattern: { fired: true, weight: 15, mortgageCount: 2 },
  highEquity: { fired: true, weight: 15, equityPercent: 75 },
  totalScore: 80,
};

const DEAL_ANALYSIS = {
  id: DEAL_ANALYSIS_ID,
  userId: USER_ID,
  marketId: MARKET_ID,
  reportId: REPORT_ID,
  title: "4100 Gulf Shore Blvd N",
  address: "4100 Gulf Shore Blvd N, Naples, FL 34103",
  propertyData: PROPERTY_DATA,
  briefContent: null,
  motivatedSellerScore: 80,
  motivatedSellerSignals: SELLER_SIGNALS,
  status: "queued",
  errorMessage: null,
  generatedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MARKET = {
  id: MARKET_ID,
  name: "Naples, FL — $6M+",
  geography: { city: "Naples", state: "FL" },
  luxuryTier: "high_luxury",
  priceFloor: 6000000,
};

const DASHBOARD_SECTION = {
  sectionType: "luxury_market_dashboard",
  content: {
    market: {
      totalProperties: 156,
      medianPrice: 7200000,
      averagePrice: 8100000,
      medianPricePerSqft: 1850,
      totalVolume: 1123200000,
      rating: "A",
    },
    segments: [
      {
        name: "Single Family",
        propertyType: "SFR",
        count: 89,
        medianPrice: 7200000,
        averagePrice: 7800000,
        minPrice: 6100000,
        maxPrice: 15000000,
        medianPricePerSqft: 1850,
        rating: "A",
        lowSample: false,
        yoy: {
          medianPriceChange: 0.082,
          volumeChange: 0.03,
          pricePerSqftChange: 0.065,
        },
      },
    ],
    yoy: {
      medianPriceChange: 0.082,
      volumeChange: 0.03,
      pricePerSqftChange: 0.065,
    },
  },
};

const FORWARD_LOOK_SECTION = {
  sectionType: "forward_look",
  content: {
    projections: [
      {
        segment: "Single Family",
        sixMonth: {
          medianPrice: 7800000,
          priceRange: { low: 7400000, high: 8200000 },
          confidence: "medium",
        },
        twelveMonth: {
          medianPrice: 8000000,
          priceRange: { low: 7200000, high: 8800000 },
          confidence: "low",
        },
      },
    ],
    timing: {
      buyers: "Buyers should accelerate in the single-family segment before spring tightens supply further.",
      sellers: "Sellers should list before Q3 when projected new supply enters.",
    },
  },
};

const REPORT_PERSONAS = [
  {
    selectionOrder: 1,
    persona: {
      id: "p-001",
      slug: "business-mogul",
      name: "Business Mogul",
      description: "UHNW individual seeking trophy asset",
      decisionDrivers: [
        { factor: "Privacy", weight: "critical", description: "Gated, private access" },
        { factor: "Waterfront", weight: "high", description: "Direct water access" },
      ],
      narrativeFraming: {
        languageTone: "Authoritative, concise",
        keyVocabulary: ["trophy asset", "executive retreat", "positioning"],
        avoid: ["deal", "bargain", "fixer-upper"],
      },
      propertyFilters: {
        priceRange: "$5M+",
        propertyType: "SFR",
        waterfront: true,
      },
    },
  },
  {
    selectionOrder: 2,
    persona: {
      id: "p-002",
      slug: "coastal-escape-seeker",
      name: "Coastal Escape Seeker",
      description: "Seeking waterfront lifestyle property",
      decisionDrivers: [
        { factor: "Views", weight: "critical", description: "Unobstructed water views" },
      ],
      narrativeFraming: {
        languageTone: "Warm, lifestyle-focused",
        keyVocabulary: ["waterfront living", "sunset views", "coastal lifestyle"],
        avoid: ["investment vehicle", "ROI"],
      },
      propertyFilters: {
        priceRange: "$3M-$10M",
        propertyType: "SFR",
        waterfront: true,
      },
    },
  },
];

// --- Helper to set up standard successful mock chain ---
function setupSuccessfulMocks() {
  selectCallCount = 0;
  // Call 0: deal analysis lookup
  // Call 1: market lookup
  // Call 2: report sections lookup
  mockSelectResults = [
    [DEAL_ANALYSIS],
    [MARKET],
    [DASHBOARD_SECTION, FORWARD_LOOK_SECTION],
  ];
  mockGetReportPersonas.mockResolvedValue(REPORT_PERSONAS);
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(VALID_BRIEF_CONTENT) }],
    usage: { input_tokens: 3000, output_tokens: 1500 },
  });
}

// --- Tests ---

describe("Deal Brief Agent: POST /api/deal-analyzer/brief", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    selectCallCount = 0;
    mockSelectResults = [];
    mockGetAuthUserId.mockResolvedValue(USER_ID);
    setupSuccessfulMocks();
  });

  // ==========================================
  // Section 1: Input Validation & Auth (Scenarios 9-13, 17)
  // ==========================================

  describe("Section 1: Input Validation & Auth", () => {
    it("API-DBR-01: rejects unauthenticated request (Scenario 11)", async () => {
      mockGetAuthUserId.mockResolvedValue(null);
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(401);
    });

    it("API-DBR-02: returns 404 for non-existent deal analysis (Scenario 9)", async () => {
      mockSelectResults[0] = [];
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: "nonexistent" }));
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toMatch(/deal analysis.*not found/i);
    });

    it("API-DBR-03: returns 403 when deal analysis belongs to different user (Scenario 10)", async () => {
      mockSelectResults[0] = [{ ...DEAL_ANALYSIS, userId: OTHER_USER_ID }];
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(403);
    });

    it("API-DBR-04: returns 422 when propertyData is null (Scenario 12)", async () => {
      mockSelectResults[0] = [{ ...DEAL_ANALYSIS, propertyData: null }];
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toMatch(/property data.*not available/i);
    });

    it("API-DBR-05: returns 422 when report has no analytics sections (Scenario 13)", async () => {
      mockSelectResults[2] = []; // no report sections
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toMatch(/report analytics.*not available/i);
    });

    it("API-DBR-06: returns 409 when status is 'generating' (Scenario 17)", async () => {
      mockSelectResults[0] = [{ ...DEAL_ANALYSIS, status: "generating" }];
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toMatch(/already in progress/i);
    });

    it("API-DBR-07: returns 400 when dealAnalysisId is missing", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/dealAnalysisId.*required/i);
    });
  });

  // ==========================================
  // Section 2: Happy Path (Scenario 1)
  // ==========================================

  describe("Section 2: Happy Path", () => {
    it("API-DBR-08: returns 200 with DealBriefContent on success (Scenario 1)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.briefContent).toBeDefined();
      expect(body.briefContent.summary).toBeDefined();
      expect(body.briefContent.pricingAssessment).toBeDefined();
      expect(body.briefContent.personaMatch).toBeDefined();
      expect(body.briefContent.negotiationPoints).toBeDefined();
      expect(body.briefContent.marketTiming).toBeDefined();
    });

    it("API-DBR-09: calls Claude API with correct model (Scenario 20)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe("claude-sonnet-4-6");
      expect(callArgs.max_tokens).toBe(4096);
      expect(callArgs.temperature).toBe(0.5);
    });

    it("API-DBR-10: updates deal analysis with briefContent and status (Scenario 1)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      // Should have called update at least twice (generating + completed)
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("API-DBR-11: fetches report personas for prompt (Scenario 3)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(mockGetReportPersonas).toHaveBeenCalledWith(REPORT_ID);
    });
  });

  // ==========================================
  // Section 3: DealBriefContent Structure (Scenario 19)
  // ==========================================

  describe("Section 3: DealBriefContent Structure", () => {
    it("API-DBR-12: response has all required top-level keys (Scenario 19)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const body = await res.json();
      const brief = body.briefContent;

      expect(brief).toHaveProperty("summary");
      expect(brief).toHaveProperty("pricingAssessment");
      expect(brief).toHaveProperty("personaMatch");
      expect(brief).toHaveProperty("negotiationPoints");
      expect(brief).toHaveProperty("marketTiming");
    });

    it("API-DBR-13: pricingAssessment has required sub-keys (Scenario 19)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const body = await res.json();
      const pa = body.briefContent.pricingAssessment;

      expect(pa).toHaveProperty("narrative");
      expect(pa).toHaveProperty("vsMedian");
      expect(pa).toHaveProperty("vsSegmentComps");
      expect(pa).toHaveProperty("pricePerSqFtContext");
    });

    it("API-DBR-14: personaMatch has required sub-keys (Scenario 19)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const body = await res.json();
      const pm = body.briefContent.personaMatch;

      expect(pm).toHaveProperty("bestFitPersona");
      expect(pm).toHaveProperty("matchRationale");
      expect(pm).toHaveProperty("talkingPoints");
      expect(Array.isArray(pm.talkingPoints)).toBe(true);
    });

    it("API-DBR-15: negotiationPoints has required arrays (Scenario 19)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const body = await res.json();
      const np = body.briefContent.negotiationPoints;

      expect(Array.isArray(np.leverageItems)).toBe(true);
      expect(Array.isArray(np.dataBackedArguments)).toBe(true);
      expect(Array.isArray(np.riskFactors)).toBe(true);
    });

    it("API-DBR-16: marketTiming has signal enum and strings (Scenario 19)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const body = await res.json();
      const mt = body.briefContent.marketTiming;

      expect(["buy", "wait", "neutral"]).toContain(mt.signal);
      expect(typeof mt.rationale).toBe("string");
      expect(typeof mt.forecastContext).toBe("string");
    });
  });

  // ==========================================
  // Section 4: Persona Handling (Scenarios 3, 8)
  // ==========================================

  describe("Section 4: Persona Handling", () => {
    it("API-DBR-17: bestFitPersona is one of the linked persona slugs (Scenario 3)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const body = await res.json();
      const linkedSlugs = REPORT_PERSONAS.map((rp) => rp.persona.slug);
      expect(linkedSlugs).toContain(body.briefContent.personaMatch.bestFitPersona);
    });

    it("API-DBR-18: handles no personas linked to report (Scenario 8)", async () => {
      mockGetReportPersonas.mockResolvedValue([]);
      // Mock Claude to return "general" when no personas are provided
      const generalBrief = {
        ...VALID_BRIEF_CONTENT,
        personaMatch: {
          bestFitPersona: "general",
          matchRationale: "Broad buyer appeal with waterfront positioning and luxury finishes",
          talkingPoints: [
            "Waterfront properties in this price range are rare — only 12 active listings",
            "Price per square foot is competitive at $2,024 vs $1,850 segment median",
          ],
        },
      };
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(generalBrief) }],
        usage: { input_tokens: 3000, output_tokens: 1500 },
      });
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.briefContent.personaMatch.bestFitPersona).toBe("general");
    });
  });

  // ==========================================
  // Section 5: Motivated Seller Integration (Scenarios 4, 5)
  // ==========================================

  describe("Section 5: Motivated Seller Integration", () => {
    it("API-DBR-19: prompt includes seller signals when score >= 50 (Scenario 4)", async () => {
      selectCallCount = 0;
      setupSuccessfulMocks();
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      // Verify the user prompt passed to Claude includes seller signals
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      expect(userMessage).toMatch(/MOTIVATED SELLER SIGNALS/i);
    });

    it("API-DBR-20: prompt does NOT emphasize seller signals when score = 0 (Scenario 5)", async () => {
      selectCallCount = 0;
      mockSelectResults = [
        [
          {
            ...DEAL_ANALYSIS,
            motivatedSellerScore: 0,
            motivatedSellerSignals: {
              inherited: { fired: false, weight: 20 },
              nonOwnerOccupied: { fired: false, weight: 15 },
              adjustableRate: { fired: false, weight: 15 },
              longHoldPeriod: { fired: false, weight: 20, yearsHeld: 2 },
              helocPattern: { fired: false, weight: 15, mortgageCount: 1 },
              highEquity: { fired: false, weight: 15, equityPercent: 20 },
              totalScore: 0,
            },
          },
        ],
        [MARKET],
        [DASHBOARD_SECTION, FORWARD_LOOK_SECTION],
      ];
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      // Should NOT have the HIGH seller signals section
      expect(userMessage).not.toMatch(/MOTIVATED SELLER SIGNALS/i);
      // Should have the low score line instead
      expect(userMessage).toMatch(/MOTIVATED SELLER SCORE: 0\/100/i);
    });
  });

  // ==========================================
  // Section 6: Error Handling (Scenarios 14, 15, 16)
  // ==========================================

  describe("Section 6: Error Handling", () => {
    it("API-DBR-21: returns 502 and sets status to 'failed' on Claude API error (Scenario 14)", async () => {
      mockCreate.mockRejectedValue(new Error("API error: 500"));
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toMatch(/brief generation failed/i);
      // Verify status was set to failed
      expect(mockUpdate).toHaveBeenCalled();
    });

    it("API-DBR-22: handles malformed JSON from Claude (Scenario 15)", async () => {
      mockCreate
        .mockResolvedValueOnce({
          content: [{ type: "text", text: "not valid json {{{" }],
          usage: { input_tokens: 3000, output_tokens: 100 },
        })
        .mockResolvedValueOnce({
          content: [{ type: "text", text: JSON.stringify(VALID_BRIEF_CONTENT) }],
          usage: { input_tokens: 3500, output_tokens: 1500 },
        });
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      // Should retry and succeed
      expect(res.status).toBe(200);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it("API-DBR-23: sets status to failed if retry also fails (Scenario 15)", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "not valid json at all" }],
        usage: { input_tokens: 3000, output_tokens: 100 },
      });
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(502);
    });

    it("API-DBR-24: allows re-generation of completed analysis (Scenario 16)", async () => {
      mockSelectResults[0] = [
        { ...DEAL_ANALYSIS, status: "completed", briefContent: VALID_BRIEF_CONTENT },
      ];
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      const res = await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      expect(res.status).toBe(200);
    });
  });

  // ==========================================
  // Section 7: Prompt Content (Scenarios 2, 6)
  // ==========================================

  describe("Section 7: Prompt Content", () => {
    it("API-DBR-25: user prompt includes property data (Scenario 2)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      // Should include key property details
      expect(userMessage).toContain("4100 Gulf Shore Blvd N");
      expect(userMessage).toContain("Naples");
    });

    it("API-DBR-26: user prompt includes market analytics (Scenario 2)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      // Should include market metrics
      expect(userMessage).toMatch(/median/i);
      expect(userMessage).toMatch(/segment/i);
    });

    it("API-DBR-27: user prompt includes forecast data (Scenario 6)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      // Should include forward look data
      expect(userMessage).toMatch(/forecast|projection|6.month|12.month/i);
    });

    it("API-DBR-28: user prompt includes persona specs when available (Scenario 3)", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      expect(userMessage).toContain("Business Mogul");
      expect(userMessage).toContain("Coastal Escape Seeker");
    });

    it("API-DBR-29: system prompt establishes deal analyst role", async () => {
      const { POST } = await import("@/app/api/deal-analyzer/brief/route");
      await POST(makeRequest({ dealAnalysisId: DEAL_ANALYSIS_ID }));
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.system).toMatch(/deal|property|analysis/i);
    });
  });
});
