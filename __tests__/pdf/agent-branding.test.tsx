import "@testing-library/jest-dom";

describe("Agent Branding Injection", () => {
  describe("Extended AgentBranding interface", () => {
    it("AgentBranding includes brandColors, phone, email, title, disclaimer", async () => {
      const mod = await import("@/lib/pdf/document");

      // Type check — create a full branding object
      const branding: Parameters<typeof mod.ReportDocument>[0]["branding"] = {
        name: "Victoria Ashford",
        company: "Ashford & Associates",
        logoUrl: "https://example.com/logo.png",
        brandColors: { primary: "#1A1A2E", accent: "#E94560" },
        phone: "(239) 555-0100",
        email: "victoria@ashford.com",
        title: "Senior Luxury Advisor",
        disclaimer: "All data is for informational purposes only.",
      };

      expect(branding.brandColors).toBeDefined();
      expect(branding.phone).toBeDefined();
      expect(branding.email).toBeDefined();
      expect(branding.title).toBeDefined();
      expect(branding.disclaimer).toBeDefined();
    });
  });

  describe("Cover page with contact info", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders agent name, title, company, phone, and email", async () => {
      const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

      render(
        React.createElement(CoverPage, {
          title: "Naples Market Report",
          marketName: "Naples, FL",
          agentName: "Victoria Ashford",
          company: "Ashford & Associates",
          generatedAt: "2026-03-09T00:00:00Z",
          logoUrl: "https://example.com/logo.png",
          phone: "(239) 555-0100",
          email: "victoria@ashford.com",
          agentTitle: "Senior Luxury Advisor",
        })
      );

      expect(screen.getByText(/Victoria Ashford/)).toBeInTheDocument();
      expect(screen.getByText(/Ashford & Associates/)).toBeInTheDocument();
      expect(screen.getByText(/239.*555.*0100/)).toBeInTheDocument();
      expect(screen.getByText(/victoria@ashford.com/)).toBeInTheDocument();
      expect(screen.getByText(/Senior Luxury Advisor/)).toBeInTheDocument();
    });

    it("renders without optional contact fields", async () => {
      const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

      expect(() => {
        render(
          React.createElement(CoverPage, {
            title: "Naples Market Report",
            marketName: "Naples, FL",
            agentName: "Alex Rivera",
            generatedAt: "2026-03-09T00:00:00Z",
          })
        );
      }).not.toThrow();
    });
  });

  describe("Section page footer with company name", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("shows company name in section page footer", async () => {
      const { SectionPage } = await import(
        "@/lib/pdf/templates/section-page"
      );

      render(
        React.createElement(SectionPage, {
          section: {
            sectionType: "market_overview",
            title: "Market Overview",
            content: { narrative: "Test." },
          },
          reportTitle: "Naples Report",
          companyName: "Ashford & Associates",
        })
      );

      expect(
        screen.getAllByText(/Ashford & Associates/).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Metadata page with disclaimer", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("shows disclaimer text on metadata page", async () => {
      const { MetadataPage } = await import(
        "@/lib/pdf/templates/metadata-page"
      );

      render(
        React.createElement(MetadataPage, {
          metadata: {
            generatedAt: "2026-03-09T00:00:00Z",
            totalDurationMs: 30000,
            agentDurations: {},
            confidence: {
              level: "high",
              sampleSize: 500,
              staleDataSources: [],
            },
          },
          pullQuotes: [],
          reportTitle: "Naples Report",
          disclaimer: "All data is for informational purposes only.",
        })
      );

      expect(
        screen.getByText(/informational purposes only/)
      ).toBeInTheDocument();
    });
  });

  describe("Brand colors override defaults", () => {
    it("createBrandedColors returns custom colors when provided", async () => {
      const { createBrandedColors, COLORS } = await import(
        "@/lib/pdf/styles"
      );

      const custom = createBrandedColors({
        primary: "#1A1A2E",
        accent: "#E94560",
      });

      expect(custom.primary).toBe("#1A1A2E");
      expect(custom.accent).toBe("#E94560");
      // Non-overridden colors stay default
      expect(custom.success).toBe(COLORS.success);
    });

    it("createBrandedColors returns defaults when no colors provided", async () => {
      const { createBrandedColors, COLORS } = await import(
        "@/lib/pdf/styles"
      );

      const defaults = createBrandedColors();
      expect(defaults.primary).toBe(COLORS.primary);
      expect(defaults.accent).toBe(COLORS.accent);
    });
  });

  describe("ReportDocument passes branding through", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render } = require("@testing-library/react");

    it("renders with full branding without errors", async () => {
      const { ReportDocument } = await import("@/lib/pdf/document");

      const reportData = {
        sections: [
          {
            sectionType: "market_overview",
            title: "Market Overview",
            content: { narrative: "Test narrative." },
          },
        ],
        pullQuotes: [],
        metadata: {
          generatedAt: "2026-03-09T00:00:00Z",
          totalDurationMs: 30000,
          agentDurations: {},
          confidence: {
            level: "high",
            sampleSize: 500,
            staleDataSources: [],
          },
        },
      };

      expect(() => {
        render(
          React.createElement(ReportDocument, {
            reportData,
            branding: {
              name: "Victoria Ashford",
              company: "Ashford & Associates",
              logoUrl: "https://example.com/logo.png",
              brandColors: { primary: "#1A1A2E", accent: "#E94560" },
              phone: "(239) 555-0100",
              email: "victoria@ashford.com",
              title: "Senior Luxury Advisor",
              disclaimer: "For informational purposes only.",
            },
            title: "Naples Report",
            marketName: "Naples, FL",
          })
        );
      }).not.toThrow();
    });
  });
});
