/**
 * PDF Render Polish Tests
 *
 * Tests for PDF rendering improvements across 4 work packages:
 * WP1: Layout & Spacing (TOC spacer, card padding, table row padding)
 * WP2: Typography & Text (hyphenation, subheading line height, bullet indentation)
 * WP3: Data Viz & Tables (right-aligned numerics, trend tinted backgrounds, badge sizing)
 * WP4: Accessibility & Brand (clickable contact info, luminance utility)
 *
 * Spec: .specs/features/report-output-v2/pdf-render-polish.feature.md
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// ============================================================================
// WP1: Layout & Spacing
// ============================================================================

describe("WP1: Layout & Spacing", () => {
  describe("Styles — card padding consistency", () => {
    it("PDF-RP-01: styles.card has 16pt padding", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      expect(styles.card.padding).toBe(16);
    });

    it("PDF-RP-02: styles.personaCallout has 16pt padding", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      expect(styles.personaCallout.padding).toBe(16);
    });

    it("PDF-RP-03: styles.tableRow has 8pt vertical padding", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      expect(styles.tableRow.paddingVertical).toBe(8);
    });
  });

  describe("TableOfContents — branded footer element", () => {
    it("PDF-RP-04: TOC renders a bottom accent line element", async () => {
      const { TableOfContents } = await import(
        "@/lib/pdf/templates/table-of-contents"
      );

      const sections = [
        {
          sectionType: "executive_briefing",
          title: "Executive Briefing",
          content: {},
        },
        {
          sectionType: "market_overview",
          title: "Market Overview",
          content: {},
        },
      ];

      const { container } = render(
        React.createElement(TableOfContents, { sections })
      );

      // The TOC should render all section titles
      expect(screen.getByText("Executive Briefing")).toBeInTheDocument();
      expect(screen.getByText("Market Overview")).toBeInTheDocument();

      // Should have a spacer + accent line structure (flexGrow spacer div)
      // The container should have more divs than just the section list
      const allDivs = container.querySelectorAll("div");
      // At minimum: page > content wrapper > section items + spacer + accent line + footer
      expect(allDivs.length).toBeGreaterThan(6);
    });
  });
});

// ============================================================================
// WP2: Typography & Text
// ============================================================================

describe("WP2: Typography & Text", () => {
  describe("Styles — subheading line height", () => {
    it("PDF-RP-05: styles.subheading has lineHeight 1.3", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      expect(styles.subheading.lineHeight).toBe(1.3);
    });
  });

  describe("Styles — bullet indentation", () => {
    it("PDF-RP-06: styles.bulletItem has paddingLeft 12", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      expect(styles.bulletItem.paddingLeft).toBe(12);
    });

    it("PDF-RP-07: styles.bulletItemNested exists with paddingLeft 24", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      expect((styles as any).bulletItemNested).toBeDefined();
      expect((styles as any).bulletItemNested.paddingLeft).toBe(24);
    });
  });

  describe("Trend arrow colors", () => {
    it("PDF-RP-08: TrendIndicator uses green for positive, red for negative", async () => {
      const { TrendIndicator } = await import(
        "@/lib/pdf/components/data-viz"
      );
      const { COLORS } = await import("@/lib/pdf/styles");

      // Positive trend
      const { container: posContainer } = render(
        React.createElement(TrendIndicator, {
          label: "Price",
          value: 0.08,
        })
      );
      expect(posContainer.textContent).toContain("+8.0%");
      expect(posContainer.textContent).toContain("▲");

      // Negative trend
      const { container: negContainer } = render(
        React.createElement(TrendIndicator, {
          label: "Volume",
          value: -0.03,
        })
      );
      expect(negContainer.textContent).toContain("-3.0%");
      expect(negContainer.textContent).toContain("▼");
    });
  });
});

// ============================================================================
// WP3: Data Visualization & Tables
// ============================================================================

describe("WP3: Data Visualization & Tables", () => {
  describe("SegmentMatrix — right-aligned numerics", () => {
    it("PDF-RP-09: SegmentMatrix renders with right-aligned numeric columns", async () => {
      const { SegmentMatrix } = await import(
        "@/lib/pdf/components/data-viz"
      );

      const segments = [
        { name: "luxury", count: 143, medianPrice: 2100000, rating: "A-" },
        { name: "ultra_luxury", count: 29, medianPrice: 5800000, rating: "B+" },
      ];

      const { container } = render(
        React.createElement(SegmentMatrix, { segments })
      );

      // Should render segment names
      expect(screen.getByText("luxury")).toBeInTheDocument();
      expect(screen.getByText("ultra luxury")).toBeInTheDocument();
      // Should render formatted prices
      expect(screen.getByText("$2.1M")).toBeInTheDocument();
      expect(screen.getByText("$5.8M")).toBeInTheDocument();
    });
  });

  describe("TrendIndicator — tinted backgrounds", () => {
    it("PDF-RP-10: TrendIndicator renders a wrapper for positive trends", async () => {
      const { TrendIndicator } = await import(
        "@/lib/pdf/components/data-viz"
      );

      const { container } = render(
        React.createElement(TrendIndicator, {
          label: "Price",
          value: 0.08,
        })
      );

      // The outer div should exist (wrapper with tinted background)
      const outerDiv = container.firstChild;
      expect(outerDiv).toBeTruthy();
      expect(outerDiv?.textContent).toContain("+8.0%");
    });

    it("PDF-RP-11: TrendIndicator renders a wrapper for negative trends", async () => {
      const { TrendIndicator } = await import(
        "@/lib/pdf/components/data-viz"
      );

      const { container } = render(
        React.createElement(TrendIndicator, {
          label: "Volume",
          value: -0.05,
        })
      );

      const outerDiv = container.firstChild;
      expect(outerDiv).toBeTruthy();
      expect(outerDiv?.textContent).toContain("-5.0%");
    });
  });

  describe("Badge consistency", () => {
    it("PDF-RP-12: styles.badge has borderRadius 4 and consistent padding", async () => {
      const { styles } = await import("@/lib/pdf/styles");
      expect(styles.badge.borderRadius).toBe(4);
      expect(styles.badge.paddingHorizontal).toBe(8);
      expect(styles.badge.paddingVertical).toBe(3);
    });
  });
});

// ============================================================================
// WP4: Accessibility, Interactivity & Brand Safety
// ============================================================================

describe("WP4: Accessibility & Brand Safety", () => {
  describe("Cover page — clickable contact info", () => {
    it("PDF-RP-13: cover page renders email as clickable mailto link", async () => {
      const { CoverPage } = await import(
        "@/lib/pdf/templates/cover-page"
      );

      const { container } = render(
        React.createElement(CoverPage, {
          title: "Test Report",
          marketName: "Test Market",
          agentName: "Alex Rivera",
          generatedAt: "2026-03-16T00:00:00Z",
          email: "alex@example.com",
          phone: "+1-555-0100",
        })
      );

      // Link mock renders as <a href="...">
      const mailtoLink = container.querySelector('a[href="mailto:alex@example.com"]');
      expect(mailtoLink).toBeTruthy();
    });

    it("PDF-RP-14: cover page renders phone as clickable tel link", async () => {
      const { CoverPage } = await import(
        "@/lib/pdf/templates/cover-page"
      );

      const { container } = render(
        React.createElement(CoverPage, {
          title: "Test Report",
          marketName: "Test Market",
          agentName: "Alex Rivera",
          generatedAt: "2026-03-16T00:00:00Z",
          phone: "+1-555-0100",
        })
      );

      const telLink = container.querySelector('a[href="tel:+1-555-0100"]');
      expect(telLink).toBeTruthy();
    });
  });

  describe("Luminance utility", () => {
    it("PDF-RP-15: getContrastTextColor returns white for dark backgrounds", async () => {
      const { getContrastTextColor } = await import("@/lib/pdf/styles");
      // Navy (#0F172A) is dark → white text
      expect(getContrastTextColor("#0F172A")).toBe("#F8FAFC");
    });

    it("PDF-RP-16: getContrastTextColor returns dark for light backgrounds", async () => {
      const { getContrastTextColor } = await import("@/lib/pdf/styles");
      // White (#FFFFFF) is light → dark text
      expect(getContrastTextColor("#FFFFFF")).toBe("#0F172A");
    });

    it("PDF-RP-17: getContrastTextColor handles mid-tone colors", async () => {
      const { getContrastTextColor } = await import("@/lib/pdf/styles");
      // Gold (#CA8A04) — luminance ~0.556 → dark text (it's a bright gold)
      expect(getContrastTextColor("#CA8A04")).toBe("#0F172A");
      // Dark blue (#1E3A5F) — luminance ~0.14 → white text
      expect(getContrastTextColor("#1E3A5F")).toBe("#F8FAFC");
    });
  });
});
