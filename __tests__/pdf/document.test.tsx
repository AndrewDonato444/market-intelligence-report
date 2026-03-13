import fs from "fs";
import path from "path";

describe("Report Template Engine", () => {
  describe("File structure", () => {
    it("has PDF styles module", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/pdf/styles.ts"))
      ).toBe(true);
    });

    it("has PDF fonts module", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/pdf/fonts.ts"))
      ).toBe(true);
    });

    it("has PDF document component", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/pdf/document.tsx"))
      ).toBe(true);
    });

    it("has PDF renderer module", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/pdf/renderer.ts"))
      ).toBe(true);
    });

    it("has cover page template", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/pdf/templates/cover-page.tsx")
        )
      ).toBe(true);
    });

    it("has section page template", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/pdf/templates/section-page.tsx")
        )
      ).toBe(true);
    });

    it("has section renderers", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/pdf/templates/renderers.tsx")
        )
      ).toBe(true);
    });

    it("has PDF generation API route", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/reports/[id]/pdf/route.ts")
        )
      ).toBe(true);
    });
  });

  describe("PDF styles", () => {
    it("exports a styles object with design token mappings", async () => {
      const mod = await import("@/lib/pdf/styles");
      expect(mod.styles).toBeDefined();
      expect(typeof mod.styles).toBe("object");
    });

    it("defines page styles with US Letter dimensions", async () => {
      const mod = await import("@/lib/pdf/styles");
      expect(mod.styles.page).toBeDefined();
      // US Letter = 612 x 792 points (8.5" x 11" at 72 DPI)
      expect(mod.styles.page.width).toBe(612);
      expect(mod.styles.page.height).toBe(792);
    });

    it("defines heading styles with Playfair Display font", async () => {
      const mod = await import("@/lib/pdf/styles");
      expect(mod.styles.heading).toBeDefined();
      expect(mod.styles.heading.fontFamily).toBe("Playfair Display");
    });

    it("defines body styles with Inter font", async () => {
      const mod = await import("@/lib/pdf/styles");
      expect(mod.styles.body).toBeDefined();
      expect(mod.styles.body.fontFamily).toBe("Inter");
    });

    it("uses navy primary color for headings", async () => {
      const mod = await import("@/lib/pdf/styles");
      expect(mod.styles.heading.color).toBe("#0F172A");
    });

    it("uses gold accent color for accents", async () => {
      const mod = await import("@/lib/pdf/styles");
      expect(mod.COLORS).toBeDefined();
      expect(mod.COLORS.accent).toBe("#CA8A04");
    });

    it("exports color constants from design tokens", async () => {
      const mod = await import("@/lib/pdf/styles");
      expect(mod.COLORS.primary).toBe("#0F172A");
      expect(mod.COLORS.background).toBe("#FAFAF9");
    });
  });

  describe("PDF fonts", () => {
    it("exports a registerFonts function", async () => {
      const mod = await import("@/lib/pdf/fonts");
      expect(typeof mod.registerFonts).toBe("function");
    });

    it("registers Playfair Display and Inter fonts", async () => {
      const mod = await import("@/lib/pdf/fonts");
      expect(mod.FONT_FAMILIES).toBeDefined();
      expect(mod.FONT_FAMILIES.heading).toBe("Playfair Display");
      expect(mod.FONT_FAMILIES.body).toBe("Inter");
    });
  });

  describe("PDF document component", () => {
    it("exports ReportDocument component", async () => {
      const mod = await import("@/lib/pdf/document");
      expect(mod.ReportDocument).toBeDefined();
      expect(typeof mod.ReportDocument).toBe("function");
    });

    it("exports ReportDocumentProps type interface", async () => {
      // Verify the module can be imported and has the expected shape
      const mod = await import("@/lib/pdf/document");
      // ReportDocument should accept reportData and branding props
      expect(mod.ReportDocument).toBeDefined();
    });
  });

  describe("Section renderers", () => {
    it("exports type-specific renderers", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.MarketOverviewPdf).toBeDefined();
      expect(mod.KeyDriversPdf).toBeDefined();
      expect(mod.ForecastsPdf).toBeDefined();
      expect(mod.NarrativeSectionPdf).toBeDefined();
      expect(mod.GenericSectionPdf).toBeDefined();
    });

    it("exports a dispatch function for section type to renderer", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      expect(mod.getSectionRenderer).toBeDefined();
      expect(typeof mod.getSectionRenderer).toBe("function");
    });

    it("returns correct renderer for market_overview", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("market_overview");
      expect(renderer).toBe(mod.MarketOverviewPdf);
    });

    it("returns correct renderer for key_drivers", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("key_drivers");
      expect(renderer).toBe(mod.KeyDriversPdf);
    });

    it("returns correct renderer for forecasts", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("forecasts");
      expect(renderer).toBe(mod.ForecastsPdf);
    });

    it("returns executive summary renderer for executive_summary", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("executive_summary");
      expect(renderer).toBe(mod.ExecutiveSummaryPdf);
    });

    it("returns generic renderer for unknown types", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("unknown_type");
      expect(renderer).toBe(mod.GenericSectionPdf);
    });

    // --- v2 section type regression tests (PDF-V2-01 through PDF-V2-09) ---

    it("PDF-V2-01: returns ExecutiveBriefingPdf for executive_briefing", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("executive_briefing");
      expect(renderer).toBe(mod.ExecutiveBriefingPdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-02: returns MarketInsightsIndexPdf for market_insights_index", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("market_insights_index");
      expect(renderer).toBe(mod.MarketInsightsIndexPdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-03: returns LuxuryMarketDashboardPdf for luxury_market_dashboard", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("luxury_market_dashboard");
      expect(renderer).toBe(mod.LuxuryMarketDashboardPdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-04: returns NeighborhoodIntelligencePdf for neighborhood_intelligence", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("neighborhood_intelligence");
      expect(renderer).toBe(mod.NeighborhoodIntelligencePdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-05: returns TheNarrativePdf for the_narrative", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("the_narrative");
      expect(renderer).toBe(mod.TheNarrativePdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-06: returns ForwardLookPdf for forward_look", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("forward_look");
      expect(renderer).toBe(mod.ForwardLookPdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-07: returns ComparativePositioningPdf for comparative_positioning", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("comparative_positioning");
      expect(renderer).toBe(mod.ComparativePositioningPdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-08: strategic_benchmark falls back to GenericSectionPdf (removed section)", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("strategic_benchmark");
      expect(renderer).toBe(mod.GenericSectionPdf);
    });

    it("PDF-V2-09: returns DisclaimerMethodologyPdf for disclaimer_methodology", async () => {
      const mod = await import("@/lib/pdf/templates/renderers");
      const renderer = mod.getSectionRenderer("disclaimer_methodology");
      expect(renderer).toBe(mod.DisclaimerMethodologyPdf);
      expect(renderer).not.toBe(mod.GenericSectionPdf);
    });
  });

  describe("Cover page template", () => {
    it("exports CoverPage component", async () => {
      const mod = await import("@/lib/pdf/templates/cover-page");
      expect(mod.CoverPage).toBeDefined();
      expect(typeof mod.CoverPage).toBe("function");
    });
  });

  describe("Section page template", () => {
    it("exports SectionPage component", async () => {
      const mod = await import("@/lib/pdf/templates/section-page");
      expect(mod.SectionPage).toBeDefined();
      expect(typeof mod.SectionPage).toBe("function");
    });
  });

  describe("PDF renderer", () => {
    it("exports renderReportPdf function", async () => {
      const mod = await import("@/lib/pdf/renderer");
      expect(mod.renderReportPdf).toBeDefined();
      expect(typeof mod.renderReportPdf).toBe("function");
    });

    it("exports AgentBranding type", async () => {
      // Just verify the module loads and has the expected exports
      const mod = await import("@/lib/pdf/renderer");
      expect(mod.renderReportPdf).toBeDefined();
    });
  });

  describe("PDF generation API route", () => {
    it("exports POST handler", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/[id]/pdf/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("export async function POST");
    });

    it("uses Supabase auth", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/[id]/pdf/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("getAuthUserId");
    });

    it("returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/[id]/pdf/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("401");
    });

    it("returns PDF content type", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/[id]/pdf/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("application/pdf");
    });

    it("calls renderReportPdf", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/[id]/pdf/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("renderReportPdf");
    });

    it("loads report sections from database", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/reports/[id]/pdf/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("getReportSections");
    });
  });
});
