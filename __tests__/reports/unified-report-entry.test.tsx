import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

const cwd = process.cwd();

describe("Unified Report Entry Point", () => {
  describe("Reports page links point to /reports/create", () => {
    let reportsPageContent: string;

    beforeAll(() => {
      reportsPageContent = fs.readFileSync(
        path.join(cwd, "app/(protected)/reports/page.tsx"),
        "utf-8"
      );
    });

    it("has no links to /reports/new", () => {
      expect(reportsPageContent).not.toContain('href="/reports/new"');
    });

    it("header button links to /reports/create", () => {
      expect(reportsPageContent).toContain('href="/reports/create"');
    });

    it("has at least two links to /reports/create (header + empty state)", () => {
      const matches = reportsPageContent.match(/href="\/reports\/create"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("/reports/new redirects to /reports/create", () => {
    let newPageContent: string;

    beforeAll(() => {
      newPageContent = fs.readFileSync(
        path.join(cwd, "app/(protected)/reports/new/page.tsx"),
        "utf-8"
      );
    });

    it("contains a redirect to /reports/create", () => {
      expect(newPageContent).toContain('redirect("/reports/create")');
    });

    it("does not import ReportWizard", () => {
      expect(newPageContent).not.toContain("ReportWizard");
    });

    it("does not call getMarkets", () => {
      expect(newPageContent).not.toContain("getMarkets");
    });
  });

  describe("Legacy wizard is removed", () => {
    it("report-wizard.tsx does not exist", () => {
      expect(
        fs.existsSync(
          path.join(cwd, "components/reports/report-wizard.tsx")
        )
      ).toBe(false);
    });

    it("no production code imports ReportWizard", () => {
      // Check all tsx files in app/ and components/ for ReportWizard imports
      const dirsToCheck = ["app", "components"];
      const importFound = dirsToCheck.some((dir) => {
        const fullDir = path.join(cwd, dir);
        if (!fs.existsSync(fullDir)) return false;
        return findImportInDir(fullDir, "ReportWizard");
      });
      expect(importFound).toBe(false);
    });
  });

  describe("Creation flow exists and is the canonical entry", () => {
    it("creation flow page exists at /reports/create", () => {
      expect(
        fs.existsSync(
          path.join(cwd, "app/(protected)/reports/create/page.tsx")
        )
      ).toBe(true);
    });

    it("creation flow uses CreationFlowShell", () => {
      const createPageContent = fs.readFileSync(
        path.join(cwd, "app/(protected)/reports/create/page.tsx"),
        "utf-8"
      );
      expect(createPageContent).toContain("CreationFlowShell");
    });
  });
});

/** Recursively search a directory for .tsx files containing an import of `name` */
function findImportInDir(dir: string, name: string): boolean {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (findImportInDir(fullPath, name)) return true;
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes(`import`) && content.includes(name)) {
        // Exclude test files
        if (fullPath.includes("__tests__")) continue;
        return true;
      }
    }
  }
  return false;
}
