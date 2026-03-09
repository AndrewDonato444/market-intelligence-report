import "@testing-library/jest-dom";

describe("Forecasts + Methodology + Strategic Summary PDF Sections", () => {
  describe("ForecastsPdf rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders projections table with formatted prices", async () => {
      const { ForecastsPdf } = await import("@/lib/pdf/templates/renderers");

      const section = {
        sectionType: "forecasts",
        title: "Forecasts & Projections",
        content: {
          projections: [
            {
              segment: "single_family",
              sixMonth: { medianPrice: 2500000, confidence: "high" },
              twelveMonth: { medianPrice: 2700000, confidence: "medium" },
            },
          ],
          scenarios: {},
        },
      };

      render(React.createElement(ForecastsPdf, { section }));

      expect(screen.getByText("single family")).toBeInTheDocument();
      expect(screen.getByText("$2.5M")).toBeInTheDocument();
      expect(screen.getByText("$2.7M")).toBeInTheDocument();
    });

    it("renders scenario cards with narratives", async () => {
      const { ForecastsPdf } = await import("@/lib/pdf/templates/renderers");

      const section = {
        sectionType: "forecasts",
        title: "Forecasts",
        content: {
          projections: [],
          scenarios: {
            base: {
              narrative: "Steady growth continues.",
              medianPriceChange: 0.06,
            },
            bull: {
              narrative: "Accelerated demand.",
              medianPriceChange: 0.12,
            },
            bear: {
              narrative: "Correction possible.",
              medianPriceChange: -0.03,
            },
          },
        },
      };

      render(React.createElement(ForecastsPdf, { section }));

      expect(screen.getByText("Steady growth continues.")).toBeInTheDocument();
      expect(screen.getByText("Accelerated demand.")).toBeInTheDocument();
      expect(screen.getByText("Correction possible.")).toBeInTheDocument();
      expect(screen.getByText(/6\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/12\.0%/)).toBeInTheDocument();
    });
  });

  describe("Strategic summary (NarrativeSectionPdf)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("dispatches strategic_summary to NarrativeSectionPdf", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.getSectionRenderer("strategic_summary")).toBe(
        mod.NarrativeSectionPdf
      );
    });

    it("renders strategic summary with timing", async () => {
      const { NarrativeSectionPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "strategic_summary",
        title: "Strategic Summary",
        content: {
          narrative: "The Naples market is well-positioned for continued growth.",
          highlights: ["Strong demand fundamentals"],
          timing: {
            buyers: "Favorable conditions through Q2",
            sellers: "Optimal listing window now",
          },
        },
      };

      render(React.createElement(NarrativeSectionPdf, { section }));

      expect(
        screen.getByText(
          "The Naples market is well-positioned for continued growth."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Favorable conditions through Q2")).toBeInTheDocument();
      expect(screen.getByText("Optimal listing window now")).toBeInTheDocument();
    });
  });

  describe("All section types have dedicated renderers", () => {
    it("no SECTION_REGISTRY type falls through to GenericSectionPdf", async () => {
      const { getSectionRenderer, GenericSectionPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );
      const { SECTION_REGISTRY } = await import("@/lib/agents/schema");

      for (const entry of SECTION_REGISTRY) {
        const renderer = getSectionRenderer(entry.sectionType);
        expect(renderer).not.toBe(GenericSectionPdf);
      }
    });

    it("all 8 section types return a function renderer", async () => {
      const { getSectionRenderer } = await import(
        "@/lib/pdf/templates/renderers"
      );
      const { SECTION_REGISTRY } = await import("@/lib/agents/schema");

      expect(SECTION_REGISTRY.length).toBe(8);
      for (const entry of SECTION_REGISTRY) {
        const renderer = getSectionRenderer(entry.sectionType);
        expect(typeof renderer).toBe("function");
      }
    });
  });

  describe("Full report rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render } = require("@testing-library/react");

    it("ReportDocument renders with all section types without errors", async () => {
      const { ReportDocument } = await import("@/lib/pdf/document");

      const reportData = {
        sections: [
          { sectionType: "market_overview", title: "Market Overview", content: { narrative: "Text", highlights: [], recommendations: [] } },
          { sectionType: "executive_summary", title: "Executive Summary", content: { narrative: "Text", highlights: [], timing: {} } },
          { sectionType: "key_drivers", title: "Key Drivers", content: { themes: [] } },
          { sectionType: "competitive_market_analysis", title: "Competitive Analysis", content: { narrative: "Text" } },
          { sectionType: "forecasts", title: "Forecasts", content: { projections: [], scenarios: {} } },
          { sectionType: "strategic_summary", title: "Strategic Summary", content: { narrative: "Text" } },
          { sectionType: "polished_report", title: "Polish", content: { pullQuotes: [] } },
          { sectionType: "methodology", title: "Methodology", content: { narrative: "Data sources." } },
        ],
        pullQuotes: [],
        metadata: {
          generatedAt: "2026-03-09T00:00:00Z",
          totalDurationMs: 30000,
          agentDurations: {},
          confidence: { level: "high", sampleSize: 500, staleDataSources: [] },
        },
      };

      expect(() => {
        render(
          React.createElement(ReportDocument, {
            reportData,
            branding: { name: "Alex Rivera", company: "Luxury Realty" },
            title: "Naples Report",
            marketName: "Naples, FL",
          })
        );
      }).not.toThrow();
    });
  });
});
