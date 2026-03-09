import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

describe("PDF Export + Digital Sharing Links", () => {
  describe("Database schema has share fields", () => {
    it("reports table has shareToken and shareTokenExpiresAt columns", async () => {
      const schemaModule = await import("@/lib/db/schema");
      const reports = schemaModule.reports;

      // Verify share columns exist
      expect(reports.shareToken).toBeDefined();
      expect(reports.shareTokenExpiresAt).toBeDefined();
    });
  });

  describe("Report sharing service", () => {
    it("has report-sharing service file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/report-sharing.ts")
        )
      ).toBe(true);
    });

    it("exports generateShareToken function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-sharing.ts"),
        "utf-8"
      );
      expect(content).toContain("export function generateShareToken");
    });

    it("generateShareToken uses crypto.randomBytes for secure tokens", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-sharing.ts"),
        "utf-8"
      );
      expect(content).toContain("crypto.randomBytes");
      expect(content).toContain('toString("hex")');
    });

    it("exports createShareLink, revokeShareLink, getReportByShareToken", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-sharing.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function createShareLink");
      expect(content).toContain("export async function revokeShareLink");
      expect(content).toContain("export async function getReportByShareToken");
    });
  });

  describe("Share API route exists", () => {
    it("has share route file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/api/reports/[id]/share/route.ts"
          )
        )
      ).toBe(true);
    });
  });

  describe("Public share route exists", () => {
    it("has public share token route file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/api/reports/share/[token]/route.ts"
          )
        )
      ).toBe(true);
    });
  });

  describe("ReportActions component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("has report-actions component file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/report-actions.tsx")
        )
      ).toBe(true);
    });

    it("renders Download PDF button", async () => {
      const { ReportActions } = await import(
        "@/components/reports/report-actions"
      );

      render(
        React.createElement(ReportActions, {
          reportId: "test-report-id",
          reportTitle: "Naples Market Report",
        })
      );

      expect(screen.getByText(/Download PDF/)).toBeInTheDocument();
    });

    it("renders Share Report button", async () => {
      const { ReportActions } = await import(
        "@/components/reports/report-actions"
      );

      render(
        React.createElement(ReportActions, {
          reportId: "test-report-id",
          reportTitle: "Naples Market Report",
        })
      );

      expect(screen.getByText(/Share/i)).toBeInTheDocument();
    });

    it("renders share link when shareToken is provided", async () => {
      const { ReportActions } = await import(
        "@/components/reports/report-actions"
      );

      render(
        React.createElement(ReportActions, {
          reportId: "test-report-id",
          reportTitle: "Naples Market Report",
          shareToken: "abc123def456",
        })
      );

      expect(screen.getByText(/abc123def456/)).toBeInTheDocument();
    });
  });

  describe("Report detail page includes ReportActions", () => {
    it("report detail page file imports ReportActions", async () => {
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
});
