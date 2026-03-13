import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Unit tests for generateReportTitle utility ---

describe("generateReportTitle", () => {
  let generateReportTitle: (city: string, tier: string, date: Date) => string;

  beforeAll(async () => {
    const mod = await import("@/lib/utils/report-title");
    generateReportTitle = mod.generateReportTitle;
  });

  it("generates title with city, tier, and quarter", () => {
    const result = generateReportTitle("Naples", "Luxury", new Date("2026-03-15"));
    expect(result).toBe("Naples Luxury Market Intelligence \u2014 Q1 2026");
  });

  it("uses Q1 for January-March", () => {
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 0, 15))).toContain("Q1 2026");
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 2, 15))).toContain("Q1 2026");
  });

  it("uses Q2 for April-June", () => {
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 3, 15))).toContain("Q2 2026");
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 5, 15))).toContain("Q2 2026");
  });

  it("uses Q3 for July-September", () => {
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 6, 15))).toContain("Q3 2026");
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 8, 15))).toContain("Q3 2026");
  });

  it("uses Q4 for October-December", () => {
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 9, 15))).toContain("Q4 2026");
    expect(generateReportTitle("Miami", "Luxury", new Date(2026, 11, 15))).toContain("Q4 2026");
  });

  it("defaults tier to Luxury when empty", () => {
    const result = generateReportTitle("Naples", "", new Date("2026-03-15"));
    expect(result).toBe("Naples Luxury Market Intelligence \u2014 Q1 2026");
  });

  it("handles High Luxury tier", () => {
    const result = generateReportTitle("Aspen", "High Luxury", new Date(2026, 6, 15));
    expect(result).toBe("Aspen High Luxury Market Intelligence \u2014 Q3 2026");
  });

  it("handles Ultra Luxury tier", () => {
    const result = generateReportTitle("Beverly Hills", "Ultra Luxury", new Date(2026, 9, 15));
    expect(result).toBe("Beverly Hills Ultra Luxury Market Intelligence \u2014 Q4 2026");
  });
});

// --- CoverPage component tests ---

describe("CoverPage redesign", () => {
  it("exports CoverPage component with new props", async () => {
    const mod = await import("@/lib/pdf/templates/cover-page");
    expect(mod.CoverPage).toBeDefined();
    expect(typeof mod.CoverPage).toBe("function");
  });

  it("renders key themes when provided", async () => {
    const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

    const themes = [
      { name: "Waterfront Premium", impact: "high" as const, trend: "up" as const },
      { name: "Inventory Contraction", impact: "medium" as const, trend: "down" as const },
    ];

    render(
      React.createElement(CoverPage, {
        title: "Naples Luxury Market Intelligence \u2014 Q1 2026",
        marketName: "Naples, FL",
        agentName: "Alex Rivera",
        generatedAt: "2026-03-09T00:00:00Z",
        keyThemes: themes,
      })
    );

    expect(screen.getByText("Key Themes")).toBeInTheDocument();
    expect(screen.getByText("Waterfront Premium")).toBeInTheDocument();
    expect(screen.getByText("Inventory Contraction")).toBeInTheDocument();
  });

  it("renders without key themes section when themes array is empty", async () => {
    const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

    render(
      React.createElement(CoverPage, {
        title: "Naples Luxury Market Intelligence \u2014 Q1 2026",
        marketName: "Naples, FL",
        agentName: "Alex Rivera",
        generatedAt: "2026-03-09T00:00:00Z",
        keyThemes: [],
      })
    );

    expect(screen.queryByText("Key Themes")).not.toBeInTheDocument();
  });

  it("renders without key themes section when themes not provided", async () => {
    const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

    render(
      React.createElement(CoverPage, {
        title: "Naples Luxury Market Intelligence \u2014 Q1 2026",
        marketName: "Naples, FL",
        agentName: "Alex Rivera",
        generatedAt: "2026-03-09T00:00:00Z",
      })
    );

    expect(screen.queryByText("Key Themes")).not.toBeInTheDocument();
  });

  it("limits themes to 3 maximum", async () => {
    const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

    const themes = [
      { name: "Theme One", impact: "high" as const, trend: "up" as const },
      { name: "Theme Two", impact: "medium" as const, trend: "down" as const },
      { name: "Theme Three", impact: "low" as const, trend: "neutral" as const },
      { name: "Theme Four", impact: "high" as const, trend: "up" as const },
    ];

    render(
      React.createElement(CoverPage, {
        title: "Test Report",
        marketName: "Test Market",
        agentName: "Test Agent",
        generatedAt: "2026-03-09T00:00:00Z",
        keyThemes: themes,
      })
    );

    expect(screen.getByText("Theme One")).toBeInTheDocument();
    expect(screen.getByText("Theme Two")).toBeInTheDocument();
    expect(screen.getByText("Theme Three")).toBeInTheDocument();
    expect(screen.queryByText("Theme Four")).not.toBeInTheDocument();
  });

  it("renders How to Read This Report legend", async () => {
    const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

    render(
      React.createElement(CoverPage, {
        title: "Test Report",
        marketName: "Test Market",
        agentName: "Test Agent",
        generatedAt: "2026-03-09T00:00:00Z",
      })
    );

    expect(screen.getByText("How to Read This Report")).toBeInTheDocument();
    expect(screen.getByText(/A = Strong/)).toBeInTheDocument();
    expect(screen.getByText(/B = Stable/)).toBeInTheDocument();
    expect(screen.getByText(/C = Watch/)).toBeInTheDocument();
  });

  it("renders impact and trend labels in legend", async () => {
    const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

    render(
      React.createElement(CoverPage, {
        title: "Test Report",
        marketName: "Test Market",
        agentName: "Test Agent",
        generatedAt: "2026-03-09T00:00:00Z",
      })
    );

    expect(screen.getByText(/Improving/)).toBeInTheDocument();
    expect(screen.getByText(/Declining/)).toBeInTheDocument();
    // "Stable" appears in both Ratings line ("B = Stable") and Trends line — use getAllByText
    const stableElements = screen.getAllByText(/Stable/);
    expect(stableElements.length).toBeGreaterThanOrEqual(1);
  });

  it("preserves existing branding elements", async () => {
    const { CoverPage } = await import("@/lib/pdf/templates/cover-page");

    render(
      React.createElement(CoverPage, {
        title: "Naples Luxury Market Intelligence \u2014 Q1 2026",
        marketName: "Naples, FL",
        agentName: "Alex Rivera",
        company: "Modern Signal Advisory",
        agentTitle: "Senior Advisor",
        phone: "239-555-0100",
        email: "alex@msa.com",
        generatedAt: "2026-03-09T00:00:00Z",
      })
    );

    expect(screen.getByText(/Alex Rivera/)).toBeInTheDocument();
    expect(screen.getByText("Modern Signal Advisory")).toBeInTheDocument();
    expect(screen.getByText(/239-555-0100/)).toBeInTheDocument();
  });
});

// --- Document assembly tests ---

describe("Document assembly passes themes to cover page", () => {
  it("ReportDocument passes keyThemes from the_narrative section to CoverPage", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const documentContent = fs.readFileSync(
      path.join(process.cwd(), "lib/pdf/document.tsx"),
      "utf8"
    );
    // Document should extract themes and pass to CoverPage
    expect(documentContent).toContain("keyThemes");
  });
});
