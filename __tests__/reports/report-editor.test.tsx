import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

describe("Report Editor", () => {
  describe("File structure", () => {
    it("has section-editor component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/section-editor.tsx")
        )
      ).toBe(true);
    });

    it("has report-editor component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/report-editor.tsx")
        )
      ).toBe(true);
    });

    it("has section update API route", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/api/reports/[id]/sections/[sectionId]/route.ts"
          )
        )
      ).toBe(true);
    });
  });

  describe("Section update service", () => {
    it("report service exports updateReportSection", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function updateReportSection");
    });
  });

  describe("SectionEditor component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports SectionEditor component", async () => {
      const mod = await import("@/components/reports/section-editor");
      expect(mod.SectionEditor).toBeDefined();
      expect(typeof mod.SectionEditor).toBe("function");
    });

    it("renders narrative textarea for market_overview section", async () => {
      const { SectionEditor } = await import(
        "@/components/reports/section-editor"
      );

      render(
        React.createElement(SectionEditor, {
          section: {
            id: "sec-1",
            sectionType: "market_overview",
            title: "Market Overview",
            content: {
              narrative: "The Naples market shows strong growth.",
              highlights: ["Strong demand"],
            },
          },
          onSave: jest.fn(),
          onCancel: jest.fn(),
        })
      );

      // Should have a textarea with the narrative text
      const textarea = screen.getByDisplayValue(
        "The Naples market shows strong growth."
      );
      expect(textarea).toBeInTheDocument();
    });

    it("renders Save and Cancel buttons", async () => {
      const { SectionEditor } = await import(
        "@/components/reports/section-editor"
      );

      render(
        React.createElement(SectionEditor, {
          section: {
            id: "sec-1",
            sectionType: "market_overview",
            title: "Market Overview",
            content: { narrative: "Text." },
          },
          onSave: jest.fn(),
          onCancel: jest.fn(),
        })
      );

      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("renders highlight list items for sections with highlights", async () => {
      const { SectionEditor } = await import(
        "@/components/reports/section-editor"
      );

      render(
        React.createElement(SectionEditor, {
          section: {
            id: "sec-1",
            sectionType: "executive_summary",
            title: "Executive Summary",
            content: {
              narrative: "Summary text.",
              highlights: ["Point A", "Point B"],
            },
          },
          onSave: jest.fn(),
          onCancel: jest.fn(),
        })
      );

      expect(screen.getByDisplayValue("Point A")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Point B")).toBeInTheDocument();
    });
  });

  describe("ReportEditor component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("exports ReportEditor component", async () => {
      const mod = await import("@/components/reports/report-editor");
      expect(mod.ReportEditor).toBeDefined();
    });

    it("renders sections with Edit buttons", async () => {
      const { ReportEditor } = await import(
        "@/components/reports/report-editor"
      );

      render(
        React.createElement(ReportEditor, {
          reportId: "rpt-1",
          sections: [
            {
              id: "sec-1",
              sectionType: "market_overview",
              title: "Market Overview",
              content: { narrative: "Text." },
              sortOrder: 1,
            },
            {
              id: "sec-2",
              sectionType: "executive_summary",
              title: "Executive Summary",
              content: { narrative: "Summary." },
              sortOrder: 2,
            },
          ],
        })
      );

      expect(screen.getByText("Market Overview")).toBeInTheDocument();
      expect(screen.getByText("Executive Summary")).toBeInTheDocument();
      expect(screen.getAllByText("Edit").length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Report detail page integration", () => {
    it("report detail page does NOT import ReportEditor (read-only view)", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/reports/[id]/page.tsx"
        ),
        "utf-8"
      );
      expect(content).not.toContain("ReportEditor");
    });
  });
});
