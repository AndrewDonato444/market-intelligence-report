import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require("react");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, screen } = require("@testing-library/react");

describe("View Report Read-Only", () => {
  describe("PG-RO-01: Report detail page does NOT render ReportEditor", () => {
    it("does not import ReportEditor component", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf-8"
      );
      expect(content).not.toContain("ReportEditor");
    });

    it("does not import report-editor module", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf-8"
      );
      expect(content).not.toContain("report-editor");
    });

    it("still imports ReportPreview", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf-8"
      );
      expect(content).toContain("ReportPreview");
    });

    it("still imports ReportActions", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf-8"
      );
      expect(content).toContain("ReportActions");
    });
  });

  describe("CMP-RO-02: disclaimer_methodology silently skipped", () => {
    it("returns null for disclaimer_methodology sections (removed from report)", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "disclaimer_methodology",
        title: "Disclaimer & Methodology",
        content: {
          narrative: "This report was generated using proprietary algorithms.",
          methodology: "Data sourced from MLS records and public filings.",
        },
      };

      const { container } = render(
        React.createElement(SectionRenderer, { section })
      );

      // Should render nothing — section is silently skipped
      expect(container.innerHTML).toBe("");
    });
  });

  describe("CMP-RO-03: GenericSectionRenderer avoids JSON dumps", () => {
    it("renders narrative from unknown section types", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "some_future_type",
        title: "Future Section",
        content: {
          narrative: "This is a future section with narrative text.",
          highlights: ["Point one", "Point two"],
        },
      };

      render(React.createElement(SectionRenderer, { section }));

      expect(screen.getByText("Future Section")).toBeInTheDocument();
      expect(
        screen.getByText("This is a future section with narrative text.")
      ).toBeInTheDocument();
      expect(screen.getByText("Point one")).toBeInTheDocument();
    });

    it("does NOT show raw JSON for unknown sections with narrative", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "some_future_type",
        title: "Future Section",
        content: {
          narrative: "Narrative text here.",
        },
      };

      const { container } = render(
        React.createElement(SectionRenderer, { section })
      );

      const preElements = container.querySelectorAll("pre");
      expect(preElements.length).toBe(0);
    });

    it("shows fallback message for unknown sections with no narrative", async () => {
      const { SectionRenderer } = await import(
        "@/components/reports/report-preview"
      );
      const section = {
        sectionType: "some_opaque_type",
        title: "Opaque Section",
        content: {
          rawData: { nested: "object" },
        },
      };

      const { container } = render(
        React.createElement(SectionRenderer, { section })
      );

      // Should NOT have a <pre> JSON dump
      const preElements = container.querySelectorAll("pre");
      expect(preElements.length).toBe(0);

      // Should show a fallback message
      expect(
        screen.getByText(/available in (?:the )?PDF/i)
      ).toBeInTheDocument();
    });
  });

  describe("CMP-RO-04: No edit buttons in preview", () => {
    it("ReportPreview does not render any Edit buttons", async () => {
      const { ReportPreview } = await import(
        "@/components/reports/report-preview"
      );
      const sections = [
        {
          sectionType: "market_overview",
          title: "Market Overview",
          content: {
            narrative: "Overview text",
            highlights: ["Growth trend"],
            recommendations: [],
          },
        },
        {
          sectionType: "executive_summary",
          title: "Executive Summary",
          content: {
            narrative: "Summary text",
            highlights: [],
          },
        },
      ];

      render(React.createElement(ReportPreview, { sections }));

      const editButtons = screen.queryAllByText("Edit");
      expect(editButtons.length).toBe(0);
    });
  });
});
