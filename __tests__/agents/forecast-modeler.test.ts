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

jest.mock("@/lib/config/env", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key",
  },
}));

describe("Forecast Modeler Agent", () => {
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
      ...overrides,
    };
  }

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
        name: "Naples",
        geography: {
          city: "Naples",
          state: "Florida",
          county: "Collier County",
        },
        luxuryTier: "ultra_luxury",
        priceFloor: 5000000,
        priceCeiling: null,
      },
      reportConfig: {
        sections: ["forecasts", "strategic_summary"],
      },
      upstreamResults: {
        "data-analyst": dataAnalystResult,
      },
      abortSignal: new AbortController().signal,
      ...overrides,
    };
  }

  const mockClaudeResponse = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          projections: [
            {
              segment: "single_family",
              sixMonth: {
                medianPrice: 9900000,
                priceRange: { low: 9200000, high: 10500000 },
                confidence: "high",
              },
              twelveMonth: {
                medianPrice: 10300000,
                priceRange: { low: 9000000, high: 11500000 },
                confidence: "medium",
              },
            },
            {
              segment: "condo",
              sixMonth: {
                medianPrice: 6400000,
                priceRange: { low: 6000000, high: 6900000 },
                confidence: "medium",
              },
              twelveMonth: {
                medianPrice: 6600000,
                priceRange: { low: 5700000, high: 7500000 },
                confidence: "medium",
              },
            },
          ],
          scenarios: {
            base: {
              narrative:
                "Continued moderate appreciation driven by supply constraints and sustained demand.",
              assumptions: [
                "Interest rates remain stable",
                "No major economic disruption",
              ],
              medianPriceChange: 0.06,
              volumeChange: 0.05,
            },
            bull: {
              narrative:
                "Accelerated growth driven by increased migration and limited inventory.",
              assumptions: [
                "Tax migration accelerates",
                "Inventory tightens further",
              ],
              medianPriceChange: 0.12,
              volumeChange: 0.15,
            },
            bear: {
              narrative:
                "Moderation due to affordability ceiling and potential rate increases.",
              assumptions: [
                "Rate hikes resume",
                "International buyer pullback",
              ],
              medianPriceChange: -0.02,
              volumeChange: -0.08,
            },
          },
          timing: {
            buyers:
              "Condos present the best near-term entry opportunity with moderate growth projections.",
            sellers:
              "Single-family sellers benefit from continued appreciation — optimal window is next 6 months.",
          },
          outlook: {
            narrative:
              "The Naples ultra-luxury market outlook remains positive with moderate-to-strong growth expected across segments.",
            monitoringAreas: [
              "Interest rate decisions in Q3",
              "Inventory levels for waterfront properties",
              "International buyer sentiment shifts",
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
    mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
    Anthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }));
  });

  describe("Agent definition", () => {
    it("has correct name and dependencies", async () => {
      const { forecastModelerAgent } = await import(
        "@/lib/agents/forecast-modeler"
      );

      expect(forecastModelerAgent.name).toBe("forecast-modeler");
      expect(forecastModelerAgent.dependencies).toEqual([]);
      expect(typeof forecastModelerAgent.execute).toBe("function");
      expect(forecastModelerAgent.description).toBeTruthy();
    });
  });

  describe("executeForecastModeler", () => {
    it("returns AgentResult with correct structure", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeForecastModeler(context);

      expect(result.agentName).toBe("forecast-modeler");
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections.length).toBeGreaterThanOrEqual(2);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("produces forecasts section with projections and scenarios", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeForecastModeler(context);

      const forecasts = result.sections.find(
        (s) => s.sectionType === "forecasts"
      );
      expect(forecasts).toBeDefined();
      expect(forecasts!.content).toHaveProperty("projections");
      expect(forecasts!.content).toHaveProperty("scenarios");

      const content = forecasts!.content as {
        projections: unknown[];
        scenarios: { base: unknown; bull: unknown; bear: unknown };
      };
      expect(content.projections.length).toBeGreaterThanOrEqual(1);
      expect(content.scenarios.base).toBeDefined();
      expect(content.scenarios.bull).toBeDefined();
      expect(content.scenarios.bear).toBeDefined();
    });

    it("produces strategic_summary section with timing and outlook", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeForecastModeler(context);

      const summary = result.sections.find(
        (s) => s.sectionType === "strategic_summary"
      );
      expect(summary).toBeDefined();
      expect(summary!.content).toHaveProperty("timing");
      expect(summary!.content).toHaveProperty("outlook");

      const content = summary!.content as {
        timing: { buyers: string; sellers: string };
        outlook: { narrative: string; monitoringAreas: string[] };
      };
      expect(content.timing.buyers).toBeTruthy();
      expect(content.timing.sellers).toBeTruthy();
      expect(content.outlook.narrative).toBeTruthy();
      expect(content.outlook.monitoringAreas.length).toBeGreaterThanOrEqual(1);
    });

    it("each projection has sixMonth and twelveMonth with confidence", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeForecastModeler(context);

      const forecasts = result.sections.find(
        (s) => s.sectionType === "forecasts"
      );
      const content = forecasts!.content as {
        projections: Array<{
          segment: string;
          sixMonth: { medianPrice: number; confidence: string };
          twelveMonth: { medianPrice: number; confidence: string };
        }>;
      };

      for (const proj of content.projections) {
        expect(proj.segment).toBeTruthy();
        expect(proj.sixMonth.medianPrice).toBeGreaterThan(0);
        expect(["high", "medium", "low"]).toContain(proj.sixMonth.confidence);
        expect(proj.twelveMonth.medianPrice).toBeGreaterThan(0);
        expect(["high", "medium", "low"]).toContain(
          proj.twelveMonth.confidence
        );
      }
    });

    it("each scenario has narrative, assumptions, and projected changes", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeForecastModeler(context);

      const forecasts = result.sections.find(
        (s) => s.sectionType === "forecasts"
      );
      const content = forecasts!.content as {
        scenarios: Record<
          string,
          {
            narrative: string;
            assumptions: string[];
            medianPriceChange: number;
            volumeChange: number;
          }
        >;
      };

      for (const key of ["base", "bull", "bear"]) {
        const scenario = content.scenarios[key];
        expect(scenario.narrative).toBeTruthy();
        expect(scenario.assumptions.length).toBeGreaterThanOrEqual(1);
        expect(typeof scenario.medianPriceChange).toBe("number");
        expect(typeof scenario.volumeChange).toBe("number");
      }
    });

    it("stores forecast data in metadata", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeForecastModeler(context);

      expect(result.metadata).toHaveProperty("forecast");
    });
  });

  describe("Claude API integration", () => {
    it("includes market data and YoY metrics in prompt", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      await executeForecastModeler(context);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const call = mockCreate.mock.calls[0][0];
      const userMsg = call.messages[0].content;

      expect(userMsg).toContain("Naples");
      expect(userMsg).toContain("8.0%"); // YoY median price change
      expect(userMsg).toContain("single_family");
      expect(userMsg).toContain("condo");
    });
  });

  describe("Insufficient data handling", () => {
    it("flags low confidence when data analyst has low confidence", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );

      const lowConfidenceAnalysis = buildDataAnalystOutput({
        confidence: {
          level: "low",
          staleDataSources: ["realestateapi"],
          sampleSize: 3,
        },
        yoy: {
          medianPriceChange: null,
          volumeChange: null,
          pricePerSqftChange: null,
          averagePriceChange: null,
          totalVolumeChange: null,
          domChange: null,
          listToSaleChange: null,
        },
      });

      // Mock response for low confidence
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              projections: [],
              scenarios: {
                base: {
                  narrative: "Insufficient historical data for reliable projections.",
                  assumptions: ["Limited data availability"],
                  medianPriceChange: 0,
                  volumeChange: 0,
                },
                bull: {
                  narrative: "Insufficient data.",
                  assumptions: ["Limited data availability"],
                  medianPriceChange: 0.05,
                  volumeChange: 0.05,
                },
                bear: {
                  narrative: "Insufficient data.",
                  assumptions: ["Limited data availability"],
                  medianPriceChange: -0.05,
                  volumeChange: -0.05,
                },
              },
              timing: {
                buyers: "Insufficient data for specific timing guidance.",
                sellers: "Insufficient data for specific timing guidance.",
              },
              outlook: {
                narrative: "Data limitations prevent reliable forward outlook.",
                monitoringAreas: ["Await additional transaction data"],
              },
            }),
          },
        ],
      });

      const context = buildContext(lowConfidenceAnalysis);

      const result = await executeForecastModeler(context);

      expect(result.metadata).toHaveProperty("lowConfidence", true);
    });
  });

  describe("Abort signal handling", () => {
    it("throws when abort signal is triggered before execution", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );

      const controller = new AbortController();
      controller.abort();

      const context = buildContext(buildDataAnalystOutput(), {
        abortSignal: controller.signal,
      });

      await expect(executeForecastModeler(context)).rejects.toThrow(
        /abort/i
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("wraps Claude API 429 errors as retriable", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );

      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("Rate limit"), { status: 429 })
      );

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeForecastModeler(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        expect((err as Error & { retriable?: boolean }).retriable).toBe(true);
      }
    });

    it("handles malformed Claude JSON response", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "invalid json {" }],
      });

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeForecastModeler(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.message).toContain("parse");
        expect(error.retriable).toBe(true);
      }
    });
  });

  describe("Pipeline conformance", () => {
    it("throws if neither computedAnalytics nor data-analyst results are available", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );

      const context = buildContext(buildDataAnalystOutput());
      context.upstreamResults = {};
      context.computedAnalytics = undefined;

      await expect(executeForecastModeler(context)).rejects.toThrow(
        /data-analyst/i
      );
    });

    it("sections are typed SectionOutput entries", async () => {
      const { executeForecastModeler } = await import(
        "@/lib/agents/forecast-modeler"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeForecastModeler(context);

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
