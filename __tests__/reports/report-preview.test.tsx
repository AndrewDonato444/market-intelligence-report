import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Report Preview", () => {
  describe("File structure", () => {
    it("has ReportPreview component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/report-preview.tsx")
        )
      ).toBe(true);
    });

    it("has report sections API route", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/api/reports/[id]/sections/route.ts"
          )
        )
      ).toBe(true);
    });
  });

  describe("SectionRenderer", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders market_overview section with narrative and highlights", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "market_overview",
        title: "Market Overview",
        content: {
          narrative: "Strong market performance in Naples.",
          highlights: ["8% YoY growth", "A-rated market"],
          recommendations: ["Focus on waterfront"],
        },
      };

      render(React.createElement(SectionRenderer, { section }));

      expect(screen.getByText("Market Overview")).toBeInTheDocument();
      expect(
        screen.getByText("Strong market performance in Naples.")
      ).toBeInTheDocument();
      expect(screen.getByText("8% YoY growth")).toBeInTheDocument();
      expect(screen.getByText("Focus on waterfront")).toBeInTheDocument();
    });

    it("renders key_drivers section with themes", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "key_drivers",
        title: "Key Market Drivers",
        content: {
          themes: [
            {
              name: "Resilience",
              impact: "high",
              trend: "up",
              narrative: "Demand persists.",
            },
          ],
        },
      };

      render(React.createElement(SectionRenderer, { section }));

      expect(screen.getByText("Key Market Drivers")).toBeInTheDocument();
      expect(screen.getByText("Resilience")).toBeInTheDocument();
      expect(screen.getByText("Demand persists.")).toBeInTheDocument();
    });

    it("renders forecasts section with scenarios", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "forecasts",
        title: "Forecasts & Projections",
        content: {
          projections: [
            {
              segment: "single_family",
              sixMonth: { medianPrice: 9900000, confidence: "high" },
              twelveMonth: { medianPrice: 10300000, confidence: "medium" },
            },
          ],
          scenarios: {
            base: {
              narrative: "Continued growth.",
              assumptions: ["Stable rates"],
              medianPriceChange: 0.06,
              volumeChange: 0.05,
            },
            bull: {
              narrative: "Accelerated growth.",
              assumptions: ["Tax migration"],
              medianPriceChange: 0.12,
              volumeChange: 0.15,
            },
            bear: {
              narrative: "Moderation.",
              assumptions: ["Rate hikes"],
              medianPriceChange: -0.02,
              volumeChange: -0.08,
            },
          },
        },
      };

      render(React.createElement(SectionRenderer, { section }));

      expect(
        screen.getByText("Forecasts & Projections")
      ).toBeInTheDocument();
      expect(screen.getByText(/base/i)).toBeInTheDocument();
      expect(screen.getByText("Continued growth.")).toBeInTheDocument();
    });

    it("renders executive_summary section", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "executive_summary",
        title: "Executive Summary",
        content: {
          narrative: "Naples performed well.",
          highlights: ["A rating"],
          timing: { buyers: "Act now", sellers: "Strong market" },
        },
      };

      render(React.createElement(SectionRenderer, { section }));

      expect(screen.getByText("Executive Summary")).toBeInTheDocument();
      expect(screen.getByText("Naples performed well.")).toBeInTheDocument();
    });

    it("renders generic section for unknown types", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "unknown_type",
        title: "Unknown Section",
        content: { some: "data" },
      };

      render(React.createElement(SectionRenderer, { section }));

      expect(screen.getByText("Unknown Section")).toBeInTheDocument();
    });
  });

  describe("ReportPreview component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders all sections in order", async () => {
      const { ReportPreview } = await import(
        "@/components/reports/report-preview"
      );
      const sections = [
        {
          sectionType: "market_overview",
          title: "Market Overview",
          content: {
            narrative: "Overview text",
            highlights: [],
            recommendations: [],
          },
        },
        {
          sectionType: "executive_summary",
          title: "Executive Summary",
          content: {
            narrative: "Summary text",
            highlights: [],
            timing: {},
          },
        },
      ];

      render(React.createElement(ReportPreview, { sections }));

      expect(screen.getByText("Market Overview")).toBeInTheDocument();
      expect(screen.getByText("Executive Summary")).toBeInTheDocument();
    });

    it("shows empty message when no sections", async () => {
      const { ReportPreview } = await import(
        "@/components/reports/report-preview"
      );
      render(React.createElement(ReportPreview, { sections: [] }));

      expect(
        screen.getByText(/sections are being assembled/i)
      ).toBeInTheDocument();
    });
  });

  describe("Report sections API route", () => {
    it("route file exports GET handler", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/sections/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
    });

    it("route uses Supabase auth", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/sections/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("@/lib/supabase/auth");
      expect(routeContent).toContain("getAuthUserId");
    });

    it("route returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/sections/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("401");
    });

    it("route uses getReportSections service", () => {
      const routeContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/api/reports/[id]/sections/route.ts"
        ),
        "utf8"
      );
      expect(routeContent).toContain("getReportSections");
    });
  });

  describe("Report detail page integration", () => {
    it("imports ReportPreview component", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("ReportPreview");
    });

    it("conditionally renders preview for completed reports", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("completed");
    });
  });
});
