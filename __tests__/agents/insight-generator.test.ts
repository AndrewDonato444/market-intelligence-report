import type {
  AgentContext,
  AgentResult,
} from "@/lib/agents/orchestrator";
import type { DataAnalystOutput } from "@/lib/agents/data-analyst";

// Mock the Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

// Mock env to provide ANTHROPIC_API_KEY
jest.mock("@/lib/config/env", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key",
  },
}));

describe("Insight Generator Agent", () => {
  // Helper to build a realistic data analyst output
  function buildDataAnalystOutput(
    overrides: Partial<DataAnalystOutput> = {}
  ): DataAnalystOutput {
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
        {
          name: "condo",
          propertyType: "condo",
          count: 15,
          medianPrice: 6200000,
          averagePrice: 7800000,
          minPrice: 5000000,
          maxPrice: 18500000,
          medianPricePerSqft: 1850,
          rating: "B+",
          lowSample: false,
        },
        {
          name: "estate",
          propertyType: "estate",
          count: 5,
          medianPrice: 22000000,
          averagePrice: 25600000,
          minPrice: 15000000,
          maxPrice: 42000000,
          medianPricePerSqft: 3100,
          rating: "A+",
          lowSample: false,
        },
      ],
      yoy: {
        medianPriceChange: 0.08,
        volumeChange: 0.12,
        pricePerSqftChange: 0.06,
      },
      confidence: {
        level: "high",
        staleDataSources: [],
        sampleSize: 45,
      },
      ...overrides,
    };
  }

  // Helper to build agent context with data analyst upstream
  function buildContext(
    analysis: DataAnalystOutput,
    overrides: Partial<AgentContext> = {}
  ): AgentContext {
    const dataAnalystResult: AgentResult = {
      agentName: "data-analyst",
      sections: [],
      metadata: { analysis },
      durationMs: 500,
    };

    return {
      reportId: "report-001",
      userId: "user-001",
      market: {
        name: "Palm Beach",
        geography: {
          city: "Palm Beach",
          state: "Florida",
          county: "Palm Beach County",
        },
        luxuryTier: "ultra_luxury",
        priceFloor: 5000000,
        priceCeiling: null,
        segments: ["waterfront", "golf course"],
        propertyTypes: ["single_family", "condo", "estate"],
      },
      reportConfig: {
        sections: [
          "market_overview",
          "executive_summary",
          "key_drivers",
        ],
      },
      upstreamResults: {
        "data-analyst": dataAnalystResult,
      },
      abortSignal: new AbortController().signal,
      ...overrides,
    };
  }

  // Set up default mock response before each test
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require("@anthropic-ai/sdk").default;
    mockCreate = jest.fn().mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            overview: {
              narrative:
                "The Palm Beach ultra-luxury market demonstrates exceptional resilience with median prices reaching $8.75M.",
              highlights: [
                "Median price up 8% year-over-year to $8.75M",
                "Transaction volume increased 12% with 45 properties",
                "Estate segment commands $3,100/sqft premium",
              ],
              recommendations: [
                "Buyers should act on waterfront inventory before summer season",
                "Sellers in the estate segment can expect premium positioning",
              ],
            },
            themes: [
              {
                name: "Ultra-Luxury Resilience",
                impact: "high",
                trend: "up",
                narrative:
                  "Despite broader market headwinds, the ultra-luxury segment shows sustained demand with 8% price appreciation.",
              },
              {
                name: "Estate Segment Dominance",
                impact: "high",
                trend: "up",
                narrative:
                  "Estates outperform all segments with $22M median and A+ rating, driven by scarcity.",
              },
              {
                name: "Condo Market Stabilization",
                impact: "medium",
                trend: "neutral",
                narrative:
                  "The condo segment shows B+ performance with moderate growth, suggesting stabilization after recent volatility.",
              },
            ],
            executiveSummary: {
              narrative:
                "Palm Beach's ultra-luxury market delivered strong performance in the current period.",
              highlights: [
                "Overall market rated A with 8% median price growth",
                "Volume up 12% indicating sustained buyer demand",
                "Price per square foot grew 6% to $2,150",
              ],
              timing: {
                buyers:
                  "Favorable entry point for condos; estate inventory is limited",
                sellers:
                  "Strong seller's market, especially in single-family and estate segments",
              },
            },
          }),
        },
      ],
    });
    Anthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
  });

  describe("Agent definition", () => {
    it("has correct name and dependencies", async () => {
      const { insightGeneratorAgent } = await import(
        "@/lib/agents/insight-generator"
      );

      expect(insightGeneratorAgent.name).toBe("insight-generator");
      expect(insightGeneratorAgent.dependencies).toEqual(["data-analyst"]);
      expect(typeof insightGeneratorAgent.execute).toBe("function");
      expect(insightGeneratorAgent.description).toBeTruthy();
    });
  });

  describe("executeInsightGenerator", () => {
    it("returns AgentResult with correct structure", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const analysis = buildDataAnalystOutput();
      const context = buildContext(analysis);

      const result = await executeInsightGenerator(context);

      expect(result.agentName).toBe("insight-generator");
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections.length).toBeGreaterThanOrEqual(3);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata).toBeDefined();
    });

    it("produces market_overview section with narrative", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeInsightGenerator(context);

      const overview = result.sections.find(
        (s) => s.sectionType === "market_overview"
      );
      expect(overview).toBeDefined();
      expect(overview!.title).toBeTruthy();
      expect(overview!.content).toHaveProperty("narrative");
      expect(overview!.content).toHaveProperty("highlights");
      expect(overview!.content).toHaveProperty("recommendations");
    });

    it("produces key_drivers section with themes", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeInsightGenerator(context);

      const drivers = result.sections.find(
        (s) => s.sectionType === "key_drivers"
      );
      expect(drivers).toBeDefined();
      expect(drivers!.title).toBeTruthy();

      const content = drivers!.content as { themes: unknown[] };
      expect(content.themes).toBeInstanceOf(Array);
      expect(content.themes.length).toBeGreaterThanOrEqual(1);
    });

    it("produces executive_summary section", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeInsightGenerator(context);

      const summary = result.sections.find(
        (s) => s.sectionType === "executive_summary"
      );
      expect(summary).toBeDefined();
      expect(summary!.content).toHaveProperty("narrative");
      expect(summary!.content).toHaveProperty("highlights");
      expect(summary!.content).toHaveProperty("timing");
    });

    it("stores insights in metadata", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeInsightGenerator(context);

      expect(result.metadata).toHaveProperty("insights");
      const insights = result.metadata.insights as Record<string, unknown>;
      expect(insights).toHaveProperty("overview");
      expect(insights).toHaveProperty("themes");
      expect(insights).toHaveProperty("executiveSummary");
    });

    it("each theme has name, impact, trend, narrative", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeInsightGenerator(context);

      const drivers = result.sections.find(
        (s) => s.sectionType === "key_drivers"
      );
      const content = drivers!.content as {
        themes: Array<{
          name: string;
          impact: string;
          trend: string;
          narrative: string;
        }>;
      };

      for (const theme of content.themes) {
        expect(theme.name).toBeTruthy();
        expect(["high", "medium", "low"]).toContain(theme.impact);
        expect(["up", "down", "neutral"]).toContain(theme.trend);
        expect(theme.narrative).toBeTruthy();
      }
    });
  });

  describe("Claude API integration", () => {
    it("calls Claude with market context in the prompt", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      await executeInsightGenerator(context);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const call = mockCreate.mock.calls[0][0];

      // System prompt should establish luxury analyst persona
      expect(call.system).toContain("luxury");

      // User message should include market data
      const userMsg = call.messages[0].content;
      expect(userMsg).toContain("Palm Beach");
      expect(userMsg).toContain("Florida");
      expect(userMsg).toContain("Ultra Luxury");
    });

    it("includes segment data in prompt", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      await executeInsightGenerator(context);

      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      expect(userMsg).toContain("single_family");
      expect(userMsg).toContain("$8.8M"); // median price formatted
    });

    it("includes YoY metrics in prompt", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      await executeInsightGenerator(context);

      const userMsg = mockCreate.mock.calls[0][0].messages[0].content;
      // YoY data should be present
      expect(userMsg).toContain("8.0%"); // medianPriceChange formatted
    });
  });

  describe("Insufficient data handling", () => {
    it("produces caveated narratives when data is insufficient", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );

      const insufficientAnalysis = buildDataAnalystOutput({
        market: {
          totalProperties: 0,
          medianPrice: 0,
          averagePrice: 0,
          medianPricePerSqft: null,
          totalVolume: 0,
          rating: "C",
        },
        segments: [],
        yoy: {
          medianPriceChange: null,
          volumeChange: null,
          pricePerSqftChange: null,
        },
        confidence: {
          level: "low",
          staleDataSources: ["realestateapi"],
          sampleSize: 0,
        },
      });

      // Mock a response that reflects insufficient data
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              overview: {
                narrative:
                  "Insufficient data to provide comprehensive market analysis for Palm Beach.",
                highlights: [
                  "Limited transaction data available for this period",
                ],
                recommendations: [
                  "Consider expanding the date range or adjusting market parameters",
                ],
              },
              themes: [],
              executiveSummary: {
                narrative:
                  "Data limitations prevent a full executive summary at this time.",
                highlights: [
                  "Insufficient transaction data for statistical analysis",
                ],
                timing: {
                  buyers: "Consult local sources for current market conditions",
                  sellers:
                    "Consult local sources for current market conditions",
                },
              },
            }),
          },
        ],
      });

      const context = buildContext(insufficientAnalysis);
      // Flag insufficient data in upstream metadata
      context.upstreamResults["data-analyst"].metadata.insufficientData = true;

      const result = await executeInsightGenerator(context);

      expect(result.metadata).toHaveProperty("lowConfidence", true);
      expect(result.sections.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Abort signal handling", () => {
    it("throws when abort signal is triggered before API call", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );

      const controller = new AbortController();
      controller.abort();

      const context = buildContext(buildDataAnalystOutput(), {
        abortSignal: controller.signal,
      });

      await expect(executeInsightGenerator(context)).rejects.toThrow(
        /abort/i
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("wraps Claude API errors with retriable flag for rate limits", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );

      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("Rate limit exceeded"), {
          status: 429,
        })
      );

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeInsightGenerator(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.retriable).toBe(true);
      }
    });

    it("wraps Claude API errors as non-retriable for bad requests", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );

      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("Invalid request"), {
          status: 400,
        })
      );

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeInsightGenerator(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.retriable).toBe(false);
      }
    });

    it("handles malformed Claude JSON response gracefully", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "not valid json {{{" }],
      });

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeInsightGenerator(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.message).toContain("parse");
        expect(error.retriable).toBe(true);
      }
    });
  });

  describe("Pipeline conformance", () => {
    it("reads data analyst output from upstreamResults", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const analysis = buildDataAnalystOutput();
      const context = buildContext(analysis);

      const result = await executeInsightGenerator(context);

      // Should succeed — reads from upstreamResults["data-analyst"]
      expect(result.agentName).toBe("insight-generator");
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it("throws if data-analyst results are missing", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );

      const context = buildContext(buildDataAnalystOutput());
      context.upstreamResults = {}; // No upstream data

      await expect(executeInsightGenerator(context)).rejects.toThrow(
        /data-analyst/i
      );
    });

    it("sections are typed SectionOutput entries", async () => {
      const { executeInsightGenerator } = await import(
        "@/lib/agents/insight-generator"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeInsightGenerator(context);

      for (const section of result.sections) {
        expect(section).toHaveProperty("sectionType");
        expect(section).toHaveProperty("title");
        expect(section).toHaveProperty("content");
        expect(typeof section.sectionType).toBe("string");
        expect(typeof section.title).toBe("string");
      }
    });
  });
});
