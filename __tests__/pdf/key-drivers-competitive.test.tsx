import "@testing-library/jest-dom";

describe("Key Drivers + Competitive Analysis PDF Sections", () => {
  describe("KeyDriversPdf rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders themes with impact and trend", async () => {
      const { KeyDriversPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "key_drivers",
        title: "Key Market Drivers",
        content: {
          themes: [
            {
              name: "Waterfront Premium",
              impact: "high",
              trend: "up",
              narrative: "Waterfront properties command 40% premium.",
            },
            {
              name: "Inventory Pressure",
              impact: "medium",
              trend: "down",
              narrative: "Available listings declining quarter over quarter.",
            },
          ],
        },
      };

      render(React.createElement(KeyDriversPdf, { section }));

      expect(screen.getByText("Waterfront Premium")).toBeInTheDocument();
      expect(
        screen.getByText("Waterfront properties command 40% premium.")
      ).toBeInTheDocument();
      expect(screen.getByText("Inventory Pressure")).toBeInTheDocument();
      expect(screen.getByText(/high/)).toBeInTheDocument();
      expect(screen.getByText(/medium/)).toBeInTheDocument();
    });

    it("renders trend indicators", async () => {
      const { KeyDriversPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "key_drivers",
        title: "Key Market Drivers",
        content: {
          themes: [
            {
              name: "Theme A",
              impact: "high",
              trend: "up",
              narrative: "Going up.",
            },
            {
              name: "Theme B",
              impact: "low",
              trend: "down",
              narrative: "Going down.",
            },
            {
              name: "Theme C",
              impact: "medium",
              trend: "neutral",
              narrative: "Holding steady.",
            },
          ],
        },
      };

      render(React.createElement(KeyDriversPdf, { section }));

      expect(screen.getByText(/↑/)).toBeInTheDocument();
      expect(screen.getByText(/↓/)).toBeInTheDocument();
      expect(screen.getByText(/→/)).toBeInTheDocument();
    });

    it("handles empty themes gracefully", async () => {
      const { KeyDriversPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      expect(() => {
        render(
          React.createElement(KeyDriversPdf, {
            section: {
              sectionType: "key_drivers",
              title: "Key Market Drivers",
              content: { themes: [] },
            },
          })
        );
      }).not.toThrow();
    });
  });

  describe("CompetitiveAnalysisPdf rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders narrative and comparison cards", async () => {
      const { CompetitiveAnalysisPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "competitive_market_analysis",
        title: "Competitive Analysis",
        content: {
          narrative: "Naples outperforms peer markets significantly.",
          comparisons: [
            {
              market: "Sarasota",
              medianPrice: 1800000,
              advantage: "Naples has stronger growth",
            },
          ],
        },
      };

      render(React.createElement(CompetitiveAnalysisPdf, { section }));

      expect(
        screen.getByText("Naples outperforms peer markets significantly.")
      ).toBeInTheDocument();
      expect(screen.getByText("Sarasota")).toBeInTheDocument();
      expect(
        screen.getByText("Naples has stronger growth")
      ).toBeInTheDocument();
    });
  });

  describe("PolishedReportPdf rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports PolishedReportPdf renderer", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.PolishedReportPdf).toBeDefined();
      expect(typeof mod.PolishedReportPdf).toBe("function");
    });

    it("dispatches polished_report to PolishedReportPdf", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("polished_report");
      expect(renderer).toBe(mod.PolishedReportPdf);
    });

    it("renders pull quotes and methodology", async () => {
      const { PolishedReportPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "polished_report",
        title: "Editorial Polish",
        content: {
          pullQuotes: [
            { text: "A remarkable year for luxury.", source: "Market Overview" },
          ],
          methodology: "Analysis based on 2,234 transactions.",
        },
      };

      render(React.createElement(PolishedReportPdf, { section }));

      expect(
        screen.getByText(/A remarkable year for luxury/)
      ).toBeInTheDocument();
      expect(
        screen.getByText("Analysis based on 2,234 transactions.")
      ).toBeInTheDocument();
    });
  });

  describe("MethodologySectionPdf rendering", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports MethodologySectionPdf renderer", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.MethodologySectionPdf).toBeDefined();
    });

    it("dispatches methodology to MethodologySectionPdf", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("methodology");
      expect(renderer).toBe(mod.MethodologySectionPdf);
    });

    it("renders methodology content", async () => {
      const { MethodologySectionPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "methodology",
        title: "Methodology",
        content: {
          narrative:
            "Data sourced from MLS and public records covering Q4 2025.",
          dataSources: ["MLS", "Public Records", "ScrapingDog"],
        },
      };

      render(React.createElement(MethodologySectionPdf, { section }));

      expect(
        screen.getByText(
          "Data sourced from MLS and public records covering Q4 2025."
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Public Records/)).toBeInTheDocument();
    });
  });
});
