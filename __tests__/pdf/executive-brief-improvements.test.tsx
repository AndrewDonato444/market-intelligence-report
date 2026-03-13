import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Test helpers ---

function makeExecutiveBriefingSection(overrides: Record<string, unknown> = {}) {
  return {
    sectionType: "executive_briefing",
    title: "Executive Briefing",
    content: {
      headline: {
        rating: "A+",
        medianPrice: 4200000,
        yoyPriceChange: 0.123,
        totalProperties: 234,
      },
      narrative: "The Naples luxury market demonstrated resilience in Q1 2026.",
      confidence: { level: "high", sampleSize: 45 },
      dataAsOfDate: "2026-02-15",
      metricExplainers: {
        marketRating: "Overall market health based on growth, liquidity, and risk indicators",
        medianPrice: "50th percentile sale price across all luxury transactions in the analysis period",
        yoyChange: "Year-over-year change in median sale price compared to the same period last year",
        properties: "Total luxury property transactions included in this analysis",
      },
      timing: {
        buyers: "Opportunity window narrowing — waterfront inventory at 18-month low.",
        sellers: "Premium positioning favored — list at 5-8% above Q4 comps.",
      },
      ...overrides,
    },
  };
}

describe("Executive Brief Improvements", () => {
  let ExecutiveBriefingPdf: React.FC<{ section: Record<string, unknown> }>;

  beforeAll(async () => {
    const mod = await import("@/lib/pdf/templates/renderers");
    ExecutiveBriefingPdf = mod.ExecutiveBriefingPdf as unknown as typeof ExecutiveBriefingPdf;
  });

  describe("Headline tile explainer text", () => {
    it("EB-01: Market Rating tile shows explainer text", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Overall market health based on growth, liquidity, and risk indicators")).toBeInTheDocument();
    });

    it("EB-02: Median Price tile shows explainer text", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("50th percentile sale price across all luxury transactions in the analysis period")).toBeInTheDocument();
    });

    it("EB-03: YoY Change tile shows explainer text", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Year-over-year change in median sale price compared to the same period last year")).toBeInTheDocument();
    });

    it("EB-04: Properties tile shows explainer text", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Total luxury property transactions included in this analysis")).toBeInTheDocument();
    });
  });

  describe("Explainer text styling", () => {
    it("EB-05: metricExplainer style exists with correct properties", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      const explainerStyle = (styles as Record<string, Record<string, unknown>>).metricExplainer;
      expect(explainerStyle).toBeDefined();
      expect(explainerStyle.fontFamily).toBe("Inter");
      expect(explainerStyle.fontSize).toBeGreaterThanOrEqual(10);
      expect(explainerStyle.fontSize).toBeLessThanOrEqual(11);
      expect(explainerStyle.marginTop).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Data freshness date", () => {
    it("EB-06: displays 'Data as of February 2026' from transaction date 2026-02-15", () => {
      const section = makeExecutiveBriefingSection({ dataAsOfDate: "2026-02-15" });
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText(/Data as of February 2026/)).toBeInTheDocument();
    });

    it("EB-07: date reflects latest transaction date, not generation date", () => {
      const section = makeExecutiveBriefingSection({ dataAsOfDate: "2026-02-15" });
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText(/Data as of February 2026/)).toBeInTheDocument();
      expect(screen.queryByText(/Data as of March 2026/)).not.toBeInTheDocument();
    });

    it("EB-08: falls back to generation date when dataAsOfDate is null", () => {
      const section = makeExecutiveBriefingSection({ dataAsOfDate: null });
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText(/Data as of \w+ \d{4}/)).toBeInTheDocument();
    });

    it("EB-09: uses 'Month YYYY' format, not showing specific day", () => {
      const section = makeExecutiveBriefingSection({ dataAsOfDate: "2026-02-15" });
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      const el = screen.getByText(/Data as of/);
      expect(el.textContent).toMatch(/Data as of February 2026/);
      expect(el.textContent).not.toMatch(/February 15/);
    });
  });

  describe("formatDataFreshnessDate", () => {
    let formatDataFreshnessDate: (isoDate: string | null | undefined, fallbackDate?: Date) => string | null;

    beforeAll(async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      formatDataFreshnessDate = mod.formatDataFreshnessDate;
    });

    it("EB-10: formats ISO date as Month YYYY", () => {
      expect(formatDataFreshnessDate("2026-02-15")).toBe("February 2026");
    });

    it("EB-11: uses fallback date when isoDate is null", () => {
      const fallback = new Date(2026, 2, 13);
      expect(formatDataFreshnessDate(null, fallback)).toBe("March 2026");
    });

    it("EB-12: returns null when both args are absent", () => {
      expect(formatDataFreshnessDate(null)).toBeNull();
    });

    it("EB-13: handles unparseable date string with fallback", () => {
      const fallback = new Date(2026, 2, 13);
      expect(formatDataFreshnessDate("not-a-date", fallback)).toBe("March 2026");
    });
  });

  describe("Section headers", () => {
    it("EB-14: narrative block is preceded by 'Market Overview' header", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Market Overview")).toBeInTheDocument();
    });

    it("EB-15: confidence block is preceded by 'Data Confidence' header", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Data Confidence")).toBeInTheDocument();
    });

    it("EB-16: confidence line shows level and sample size", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText(/High confidence \(n=45 transactions\)/)).toBeInTheDocument();
    });

    it("EB-17: timing block is preceded by 'Timing Guidance' header", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Timing Guidance")).toBeInTheDocument();
    });

    it("EB-18: buyer timing shows with bold 'Buyers:' label", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Buyers:")).toBeInTheDocument();
    });

    it("EB-19: seller timing shows with bold 'Sellers:' label", () => {
      const section = makeExecutiveBriefingSection();
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Sellers:")).toBeInTheDocument();
    });
  });

  describe("Subsection header styling", () => {
    it("EB-20: subsectionHeader style exists with correct properties", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      const headerStyle = (styles as Record<string, Record<string, unknown>>).subsectionHeader;
      expect(headerStyle).toBeDefined();
      expect(headerStyle.fontFamily).toBe("Inter");
      expect(headerStyle.fontWeight).toBe(600);
      expect(headerStyle.textTransform).toBe("uppercase");
    });
  });

  describe("Graceful rendering without optional data", () => {
    it("EB-21: renders without timing, confidence works, no broken layout", () => {
      const section = makeExecutiveBriefingSection({
        timing: { buyers: null, sellers: null },
        dataAsOfDate: null,
      });
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Market Rating")).toBeInTheDocument();
      expect(screen.getByText("Overall market health based on growth, liquidity, and risk indicators")).toBeInTheDocument();
      expect(screen.getByText("Market Overview")).toBeInTheDocument();
      expect(screen.getByText("Data Confidence")).toBeInTheDocument();
      expect(screen.queryByText("Timing Guidance")).not.toBeInTheDocument();
    });

    it("EB-22: renders without metricExplainers (backward compat)", () => {
      const section = makeExecutiveBriefingSection({ metricExplainers: undefined });
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.getByText("Market Rating")).toBeInTheDocument();
      expect(screen.getByText("Median Price")).toBeInTheDocument();
      expect(screen.queryByText(/Overall market health/)).not.toBeInTheDocument();
    });

    it("EB-23: renders without narrative — no Market Overview header", () => {
      const section = makeExecutiveBriefingSection({ narrative: null });
      render(React.createElement(ExecutiveBriefingPdf, { section }));
      expect(screen.queryByText("Market Overview")).not.toBeInTheDocument();
      expect(screen.getByText("Data Confidence")).toBeInTheDocument();
      expect(screen.getByText("Market Rating")).toBeInTheDocument();
    });
  });

  describe("Layer 1: computeDataAsOfDate", () => {
    let computeDataAsOfDate: (properties: Array<{ lastSaleDate: string | null }>) => string | null;

    beforeAll(async () => {
      const mod = await import("@/lib/services/market-analytics");
      computeDataAsOfDate = mod.computeDataAsOfDate as typeof computeDataAsOfDate;
    });

    it("EB-24: extracts the most recent lastSaleDate across all properties", () => {
      const properties = [
        { lastSaleDate: "2025-11-01" },
        { lastSaleDate: "2026-02-15" },
        { lastSaleDate: "2025-06-20" },
      ];
      expect(computeDataAsOfDate(properties as never[])).toBe("2026-02-15");
    });

    it("EB-25: returns null when no properties have parseable sale dates", () => {
      const properties = [
        { lastSaleDate: null },
        { lastSaleDate: null },
      ];
      expect(computeDataAsOfDate(properties as never[])).toBeNull();
    });

    it("EB-26: skips unparseable dates and still finds the latest valid one", () => {
      const properties = [
        { lastSaleDate: "garbage" },
        { lastSaleDate: "2026-01-10" },
        { lastSaleDate: null },
      ];
      expect(computeDataAsOfDate(properties as never[])).toBe("2026-01-10");
    });

    it("EB-27: returns ISO date string format", () => {
      const properties = [{ lastSaleDate: "2026-02-15" }];
      const result = computeDataAsOfDate(properties as never[]);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("Data freshness styling", () => {
    it("EB-28: dataFreshness style exists with correct properties", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      const freshnessStyle = (styles as Record<string, Record<string, unknown>>).dataFreshness;
      expect(freshnessStyle).toBeDefined();
      expect(freshnessStyle.fontFamily).toBe("Inter");
      expect(freshnessStyle.fontSize).toBe(10);
    });
  });
});
