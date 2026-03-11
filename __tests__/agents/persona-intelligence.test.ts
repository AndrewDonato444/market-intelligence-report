import type { AgentContext } from "@/lib/agents/orchestrator";
import type { DataAnalystOutput } from "@/lib/agents/data-analyst";

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ messages: { create: jest.fn() } })),
}));
jest.mock("@/lib/config/env", () => ({ env: { ANTHROPIC_API_KEY: "test-key" } }));
jest.mock("@/lib/services/buyer-personas", () => ({ getReportPersonas: jest.fn() }));

const BUSINESS_MOGUL_PERSONA = {
  id: "persona-001", name: "The Business Mogul", slug: "the-business-mogul",
  tagline: "Real estate as a strategic asset class", displayOrder: 1,
  profileOverview: "C-suite executive acquiring luxury real estate as portfolio allocation.",
  primaryMotivation: "Portfolio Optimization", buyingLens: "Investment Performance",
  whatWinsThem: "Data-driven analysis showing alpha generation", biggestFear: "Capital misallocation",
  demographics: { ageRange: "45-65", netWorth: "$20M+", primaryResidence: "Multiple", purchaseType: "Investment/Trophy", transactionSpeed: "Fast", financing: "Cash", informationStyle: "Data-forward", trustSignals: "Track record" },
  decisionDrivers: [
    { factor: "ROI Potential", weight: "critical" as const, description: "Expected return" },
    { factor: "Tax Optimization", weight: "high" as const, description: "Tax benefits" },
    { factor: "Liquidity", weight: "moderate" as const, description: "Exit strategy" },
  ],
  reportMetrics: ["CAGR by Micro-Market", "Price Per Square Foot Trends", "Days on Market vs Sold Price"],
  propertyFilters: { priceRange: "$5M+", propertyType: "Single Family, Estate", keyDevelopmentsExample: "Port Royal" },
  narrativeFraming: { languageTone: "Direct, data-forward, institutional language", keyVocabulary: ["basis", "alpha", "total return", "cap rate", "portfolio allocation"], avoid: ["dream home", "charming", "cozy", "fixer-upper"] },
  talkingPointTemplates: ["This micro-market delivered {cagr}% CAGR"], sampleBenchmarks: [{ metric: "CAGR", value: ">8%" }],
  createdAt: new Date(), updatedAt: new Date(),
};

const COASTAL_ESCAPE_PERSONA = {
  id: "persona-002", name: "The Coastal Escape Seeker", slug: "the-coastal-escape-seeker",
  tagline: "Finding the perfect waterfront sanctuary", displayOrder: 2,
  profileOverview: "Professional seeking luxury waterfront retreat.",
  primaryMotivation: "Lifestyle Enhancement", buyingLens: "Lifestyle & Amenity",
  whatWinsThem: "Experiential narratives", biggestFear: "Overpaying",
  demographics: { ageRange: "40-60", netWorth: "$10M+", primaryResidence: "City", purchaseType: "Second Home", transactionSpeed: "Measured", financing: "Cash", informationStyle: "Narrative", trustSignals: "Expertise" },
  decisionDrivers: [
    { factor: "Waterfront Access", weight: "critical" as const, description: "Direct water access" },
    { factor: "Design Quality", weight: "high" as const, description: "Architecture" },
    { factor: "Community Fit", weight: "moderate" as const, description: "Lifestyle match" },
  ],
  reportMetrics: ["Waterfront Premium Analysis", "Lifestyle Amenity Density", "Seasonal Occupancy Patterns"],
  propertyFilters: { priceRange: "$3M-$15M", propertyType: "Single Family, Condo", waterfront: "Required", keyDevelopmentsExample: "Pelican Bay" },
  narrativeFraming: { languageTone: "Experiential, aspirational", keyVocabulary: ["sanctuary", "retreat", "coastal living", "turnkey", "waterfront"], avoid: ["investment vehicle", "cap rate", "basis points", "institutional"] },
  talkingPointTemplates: ["Waterfront properties command {premium}% premium"], sampleBenchmarks: [{ metric: "Premium", value: "15-25%" }],
  createdAt: new Date(), updatedAt: new Date(),
};

const LEGACY_BUILDER_PERSONA = {
  id: "persona-003", name: "The Legacy Builder", slug: "the-legacy-builder",
  tagline: "Building generational wealth", displayOrder: 3,
  profileOverview: "Multi-generational wealth holder.",
  primaryMotivation: "Generational Wealth", buyingLens: "Long-term Hold Value",
  whatWinsThem: "Historical appreciation data", biggestFear: "Value erosion",
  demographics: { ageRange: "50-70", netWorth: "$50M+", primaryResidence: "Multiple", purchaseType: "Legacy", transactionSpeed: "Deliberate", financing: "Cash", informationStyle: "Historical", trustSignals: "Longevity" },
  decisionDrivers: [
    { factor: "Long-term Appreciation", weight: "critical" as const, description: "30+ year trajectory" },
    { factor: "Estate Planning", weight: "high" as const, description: "Trust compatibility" },
    { factor: "Community Prestige", weight: "moderate" as const, description: "Social standing" },
  ],
  reportMetrics: ["Historical Price Stability", "CAGR by Micro-Market", "Land Value Trajectory"],
  propertyFilters: { priceRange: "$10M+", propertyType: "Estate", keyDevelopmentsExample: "Port Royal" },
  narrativeFraming: { languageTone: "Measured, institutional", keyVocabulary: ["stewardship", "generational", "preservation", "endowment", "heritage"], avoid: ["flip", "quick return", "fixer-upper", "trendy"] },
  talkingPointTemplates: ["This corridor maintained {stability}% stability"], sampleBenchmarks: [{ metric: "Stability", value: "95%+" }],
  createdAt: new Date(), updatedAt: new Date(),
};

function buildMockClaudeResponse(personaCount: number) {
  const allPersonas = [
    { personaSlug: "the-business-mogul", personaName: "The Business Mogul", selectionOrder: 1,
      talkingPoints: [
        { headline: "Ultra-luxury delivered 12.4% YoY", detail: "Significant alpha generation.", dataSource: "yoy.medianPriceChange", relevance: "Direct ROI metric" },
        { headline: "Cash ratio signals conviction", detail: "87% cash transactions.", dataSource: "market.cashTransactionRatio", relevance: "Capital allocation" },
        { headline: "Price/sqft shows basis expansion", detail: "$2,150/sqft +6% YoY.", dataSource: "market.medianPricePerSqft", relevance: "Total return" },
        { headline: "Estate segment at $22M median", detail: "A+ rating.", dataSource: "segments.estate.medianPrice", relevance: "Trophy asset" },
        { headline: "Volume increased 12%", detail: "Genuine demand expansion.", dataSource: "yoy.volumeChange", relevance: "Exit strategy" },
      ],
      narrativeOverlay: { perspective: "Compelling capital allocation.", emphasis: ["CAGR by Micro-Market", "Price Per Square Foot Trends"], deEmphasis: ["lifestyle amenities"], toneGuidance: "Direct, data-forward" },
      metricEmphasis: [{ metricName: "CAGR by Micro-Market", currentValue: "12.4% YoY", interpretation: "Outperforms alternatives.", priority: "primary" as const }, { metricName: "Price Per Square Foot Trends", currentValue: "$2,150/sqft", interpretation: "Sustained expansion.", priority: "primary" as const }],
      vocabulary: { preferred: ["basis", "alpha", "total return", "cap rate"], avoid: ["dream home", "charming"] },
    },
    { personaSlug: "the-coastal-escape-seeker", personaName: "The Coastal Escape Seeker", selectionOrder: 2,
      talkingPoints: [
        { headline: "Waterfront defines lifestyle premium", detail: "Median $8.2M.", dataSource: "market.medianPrice", relevance: "Coastal premium" },
        { headline: "Design-forward estates lead", detail: "7,000+ sqft.", dataSource: "segments.estate", relevance: "Turnkey quality" },
        { headline: "Market depth ensures selection", detail: "45 properties.", dataSource: "market.totalProperties", relevance: "Selection breadth" },
        { headline: "YoY stability supports retreat", detail: "8% appreciation.", dataSource: "yoy.medianPriceChange", relevance: "Peace of mind" },
        { headline: "Condo offers coastal entry", detail: "$6.2M median.", dataSource: "segments.condo.medianPrice", relevance: "Alternative entry" },
      ],
      narrativeOverlay: { perspective: "Exceptional sanctuary.", emphasis: ["Waterfront Premium Analysis"], deEmphasis: ["cap rate analysis"], toneGuidance: "Experiential" },
      metricEmphasis: [{ metricName: "Waterfront Premium Analysis", currentValue: "18% premium", interpretation: "Reflects lifestyle value.", priority: "primary" as const }],
      vocabulary: { preferred: ["sanctuary", "retreat", "coastal living", "turnkey"], avoid: ["investment vehicle", "cap rate"] },
    },
    { personaSlug: "the-legacy-builder", personaName: "The Legacy Builder", selectionOrder: 3,
      talkingPoints: [
        { headline: "Estate demonstrates preservation", detail: "A+ with $22M median.", dataSource: "segments.estate.rating", relevance: "Stewardship" },
        { headline: "Market stability underpins heritage", detail: "A rating, 8% growth.", dataSource: "market.rating", relevance: "Generational thesis" },
        { headline: "Premium micro-markets for legacy", detail: "$9.5M median.", dataSource: "segments.single_family.medianPrice", relevance: "Prestige" },
        { headline: "Volume signals enduring relevance", detail: "12% increase.", dataSource: "yoy.volumeChange", relevance: "Liquidity assurance" },
        { headline: "Price/sqft supports heritage", detail: "$2,150/sqft, 6% growth.", dataSource: "market.medianPricePerSqft", relevance: "Legacy metric" },
      ],
      narrativeOverlay: { perspective: "Enduring generational wealth.", emphasis: ["Historical Price Stability"], deEmphasis: ["short-term trends"], toneGuidance: "Measured, institutional" },
      metricEmphasis: [{ metricName: "Historical Price Stability", currentValue: "A+ rated", interpretation: "Endowment-grade.", priority: "primary" as const }],
      vocabulary: { preferred: ["stewardship", "generational", "preservation"], avoid: ["flip", "quick return"] },
    },
  ];
  const personas = allPersonas.slice(0, personaCount);
  const blended = personaCount >= 2 ? {
    metricUnion: ["CAGR by Micro-Market", "Price Per Square Foot Trends", "Waterfront Premium Analysis", ...(personaCount >= 3 ? ["Historical Price Stability"] : [])],
    filterIntersection: { priceRange: { min: 5000000, max: 15000000 }, propertyTypes: ["Single Family"], communityTypes: ["Waterfront"] },
    blendedTalkingPoints: [
      { headline: "Ultra-luxury outpaces broader markets", detail: "12.4% YoY growth.", dataSource: "yoy.medianPriceChange", relevance: "Cross-persona" },
      { headline: "Estate segment is crown jewel", detail: "$22M median, A+ rating.", dataSource: "segments.estate", relevance: "Overlapping interest" },
    ],
    conflicts: personaCount >= 3 ? [{ metric: "cap rate analysis", emphasizedBy: "the-business-mogul", deEmphasizedBy: "the-coastal-escape-seeker", resolution: "included as secondary context" }] : [],
  } : null;
  return { personas, blended, meta: { personaCount, primaryPersona: personas[0].personaSlug, modelUsed: "claude-sonnet-4-6", promptTokens: 3200, completionTokens: 4100 } };
}

function buildAnalysis(): DataAnalystOutput {
  return {
    market: { totalProperties: 45, medianPrice: 8200000, averagePrice: 12400000, medianPricePerSqft: 2150, totalVolume: 558000000, rating: "A" },
    segments: [
      { name: "single_family", propertyType: "single_family", count: 25, medianPrice: 9500000, averagePrice: 13200000, minPrice: 5100000, maxPrice: 42000000, medianPricePerSqft: 2300, rating: "A", lowSample: false },
      { name: "condo", propertyType: "condo", count: 15, medianPrice: 6200000, averagePrice: 7800000, minPrice: 5000000, maxPrice: 18500000, medianPricePerSqft: 1850, rating: "B+", lowSample: false },
      { name: "estate", propertyType: "estate", count: 5, medianPrice: 22000000, averagePrice: 25600000, minPrice: 15000000, maxPrice: 42000000, medianPricePerSqft: 3100, rating: "A+", lowSample: false },
    ],
    yoy: { medianPriceChange: 0.124, volumeChange: 0.12, pricePerSqftChange: 0.06, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
    confidence: { level: "high", staleDataSources: [], sampleSize: 45 },
  };
}

function buildContext(overrides: Partial<AgentContext> = {}): AgentContext {
  const a = buildAnalysis();
  return {
    reportId: "report-001", userId: "user-001",
    market: { name: "Naples", geography: { city: "Naples", state: "Florida", county: "Collier County" }, luxuryTier: "ultra_luxury", priceFloor: 5000000, priceCeiling: null },
    reportConfig: {},
    upstreamResults: {
      "insight-generator": { agentName: "insight-generator", sections: [], metadata: { insights: { overview: { narrative: "Naples ultra-luxury shows resilience", highlights: [], recommendations: [] }, themes: [{ name: "Ultra-Luxury Resilience", impact: "high", trend: "up", narrative: "Strong demand" }], executiveSummary: { narrative: "Strong market", highlights: [], timing: { buyers: "Act now", sellers: "Favorable" } } }, executiveBriefing: "Naples ultra-luxury shows resilience", themes: ["Ultra-Luxury Resilience"] }, durationMs: 5000 },
      "forecast-modeler": { agentName: "forecast-modeler", sections: [], metadata: { forecast: { projections: [], scenarios: [] }, guidance: "Positive outlook" }, durationMs: 4000 },
      "polish-agent": { agentName: "polish-agent", sections: [], metadata: { strategicBrief: "Market positioned for growth", methodology: "Data-driven approach" }, durationMs: 3000 },
    },
    abortSignal: new AbortController().signal,
    computedAnalytics: { market: a.market, segments: a.segments, yoy: a.yoy, confidence: { ...a.confidence, detailCoverage: 0.8 }, insightsIndex: { overall: "A", segments: {} }, dashboard: {}, detailMetrics: {}, neighborhoods: [], peerComparisons: [], peerRankings: [], scorecard: {} } as any,
    ...overrides,
  };
}

describe("Persona Intelligence Agent", () => {
  let mockCreate: jest.Mock;
  let mockGetReportPersonas: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks(); jest.resetModules();
    const Anthropic = require("@anthropic-ai/sdk").default;
    mockCreate = jest.fn();
    Anthropic.mockImplementation(() => ({ messages: { create: mockCreate } }));
    mockGetReportPersonas = require("@/lib/services/buyer-personas").getReportPersonas;
  });

  describe("Scenario: Agent is registered in the pipeline", () => {
    it("has correct name, dependencies, and execute function", async () => {
      const { personaIntelligenceAgent } = await import("@/lib/agents/persona-intelligence");
      expect(personaIntelligenceAgent.name).toBe("persona-intelligence");
      expect(personaIntelligenceAgent.dependencies).toEqual(["insight-generator", "forecast-modeler", "polish-agent"]);
      expect(typeof personaIntelligenceAgent.execute).toBe("function");
    });

    it("returns AgentResult with sections and metadata", async () => {
      const { personaIntelligenceAgent } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await personaIntelligenceAgent.execute(buildContext());
      expect(result.agentName).toBe("persona-intelligence");
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Scenario: Agent loads selected personas from database", () => {
    it("fetches personas and includes full data in prompt ordered by selection", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }, { selectionOrder: 2, persona: COASTAL_ESCAPE_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(2)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      await executePersonaIntelligence(buildContext());
      expect(mockGetReportPersonas).toHaveBeenCalledWith("report-001");
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("The Business Mogul");
      expect(userMsg).toContain("ROI Potential");
      expect(userMsg).toContain("basis");
      expect(userMsg).toContain("alpha");
      expect(userMsg.indexOf("The Business Mogul")).toBeLessThan(userMsg.indexOf("The Coastal Escape Seeker"));
      expect(userMsg).toContain("PRIMARY");
    });
  });

  describe("Scenario: Agent skips when no personas selected", () => {
    it("returns empty result with skipped metadata and no API call", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([]);
      const result = await executePersonaIntelligence(buildContext());
      expect(result.sections).toEqual([]);
      expect(result.metadata).toMatchObject({ skipped: true, reason: "no_personas_selected" });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Agent generates persona-specific talking points", () => {
    it("produces 5-7 talking points with correct structure and vocabulary in prompt", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await executePersonaIntelligence(buildContext());
      const output = result.metadata.personaIntelligence as any;
      expect(output.personas[0].talkingPoints.length).toBeGreaterThanOrEqual(5);
      expect(output.personas[0].talkingPoints.length).toBeLessThanOrEqual(7);
      for (const tp of output.personas[0].talkingPoints) {
        expect(tp).toHaveProperty("headline"); expect(tp).toHaveProperty("detail");
        expect(tp).toHaveProperty("dataSource"); expect(tp).toHaveProperty("relevance");
      }
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      for (const w of ["basis", "alpha", "total return", "cap rate"]) expect(userMsg).toContain(w);
    });
  });

  describe("Scenario: Agent generates narrative overlay", () => {
    it("produces overlay with correct structure and Coastal vocabulary in prompt", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: COASTAL_ESCAPE_PERSONA }]);
      const resp = buildMockClaudeResponse(2); resp.personas = [resp.personas[1]]; resp.personas[0].selectionOrder = 1; resp.meta.personaCount = 1; resp.meta.primaryPersona = "the-coastal-escape-seeker"; resp.blended = null;
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(resp) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await executePersonaIntelligence(buildContext());
      const overlay = (result.metadata.personaIntelligence as any).personas[0].narrativeOverlay;
      expect(overlay).toHaveProperty("perspective"); expect(overlay).toHaveProperty("emphasis"); expect(overlay).toHaveProperty("deEmphasis"); expect(overlay).toHaveProperty("toneGuidance");
      expect(typeof overlay.perspective).toBe("string"); expect(Array.isArray(overlay.emphasis)).toBe(true);
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      for (const w of ["sanctuary", "retreat", "coastal living"]) expect(userMsg).toContain(w);
    });
  });

  describe("Scenario: Agent applies metric emphasis", () => {
    it("produces metricEmphasis with correct structure and report_metrics in prompt", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await executePersonaIntelligence(buildContext());
      for (const m of (result.metadata.personaIntelligence as any).personas[0].metricEmphasis) {
        expect(m).toHaveProperty("metricName"); expect(m).toHaveProperty("currentValue"); expect(m).toHaveProperty("interpretation");
        expect(["primary", "secondary"]).toContain(m.priority);
      }
      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("CAGR by Micro-Market"); expect(userMsg).toContain("Price Per Square Foot Trends");
    });
  });

  describe("Scenario: Agent handles multiple personas with blending", () => {
    it("produces per-persona output and blended content for 3 personas", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }, { selectionOrder: 2, persona: COASTAL_ESCAPE_PERSONA }, { selectionOrder: 3, persona: LEGACY_BUILDER_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(3)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await executePersonaIntelligence(buildContext());
      const output = result.metadata.personaIntelligence as any;
      expect(output.personas).toHaveLength(3);
      expect(output.blended).not.toBeNull();
      expect(output.blended.metricUnion).toBeInstanceOf(Array);
      expect(output.blended.filterIntersection).toBeDefined();
      expect(output.blended.blendedTalkingPoints.length).toBeLessThanOrEqual(7);
      expect(output.blended.conflicts).toBeInstanceOf(Array);
    });

    it("blended is null for single persona", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await executePersonaIntelligence(buildContext());
      expect((result.metadata.personaIntelligence as any).blended).toBeNull();
    });
  });

  describe("Scenario: Agent uses Claude API correctly", () => {
    it("system prompt establishes advisor role, uses claude-sonnet-4-6, includes market data", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      await executePersonaIntelligence(buildContext());
      const call = mockCreate.mock.calls[0][0];
      expect(call.system).toContain("luxury real estate intelligence advisor");
      expect(call.system).toContain("persona-targeted");
      expect(call.model).toBe("claude-sonnet-4-6");
      const userMsg = call.messages[0].content;
      expect(userMsg).toContain("$8.2M"); expect(userMsg).toContain("Upstream"); expect(userMsg).toContain("Decision Drivers");
    });

    it("parses response into PersonaIntelligenceOutput", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await executePersonaIntelligence(buildContext());
      const output = result.metadata.personaIntelligence as any;
      expect(output).toHaveProperty("personas"); expect(output).toHaveProperty("blended"); expect(output).toHaveProperty("meta");
      expect(output.meta.modelUsed).toBe("claude-sonnet-4-6");
    });
  });

  describe("Scenario: Agent produces structured output", () => {
    it("sections contain persona_intelligence with correct title and metadata", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const result = await executePersonaIntelligence(buildContext());
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].sectionType).toBe("persona_intelligence");
      expect(result.sections[0].title).toBe("Persona Intelligence");
      expect(result.metadata).toHaveProperty("personaIntelligence");
    });
  });

  describe("Scenario: Agent handles upstream failures", () => {
    it("notes missing upstream and still generates output", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const ctx = buildContext(); delete ctx.upstreamResults["insight-generator"];
      const result = await executePersonaIntelligence(ctx);
      expect(result.metadata.missingUpstream).toContain("insight-generator");
      expect(result.sections).toHaveLength(1);
    });

    it("works with all upstream missing", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: JSON.stringify(buildMockClaudeResponse(1)) }], usage: { input_tokens: 3200, output_tokens: 4100 } });
      const ctx = buildContext(); ctx.upstreamResults = {};
      const result = await executePersonaIntelligence(ctx);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.sections).toHaveLength(1);
    });
  });

  describe("Scenario: Agent respects abort signal", () => {
    it("throws non-retriable error on abort before API call", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      const controller = new AbortController(); controller.abort();
      try { await executePersonaIntelligence(buildContext({ abortSignal: controller.signal })); fail("Should throw"); } catch (e: any) { expect(e.message).toMatch(/abort/i); expect(e.retriable).toBe(false); }
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Agent handles API rate limits", () => {
    it.each([[429, true], [500, true], [503, true], [400, false]])("tags %d errors as retriable=%s", async (status, expected) => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockRejectedValue(Object.assign(new Error("Error"), { status }));
      try { await executePersonaIntelligence(buildContext()); fail("Should throw"); } catch (e: any) { expect(e.retriable).toBe(expected); }
    });

    it("handles malformed JSON as retriable", async () => {
      const { executePersonaIntelligence } = await import("@/lib/agents/persona-intelligence");
      mockGetReportPersonas.mockResolvedValue([{ selectionOrder: 1, persona: BUSINESS_MOGUL_PERSONA }]);
      mockCreate.mockResolvedValue({ content: [{ type: "text", text: "not valid {{{" }], usage: { input_tokens: 100, output_tokens: 50 } });
      try { await executePersonaIntelligence(buildContext()); fail("Should throw"); } catch (e: any) { expect(e.message).toContain("parse"); expect(e.retriable).toBe(true); }
    });
  });
});
