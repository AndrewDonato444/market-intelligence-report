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

// Mock env
jest.mock("@/lib/config/env", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key",
  },
}));

// Mock RealEstateAPI connector
jest.mock("@/lib/connectors/realestateapi", () => ({
  searchProperties: jest.fn(),
  buildSearchParamsFromMarket: jest.fn().mockReturnValue({
    city: "Miami Beach",
    state: "Florida",
    priceMin: 5000000,
  }),
}));

describe("Competitive Analyst Agent", () => {
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
        segments: ["waterfront"],
        propertyTypes: ["single_family", "condo"],
        peerMarkets: [
          { name: "Palm Beach", geography: { city: "Palm Beach", state: "Florida" } },
          { name: "Aspen", geography: { city: "Aspen", state: "Colorado" } },
        ],
      },
      reportConfig: {
        sections: ["competitive_market_analysis"],
      },
      upstreamResults: {
        "data-analyst": dataAnalystResult,
      },
      abortSignal: new AbortController().signal,
      ...overrides,
    };
  }

  // Mock Claude response
  const mockClaudeResponse = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          positioning: {
            narrative:
              "Naples positions favorably against its peer luxury markets with strong price appreciation.",
            strengths: [
              "Higher YoY price growth than Palm Beach",
              "Lower price per sqft entry point than Aspen",
            ],
            weaknesses: [
              "Smaller total transaction volume than Palm Beach",
              "Less diverse property mix than Aspen",
            ],
            opportunities: [
              "Waterfront inventory remains undervalued relative to peers",
            ],
          },
          peerComparisons: [
            {
              peerName: "Palm Beach",
              medianPrice: 9200000,
              medianPricePerSqft: 2400,
              totalProperties: 60,
              rating: "A+",
              relativePerformance:
                "Palm Beach outperforms on volume but trails on price growth momentum.",
            },
            {
              peerName: "Aspen",
              medianPrice: 12500000,
              medianPricePerSqft: 3200,
              totalProperties: 20,
              rating: "A",
              relativePerformance:
                "Aspen commands higher price points but with lower transaction volume.",
            },
          ],
          rankings: [
            {
              metric: "Median Price",
              targetRank: 3,
              totalMarkets: 3,
              narrative: "Naples ranks third in median price among peer markets.",
            },
            {
              metric: "YoY Price Growth",
              targetRank: 1,
              totalMarkets: 3,
              narrative:
                "Naples leads peers in year-over-year price appreciation.",
            },
          ],
        }),
      },
    ],
  };

  let mockCreate: jest.Mock;
  let mockSearchProperties: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Anthropic = require("@anthropic-ai/sdk").default;
    mockCreate = jest.fn().mockResolvedValue(mockClaudeResponse);
    Anthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { searchProperties } = require("@/lib/connectors/realestateapi");
    mockSearchProperties = searchProperties as jest.Mock;

    // Default: return some properties for each peer
    mockSearchProperties.mockResolvedValue({
      properties: [
        {
          id: "p1",
          address: "123 Ocean Dr",
          price: 9200000,
          lastSalePrice: 8800000,
          lastSaleDate: "2026-01-15",
          sqft: 4000,
          propertyType: "single_family",
        },
        {
          id: "p2",
          address: "456 Palm Ave",
          price: 11000000,
          lastSalePrice: 10500000,
          lastSaleDate: "2025-06-20",
          sqft: 5500,
          propertyType: "single_family",
        },
      ],
      stale: false,
    });
  });

  describe("Agent definition", () => {
    it("has correct name and dependencies", async () => {
      const { competitiveAnalystAgent } = await import(
        "@/lib/agents/competitive-analyst"
      );

      expect(competitiveAnalystAgent.name).toBe("competitive-analyst");
      expect(competitiveAnalystAgent.dependencies).toEqual(["data-analyst"]);
      expect(typeof competitiveAnalystAgent.execute).toBe("function");
      expect(competitiveAnalystAgent.description).toBeTruthy();
    });
  });

  describe("executeCompetitiveAnalyst", () => {
    it("returns AgentResult with correct structure", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeCompetitiveAnalyst(context);

      expect(result.agentName).toBe("competitive-analyst");
      expect(result.sections).toBeInstanceOf(Array);
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata).toBeDefined();
    });

    it("produces competitive_market_analysis section", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeCompetitiveAnalyst(context);

      const section = result.sections.find(
        (s) => s.sectionType === "competitive_market_analysis"
      );
      expect(section).toBeDefined();
      expect(section!.title).toBeTruthy();
      expect(section!.content).toHaveProperty("positioning");
      expect(section!.content).toHaveProperty("peerComparisons");
      expect(section!.content).toHaveProperty("rankings");
    });

    it("fetches property data for each peer market", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput());

      await executeCompetitiveAnalyst(context);

      // Should call searchProperties once per peer (2 peers)
      expect(mockSearchProperties).toHaveBeenCalledTimes(2);
    });

    it("stores peer analysis in metadata", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeCompetitiveAnalyst(context);

      expect(result.metadata).toHaveProperty("competitiveAnalysis");
      expect(result.metadata).toHaveProperty("peersFetched");
      expect(result.metadata.peersFetched).toBe(2);
    });

    it("includes target and peer data in Claude prompt", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput());

      await executeCompetitiveAnalyst(context);

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const call = mockCreate.mock.calls[0][0];
      const userMsg = call.messages[0].content;

      // Target market data
      expect(userMsg).toContain("Naples");
      // Peer market names
      expect(userMsg).toContain("Palm Beach");
      expect(userMsg).toContain("Aspen");
    });
  });

  describe("No peer markets", () => {
    it("returns result without calling Claude when no peers defined", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput(), {
        market: {
          name: "Naples",
          geography: { city: "Naples", state: "Florida" },
          luxuryTier: "ultra_luxury",
          priceFloor: 5000000,
          peerMarkets: [],
        },
      });

      const result = await executeCompetitiveAnalyst(context);

      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockSearchProperties).not.toHaveBeenCalled();
      expect(result.agentName).toBe("competitive-analyst");
      expect(result.sections.length).toBeGreaterThanOrEqual(1);
    });

    it("returns result when peerMarkets is undefined", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput(), {
        market: {
          name: "Naples",
          geography: { city: "Naples", state: "Florida" },
          luxuryTier: "ultra_luxury",
          priceFloor: 5000000,
          // no peerMarkets at all
        },
      });

      const result = await executeCompetitiveAnalyst(context);

      expect(mockCreate).not.toHaveBeenCalled();
      expect(result.metadata).toHaveProperty("noPeers", true);
    });
  });

  describe("Peer data fetch failures", () => {
    it("continues with remaining peers when one fetch fails", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );

      // First peer succeeds, second peer fails
      mockSearchProperties
        .mockResolvedValueOnce({
          properties: [
            {
              id: "p1",
              address: "123 Ocean Dr",
              price: 9200000,
              lastSalePrice: 8800000,
              lastSaleDate: "2026-01-15",
              sqft: 4000,
              propertyType: "single_family",
            },
          ],
          stale: false,
        })
        .mockRejectedValueOnce(new Error("API timeout"));

      const context = buildContext(buildDataAnalystOutput());

      const result = await executeCompetitiveAnalyst(context);

      // Should still succeed with partial data
      expect(result.agentName).toBe("competitive-analyst");
      expect(result.metadata.peersSkipped).toEqual(["Aspen"]);
      expect(result.metadata.peersFetched).toBe(1);
      // Should still call Claude with available data
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it("falls back to no-peers path when all fetches fail", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );

      mockSearchProperties.mockRejectedValue(new Error("API down"));

      const context = buildContext(buildDataAnalystOutput());

      const result = await executeCompetitiveAnalyst(context);

      expect(result.agentName).toBe("competitive-analyst");
      expect(mockCreate).not.toHaveBeenCalled();
      expect(result.metadata.peersSkipped).toEqual(["Palm Beach", "Aspen"]);
    });
  });

  describe("Abort signal handling", () => {
    it("throws when abort signal is triggered before execution", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );

      const controller = new AbortController();
      controller.abort();

      const context = buildContext(buildDataAnalystOutput(), {
        abortSignal: controller.signal,
      });

      await expect(executeCompetitiveAnalyst(context)).rejects.toThrow(
        /abort/i
      );
      expect(mockSearchProperties).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("wraps Claude API 429 errors as retriable", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );

      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("Rate limit"), { status: 429 })
      );

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeCompetitiveAnalyst(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.retriable).toBe(true);
      }
    });

    it("wraps Claude API 400 errors as non-retriable", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );

      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("Bad request"), { status: 400 })
      );

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeCompetitiveAnalyst(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.retriable).toBe(false);
      }
    });

    it("handles malformed Claude JSON response", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "not json {{{" }],
      });

      const context = buildContext(buildDataAnalystOutput());

      try {
        await executeCompetitiveAnalyst(context);
        fail("Should have thrown");
      } catch (err: unknown) {
        const error = err as Error & { retriable?: boolean };
        expect(error.message).toContain("parse");
        expect(error.retriable).toBe(true);
      }
    });
  });

  describe("Pipeline conformance", () => {
    it("throws if data-analyst results are missing", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );

      const context = buildContext(buildDataAnalystOutput());
      context.upstreamResults = {};

      await expect(executeCompetitiveAnalyst(context)).rejects.toThrow(
        /data-analyst/i
      );
    });

    it("sections are typed SectionOutput entries", async () => {
      const { executeCompetitiveAnalyst } = await import(
        "@/lib/agents/competitive-analyst"
      );
      const context = buildContext(buildDataAnalystOutput());

      const result = await executeCompetitiveAnalyst(context);

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
