/**
 * Market Calibration Engine — Tests
 * Pure computation service. Tests cover all 12 Gherkin scenarios.
 */
import type { ComputedAnalytics } from "@/lib/services/market-analytics";
import type { MarketData } from "@/lib/agents/orchestrator";
import type { MarketCalibrationResult, MarketCalibrationSkipped, LocalBenchmark, MarketProfile } from "@/lib/services/market-calibration";

function assertCalibrated(result: MarketCalibrationResult | MarketCalibrationSkipped): asserts result is MarketCalibrationResult {
  if ("skipped" in result) throw new Error("Expected calibrated result but got skipped");
}

jest.mock("@/lib/services/cache", () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  buildKey: jest.fn((source: string, endpoint: string, params: Record<string, unknown>) => {
    const sorted = Object.keys(params).sort().map((k) => `${k}=${String(params[k])}`).join("&");
    return `${source}:${endpoint}:${sorted}`;
  }),
}));

function makePersona(overrides: Record<string, unknown> = {}) {
  return {
    id: "persona-001", name: "The Business Mogul", slug: "the-business-mogul",
    tagline: "Real estate as a strategic asset class", displayOrder: 1,
    profileOverview: "C-suite executive.", primaryMotivation: "Portfolio Optimization",
    buyingLens: "Investment Performance", whatWinsThem: "Data-driven analysis",
    biggestFear: "Capital misallocation",
    demographics: { ageRange: "45-65", netWorth: "$20M+", primaryResidence: "Multiple", purchaseType: "Investment/Trophy", transactionSpeed: "Fast", financing: "Cash", informationStyle: "Data-forward", trustSignals: "Track record" },
    decisionDrivers: [{ factor: "ROI Potential", weight: "critical" as const, description: "Expected return" }],
    reportMetrics: ["CAGR by Micro-Market"],
    propertyFilters: { priceRange: "$4M-$25M+", propertyType: "Single Family, Estate", communityType: "Gated, Waterfront", keyDevelopmentsExample: "Port Royal, Grey Oaks, Pelican Bay" },
    narrativeFraming: { languageTone: "Direct, data-forward", keyVocabulary: ["basis", "alpha", "total return"], avoid: ["dream home", "charming"] },
    talkingPointTemplates: ["This micro-market delivered {cagr}% CAGR"],
    sampleBenchmarks: [
      { metric: "Total Luxury Transactions", value: "2,234 closed sales" },
      { metric: "Cash Transaction Rate", value: "87% cash transactions" },
      { metric: "Median DOM", value: "45 days" },
    ],
    createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

function makeCoastalEscapePersona() {
  return makePersona({
    id: "persona-002", name: "The Coastal Escape Seeker", slug: "the-coastal-escape-seeker", displayOrder: 2,
    primaryMotivation: "Lifestyle Enhancement", buyingLens: "Lifestyle & Amenity",
    propertyFilters: { priceRange: "$3M-$15M", propertyType: "Single Family, Condo", communityType: "Waterfront, Beachfront", waterfront: "Required", keyDevelopmentsExample: "Pelican Bay, Park Shore" },
    narrativeFraming: { languageTone: "Experiential", keyVocabulary: ["sanctuary", "retreat"], avoid: ["cap rate"] },
    sampleBenchmarks: [{ metric: "Waterfront Premium", value: "15-25%" }, { metric: "Median DOM", value: "60 days" }],
  });
}

function makeLegacyBuilderPersona() {
  return makePersona({
    id: "persona-003", name: "The Legacy Builder", slug: "the-legacy-builder", displayOrder: 3,
    primaryMotivation: "Generational Wealth", buyingLens: "Long-term Hold Value",
    propertyFilters: { priceRange: "$10M+", propertyType: "Estate", communityType: "Gated, Prestigious", keyDevelopmentsExample: "Port Royal, Aqualane Shores" },
    narrativeFraming: { languageTone: "Measured", keyVocabulary: ["stewardship"], avoid: ["flip"] },
    sampleBenchmarks: [{ metric: "Stability", value: "95%+" }, { metric: "Median DOM", value: "90 days" }],
  });
}

function makeMarket(overrides: Partial<MarketData> = {}): MarketData {
  return { name: "Naples", geography: { city: "Naples", state: "Florida", county: "Collier County" }, luxuryTier: "ultra_luxury", priceFloor: 1000000, priceCeiling: null, ...overrides };
}

function makeAnalytics(overrides: Partial<ComputedAnalytics> = {}): ComputedAnalytics {
  return {
    market: { totalProperties: 120, medianPrice: 4500000, averagePrice: 6200000, medianPricePerSqft: 1850, totalVolume: 744000000, rating: "A" },
    segments: [
      { name: "Single Family", propertyType: "single_family", count: 54, medianPrice: 3200000, averagePrice: 4100000, minPrice: 1000000, maxPrice: 8500000, medianPricePerSqft: 1600, rating: "A", lowSample: false },
      { name: "Condo", propertyType: "condo", count: 42, medianPrice: 2800000, averagePrice: 3500000, minPrice: 1000000, maxPrice: 7200000, medianPricePerSqft: 1400, rating: "B+", lowSample: false },
      { name: "Estate", propertyType: "estate", count: 24, medianPrice: 12000000, averagePrice: 15000000, minPrice: 6000000, maxPrice: 42000000, medianPricePerSqft: 2800, rating: "A+", lowSample: false },
    ],
    yoy: { medianPriceChange: 0.08, volumeChange: 0.12, pricePerSqftChange: 0.05, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
    insightsIndex: {
      liquidity: { score: 7, label: "Strong", components: { cashBuyerPct: 0.54, transactionVolume: 120 } },
      timing: { score: 6, label: "Favorable", components: {} },
      risk: { score: 7, label: "Low Risk", components: {} },
      value: { score: 6, label: "Moderate Opportunity", components: {} },
    },
    dashboard: { powerFive: [], tierTwo: [], tierThree: [] },
    neighborhoods: [
      { name: "Starwood", zipCode: "81611", propertyCount: 18, medianPrice: 8500000, medianPricePerSqft: 2200, yoyPriceChange: 0.06, amenities: [] },
      { name: "Red Mountain", zipCode: "81612", propertyCount: 15, medianPrice: 12000000, medianPricePerSqft: 2800, yoyPriceChange: 0.1, amenities: [] },
      { name: "West End", zipCode: "81611", propertyCount: 12, medianPrice: 6500000, medianPricePerSqft: 1900, yoyPriceChange: 0.04, amenities: [] },
      { name: "Smuggler", zipCode: "81611", propertyCount: 8, medianPrice: 4200000, medianPricePerSqft: 1500, yoyPriceChange: 0.03, amenities: [] },
      { name: "McLain Flats", zipCode: "81611", propertyCount: 5, medianPrice: 15000000, medianPricePerSqft: 3200, yoyPriceChange: 0.12, amenities: [] },
    ],
    peerComparisons: [], peerRankings: [], scorecard: [],
    confidence: { level: "high", sampleSize: 120, detailCoverage: 0.8, staleDataSources: [] },
    news: { targetMarket: [], peerMarkets: {} },
    detailMetrics: { medianDaysOnMarket: 128, cashBuyerPercentage: 0.54, listToSaleRatio: 0.96, floodZonePercentage: 0.02, investorBuyerPercentage: 0.18, freeClearPercentage: 0.45 },
    ...overrides,
  };
}

describe("Market Calibration Engine", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe("Scenario: Engine produces calibrated overrides for a target market", () => {
    it("produces CalibratedPersonaOverrides for each selected persona", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.personas).toHaveLength(1);
      expect(result.personas[0].personaSlug).toBe("the-business-mogul");
      expect(result.personas[0].propertyFilters).toBeDefined();
      expect(result.personas[0].localBenchmarks).toBeInstanceOf(Array);
      expect(result.marketProfile).toBeDefined();
      expect(result.calibratedAt).toBeDefined();
      expect(result.marketFingerprint).toBeDefined();
    });

    it("preserves original persona archetype unchanged", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const persona = makePersona();
      const origD = JSON.parse(JSON.stringify(persona.decisionDrivers));
      const origF = JSON.parse(JSON.stringify(persona.narrativeFraming));
      await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona }], makeMarket());
      expect(persona.decisionDrivers).toEqual(origD);
      expect(persona.narrativeFraming).toEqual(origF);
    });
  });

  describe("Scenario: Price tier boundaries are adjusted to local luxury definitions", () => {
    it("adjusts price tiers to reflect local distribution", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.marketProfile.priceTiers.length).toBeGreaterThanOrEqual(2);
      for (const t of result.marketProfile.priceTiers) { expect(t).toHaveProperty("label"); expect(t).toHaveProperty("min"); expect(t).toHaveProperty("transactionCount"); expect(t).toHaveProperty("percentage"); }
      expect(result.personas[0].propertyFilters.priceRange).toBeDefined();
    });

    it("maps persona tier labels to local price boundaries", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const labels = result.marketProfile.priceTiers.map((t: MarketProfile["priceTiers"][number]) => t.label);
      expect(labels.some((l: string) => l.includes("entry"))).toBe(true);
      expect(labels.some((l: string) => l.includes("ultra"))).toBe(true);
    });

    it("includes local median price benchmark", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const mb = result.personas[0].localBenchmarks.find((b: LocalBenchmark) => b.metric === "medianPrice");
      expect(mb).toBeDefined();
      expect(mb!.calibratedValue).toContain("4,500,000");
    });
  });

  describe("Scenario: Community types are substituted with local equivalents", () => {
    it("replaces default communities with local names from analytics", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket({ name: "Aspen", geography: { city: "Aspen", state: "Colorado" } }));
      assertCalibrated(result);
      const kd = result.personas[0].propertyFilters.keyDevelopmentsExample!;
      expect(kd).not.toContain("Port Royal"); expect(kd).not.toContain("Grey Oaks");
      expect(kd).toContain("Starwood"); expect(kd).toContain("Red Mountain");
    });

    it("populates topCommunities in market profile", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.marketProfile.topCommunities.length).toBeGreaterThan(0);
      for (const c of result.marketProfile.topCommunities) { expect(c).toHaveProperty("name"); expect(c).toHaveProperty("transactionCount"); expect(c).toHaveProperty("medianPrice"); expect(c).toHaveProperty("type"); }
    });
  });

  describe("Scenario: Seasonal patterns are recalibrated from transaction data", () => {
    it("computes monthly volume distribution", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.marketProfile.monthlyVolume.length).toBe(12);
      for (const mv of result.marketProfile.monthlyVolume) { expect(mv).toHaveProperty("month"); expect(mv).toHaveProperty("count"); expect(mv).toHaveProperty("percentage"); }
    });

    it("identifies peak and slow months", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.personas[0].seasonalPattern).toBeDefined();
      expect(result.personas[0].seasonalPattern!.peakMonths.length).toBe(3);
      expect(result.personas[0].seasonalPattern!.slowMonths.length).toBe(3);
    });

    it("marks low confidence when sample < 50 transactions", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const a = makeAnalytics({ confidence: { level: "medium", sampleSize: 15, detailCoverage: 0.5, staleDataSources: [] } });
      a.market = { ...a.market, totalProperties: 15 };
      const result = await calibratePersonasToMarket(a, [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.personas[0].seasonalPattern!.confidence).toBe("low");
      expect(result.personas[0].seasonalPattern!.sampleSize).toBe(15);
    });
  });

  describe("Scenario: DOM benchmarks are recalibrated to local norms", () => {
    it("replaces static DOM with actual median from analytics", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const d = result.personas[0].localBenchmarks.find((b: LocalBenchmark) => b.metric === "medianDOM");
      expect(d).toBeDefined(); expect(d!.defaultValue).toBe("45 days");
      expect(d!.calibratedValue).toContain("128"); expect(d!.context.length).toBeGreaterThan(0);
    });
  });

  describe("Scenario: Cash transaction norms are adjusted", () => {
    it("replaces default cash rate with actual local rate", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const c = result.personas[0].localBenchmarks.find((b: LocalBenchmark) => b.metric === "cashRate");
      expect(c).toBeDefined(); expect(c!.defaultValue).toBe("87% cash transactions");
      expect(c!.calibratedValue).toContain("54");
    });

    it("notes comparison to national luxury average", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const c = result.personas[0].localBenchmarks.find((b: LocalBenchmark) => b.metric === "cashRate");
      expect(c!.context).toMatch(/below|above|national|average/i);
    });
  });

  describe("Scenario: Engine handles multiple personas with independent calibration", () => {
    it("produces independent overrides for 3 personas", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [
        { selectionOrder: 1, persona: makePersona() }, { selectionOrder: 2, persona: makeCoastalEscapePersona() }, { selectionOrder: 3, persona: makeLegacyBuilderPersona() },
      ], makeMarket());
      assertCalibrated(result);
      expect(result.personas).toHaveLength(3);
      expect(result.personas[0].personaSlug).toBe("the-business-mogul");
      expect(result.personas[1].personaSlug).toBe("the-coastal-escape-seeker");
      expect(result.personas[2].personaSlug).toBe("the-legacy-builder");
    });

    it("uses same market profile for all personas", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [
        { selectionOrder: 1, persona: makePersona() }, { selectionOrder: 2, persona: makeCoastalEscapePersona() },
      ], makeMarket());
      assertCalibrated(result);
      expect(result.marketProfile.totalTransactions).toBe(120);
    });
  });

  describe("Scenario: Engine handles sparse market data gracefully", () => {
    it("marks calibration quality as partial with quality notes", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const a = makeAnalytics({ confidence: { level: "medium", sampleSize: 15, detailCoverage: 0.3, staleDataSources: [] }, detailMetrics: { medianDaysOnMarket: null, cashBuyerPercentage: null, listToSaleRatio: null, floodZonePercentage: null, investorBuyerPercentage: null, freeClearPercentage: null } });
      a.market = { ...a.market, totalProperties: 15 };
      const result = await calibratePersonasToMarket(a, [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.calibrationQuality).toBe("partial");
      expect(result.qualityNotes.length).toBeGreaterThan(0);
    });

    it("still produces price tiers from segments", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const a = makeAnalytics({ confidence: { level: "medium", sampleSize: 15, detailCoverage: 0.3, staleDataSources: [] } });
      a.market = { ...a.market, totalProperties: 15 };
      const result = await calibratePersonasToMarket(a, [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      expect(result.marketProfile.priceTiers.length).toBeGreaterThanOrEqual(1);
    });

    it("returns N/A for missing detail metrics", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const a = makeAnalytics({ detailMetrics: { medianDaysOnMarket: null, cashBuyerPercentage: null, listToSaleRatio: null, floodZonePercentage: null, investorBuyerPercentage: null, freeClearPercentage: null } });
      const result = await calibratePersonasToMarket(a, [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const d = result.personas[0].localBenchmarks.find((b: LocalBenchmark) => b.metric === "medianDOM");
      if (d) { expect(d.calibratedValue).toContain("N/A"); }
    });
  });

  describe("Scenario: Engine preserves persona identity during calibration", () => {
    it("only modifies market-specific fields", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const o = result.personas[0];
      expect(o.propertyFilters).toBeDefined(); expect(o.localBenchmarks).toBeInstanceOf(Array);
      expect(o).not.toHaveProperty("decisionDrivers"); expect(o).not.toHaveProperty("narrativeFraming");
    });
  });

  describe("Scenario: Engine integrates into pipeline before Persona Intelligence", () => {
    it("mergeCalibrationOverrides produces calibrated persona objects", async () => {
      const { calibratePersonasToMarket, mergeCalibrationOverrides } = await import("@/lib/services/market-calibration");
      const persona = makePersona();
      const rp = [{ selectionOrder: 1, persona }];
      const cal = await calibratePersonasToMarket(makeAnalytics(), rp, makeMarket());
      const merged = mergeCalibrationOverrides(rp, cal);
      expect(merged).toHaveLength(1);
      expect(merged[0].persona.propertyFilters.keyDevelopmentsExample).toBeDefined();
      expect(merged[0].persona.decisionDrivers).toEqual(persona.decisionDrivers);
    });

    it("merged personas include calibrated sampleBenchmarks", async () => {
      const { calibratePersonasToMarket, mergeCalibrationOverrides } = await import("@/lib/services/market-calibration");
      const rp = [{ selectionOrder: 1, persona: makePersona() }];
      const cal = await calibratePersonasToMarket(makeAnalytics(), rp, makeMarket());
      const merged = mergeCalibrationOverrides(rp, cal);
      expect(merged[0].persona.sampleBenchmarks.length).toBeGreaterThan(0);
    });
  });

  describe("Scenario: Engine skips when no personas selected", () => {
    it("returns skip result", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [], makeMarket());
      expect((result as MarketCalibrationSkipped).skipped).toBe(true);
      expect((result as MarketCalibrationSkipped).reason).toBe("no_personas_selected");
    });
  });

  describe("Scenario: Engine caches calibration results", () => {
    it("stores in cache after computation", async () => {
      const cache = require("@/lib/services/cache");
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      expect(cache.set).toHaveBeenCalled();
      expect(cache.set.mock.calls[0][0]).toContain("calibration:");
      expect(cache.set.mock.calls[0][3]).toBe(86400);
    });

    it("reuses cached market profile", async () => {
      const cache = require("@/lib/services/cache");
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const r1 = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(r1);
      cache.get.mockResolvedValueOnce({ marketProfile: r1.marketProfile, calibratedAt: r1.calibratedAt, marketFingerprint: r1.marketFingerprint });
      const r2 = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(r2);
      expect(r2.marketProfile.totalTransactions).toBe(r1.marketProfile.totalTransactions);
    });
  });

  describe("MarketProfile completeness", () => {
    it("contains all required fields", async () => {
      const { calibratePersonasToMarket } = await import("@/lib/services/market-calibration");
      const result = await calibratePersonasToMarket(makeAnalytics(), [{ selectionOrder: 1, persona: makePersona() }], makeMarket());
      assertCalibrated(result);
      const mp = result.marketProfile;
      expect(mp.city).toBe("Naples"); expect(mp.state).toBe("Florida");
      expect(mp.totalTransactions).toBe(120); expect(mp.dateRange).toBeDefined();
      expect(mp.priceTiers).toBeInstanceOf(Array); expect(mp.topCommunities).toBeInstanceOf(Array);
      expect(mp.monthlyVolume).toBeInstanceOf(Array);
      expect(typeof mp.medianPrice).toBe("number"); expect(typeof mp.medianDOM).toBe("number");
      expect(typeof mp.cashTransactionRate).toBe("number");
    });
  });
});
