import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Report Cover, TOC, and Insights Index", () => {
  describe("File structure", () => {
    it("has enhanced cover page template", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/pdf/templates/cover-page.tsx")
        )
      ).toBe(true);
    });

    it("has table of contents template", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/pdf/templates/table-of-contents.tsx")
        )
      ).toBe(true);
    });

    it("has insights index template", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/pdf/templates/insights-index.tsx")
        )
      ).toBe(true);
    });
  });

  describe("Enhanced cover page", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports CoverPage component", async () => {
      const mod = await import("@/lib/pdf/templates/cover-page");
      expect(mod.CoverPage).toBeDefined();
      expect(typeof mod.CoverPage).toBe("function");
    });

    it("renders with basic props", async () => {
      const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

      render(
        React.createElement(CoverPage, {
          title: "Naples Market Report",
          marketName: "Naples, FL",
          agentName: "Alex Rivera",
          company: "Luxury Realty",
          generatedAt: "2026-03-09T00:00:00Z",
        })
      );

      expect(screen.getByText("Naples Market Report")).toBeInTheDocument();
      expect(screen.getByText("Naples, FL")).toBeInTheDocument();
      expect(screen.getByText(/Alex Rivera/)).toBeInTheDocument();
      expect(
        screen.getByText(/Market Intelligence Report/)
      ).toBeInTheDocument();
    });

    it("supports optional logoUrl prop", async () => {
      const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

      expect(() => {
        render(
          React.createElement(CoverPage, {
            title: "Test Report",
            marketName: "Test Market",
            agentName: "Test Agent",
            generatedAt: "2026-03-09T00:00:00Z",
            logoUrl: "https://example.com/logo.png",
          })
        );
      }).not.toThrow();
    });
  });

  describe("Table of contents", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports TableOfContents component", async () => {
      const mod = await import("@/lib/pdf/templates/table-of-contents");
      expect(mod.TableOfContents).toBeDefined();
      expect(typeof mod.TableOfContents).toBe("function");
    });

    it("renders section titles", async () => {
      const { TableOfContents } = await import(
        "@/lib/pdf/templates/table-of-contents"
      );

      const sections = [
        {
          sectionType: "market_overview",
          title: "Market Overview",
          content: {},
        },
        {
          sectionType: "executive_summary",
          title: "Executive Summary",
          content: {},
        },
        {
          sectionType: "key_drivers",
          title: "Key Market Drivers",
          content: {},
        },
      ];

      render(React.createElement(TableOfContents, { sections }));

      const tocHeadings = screen.getAllByText("Table of Contents");
      expect(tocHeadings.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Market Overview")).toBeInTheDocument();
      expect(screen.getByText("Executive Summary")).toBeInTheDocument();
      expect(screen.getByText("Key Market Drivers")).toBeInTheDocument();
    });

    it("handles empty sections array", async () => {
      const { TableOfContents } = await import(
        "@/lib/pdf/templates/table-of-contents"
      );

      render(React.createElement(TableOfContents, { sections: [] }));
      const tocHeadings = screen.getAllByText("Table of Contents");
      expect(tocHeadings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Insights index", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports InsightsIndex component", async () => {
      const mod = await import("@/lib/pdf/templates/insights-index");
      expect(mod.InsightsIndex).toBeDefined();
      expect(typeof mod.InsightsIndex).toBe("function");
    });

    it("renders with metadata and sections", async () => {
      const { InsightsIndex } = await import(
        "@/lib/pdf/templates/insights-index"
      );

      const metadata = {
        generatedAt: "2026-03-09T00:00:00Z",
        totalDurationMs: 45000,
        agentDurations: {},
      };

      const sections = [
        {
          sectionType: "executive_briefing",
          title: "Executive Briefing",
          content: {
            headline: {
              medianPrice: 2500000,
              totalProperties: 120,
              totalVolume: 300000000,
              rating: "A",
              yoyPriceChange: 0.08,
            },
            highlights: ["8% YoY growth", "A-rated market"],
            narrative: "Naples luxury market remains strong.",
          },
        },
      ];

      render(React.createElement(InsightsIndex, { metadata, sections }));

      const headings = screen.getAllByText("At a Glance");
      expect(headings.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("120")).toBeInTheDocument();
    });

    it("handles missing market overview gracefully", async () => {
      const { InsightsIndex } = await import(
        "@/lib/pdf/templates/insights-index"
      );

      const metadata = {
        generatedAt: "2026-03-09T00:00:00Z",
        totalDurationMs: 0,
        agentDurations: {},
        confidence: {
          level: "unknown",
          sampleSize: 0,
          staleDataSources: [],
        },
      };

      render(
        React.createElement(InsightsIndex, {
          metadata,
          sections: [],
        })
      );

      const headings = screen.getAllByText("Market Intelligence Summary");
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Document assembly", () => {
    it("ReportDocument includes TOC and InsightsIndex", () => {
      const documentContent = fs.readFileSync(
        path.join(process.cwd(), "lib/pdf/document.tsx"),
        "utf8"
      );
      expect(documentContent).toContain("TableOfContents");
      expect(documentContent).toContain("InsightsIndex");
    });

    it("TOC is rendered after cover page", () => {
      const documentContent = fs.readFileSync(
        path.join(process.cwd(), "lib/pdf/document.tsx"),
        "utf8"
      );
      const coverIdx = documentContent.indexOf("CoverPage");
      const tocIdx = documentContent.indexOf("TableOfContents");
      expect(coverIdx).toBeGreaterThan(-1);
      expect(tocIdx).toBeGreaterThan(-1);
      expect(tocIdx).toBeGreaterThan(coverIdx);
    });

    it("InsightsIndex is rendered after TOC", () => {
      const documentContent = fs.readFileSync(
        path.join(process.cwd(), "lib/pdf/document.tsx"),
        "utf8"
      );
      const tocIdx = documentContent.indexOf("TableOfContents");
      const insightsIdx = documentContent.indexOf("InsightsIndex");
      expect(insightsIdx).toBeGreaterThan(tocIdx);
    });

    it("Section pages come after InsightsIndex", () => {
      const documentContent = fs.readFileSync(
        path.join(process.cwd(), "lib/pdf/document.tsx"),
        "utf8"
      );
      const insightsIdx = documentContent.indexOf("InsightsIndex");
      const sectionMapIdx = documentContent.indexOf("filteredSections.map");
      expect(sectionMapIdx).toBeGreaterThan(insightsIdx);
    });
  });
});
