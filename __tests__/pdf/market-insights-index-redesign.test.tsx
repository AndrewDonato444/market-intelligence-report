import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Test data factory ---

function makeSection(overrides: Record<string, unknown> = {}) {
  return {
    sectionType: "market_insights_index",
    title: "Market Insights Index",
    content: {
      insightsIndex: {
        liquidity: {
          score: 8,
          label: "Strong",
          components: { transactionVolume: 2234, freeClearPct: 0.42 },
          interpretation: "2234 transactions indicate active trading volume. 42% free & clear ownership signals strong capital independence",
        },
        timing: {
          score: 7,
          label: "Favorable",
          components: { priceMomentum: 0.08, medianDOM: 45, listToSaleRatio: 0.97 },
          interpretation: "Strong price momentum (+8% YoY) favors sellers",
        },
        risk: {
          score: 7,
          label: "Low Risk",
          components: { floodZonePct: 0, concentrationPct: 0.35 },
          interpretation: "No flood zone exposure — minimal climate risk",
        },
        value: {
          score: 5,
          label: "Moderate Opportunity",
          components: { yoyGrowth: 0.03, psfSpread: 0.4 },
          interpretation: "Modest 3% growth — steady value trajectory",
        },
        ...overrides,
      },
    },
  };
}

describe("Market Insights Index Redesign (#203)", () => {
  describe("Usage context block", () => {
    it("renders 'How to Read This Index' header", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      expect(screen.getByText("How to Read This Index")).toBeInTheDocument();
    });

    it("explains the 1-10 scoring scale", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      expect(screen.getByText(/scored 1.10/i)).toBeInTheDocument();
    });

    it("explains what the four dimensions measure", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      // Each dimension name appears in both usage context and tile headers
      expect(screen.getAllByText(/Liquidity/).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(/Timing/).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(/Risk/).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(/Value/).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("2x2 square tile layout", () => {
    it("renders all 4 dimension titles", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      const allText = document.body.textContent || "";
      expect(allText).toContain("Liquidity");
      expect(allText).toContain("Timing");
      expect(allText).toContain("Risk");
      expect(allText).toContain("Value");
    });

    it("renders all 4 dimension scores with /10 format", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      expect(screen.getByText("8/10")).toBeInTheDocument();
      // Risk and Timing both score 7
      expect(screen.getAllByText("7/10").length).toBe(2);
      expect(screen.getByText("5/10")).toBeInTheDocument();
    });

    it("renders all 4 dimension labels", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      expect(screen.getByText("Strong")).toBeInTheDocument();
      expect(screen.getByText("Favorable")).toBeInTheDocument();
      expect(screen.getByText("Low Risk")).toBeInTheDocument();
      expect(screen.getByText("Moderate Opportunity")).toBeInTheDocument();
    });
  });

  describe("Interpretation text", () => {
    it("renders interpretation text for each dimension", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      expect(screen.getByText(/2234 transactions indicate active trading volume/)).toBeInTheDocument();
      expect(screen.getByText(/Strong price momentum/)).toBeInTheDocument();
      expect(screen.getByText(/No flood zone exposure/)).toBeInTheDocument();
      expect(screen.getByText(/Modest 3% growth/)).toBeInTheDocument();
    });

    it("gracefully handles missing interpretation", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      const section = makeSection({
        liquidity: {
          score: 3,
          label: "Weak",
          components: { transactionVolume: 5, freeClearPct: 0.1 },
        },
      });
      render(React.createElement(MarketInsightsIndexPdf, { section }));
      expect(screen.getByText("Weak")).toBeInTheDocument();
      expect(screen.getByText("3/10")).toBeInTheDocument();
    });
  });

  describe("Component breakdown", () => {
    it("renders component values formatted as percentages when < 1", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      expect(screen.getByText(/42\.0%/)).toBeInTheDocument();
    });

    it("renders component values as plain numbers when >= 1", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      render(React.createElement(MarketInsightsIndexPdf, { section: makeSection() }));
      expect(screen.getByText(/2,234/)).toBeInTheDocument();
    });

    it("renders N/A for null component values", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      const section = makeSection({
        liquidity: {
          score: 5,
          label: "Moderate",
          components: { transactionVolume: 100, freeClearPct: null },
        },
      });
      render(React.createElement(MarketInsightsIndexPdf, { section }));
      const naTexts = screen.getAllByText(/N\/A/);
      expect(naTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Score always present (no blanks)", () => {
    it("every dimension renders a score even with minimal data", async () => {
      const { MarketInsightsIndexPdf } = await import("@/lib/pdf/templates/renderers");
      const section = makeSection({
        liquidity: { score: 5, label: "Moderate", components: {} },
        timing: { score: 5, label: "Neutral", components: {} },
        risk: { score: 5, label: "Moderate Risk", components: {} },
        value: { score: 5, label: "Moderate Opportunity", components: {} },
      });
      render(React.createElement(MarketInsightsIndexPdf, { section }));
      const scores = screen.getAllByText("5/10");
      expect(scores.length).toBe(4);
    });
  });

  describe("Computation: scores are always non-null", () => {
    it("computeInsightsIndex returns all 4 dimensions with numeric scores", async () => {
      const { computeInsightsIndex } = await import("@/lib/services/market-analytics");
      const market = { totalProperties: 50, medianPrice: 2000000, averagePrice: 2500000, medianPricePerSqft: null, totalVolume: 100000000, rating: "B" };
      const yoy = { medianPriceChange: null, volumeChange: null, pricePerSqftChange: null, averagePriceChange: null, totalVolumeChange: null, domChange: null, listToSaleChange: null };
      const detailMetrics = {
        cashBuyerPercentage: null,
        freeClearPercentage: null,
        floodZonePercentage: null,
        medianDaysOnMarket: null,
        listToSaleRatio: null,
        investorPercentage: null,
        investorBuyerPercentage: null,
        medianPricePerSqft: null,
        medianLotSize: null,
        medianYearBuilt: null,
        dataSources: { dom: "none" as const, listToSale: "none" as const },
      };
      const segments: Parameters<typeof computeInsightsIndex>[3] = [];

      const result = computeInsightsIndex(market, yoy, detailMetrics, segments);

      expect(result.liquidity.score).toBeGreaterThanOrEqual(1);
      expect(result.liquidity.score).toBeLessThanOrEqual(10);
      expect(result.liquidity.label).toBeTruthy();

      expect(result.timing.score).toBeGreaterThanOrEqual(1);
      expect(result.timing.score).toBeLessThanOrEqual(10);
      expect(result.timing.label).toBeTruthy();

      expect(result.risk.score).toBeGreaterThanOrEqual(1);
      expect(result.risk.score).toBeLessThanOrEqual(10);
      expect(result.risk.label).toBeTruthy();

      expect(result.value.score).toBeGreaterThanOrEqual(1);
      expect(result.value.score).toBeLessThanOrEqual(10);
      expect(result.value.label).toBeTruthy();
    });
  });
});
