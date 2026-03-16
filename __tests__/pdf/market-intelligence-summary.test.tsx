import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Test data factories ---

function makeMetadata(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: "2026-03-13T12:00:00Z",
    totalDurationMs: 30000,
    agentDurations: { analyst: 10000, insight: 10000, forecast: 10000 },
    confidence: {
      level: "high",
      sampleSize: 2234,
      staleDataSources: [],
    },
    ...overrides,
  };
}

function makeSections(overrides: {
  executiveBriefing?: { headline?: Record<string, unknown>; highlights?: string[] };
  marketInsightsIndex?: Record<string, unknown>;
  luxuryMarketDashboard?: Record<string, unknown>;
} = {}) {
  return [
    {
      sectionType: "executive_briefing",
      title: "Executive Briefing",
      content: {
        headline: {
          medianPrice: 2950000,
          totalProperties: 2234,
          totalVolume: 6580000000,
          rating: "A+",
          yoyPriceChange: 0.082,
          yoyVolumeChange: -0.124,
          yoyTransactionCountChange: 0.031,
          ...overrides.executiveBriefing?.headline,
        },
        narrative: "Ultra-luxury waterfront outperformed broader market by 23%.",
        highlights: overrides.executiveBriefing?.highlights ?? [
          "Ultra-luxury waterfront outperformed broader market by 23%",
          "Cash transactions dominated at 67% — highest in 3 years",
          "Supply constraints tightening: 2.1 months inventory vs 3.8 regional",
        ],
      },
    },
    {
      sectionType: "market_insights_index",
      title: "Market Insights Index",
      content: {
        liquidity: { score: 8.4, label: "Liquidity Strength" },
        timing: { score: 7.1, label: "Market Timing" },
        risk: { score: 6.8, label: "Risk Management" },
        value: { score: 9.2, label: "Opportunity Value" },
        ...overrides.marketInsightsIndex,
      },
    },
    {
      sectionType: "luxury_market_dashboard",
      title: "Luxury Market Dashboard",
      content: {
        segments: [
          { name: "$1-3M", count: 1005, medianPrice: 1800000, rating: "A" },
          { name: "$3-5M", count: 670, medianPrice: 3900000, rating: "A-" },
          { name: "$5-10M", count: 402, medianPrice: 7200000, rating: "B+" },
          { name: "$10M+", count: 157, medianPrice: 14500000, rating: "B" },
        ],
        ...overrides.luxuryMarketDashboard,
      },
    },
    {
      sectionType: "market_overview",
      title: "Market Overview",
      content: {
        narrative: "Overview text",
        highlights: [
          "Ultra-luxury waterfront outperformed broader market by 23%",
          "Cash transactions dominated at 67% — highest in 3 years",
          "Supply constraints tightening: 2.1 months inventory vs 3.8 regional",
        ],
      },
    },
  ];
}

// Expected date string from toLocaleDateString for "2026-03-13T12:00:00Z"
const expectedDate = new Date("2026-03-13T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

describe("Market Intelligence Summary", () => {
  describe("Headline metric strip", () => {
    it("renders 4 key metric values", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("2,234")).toBeInTheDocument();
      expect(screen.getByText("$6.58B")).toBeInTheDocument();
      expect(screen.getByText("$2.95M")).toBeInTheDocument();
      // +8.2% appears in both headline and trend indicator
      const yoyValues = screen.getAllByText("+8.2%");
      expect(yoyValues.length).toBeGreaterThanOrEqual(1);
    });

    it("renders metric labels", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      // "Transactions" appears in metric card label and possibly trend indicator
      expect(screen.getAllByText("Transactions").length).toBeGreaterThanOrEqual(1);
      // "Volume" appears in metric card and trend indicator
      expect(screen.getAllByText("Volume").length).toBeGreaterThanOrEqual(1);
      // "Median Price" appears in metric card and trend indicator
      expect(screen.getAllByText("Median Price").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("YoY Price")).toBeInTheDocument();
    });

    it("shows positive YoY change with plus sign", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      const yoyValues = screen.getAllByText("+8.2%");
      expect(yoyValues.length).toBeGreaterThanOrEqual(1);
    });

    it("shows negative YoY change with minus sign", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({ executiveBriefing: { headline: { yoyPriceChange: -0.053 } } }) }));
      const yoyValues = screen.getAllByText("-5.3%");
      expect(yoyValues.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Market Insights Index bar chart", () => {
    it("renders all 4 dimension labels", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("Liquidity Strength")).toBeInTheDocument();
      expect(screen.getByText("Market Timing")).toBeInTheDocument();
      expect(screen.getByText("Risk Management")).toBeInTheDocument();
      expect(screen.getByText("Opportunity Value")).toBeInTheDocument();
    });

    it("renders all 4 dimension scores", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("8.4")).toBeInTheDocument();
      expect(screen.getByText("7.1")).toBeInTheDocument();
      expect(screen.getByText("6.8")).toBeInTheDocument();
      expect(screen.getByText("9.2")).toBeInTheDocument();
    });

    it("renders composite score as average of 4 dimensions", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("7.9")).toBeInTheDocument();
    });

    it("renders Market Posture section title", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("Market Posture")).toBeInTheDocument();
    });
  });

  describe("Segment distribution chart", () => {
    it("renders segment names", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("$1-3M")).toBeInTheDocument();
      expect(screen.getByText("$3-5M")).toBeInTheDocument();
      expect(screen.getByText("$5-10M")).toBeInTheDocument();
      expect(screen.getByText("$10M+")).toBeInTheDocument();
    });

    it("renders Transaction Distribution section title", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("Transaction Distribution")).toBeInTheDocument();
    });

    it("groups segments with less than 3% into Other", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({
        luxuryMarketDashboard: {
          segments: [
            { name: "$1-3M", count: 950, medianPrice: 1800000, rating: "A" },
            { name: "$3-5M", count: 20, medianPrice: 3900000, rating: "A-" },
            { name: "$5-10M", count: 15, medianPrice: 7200000, rating: "B+" },
            { name: "$10M+", count: 5, medianPrice: 14500000, rating: "B" },
          ],
        },
      }) }));
      expect(screen.getByText("$1-3M")).toBeInTheDocument();
      expect(screen.getByText("Other")).toBeInTheDocument();
    });

    it("omits segment chart when fewer than 2 segments", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({
        luxuryMarketDashboard: { segments: [{ name: "$1-3M", count: 100, medianPrice: 1800000, rating: "A" }] },
      }) }));
      expect(screen.queryByText("Transaction Distribution")).not.toBeInTheDocument();
    });
  });

  describe("YoY trend indicators", () => {
    it("renders Year-over-Year section title", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({
        executiveBriefing: { headline: { yoyPriceChange: 0.082, yoyVolumeChange: -0.124, yoyTransactionCountChange: 0.031 } },
      }) }));
      expect(screen.getByText("Year-over-Year")).toBeInTheDocument();
    });

    it("shows up arrow for positive changes", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({
        executiveBriefing: { headline: { yoyPriceChange: 0.082, yoyVolumeChange: 0.05, yoyTransactionCountChange: 0.031 } },
      }) }));
      const arrows = screen.getAllByText("\u25B2");
      expect(arrows.length).toBeGreaterThanOrEqual(3);
    });

    it("shows down arrow for negative changes", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({
        executiveBriefing: { headline: { yoyPriceChange: -0.05, yoyVolumeChange: -0.124, yoyTransactionCountChange: -0.02 } },
      }) }));
      const arrows = screen.getAllByText("\u25BC");
      expect(arrows.length).toBeGreaterThanOrEqual(3);
    });

    it("shows flat indicator for changes within 1%", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({
        executiveBriefing: { headline: { yoyPriceChange: 0.005, yoyVolumeChange: -0.003, yoyTransactionCountChange: 0.0 } },
      }) }));
      const flatIndicators = screen.getAllByText("\u2014");
      expect(flatIndicators.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Key highlights", () => {
    it("renders up to 3 highlights", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("Key Intelligence")).toBeInTheDocument();
      expect(screen.getByText(/Ultra-luxury waterfront/)).toBeInTheDocument();
      expect(screen.getByText(/Cash transactions dominated/)).toBeInTheDocument();
      expect(screen.getByText(/Supply constraints/)).toBeInTheDocument();
    });

    it("renders gold accent bullet dots", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      const bullets = screen.getAllByText("\u2022");
      expect(bullets.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Footer strip", () => {
    it("shows formatted report date", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });
  });

  describe("Empty segments graceful degradation", () => {
    it("omits segment chart when no segments exist", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({ luxuryMarketDashboard: { segments: [] } }) }));
      expect(screen.queryByText("Transaction Distribution")).not.toBeInTheDocument();
    });

    it("still renders other components when segments are empty", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections({ luxuryMarketDashboard: { segments: [] } }) }));
      expect(screen.getByText("At a Glance")).toBeInTheDocument();
      expect(screen.getByText("Market Posture")).toBeInTheDocument();
      expect(screen.getByText("Key Intelligence")).toBeInTheDocument();
    });
  });

  describe("Page title and structure", () => {
    it("renders At a Glance as the page title", async () => {
      const { InsightsIndex } = await import("@/lib/pdf/templates/insights-index");
      render(React.createElement(InsightsIndex, { metadata: makeMetadata(), sections: makeSections() }));
      expect(screen.getByText("At a Glance")).toBeInTheDocument();
    });
  });

  describe("Data viz component exports", () => {
    it("exports HorizontalBarChart", async () => {
      const mod = await import("@/lib/pdf/components/data-viz");
      expect(mod.HorizontalBarChart).toBeDefined();
      expect(typeof mod.HorizontalBarChart).toBe("function");
    });

    it("exports SegmentDistributionBar", async () => {
      const mod = await import("@/lib/pdf/components/data-viz");
      expect(mod.SegmentDistributionBar).toBeDefined();
      expect(typeof mod.SegmentDistributionBar).toBe("function");
    });

    it("exports TrendIndicator", async () => {
      const mod = await import("@/lib/pdf/components/data-viz");
      expect(mod.TrendIndicator).toBeDefined();
      expect(typeof mod.TrendIndicator).toBe("function");
    });
  });

  describe("HorizontalBarChart", () => {
    it("renders dimension labels and scores", async () => {
      const { HorizontalBarChart } = await import("@/lib/pdf/components/data-viz");
      render(React.createElement(HorizontalBarChart, {
        dimensions: [{ label: "Liquidity Strength", score: 8.4 }, { label: "Market Timing", score: 7.1 }],
        maxScore: 10,
      }));
      expect(screen.getByText("Liquidity Strength")).toBeInTheDocument();
      expect(screen.getByText("8.4")).toBeInTheDocument();
      expect(screen.getByText("Market Timing")).toBeInTheDocument();
      expect(screen.getByText("7.1")).toBeInTheDocument();
    });

    it("renders scale markers", async () => {
      const { HorizontalBarChart } = await import("@/lib/pdf/components/data-viz");
      render(React.createElement(HorizontalBarChart, { dimensions: [{ label: "Test", score: 5.0 }], maxScore: 10 }));
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("SegmentDistributionBar", () => {
    it("renders segment names", async () => {
      const { SegmentDistributionBar } = await import("@/lib/pdf/components/data-viz");
      render(React.createElement(SegmentDistributionBar, {
        segments: [{ name: "$1-3M", count: 45 }, { name: "$3-5M", count: 30 }, { name: "$5-10M", count: 18 }, { name: "$10M+", count: 7 }],
      }));
      expect(screen.getByText("$1-3M")).toBeInTheDocument();
      expect(screen.getByText("$3-5M")).toBeInTheDocument();
    });

    it("groups small segments into Other", async () => {
      const { SegmentDistributionBar } = await import("@/lib/pdf/components/data-viz");
      render(React.createElement(SegmentDistributionBar, {
        segments: [{ name: "$1-3M", count: 950 }, { name: "$3-5M", count: 20 }, { name: "$5-10M", count: 15 }, { name: "$10M+", count: 5 }],
      }));
      expect(screen.getByText("Other")).toBeInTheDocument();
    });
  });

  describe("TrendIndicator", () => {
    it("shows up arrow for positive change", async () => {
      const { TrendIndicator } = await import("@/lib/pdf/components/data-viz");
      // value is a proportion: 0.082 = 8.2%
      render(React.createElement(TrendIndicator, { label: "Median Price", value: 0.082 }));
      expect(screen.getByText("Median Price")).toBeInTheDocument();
      expect(screen.getByText("+8.2%")).toBeInTheDocument();
      expect(screen.getByText("\u25B2")).toBeInTheDocument();
    });

    it("shows down arrow for negative change", async () => {
      const { TrendIndicator } = await import("@/lib/pdf/components/data-viz");
      // value is a proportion: -0.124 = -12.4%
      render(React.createElement(TrendIndicator, { label: "Volume", value: -0.124 }));
      expect(screen.getByText("Volume")).toBeInTheDocument();
      expect(screen.getByText("-12.4%")).toBeInTheDocument();
      expect(screen.getByText("\u25BC")).toBeInTheDocument();
    });

    it("shows flat indicator for near-zero change", async () => {
      const { TrendIndicator } = await import("@/lib/pdf/components/data-viz");
      // value is a proportion: 0.003 = 0.3% (below 1% flat threshold)
      render(React.createElement(TrendIndicator, { label: "Count", value: 0.003 }));
      expect(screen.getByText("Count")).toBeInTheDocument();
      expect(screen.getByText("+0.3%")).toBeInTheDocument();
      expect(screen.getByText("\u2014")).toBeInTheDocument();
    });
  });
});
