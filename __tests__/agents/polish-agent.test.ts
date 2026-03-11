import type {
  AgentContext,
  AgentResult,
} from "@/lib/agents/orchestrator";
import type { DataAnalystOutput } from "@/lib/agents/data-analyst";

// Mock Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  })),
}));

jest.mock("@/lib/config/env", () => ({
  env: { ANTHROPIC_API_KEY: "test-key" },
}));

describe("Polish Agent", () => {
  function buildDataAnalystOutput(): DataAnalystOutput {
    return {
      market: {
        totalProperties: 45,
        medianPrice: 8750000,
        averagePrice: 12400000,
        medianPricePerSqft: 2150,
        totalVolume: 558000000,
        rating: "A",
      },
      segments: [
        {
          name: "single_family",
          propertyType: "single_family",
          count: 25,
          medianPrice: 9500000,
          averagePrice: 13200000,
          minPrice: 5100000,
          maxPrice: 42000000,
          medianPricePerSqft: 2300,
          rating: "A",
          lowSample: false,
        },
      ],
      yoy: {
        medianPriceChange: 0.08,
        volumeChange: 0.12,
        pricePerSqftChange: 0.06,
        averagePriceChange: null,
        totalVolumeChange: null,
        domChange: null,
        listToSaleChange: null,
      },
      confidence: {
        level: "high",
        staleDataSources: [],
        sampleSize: 45,
      },
    };
  }

  function buildFullContext(
    overrides: Partial<AgentContext> = {}
  ): AgentContext {
    const dataAnalystResult: AgentResult = {
      agentName: "data-analyst",
      sections: [],
      metadata: { analysis: buildDataAnalystOutput() },
      durationMs: 500,
    };

    const insightResult: AgentResult = {
      agentName: "insight-generator",
      sections: [
        {
          sectionType: "market_overview",
          title: "Market Overview",
          content: {
            narrative: "The market shows strong performance.",
            highlights: ["8% growth"],
            recommendations: ["Buy waterfront"],
          },
        },
        {
          sectionType: "key_drivers",
          title: "Key Drivers",
          content: {
            themes: [
              {
                name: "Ultra-Luxury Resilience",
                impact: "high",
                trend: "up",
                narrative: "Strong demand persists.",
              },
            ],
          },
        },
        {
          sectionType: "executive_summary",
          title: "Executive Summary",
          content: {
            narrative: "Naples luxury market delivered strong results.",
            highlights: ["A rating overall"],
            timing: { buyers: "Act now", sellers: "Strong market" },
          },
        },
      ],
      metadata: {
        insights: {
          overview: { narrative: "Strong performance." },
          themes: [{ name: "Resilience" }],
          executiveSummary: { narrative: "Strong results." },
        },
      },
      durationMs: 1000,
    };

    const competitiveResult: AgentResult = {
      agentName: "competitive-analyst",
      sections: [
        {
          sectionType: "competitive_market_analysis",
          title: "Competitive Analysis",
          content: {
            positioning: { narrative: "Naples outperforms peers." },
            peerComparisons: [],
            rankings: [],
          },
        },
      ],
      metadata: { competitiveAnalysis: {}, peersFetched: 2 },
      durationMs: 800,
    };

    const forecastResult: AgentResult = {
      agentName: "forecast-modeler",
      sections: [
        {
          sectionType: "forecasts",
          title: "Forecasts",
          content: {
            projections: [],
            scenarios: {
              base: { narrative: "Continued growth." },
            },
          },
        },
        {
          sectionType: "strategic_summary",
          title: "Strategic Summary",
          content: {
            timing: { buyers: "Good entry point", sellers: "Strong position" },
            outlook: { narrative: "Positive outlook.", monitoringAreas: [] },
          },
        },
      ],
      metadata: { forecast: {}, lowConfidence: false },
      durationMs: 900,
    };

    return {
      reportId: "report-001",
      userId: "user-001",
      market: {
        name: "Naples",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "ultra_luxury",
        priceFloor: 5000000,
      },
      reportConfig: {},
      upstreamResults: {
        "data-analyst": dataAnalystResult,
        "insight-generator": insightResult,
        "competitive-analyst": competitiveResult,
        "forecast-modeler": forecastResult,
      },
      abortSignal: new AbortController().signal,
      ...overrides,
    };
  }

  const mockPolishResponse = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          polishedSections: [
            {
              sectionType: "market_overview",
              revisedNarrative:
                "The Naples ultra-luxury market demonstrates remarkable resilience with 8% year-over-year appreciation.",
            },
            {
              sectionType: "executive_summary",
              revisedNarrative:
                "Naples delivered A-rated performance across its luxury segments this period.",
            },
          ],
          pullQuotes: [
            {
              text: "8% year-over-year appreciation in the ultra-luxury segment",
              source: "market_overview",
            },
            {
              text: "A-rated performance across all luxury segments",
              source: "executive_summary",
            },
            {
              text: "Naples outperforms peer markets on price momentum",
              source: "competitive_market_analysis",
            },
          ],
          methodology: {
            narrative:
              "This analysis draws on property transaction data sourced via RealEstateAPI covering luxury properties in the Naples, Florida market.",
            sources: ["RealEstateAPI property data", "Claude AI analysis"],
            confidenceLevels: {
              dataConfidence: "high",
              sampleSize: 45,
              staleDataSources: [],
            },
          },
          consistency: {
            contradictions: [],
            notes: [
              "All sections align on positive market trajectory",
              "Timing recommendations are consistent across forecast and executive summary",
            ],
          },
        }),
      },
    ],
  };

  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require("@anthropic-ai/sdk").default;
    mockCreate = jest.fn().mockResolvedValue(mockPolishResponse);
    Anthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
  });

  describe("Agent definition", () => {
    it("has correct name and dependencies", async () => {
      const { polishAgent } = await import("@/lib/agents/polish-agent");

      expect(polishAgent.name).toBe("polish-agent");
      expect(polishAgent.dependencies).toEqual(["insight-generator"]);
      expect(typeof polishAgent.execute).toBe("function");
      expect(polishAgent.description).toBeTruthy();
    });
  });

  describe("executePolishAgent", () => {
    it("returns AgentResult with correct structure", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );
      const context = buildFullContext();

      const result = await executePolishAgent(context);

      expect(result.agentName).toBe("polish-agent");
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("produces polished_report section", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );
      const context = buildFullContext();

      const result = await executePolishAgent(context);

      const polished = result.sections.find(
        (s) => s.sectionType === "polished_report"
      );
      expect(polished).toBeDefined();
      expect(polished!.content).toHaveProperty("polishedSections");
      expect(polished!.content).toHaveProperty("pullQuotes");
      expect(polished!.content).toHaveProperty("consistency");
    });

    it("produces methodology section", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );
      const context = buildFullContext();

      const result = await executePolishAgent(context);

      const methodology = result.sections.find(
        (s) => s.sectionType === "methodology"
      );
      expect(methodology).toBeDefined();
      expect(methodology!.content).toHaveProperty("narrative");
      expect(methodology!.content).toHaveProperty("sources");
      expect(methodology!.content).toHaveProperty("confidenceLevels");
    });

    it("generates pull quotes with source attribution", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );
      const context = buildFullContext();

      const result = await executePolishAgent(context);

      const polished = result.sections.find(
        (s) => s.sectionType === "polished_report"
      );
      const content = polished!.content as {
        pullQuotes: Array<{ text: string; source: string }>;
      };

      expect(content.pullQuotes.length).toBeGreaterThanOrEqual(1);
      for (const quote of content.pullQuotes) {
        expect(quote.text).toBeTruthy();
        expect(quote.source).toBeTruthy();
      }
    });

    it("stores polish output in metadata", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );
      const context = buildFullContext();

      const result = await executePolishAgent(context);

      expect(result.metadata).toHaveProperty("polishOutput");
    });
  });

  describe("Partial upstream data", () => {
    it("works with only insight-generator (no competitive/forecast)", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );

      const context = buildFullContext();
      // Remove optional upstream agents
      delete context.upstreamResults["competitive-analyst"];
      delete context.upstreamResults["forecast-modeler"];

      const result = await executePolishAgent(context);

      expect(result.agentName).toBe("polish-agent");
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
      expect(result.metadata).toHaveProperty("missingSections");
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Abort signal handling", () => {
    it("throws when abort signal is triggered", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );

      const controller = new AbortController();
      controller.abort();

      const context = buildFullContext({ abortSignal: controller.signal });

      await expect(executePolishAgent(context)).rejects.toThrow(/abort/i);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("wraps Claude API 429 errors as retriable", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );

      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("Rate limit"), { status: 429 })
      );

      const context = buildFullContext();

      try {
        await executePolishAgent(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        expect((err as Error & { retriable?: boolean }).retriable).toBe(true);
      }
    });

    it("handles malformed Claude JSON response", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "not json {" }],
      });

      const context = buildFullContext();

      try {
        await executePolishAgent(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.message).toContain("parse");
        expect(error.retriable).toBe(true);
      }
    });
  });

  describe("Pipeline conformance", () => {
    it("throws if required upstream results are missing", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );

      const context = buildFullContext();
      context.upstreamResults = {};

      await expect(executePolishAgent(context)).rejects.toThrow(
        /insight-generator/i
      );
    });

    it("sections are typed SectionOutput entries", async () => {
      const { executePolishAgent } = await import(
        "@/lib/agents/polish-agent"
      );
      const context = buildFullContext();

      const result = await executePolishAgent(context);

      for (const section of result.sections) {
        expect(section).toHaveProperty("sectionType");
        expect(section).toHaveProperty("title");
        expect(section).toHaveProperty("content");
      }
    });
  });
});
