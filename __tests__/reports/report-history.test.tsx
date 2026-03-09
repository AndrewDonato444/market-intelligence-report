import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

describe("Report History + Versioning", () => {
  describe("Database schema", () => {
    it("has reportEditHistory table", async () => {
      const schemaModule = await import("@/lib/db/schema");
      expect(schemaModule.reportEditHistory).toBeDefined();
    });

    it("reportEditHistory has required columns", async () => {
      const schemaModule = await import("@/lib/db/schema");
      const table = schemaModule.reportEditHistory;
      expect(table.reportId).toBeDefined();
      expect(table.sectionId).toBeDefined();
      expect(table.previousContent).toBeDefined();
      expect(table.editedAt).toBeDefined();
    });
  });

  describe("Report history service", () => {
    it("has report-history service file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/report-history.ts")
        )
      ).toBe(true);
    });

    it("exports getReportHistory function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-history.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function getReportHistory");
    });

    it("exports recordSectionEdit function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-history.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function recordSectionEdit");
    });
  });

  describe("History API route", () => {
    it("has history route file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/api/reports/[id]/history/route.ts"
          )
        )
      ).toBe(true);
    });
  });

  describe("Report service version increment", () => {
    it("updateReportSection increments version", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report.ts"),
        "utf-8"
      );
      // Should update the report version when editing
      expect(content).toContain("version");
      expect(content).toContain("recordSectionEdit");
    });
  });

  describe("ReportHistory component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("has report-history component file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/report-history.tsx")
        )
      ).toBe(true);
    });

    it("exports ReportHistory component", async () => {
      const mod = await import("@/components/reports/report-history");
      expect(mod.ReportHistory).toBeDefined();
    });

    it("renders edit history entries", async () => {
      const { ReportHistory } = await import(
        "@/components/reports/report-history"
      );

      render(
        React.createElement(ReportHistory, {
          history: [
            {
              id: "edit-1",
              sectionTitle: "Market Overview",
              editedAt: "2026-03-09T12:00:00Z",
              sectionType: "market_overview",
            },
            {
              id: "edit-2",
              sectionTitle: "Executive Summary",
              editedAt: "2026-03-09T11:00:00Z",
              sectionType: "executive_summary",
            },
          ],
        })
      );

      expect(screen.getByText(/Market Overview/)).toBeInTheDocument();
      expect(screen.getByText(/Executive Summary/)).toBeInTheDocument();
    });

    it("renders empty state when no history", async () => {
      const { ReportHistory } = await import(
        "@/components/reports/report-history"
      );

      render(
        React.createElement(ReportHistory, {
          history: [],
        })
      );

      expect(screen.getByText(/No edits/i)).toBeInTheDocument();
    });
  });
});
