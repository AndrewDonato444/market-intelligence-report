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
  DISCLAIMER_TEXT,
  NEW_SECTION_TYPES,
  type AssemblyDurations,
} from "@/lib/agents/report-assembler";
import type { ComputedAnalytics } from "@/lib/services/market-analytics";
import type { AgentResult } from "@/lib/agents/orchestrator";

// --- Fixtures ---

function makeAnalytics(overrides: Partial<ComputedAnalytics> = {}): ComputedAnalytics {
  return {
    market: {
      totalProperties: 30,
      medianPrice: 8000000,
      averagePrice: 9000000,
      medianPricePerSqft: 1600,
      totalVolume: 240000000,
      rating: "A",
    },
    segments: [
      { name: "SFR", propertyType: "SFR", count: 20, medianPrice: 8000000, averagePrice: 8500000, minPrice: 5000000, maxPrice: 15000000, medianPricePerSqft: 1500, rating: "A", lowSample: false, yoy: null },
      { name: "Condo", propertyType: "Condo", count: 10, medianPrice: 5000000, averagePrice: 5500000, minPrice: 3000000, maxPrice: 9000000, medianPricePerSqft: 1200, rating: "B+", lowSample: false, yoy: null },
    ],
    yoy: { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null },
    insightsIndex: {
      liquidity: { score: 7, label: "Strong", components: { cashBuyerPct: 0.4, transactionVolume: 30, freeClearPct: 0.3 } },
      timing: { score: 6, label: "Favorable", components: { priceMomentum: 0.08, medianDOM: 45, listToSaleRatio: 0.97 } },
      risk: { score: 8, label: "Low Risk", components: { floodZonePct: 0.1, concentrationPct: 0.67 } },
      value: { score: 6, label: "Moderate Opportunity", components: { yoyGrowth: 0.08, psfSpread: 0.2 } },
    },
    dashboard: {
      powerFive: [
        { name: "Median Sold Price", value: 8000000, trend: "up", trendValue: 0.08, category: "power_five" },
        { name: "Median Price/SqFt", value: 1600, trend: "up", trendValue: 0.06, category: "power_five" },
        { name: "Median Days on Market", value: 45, trend: null, trendValue: null, category: "power_five" },
        { name: "List-to-Sale Ratio", value: 97, trend: null, trendValue: null, category: "power_five" },
        { name: "Transaction Volume", value: 30, trend: "up", trendValue: 0.05, category: "power_five" },
      ],
      tierTwo: [
        { name: "Cash Buyer %", value: 40, trend: null, trendValue: null, category: "tier_two" },
        { name: "Total Sales Volume", value: 240000000, trend: null, trendValue: null, category: "tier_two" },
        { name: "Average Price", value: 9000000, trend: null, trendValue: null, category: "tier_two" },
        { name: "Property Type Split", value: "SFR: 20, Condo: 10", trend: null, trendValue: null, category: "tier_two" },
      ],
      tierThree: [
        { name: "Flood Zone Exposure", value: 10, trend: null, trendValue: null, category: "tier_three" },
        { name: "Investor Activity Rate", value: 20, trend: null, trendValue: null, category: "tier_three" },
        { name: "Free & Clear %", value: 30, trend: null, trendValue: null, category: "tier_three" },
      ],
    },
    neighborhoods: [
      { name: "34102", zipCode: "34102", propertyCount: 20, medianPrice: 9000000, medianPricePerSqft: 1700, yoyPriceChange: 0.1, amenities: [] },
    ],
    peerComparisons: [
      { name: "Palm Beach", geography: { city: "Palm Beach", state: "FL" }, medianPrice: 7000000, averagePrice: 7500000, medianPricePerSqft: 1400, totalProperties: 25, totalVolume: 175000000, rating: "B+", yoy: { medianPriceChange: 0.05, volumeChange: 0.02, pricePerSqftChange: 0.04, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null } },
    ],
    peerRankings: [
      { metric: "Median Price", targetRank: 1, totalMarkets: 2 },
      { metric: "YoY Growth", targetRank: 1, totalMarkets: 2 },
      { metric: "Transaction Volume", targetRank: 1, totalMarkets: 2 },
    ],
    scorecard: [
      { segment: "SFR", rating: "A", propertyCount: 20, medianPrice: 8000000, yoyChange: 0.08, trend: "up" },
      { segment: "Condo", rating: "B+", propertyCount: 10, medianPrice: 5000000, yoyChange: 0.08, trend: "up" },
    ],
    confidence: {
      level: "high",
      sampleSize: 30,
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
        neighborhoodAnalysis: "The 34102 zip code corridor continues to lead...",
        editorial: "A tale of two markets emerges...",
        themes: ["Rising cash buyer dominance", "Waterfront premium expansion"],
      },
      durationMs: 5000,
    },
    "forecast-modeler": {
      agentName: "forecast-modeler",
      sections: [],
      metadata: {
        forecast: "Based on current trends, median prices expected to rise 5-8%...",
        guidance: {
          sellers: "Strong seller's market with accelerating prices...",
          buyers: "Buyers should act decisively in Q2...",
          holders: "Equity positions strengthening across all segments...",
        },
      },
      durationMs: 4000,
    },
    "polish-agent": {
      agentName: "polish-agent",
      sections: [],
      metadata: {
        strategicBrief: "The Naples ultra-luxury market earns an 'A' rating...",
        methodology: "Analysis based on 30 property records with 33% detail coverage...",
      },
      durationMs: 3000,
    },
  };
}

const defaultDurations: AssemblyDurations = {
  fetchMs: 2000,
  computeMs: 50,
  agentDurations: {
    "insight-generator": 5000,
    "forecast-modeler": 4000,
    "polish-agent": 3000,
  },
};

// --- Tests ---

describe("Report Assembler", () => {
  describe("assembleReport", () => {
    it("produces exactly 9 sections", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      expect(result.sections).toHaveLength(9);
    });

    it("sections are numbered 1 through 9", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const numbers = result.sections.map((s) => s.sectionNumber);
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("section types match first 9 of NEW_SECTION_TYPES (no persona agent)", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const types = result.sections.map((s) => s.sectionType);
      expect(types).toEqual([...NEW_SECTION_TYPES].slice(0, 9));
    });

    it("Section 1 (Executive Briefing) contains headline data and narrative", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[0];
      expect(section.sectionType).toBe("executive_briefing");
      const content = section.content as any;
      expect(content.headline.medianPrice).toBe(8000000);
      expect(content.headline.rating).toBe("A");
      expect(content.narrative).toContain("Naples ultra-luxury");
      expect(content.confidence.level).toBe("high");
    });

    it("Section 2 (Market Insights Index) contains pure data", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[1];
      expect(section.sectionType).toBe("market_insights_index");
      const content = section.content as any;
      expect(content.insightsIndex.liquidity.score).toBe(7);
      expect(content.insightsIndex.timing.score).toBe(6);
    });

    it("Section 3 (Luxury Market Dashboard) contains dashboard tiers", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[2];
      expect(section.sectionType).toBe("luxury_market_dashboard");
      const content = section.content as any;
      expect(content.dashboard.powerFive).toHaveLength(5);
      expect(content.dashboard.tierTwo).toHaveLength(4);
      expect(content.dashboard.tierThree).toHaveLength(3);
    });

    it("Section 4 (Neighborhood Intelligence) contains data and narrative", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[3];
      expect(section.sectionType).toBe("neighborhood_intelligence");
      const content = section.content as any;
      expect(content.neighborhoods).toHaveLength(1);
      expect(content.narrative).toContain("34102");
    });

    it("Section 5 (The Narrative) contains editorial and themes", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[4];
      expect(section.sectionType).toBe("the_narrative");
      const content = section.content as any;
      expect(content.editorial).toContain("tale of two markets");
      expect(content.themes).toHaveLength(2);
      expect(content.marketContext.rating).toBe("A");
    });

    it("Section 6 (Forward Look) contains forecast narrative", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[5];
      expect(section.sectionType).toBe("forward_look");
      const content = section.content as any;
      expect(content.forecast).toContain("median prices expected");
      expect(content.guidance).toBeDefined();
    });

    it("Section 7 (Comparative Positioning) contains peer data", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[6];
      expect(section.sectionType).toBe("comparative_positioning");
      const content = section.content as any;
      expect(content.peerComparisons).toHaveLength(1);
      expect(content.peerRankings).toHaveLength(3);
    });

    it("Section 8 (Strategic Benchmark) contains scorecard and narrative", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[7];
      expect(section.sectionType).toBe("strategic_benchmark");
      const content = section.content as any;
      expect(content.scorecard).toHaveLength(2);
      expect(content.narrative).toContain("A");
    });

    it("Section 9 (Disclaimer) contains disclaimer text and methodology", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const section = result.sections[8];
      expect(section.sectionType).toBe("disclaimer_methodology");
      const content = section.content as any;
      expect(content.disclaimer).toBe(DISCLAIMER_TEXT);
      expect(content.methodology).toContain("30 property records");
      expect(content.confidence.level).toBe("high");
      expect(content.dataSources).toHaveLength(3);
    });

    it("handles missing agent results gracefully", () => {
      const result = assembleReport(makeAnalytics(), {}, defaultDurations);
      expect(result.sections).toHaveLength(9);

      // Narrative-dependent sections should have null narratives
      const exec = result.sections[0].content as any;
      expect(exec.narrative).toBeNull();

      const narrative = result.sections[4].content as any;
      expect(narrative.editorial).toBeNull();

      const forecast = result.sections[5].content as any;
      expect(forecast.forecast).toBeNull();
    });

    it("marks stale data sources in disclaimer", () => {
      const analytics = makeAnalytics({
        confidence: {
          level: "low",
          sampleSize: 5,
          detailCoverage: 0.1,
          staleDataSources: ["realestateapi:search", "realestateapi:detail"],
        },
      });
      const result = assembleReport(analytics, makeAgentResults(), defaultDurations);
      const disclaimer = result.sections[8].content as any;
      expect(disclaimer.dataSources[0].status).toBe("stale"); // search
      expect(disclaimer.dataSources[1].status).toBe("stale"); // detail
    });
  });

  describe("metadata", () => {
    it("computes total duration from all layers", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      // 2000 fetch + 50 compute + 5000 + 4000 + 3000 agents = 14050
      expect(result.metadata.totalDurationMs).toBe(14050);
    });

    it("includes agent durations", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      expect(result.metadata.agentDurations["insight-generator"]).toBe(5000);
      expect(result.metadata.agentDurations["forecast-modeler"]).toBe(4000);
      expect(result.metadata.agentDurations["polish-agent"]).toBe(3000);
    });

    it("includes confidence from analytics", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      expect(result.metadata.confidence.level).toBe("high");
      expect(result.metadata.confidence.sampleSize).toBe(30);
    });

    it("includes section count", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      expect(result.metadata.sectionCount).toBe(9);
    });

    it("includes generatedAt timestamp", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      expect(result.metadata.generatedAt).toBeTruthy();
      // Should be a valid ISO string
      expect(() => new Date(result.metadata.generatedAt)).not.toThrow();
    });
  });

  describe("data sources summary", () => {
    it("marks all sources fresh when no stale data", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);
      const disclaimer = result.sections[8].content as any;
      expect(disclaimer.dataSources[0]).toEqual({
        name: "RealEstateAPI (Property Search)",
        status: "fresh",
      });
    });

    it("marks detail source unavailable when no detail coverage", () => {
      const analytics = makeAnalytics({
        confidence: { level: "medium", sampleSize: 5, detailCoverage: 0, staleDataSources: [] },
      });
      const result = assembleReport(analytics, makeAgentResults(), defaultDurations);
      const disclaimer = result.sections[8].content as any;
      expect(disclaimer.dataSources[1].status).toBe("unavailable");
    });
  });

  describe("DISCLAIMER_TEXT", () => {
    it("is a non-empty string", () => {
      expect(DISCLAIMER_TEXT.length).toBeGreaterThan(100);
    });
  });

  describe("NEW_SECTION_TYPES", () => {
    it("contains exactly 10 section types (including persona_intelligence)", () => {
      expect(NEW_SECTION_TYPES).toHaveLength(10);
      expect(NEW_SECTION_TYPES[9]).toBe("persona_intelligence");
    });
  });

  describe("persona intelligence integration", () => {
    function makePersonaAgentResult(): AgentResult {
      return {
        agentName: "persona-intelligence",
        sections: [
          {
            sectionType: "persona_intelligence",
            title: "Persona Intelligence",
            content: {},
          },
        ],
        metadata: {
          personaIntelligence: {
            personas: [
              {
                personaSlug: "business-mogul",
                personaName: "The Business Mogul",
                selectionOrder: 1,
                talkingPoints: [
                  { headline: "Ultra-luxury volume surged 5%", detail: "YoY growth remains strong...", dataSource: "yoy.volumeChange", relevance: "ROI signal" },
                ],
                narrativeOverlay: {
                  perspective: "This market represents a compelling capital deployment opportunity with strong risk-adjusted returns.",
                  emphasis: ["CAGR", "price per sqft trends", "cash buyer dominance"],
                  deEmphasis: ["lifestyle amenities", "school districts"],
                  toneGuidance: "Direct, data-forward, institutional language",
                },
                metricEmphasis: [
                  { metricName: "Median Price YoY", currentValue: "+8%", interpretation: "Strong alpha vs broader market", priority: "primary" as const },
                ],
                vocabulary: {
                  preferred: ["basis", "alpha", "total return", "cap rate"],
                  avoid: ["cute", "charming", "cozy"],
                },
              },
              {
                personaSlug: "coastal-escape-seeker",
                personaName: "The Coastal Escape Seeker",
                selectionOrder: 2,
                talkingPoints: [
                  { headline: "Waterfront premium holds steady", detail: "Coastal properties maintain premium...", dataSource: "segments", relevance: "Lifestyle signal" },
                ],
                narrativeOverlay: {
                  perspective: "The coast offers a sanctuary of natural beauty and refined living.",
                  emphasis: ["waterfront premiums", "lifestyle quality", "design features"],
                  deEmphasis: ["ROI metrics", "cap rates"],
                  toneGuidance: "Warm, experiential, aspirational",
                },
                metricEmphasis: [
                  { metricName: "Waterfront Premium", currentValue: "25%", interpretation: "Reflects the sanctuary value of coastal living", priority: "primary" as const },
                ],
                vocabulary: {
                  preferred: ["sanctuary", "retreat", "coastal living", "turnkey"],
                  avoid: ["investment vehicle", "basis points"],
                },
              },
            ],
            blended: {
              metricUnion: ["Median Price YoY", "Waterfront Premium", "CAGR"],
              filterIntersection: {
                priceRange: { min: 5000000, max: null },
                propertyTypes: ["SFR"],
                communityTypes: ["Waterfront"],
              },
              blendedTalkingPoints: [
                { headline: "Market strength across buyer profiles", detail: "Both investment and lifestyle buyers find value...", dataSource: "market.rating", relevance: "Cross-persona" },
              ],
              conflicts: [
                { metric: "ROI metrics", emphasizedBy: "business-mogul", deEmphasizedBy: "coastal-escape-seeker", resolution: "included as secondary context" },
              ],
            },
            meta: {
              personaCount: 2,
              primaryPersona: "business-mogul",
              modelUsed: "claude-sonnet-4-6",
              promptTokens: 3500,
              completionTokens: 2800,
            },
          },
        },
        durationMs: 6000,
      };
    }

    function makeAgentResultsWithPersona(): Record<string, AgentResult> {
      return {
        ...makeAgentResults(),
        "persona-intelligence": makePersonaAgentResult(),
      };
    }

    const durationsWithPersona: AssemblyDurations = {
      fetchMs: 2000,
      computeMs: 50,
      agentDurations: {
        "insight-generator": 5000,
        "forecast-modeler": 4000,
        "polish-agent": 3000,
        "persona-intelligence": 6000,
      },
    };

    it("produces 10 sections when persona intelligence is present", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResultsWithPersona(), durationsWithPersona);
      expect(result.sections).toHaveLength(10);
    });

    it("Section 10 has sectionType persona_intelligence", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResultsWithPersona(), durationsWithPersona);
      const section10 = result.sections[9];
      expect(section10.sectionNumber).toBe(10);
      expect(section10.sectionType).toBe("persona_intelligence");
      expect(section10.title).toBe("Persona Intelligence Briefing");
    });

    it("Section 10 content has hybrid strategy, personas, blended, and meta", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResultsWithPersona(), durationsWithPersona);
      const content = result.sections[9].content as any;
      expect(content.strategy).toBe("hybrid");
      expect(content.personas).toHaveLength(2);
      expect(content.personas[0].personaSlug).toBe("business-mogul");
      expect(content.personas[1].personaSlug).toBe("coastal-escape-seeker");
      expect(content.blended).toBeDefined();
      expect(content.blended.metricUnion).toHaveLength(3);
      expect(content.meta.personaCount).toBe(2);
      expect(content.meta.primaryPersona).toBe("business-mogul");
    });

    it("narrative sections (1, 5, 6, 8) receive personaFraming from primary persona", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResultsWithPersona(), durationsWithPersona);

      const framingSections = [0, 4, 5, 7]; // indices for sections 1, 5, 6, 8
      for (const idx of framingSections) {
        const content = result.sections[idx].content as any;
        expect(content.personaFraming).toBeDefined();
        expect(content.personaFraming.personaName).toBe("The Business Mogul");
        expect(content.personaFraming.perspective).toContain("capital deployment");
        expect(content.personaFraming.emphasis).toContain("CAGR");
        expect(content.personaFraming.toneGuidance).toContain("data-forward");
      }
    });

    it("personaFraming is null when no persona agent result", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResults(), defaultDurations);

      const framingSections = [0, 4, 5, 7]; // indices for sections 1, 5, 6, 8
      for (const idx of framingSections) {
        const content = result.sections[idx].content as any;
        expect(content.personaFraming).toBeNull();
      }
    });

    it("produces 9 sections when persona agent was skipped", () => {
      const agentResults = {
        ...makeAgentResults(),
        "persona-intelligence": {
          agentName: "persona-intelligence",
          sections: [],
          metadata: { skipped: true, reason: "no_personas_selected" },
          durationMs: 5,
        },
      };
      const result = assembleReport(makeAnalytics(), agentResults, defaultDurations);
      expect(result.sections).toHaveLength(9);
    });

    it("metadata includes persona agent duration in totalDurationMs", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResultsWithPersona(), durationsWithPersona);
      // 2000 fetch + 50 compute + 5000 + 4000 + 3000 + 6000 agents = 20050
      expect(result.metadata.totalDurationMs).toBe(20050);
      expect(result.metadata.agentDurations["persona-intelligence"]).toBe(6000);
    });

    it("sectionCount reflects actual count with persona section", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResultsWithPersona(), durationsWithPersona);
      expect(result.metadata.sectionCount).toBe(10);
    });

    it("all 10 section types match NEW_SECTION_TYPES when persona present", () => {
      const result = assembleReport(makeAnalytics(), makeAgentResultsWithPersona(), durationsWithPersona);
      const types = result.sections.map((s) => s.sectionType);
      expect(types).toEqual([...NEW_SECTION_TYPES]);
    });
  });
});
