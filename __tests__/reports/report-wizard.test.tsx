import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

// v2 required sections (7 of 10)
const V2_REQUIRED = [
  "executive_briefing",
  "market_insights_index",
  "luxury_market_dashboard",
  "neighborhood_intelligence",
  "the_narrative",
  "comparative_positioning",
  "disclaimer_methodology",
];

// v2 optional sections (3 of 10)
const V2_OPTIONAL = [
  "forward_look",
  "strategic_benchmark",
  "persona_intelligence",
];

const V2_ALL = [...V2_REQUIRED, ...V2_OPTIONAL];

describe("Report Builder Wizard", () => {
  describe("File structure", () => {
    it("has reports list page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/reports/page.tsx")
        )
      ).toBe(true);
    });

    it("has new report page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/reports/new/page.tsx")
        )
      ).toBe(true);
    });

    it("has reports API route", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "app/api/reports/route.ts"))
      ).toBe(true);
    });

    it("has report service", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/services/report.ts"))
      ).toBe(true);
    });

    it("has report validation module", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/report-validation.ts")
        )
      ).toBe(true);
    });

    it("has ReportWizard component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/report-wizard.tsx")
        )
      ).toBe(true);
    });
  });

  describe("Report validation", () => {
    let validateReportConfig: typeof import("@/lib/services/report-validation")["validateReportConfig"];

    beforeAll(async () => {
      const mod = await import("@/lib/services/report-validation");
      validateReportConfig = mod.validateReportConfig;
    });

    it("passes with valid complete config", () => {
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Naples Intelligence Report",
        sections: [...V2_REQUIRED, "forward_look"],
      });
      expect(result.success).toBe(true);
    });

    it("fails when marketId is missing", () => {
      const result = validateReportConfig({
        marketId: "",
        title: "Test Report",
        sections: V2_REQUIRED,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("marketId");
    });

    it("fails when title is empty", () => {
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "",
        sections: V2_REQUIRED,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("title");
    });

    it("fails when required sections are missing", () => {
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        sections: ["forward_look"],
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("sections");
    });

    it("requires all seven required sections", () => {
      // Missing the_narrative
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        sections: V2_REQUIRED.filter((s) => s !== "the_narrative"),
      });
      expect(result.success).toBe(false);
      expect(result.errors.sections).toContain("the_narrative");
    });

    it("fails when sections array is empty", () => {
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        sections: [],
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("sections");
    });

    it("rejects unknown section types", () => {
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test",
        sections: [...V2_REQUIRED, "bogus_section"],
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("sections");
    });

    it("trims the title", () => {
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "  Naples Report  ",
        sections: V2_REQUIRED,
      });
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Naples Report");
    });

    it("accepts all valid sections", () => {
      const result = validateReportConfig({
        marketId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Full Report",
        sections: V2_ALL,
      });
      expect(result.success).toBe(true);
      expect(result.data?.sections).toHaveLength(10);
    });
  });

  describe("Section constants", () => {
    it("exports REPORT_SECTIONS with labels and descriptions", async () => {
      const { REPORT_SECTIONS } = await import(
        "@/lib/services/report-validation"
      );
      expect(Array.isArray(REPORT_SECTIONS)).toBe(true);
      expect(REPORT_SECTIONS.length).toBe(10);

      const briefing = REPORT_SECTIONS.find(
        (s: { type: string }) => s.type === "executive_briefing"
      );
      expect(briefing).toBeDefined();
      expect(briefing).toHaveProperty("label");
      expect(briefing).toHaveProperty("description");
      expect(briefing).toHaveProperty("required");
    });

    it("marks correct sections as required", async () => {
      const { REPORT_SECTIONS } = await import(
        "@/lib/services/report-validation"
      );
      const required = REPORT_SECTIONS.filter(
        (s: { required: boolean }) => s.required
      );
      expect(required).toHaveLength(7);
      const requiredTypes = required.map((s: { type: string }) => s.type);
      expect(requiredTypes).toContain("executive_briefing");
      expect(requiredTypes).toContain("the_narrative");
      expect(requiredTypes).toContain("disclaimer_methodology");
    });

    it("exports REQUIRED_SECTIONS constant", async () => {
      const { REQUIRED_SECTIONS } = await import(
        "@/lib/services/report-validation"
      );
      expect(REQUIRED_SECTIONS).toEqual(V2_REQUIRED);
    });
  });

  describe("ReportWizard component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    jest.mock("next/navigation", () => ({
      useRouter: () => ({ push: jest.fn() }),
      usePathname: () => "/reports/new",
    }));

    const mockMarkets = [
      {
        id: "market-1",
        name: "Naples Luxury",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "ultra_luxury",
        isDefault: 1,
      },
      {
        id: "market-2",
        name: "Miami Beach Ultra",
        geography: { city: "Miami Beach", state: "Florida" },
        luxuryTier: "high_luxury",
        isDefault: 0,
      },
    ];

    it("renders the wizard title", async () => {
      const { ReportWizard } = await import(
        "@/components/reports/report-wizard"
      );
      render(React.createElement(ReportWizard, { markets: mockMarkets }));

      expect(screen.getByText("Generate Report")).toBeInTheDocument();
    });

    it("shows step indicator with three steps", async () => {
      const { ReportWizard } = await import(
        "@/components/reports/report-wizard"
      );
      render(React.createElement(ReportWizard, { markets: mockMarkets }));

      expect(screen.getByText("Market")).toBeInTheDocument();
      expect(screen.getByText("Personas")).toBeInTheDocument();
      expect(screen.getByText("Review")).toBeInTheDocument();
    });

    it("displays available markets on step 1", async () => {
      const { ReportWizard } = await import(
        "@/components/reports/report-wizard"
      );
      render(React.createElement(ReportWizard, { markets: mockMarkets }));

      expect(screen.getByText("Naples Luxury")).toBeInTheDocument();
      expect(screen.getByText("Miami Beach Ultra")).toBeInTheDocument();
    });

    it("pre-selects the default market", async () => {
      const { ReportWizard } = await import(
        "@/components/reports/report-wizard"
      );
      render(React.createElement(ReportWizard, { markets: mockMarkets }));

      // The default market (isDefault: 1) should have the accent border
      const naplesLabel = screen.getByText("Naples Luxury").closest("label");
      expect(naplesLabel?.className).toContain("accent");
    });

    it("shows empty state when no markets provided", async () => {
      const { ReportWizard } = await import(
        "@/components/reports/report-wizard"
      );
      render(React.createElement(ReportWizard, { markets: [] }));

      expect(screen.getByText(/no markets defined/i)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /create a market/i })
      ).toBeInTheDocument();
    });

    it("renders Next button on step 1", async () => {
      const { ReportWizard } = await import(
        "@/components/reports/report-wizard"
      );
      render(React.createElement(ReportWizard, { markets: mockMarkets }));

      expect(
        screen.getByRole("button", { name: /next/i })
      ).toBeInTheDocument();
    });
  });

  describe("API route", () => {
    it("route file exports GET and POST handlers", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
      expect(routeContent).toContain("export async function POST");
    });

    it("route uses Supabase auth", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("@/lib/supabase/auth");
      expect(routeContent).toContain("getAuthUserId");
    });

    it("route validates input with validateReportConfig", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("validateReportConfig");
    });

    it("route returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("401");
    });

    it("route returns 422 for validation errors", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("422");
    });

    it("route returns 201 on successful creation", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("201");
    });
  });

  describe("Reports list page", () => {
    it("includes Generate New Report link", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/reports/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain('href="/reports/new"');
      expect(pageContent).toContain("Generate New Report");
    });

    it("shows empty state when no reports exist", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/reports/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain("No reports yet");
    });

    it("uses getReports service", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/reports/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain("getReports");
    });

    it("displays report status and market name", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/reports/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain("status");
      expect(pageContent).toContain("marketName");
    });
  });
});
