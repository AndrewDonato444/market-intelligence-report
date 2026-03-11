import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

const cwd = process.cwd();

describe("Unified Market Creation", () => {
  // -------------------------------------------------------------------------
  // Markets page links
  // -------------------------------------------------------------------------
  describe("Markets page links point to /markets/new", () => {
    let marketsPageContent: string;

    beforeAll(() => {
      marketsPageContent = fs.readFileSync(
        path.join(cwd, "app/(protected)/markets/page.tsx"),
        "utf-8"
      );
    });

    it("CMP-MKT-01: header button links to /markets/new", () => {
      expect(marketsPageContent).toContain('href="/markets/new"');
    });

    it("CMP-MKT-02: has at least two links to /markets/new (header + empty state)", () => {
      const matches = marketsPageContent.match(/href="\/markets\/new"/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // /markets/new uses MarketCreationShell (not MarketWizard)
  // -------------------------------------------------------------------------
  describe("/markets/new uses MarketCreationShell", () => {
    let newPageContent: string;

    beforeAll(() => {
      newPageContent = fs.readFileSync(
        path.join(cwd, "app/(protected)/markets/new/page.tsx"),
        "utf-8"
      );
    });

    it("CMP-MKT-03: imports MarketCreationShell", () => {
      expect(newPageContent).toContain("MarketCreationShell");
    });

    it("CMP-MKT-04: does not import MarketWizard", () => {
      expect(newPageContent).not.toContain("MarketWizard");
    });
  });

  // -------------------------------------------------------------------------
  // /markets/[id]/edit uses MarketCreationShell
  // -------------------------------------------------------------------------
  describe("/markets/[id]/edit uses MarketCreationShell", () => {
    let editPageContent: string;

    beforeAll(() => {
      editPageContent = fs.readFileSync(
        path.join(cwd, "app/(protected)/markets/[id]/edit/page.tsx"),
        "utf-8"
      );
    });

    it("CMP-MKT-05: imports MarketCreationShell", () => {
      expect(editPageContent).toContain("MarketCreationShell");
    });

    it("CMP-MKT-06: does not import MarketWizard", () => {
      expect(editPageContent).not.toContain("MarketWizard");
    });

    it("CMP-MKT-07: passes mode='edit'", () => {
      expect(editPageContent).toContain('mode="edit"');
    });

    it("CMP-MKT-08: passes marketId prop", () => {
      expect(editPageContent).toContain("marketId=");
    });
  });

  // -------------------------------------------------------------------------
  // MarketCreationShell exists and uses step components
  // -------------------------------------------------------------------------
  describe("MarketCreationShell component", () => {
    let shellContent: string;

    beforeAll(() => {
      shellContent = fs.readFileSync(
        path.join(cwd, "components/markets/market-creation-shell.tsx"),
        "utf-8"
      );
    });

    it("CMP-MKT-09: file exists", () => {
      expect(
        fs.existsSync(
          path.join(cwd, "components/markets/market-creation-shell.tsx")
        )
      ).toBe(true);
    });

    it("CMP-MKT-10: imports StepYourMarket", () => {
      expect(shellContent).toContain("StepYourMarket");
    });

    it("CMP-MKT-11: imports StepYourTier", () => {
      expect(shellContent).toContain("StepYourTier");
    });

    it("CMP-MKT-12: imports StepYourFocus", () => {
      expect(shellContent).toContain("StepYourFocus");
    });

    it("CMP-MKT-13: imports CreationStepIndicator", () => {
      expect(shellContent).toContain("CreationStepIndicator");
    });

    it("CMP-MKT-14: has exactly 3 steps", () => {
      // Should define 3 steps in the STEPS array
      const stepsMatch = shellContent.match(/const STEPS\s*=\s*\[/);
      expect(stepsMatch).not.toBeNull();
      // Count step objects (each has a "name" key)
      const stepNames = shellContent.match(/"Your Market"|"Your Tier"|"Your Focus"/g);
      expect(stepNames).not.toBeNull();
      expect(stepNames!.length).toBe(3);
    });

    it("CMP-MKT-15: supports edit mode via props", () => {
      expect(shellContent).toMatch(/mode.*edit|initialData/);
    });

    it("CMP-MKT-16: calls POST /api/markets for new markets", () => {
      expect(shellContent).toContain("/api/markets");
      expect(shellContent).toContain("POST");
    });

    it("CMP-MKT-17: calls PUT /api/markets for edits", () => {
      expect(shellContent).toContain("PUT");
    });

    it("CMP-MKT-18: redirects to /markets after save", () => {
      expect(shellContent).toContain("/markets");
    });
  });

  // -------------------------------------------------------------------------
  // Legacy wizard is removed
  // -------------------------------------------------------------------------
  describe("Legacy MarketWizard is removed", () => {
    it("CMP-MKT-19: market-wizard.tsx does not exist", () => {
      expect(
        fs.existsSync(
          path.join(cwd, "components/markets/market-wizard.tsx")
        )
      ).toBe(false);
    });

    it("CMP-MKT-20: no production code imports MarketWizard", () => {
      const dirsToCheck = ["app", "components"];
      const importFound = dirsToCheck.some((dir) => {
        const fullDir = path.join(cwd, dir);
        if (!fs.existsSync(fullDir)) return false;
        return findImportInDir(fullDir, "MarketWizard");
      });
      expect(importFound).toBe(false);
    });

    it("CMP-MKT-21: legacy step-indicator.tsx does not exist", () => {
      expect(
        fs.existsSync(
          path.join(cwd, "components/markets/step-indicator.tsx")
        )
      ).toBe(false);
    });
  });
});

/** Recursively search a directory for .tsx/.ts files containing an import of `name` */
function findImportInDir(dir: string, name: string): boolean {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (findImportInDir(fullPath, name)) return true;
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes("import") && content.includes(name)) {
        if (fullPath.includes("__tests__")) continue;
        return true;
      }
    }
  }
  return false;
}
