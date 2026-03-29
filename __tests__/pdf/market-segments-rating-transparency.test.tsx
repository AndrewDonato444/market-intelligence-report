/**
 * Market Segments Rating Transparency Tests
 *
 * Verifies that segment rating methodology is displayed inline
 * in both The Narrative and Executive Summary PDF sections.
 *
 * Spec: .specs/features/report-output-v2/market-segments-rating-transparency.feature.md
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const sampleSegments = [
  { name: "Waterfront", count: 124, medianPrice: 5_100_000, rating: "A", propertyType: "waterfront" },
  { name: "Golf Community", count: 215, medianPrice: 3_200_000, rating: "B+", propertyType: "golf_community" },
];

describe("Market Segments Rating Transparency", () => {
  describe("MSRT-01: Rating methodology constant is exported", () => {
    it("exports RATING_METHODOLOGY_TEXT from renderers", async () => {
      const { RATING_METHODOLOGY_TEXT } = await import(
        "@/lib/pdf/templates/renderers"
      );
      expect(RATING_METHODOLOGY_TEXT).toBeDefined();
      expect(RATING_METHODOLOGY_TEXT).toContain("year-over-year");
      expect(RATING_METHODOLOGY_TEXT).toContain("median price");
    });
  });

  describe("MSRT-02: Methodology describes all rating tiers", () => {
    it("includes A+ through C tier descriptions", async () => {
      const { RATING_METHODOLOGY_TEXT } = await import(
        "@/lib/pdf/templates/renderers"
      );
      // Must mention all tiers
      expect(RATING_METHODOLOGY_TEXT).toContain("A+");
      expect(RATING_METHODOLOGY_TEXT).toContain("10%");
      expect(RATING_METHODOLOGY_TEXT).toContain("5%");
      expect(RATING_METHODOLOGY_TEXT).toContain("C");
      expect(RATING_METHODOLOGY_TEXT).toMatch(/insufficient data|<\s*3/i);
    });
  });

  describe("MSRT-03: TheNarrativePdf renders methodology below segments", () => {
    it("shows methodology text when segments exist", async () => {
      const { TheNarrativePdf, RATING_METHODOLOGY_TEXT } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "the_narrative",
        title: "The Narrative",
        content: {
          editorial: "Market is strong.",
          themes: [],
          marketContext: {
            rating: "A",
            yoy: { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06 },
            segments: sampleSegments,
          },
        },
      };

      const { container } = render(
        React.createElement(TheNarrativePdf, { section })
      );

      // Segments table should render
      expect(screen.getByText("Waterfront")).toBeInTheDocument();
      expect(screen.getByText("Golf Community")).toBeInTheDocument();

      // Methodology should be present
      expect(container.textContent).toContain("How Ratings Are Calculated");
      expect(container.textContent).toContain("year-over-year");
    });
  });

  describe("MSRT-04: TheNarrativePdf hides methodology when no segments", () => {
    it("does not show methodology when segments array is empty", async () => {
      const { TheNarrativePdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "the_narrative",
        title: "The Narrative",
        content: {
          editorial: "Market is strong.",
          themes: [],
          marketContext: {
            rating: "A",
            yoy: { medianPriceChange: 0.08, volumeChange: 0.05, pricePerSqftChange: 0.06 },
            segments: [],
          },
        },
      };

      const { container } = render(
        React.createElement(TheNarrativePdf, { section })
      );

      expect(container.textContent).not.toContain("How Ratings Are Calculated");
    });
  });

  describe("MSRT-05: ExecutiveSummaryPdf renders methodology below matrix", () => {
    it("shows methodology text when segments exist", async () => {
      const { ExecutiveSummaryPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "executive_summary",
        title: "Executive Summary",
        content: {
          narrative: "Strong market performance.",
          highlights: ["8% YoY growth"],
          segments: sampleSegments.map(({ propertyType, ...rest }) => rest),
          overallRating: "A",
        },
      };

      const { container } = render(
        React.createElement(ExecutiveSummaryPdf, { section })
      );

      // Segments table should render
      expect(screen.getByText("Waterfront")).toBeInTheDocument();

      // Methodology should be present
      expect(container.textContent).toContain("How Ratings Are Calculated");
      expect(container.textContent).toContain("year-over-year");
    });
  });

  describe("MSRT-06: ExecutiveSummaryPdf hides methodology when no segments", () => {
    it("does not show methodology when segments are absent", async () => {
      const { ExecutiveSummaryPdf } = await import(
        "@/lib/pdf/templates/renderers"
      );

      const section = {
        sectionType: "executive_summary",
        title: "Executive Summary",
        content: {
          narrative: "Strong market performance.",
          highlights: [],
        },
      };

      const { container } = render(
        React.createElement(ExecutiveSummaryPdf, { section })
      );

      expect(container.textContent).not.toContain("How Ratings Are Calculated");
    });
  });
});
