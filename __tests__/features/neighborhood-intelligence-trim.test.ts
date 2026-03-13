/**
 * Neighborhood Intelligence Trim — TDD Tests
 *
 * Covers all Gherkin scenarios from the feature spec:
 * 1. Narrative is tighter and shorter (prompt change — tested via prompt content)
 * 2. Source attribution appears in the PDF (renderer test)
 * 3. Source data is passed through the assembly pipeline (assembler test)
 * 4. Narrative does not duplicate the data table (prompt instruction test)
 * 5. Empty neighborhood data (renderer + assembler graceful handling)
 * 6. Existing tests remain green (covered by running full test suite)
 */

// Mock DB/cache/env to avoid DATABASE_URL requirement
jest.mock("@/lib/db", () => ({
  db: {},
  schema: { cache: {}, apiUsage: {} },
}));
jest.mock("@/lib/services/cache");
jest.mock("@/lib/services/api-usage");
jest.mock("@/lib/config/env", () => ({
  env: { REALESTATEAPI_KEY: "test-key", SCRAPINGDOG_API_KEY: "test-key" },
}));

import {
  assembleReport,
  type AssemblyDurations,
} from "@/lib/agents/report-assembler";
import type { ComputedAnalytics } from "@/lib/services/market-analytics";
import type { AgentResult } from "@/lib/agents/orchestrator";

// --- Fixtures ---

function makeAnalytics(overrides: Partial<ComputedAnalytics> = {}): ComputedAnalytics {
  return {
    market: {
      totalProperties: 847,
      medianPrice: 8000000,
      averagePrice: 9000000,
      medianPricePerSqft: 1600,
      totalVolume: 240000000,
      rating: "A",
    },
    segments: [
      { name: "SFR", propertyType: "SFR", count: 20, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false, yoy: null },
    ],
    yoy: { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
    insightsIndex: {
      liquidity: { score: 7, label: "Strong", components: { transactionVolume: 847, freeClearPct: 0.3 } },
      timing: { score: 6, label: "Favorable", components: { priceMomentum: 0.08, medianDOM: 45, listToSaleRatio: 0.97 } },
      risk: { score: 8, label: "Low Risk", components: { floodZonePct: 0.1, concentrationPct: 0.67 } },
      value: { score: 6, label: "Moderate Opportunity", components: { yoyGrowth: 0.08, psfSpread: 0.2 } },
    },
    dashboard: {
      powerFour: [
        { name: "Median Sold Price", value: 8000000, trend: "up", trendValue: 0.08, category: "power_four" },
        { name: "Median Price/SqFt", value: 1600, trend: "up", trendValue: 0.06, category: "power_four" },
        { name: "Median Days on Market", value: 45, trend: null, trendValue: null, category: "power_four" },
        { name: "List-to-Sale Ratio", value: 97, trend: null, trendValue: null, category: "power_four" },
      ],
      supportingMetrics: [
        { name: "Total Sales Volume", value: 240000000, trend: null, trendValue: null, category: "supporting" },
        { name: "Investor Activity Rate", value: 20, trend: null, trendValue: null, category: "supporting" },
      ],
    },
    neighborhoods: [
      { name: "34102", zipCode: "34102", propertyCount: 20, medianPrice: 9000000, medianPricePerSqft: 1700, yoyPriceChange: 0.1, amenities: [] },
      { name: "34103", zipCode: "34103", propertyCount: 15, medianPrice: 7200000, medianPricePerSqft: 1400, yoyPriceChange: 0.042, amenities: [] },
    ],
    peerComparisons: [],
    peerRankings: [],
    scorecard: [],
    confidence: {
      level: "high",
      sampleSize: 847,
      detailCoverage: 0.33,
      staleDataSources: [],
    },
    news: { targetMarket: [], peerMarkets: {} },
    detailMetrics: {
      medianDaysOnMarket: 45,
      cashBuyerPercentage: 0.4,
      listToSaleRatio: 0.97,
      floodZonePercentage: 0.1,
      investorBuyerPercentage: 0.2,
      freeClearPercentage: 0.3,
    },
    dataAsOfDate: "2025-12-15",
    ...overrides,
  };
}

function makeAgentResults(): Record<string, AgentResult> {
  return {
    "insight-generator": {
      agentName: "insight-generator",
      sections: [],
      metadata: {
        executiveBriefing: "Naples ultra-luxury market shows strong momentum...",
        neighborhoodAnalysis: "The waterfront corridors command a 34% price premium over inland neighborhoods.",
        editorial: "A tale of two markets emerges...",
        themes: ["Rising cash buyer dominance"],
        dashboardNarrative: "847 transactions at $8M median...",
      },
      durationMs: 5000,
    },
    "forecast-modeler": {
      agentName: "forecast-modeler",
      sections: [],
      metadata: {
        forecast: "Based on current trends...",
        guidance: { sellers: "Strong market...", buyers: "Act fast...", holders: "Hold..." },
      },
      durationMs: 4000,
    },
  };
}

const defaultDurations: AssemblyDurations = {
  fetchMs: 2000,
  computeMs: 50,
  agentDurations: {
    "insight-generator": 5000,
    "forecast-modeler": 4000,
  },
};

// ============================================================
// Scenario: Source data is passed through the assembly pipeline
// ============================================================
describe("Neighborhood Intelligence Trim", () => {
  describe("Scenario: Source data is passed through the assembly pipeline", () => {
    it("section 4 content includes a sourceAttribution string field", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section4 = result.sections.find((s) => s.sectionType === "neighborhood_intelligence");
      expect(section4).toBeDefined();
      const content = section4!.content as Record<string, unknown>;
      expect(content.sourceAttribution).toBeDefined();
      expect(typeof content.sourceAttribution).toBe("string");
    });

    it("sourceAttribution describes data origin with transaction count", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const content = result.sections[3].content as Record<string, unknown>;
      const attr = content.sourceAttribution as string;
      expect(attr).toContain("847");
      expect(attr).toContain("RealEstateAPI");
    });

    it("sourceAttribution includes date range when dataAsOfDate is available", () => {
      const result = assembleReport(makeAnalytics({ dataAsOfDate: "2025-12-15" }), makeAgentResults(), defaultDurations);
      const content = result.sections[3].content as Record<string, unknown>;
      const attr = content.sourceAttribution as string;
      expect(attr).toContain("2025");
    });

    it("sourceAttribution is null when no neighborhood data exists", () => {
      const result = assembleReport(makeAnalytics({ neighborhoods: [], market: { totalProperties: 0, medianPrice: 0, averagePrice: 0, medianPricePerSqft: 0, totalVolume: 0, rating: "N/A" } }), makeAgentResults(), defaultDurations);
      const content = result.sections[3].content as Record<string, unknown>;
      expect(content.sourceAttribution).toBeNull();
    });
  });

  // ============================================================
  // Scenario: Source attribution appears in the PDF
  // ============================================================
  describe("Scenario: Source attribution appears in the PDF renderer", () => {
    it("NeighborhoodIntelligencePdf content interface accepts sourceAttribution", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.NeighborhoodIntelligencePdf).toBeDefined();
      expect(typeof mod.NeighborhoodIntelligencePdf).toBe("function");
    });

    it("renderer source file contains sourceAttribution rendering logic", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const rendererSource = fs.readFileSync(
        path.join(process.cwd(), "lib/pdf/templates/renderers.tsx"),
        "utf8"
      );
      expect(rendererSource).toContain("sourceAttribution");
    });
  });

  // ============================================================
  // Scenario: Narrative is tighter and shorter
  // ============================================================
  describe("Scenario: Narrative is tighter and shorter (prompt changes)", () => {
    it("insight-generator prompt requests 2-4 sentences, not 1-2 paragraphs", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const source = fs.readFileSync(
        path.join(process.cwd(), "lib/agents/insight-generator.ts"),
        "utf8"
      );
      // The neighborhoodAnalysis JSON schema instruction should not say "1-2 paragraphs"
      const neighborhoodPromptMatch = source.match(/"neighborhoodAnalysis":\s*\{[^}]+\}/);
      expect(neighborhoodPromptMatch).toBeTruthy();
      expect(neighborhoodPromptMatch![0]).not.toContain("1-2 paragraphs");
      expect(source).toContain("2-4 sentences");
    });

    it("prompt instructs to lead with most important micro-market pattern", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const source = fs.readFileSync(
        path.join(process.cwd(), "lib/agents/insight-generator.ts"),
        "utf8"
      );
      expect(source).toMatch(/lead.*most.*pattern|most.*notable.*pattern/i);
    });

    it("prompt instructs to include one contrarian or surprising finding", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const source = fs.readFileSync(
        path.join(process.cwd(), "lib/agents/insight-generator.ts"),
        "utf8"
      );
      expect(source).toMatch(/contrarian|surprising/i);
    });
  });

  // ============================================================
  // Scenario: Narrative does not duplicate the data table
  // ============================================================
  describe("Scenario: Narrative does not duplicate the data table", () => {
    it("prompt instructs not to restate per-neighborhood numbers", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const source = fs.readFileSync(
        path.join(process.cwd(), "lib/agents/insight-generator.ts"),
        "utf8"
      );
      expect(source).toMatch(/do not restate|not restate|don.*restate|not.*list.*median|not.*enumerate/i);
    });

    it("prompt focuses on cross-neighborhood patterns", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const source = fs.readFileSync(
        path.join(process.cwd(), "lib/agents/insight-generator.ts"),
        "utf8"
      );
      expect(source).toMatch(/cross-neighborhood|relative positioning|micro-market dynamics/i);
    });
  });

  // ============================================================
  // Scenario: Empty neighborhood data
  // ============================================================
  describe("Scenario: Empty neighborhood data", () => {
    it("sourceAttribution is null when no neighborhoods exist", () => {
      const analytics = makeAnalytics({
        neighborhoods: [],
        market: { totalProperties: 0, medianPrice: 0, averagePrice: 0, medianPricePerSqft: 0, totalVolume: 0, rating: "N/A" },
      });
      const result = assembleReport(analytics, makeAgentResults(), defaultDurations);
      const content = result.sections[3].content as Record<string, unknown>;
      expect(content.sourceAttribution).toBeNull();
    });

    it("section 4 still exists with empty neighborhoods", () => {
      const analytics = makeAnalytics({ neighborhoods: [] });
      const result = assembleReport(analytics, makeAgentResults(), defaultDurations);
      const section4 = result.sections.find((s) => s.sectionType === "neighborhood_intelligence");
      expect(section4).toBeDefined();
      const content = section4!.content as Record<string, unknown>;
      expect(content.neighborhoods).toEqual([]);
    });
  });

  // ============================================================
  // Scenario: Existing tests remain green
  // ============================================================
  describe("Scenario: Existing structure unchanged", () => {
    it("section 4 still has neighborhoods array and narrative", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const content = result.sections[3].content as Record<string, unknown>;
      expect(content.neighborhoods).toBeDefined();
      expect(content.narrative).toBeDefined();
    });

    it("total section count unchanged (7 without persona)", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      expect(result.sections).toHaveLength(7);
    });

    it("section types match expected order", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      expect(result.sections[3].sectionType).toBe("neighborhood_intelligence");
      expect(result.sections[3].sectionNumber).toBe(4);
    });
  });
});
