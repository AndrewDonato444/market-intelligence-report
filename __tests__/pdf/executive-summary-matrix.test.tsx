import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Executive Summary + Market Analysis Matrix", () => {
  describe("Renderer exports", () => {
    it("exports ExecutiveSummaryPdf renderer", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.ExecutiveSummaryPdf).toBeDefined();
      expect(typeof mod.ExecutiveSummaryPdf).toBe("function");
    });

    it("exports CompetitiveAnalysisPdf renderer", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.CompetitiveAnalysisPdf).toBeDefined();
      expect(typeof mod.CompetitiveAnalysisPdf).toBe("function");
    });

    it("dispatches executive_summary to ExecutiveSummaryPdf", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("executive_summary");
      expect(renderer).toBe(mod.ExecutiveSummaryPdf);
    });

    it("dispatches competitive_market_analysis to CompetitiveAnalysisPdf", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("competitive_market_analysis");
      expect(renderer).toBe(mod.CompetitiveAnalysisPdf);
    });
  });

  describe("ExecutiveSummaryPdf rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders narrative and highlights", async () => {
      const { ExecutiveSummaryPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "executive_summary",
        title: "Executive Summary",
        content: {
          narrative: "Naples luxury market shows resilience.",
          highlights: ["8% YoY growth", "Low inventory"],
          timing: { buyers: "Act now", sellers: "Strong market" },
        },
      };

      render(React.createElement(ExecutiveSummaryPdf, { section }));

      expect(
        screen.getByText("Naples luxury market shows resilience.")
      ).toBeInTheDocument();
      expect(screen.getByText(/8% YoY growth/)).toBeInTheDocument();
      expect(screen.getByText(/Low inventory/)).toBeInTheDocument();
    });

    it("renders timing guidance", async () => {
      const { ExecutiveSummaryPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "executive_summary",
        title: "Executive Summary",
        content: {
          narrative: "Market analysis.",
          highlights: [],
          timing: { buyers: "Act before Q2", sellers: "List in spring" },
        },
      };

      render(React.createElement(ExecutiveSummaryPdf, { section }));

      expect(screen.getByText("Act before Q2")).toBeInTheDocument();
      expect(screen.getByText("List in spring")).toBeInTheDocument();
    });

    it("renders segment metrics table when segments present", async () => {
      const { ExecutiveSummaryPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "executive_summary",
        title: "Executive Summary",
        content: {
          narrative: "Market overview.",
          highlights: [],
          timing: {},
          segments: [
            {
              name: "single_family",
              count: 450,
              medianPrice: 2500000,
              rating: "A",
            },
            {
              name: "condo",
              count: 200,
              medianPrice: 1200000,
              rating: "B+",
            },
          ],
        },
      };

      render(React.createElement(ExecutiveSummaryPdf, { section }));

      expect(screen.getByText("single family")).toBeInTheDocument();
      expect(screen.getByText("condo")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B+")).toBeInTheDocument();
    });

    it("handles missing segments gracefully", async () => {
      const { ExecutiveSummaryPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "executive_summary",
        title: "Executive Summary",
        content: {
          narrative: "Narrative only.",
          highlights: [],
        },
      };

      expect(() => {
        render(React.createElement(ExecutiveSummaryPdf, { section }));
      }).not.toThrow();

      expect(screen.getByText("Narrative only.")).toBeInTheDocument();
    });
  });

  describe("CompetitiveAnalysisPdf rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders competitive analysis content", async () => {
      const { CompetitiveAnalysisPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "competitive_market_analysis",
        title: "Competitive Market Analysis",
        content: {
          narrative: "Naples outperforms peer markets.",
          comparisons: [
            {
              market: "Miami Beach",
              medianPrice: 3200000,
              advantage: "Naples offers better value",
            },
            {
              market: "Palm Beach",
              medianPrice: 5100000,
              advantage: "Lower entry point in Naples",
            },
          ],
        },
      };

      render(React.createElement(CompetitiveAnalysisPdf, { section }));

      expect(
        screen.getByText("Naples outperforms peer markets.")
      ).toBeInTheDocument();
      expect(screen.getByText("Miami Beach")).toBeInTheDocument();
      expect(screen.getByText("Palm Beach")).toBeInTheDocument();
    });

    it("handles missing comparisons gracefully", async () => {
      const { CompetitiveAnalysisPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "competitive_market_analysis",
        title: "Competitive Market Analysis",
        content: {
          narrative: "Basic analysis.",
        },
      };

      expect(() => {
        render(React.createElement(CompetitiveAnalysisPdf, { section }));
      }).not.toThrow();

      expect(screen.getByText("Basic analysis.")).toBeInTheDocument();
    });
  });
});
