import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

describe("Report Templates", () => {
  describe("Database schema", () => {
    it("has reportTemplates table", async () => {
      const schemaModule = await import("@/lib/db/schema");
      expect(schemaModule.reportTemplates).toBeDefined();
    });

    it("reportTemplates has required columns", async () => {
      const schemaModule = await import("@/lib/db/schema");
      const table = schemaModule.reportTemplates;
      expect(table.userId).toBeDefined();
      expect(table.name).toBeDefined();
      expect(table.marketId).toBeDefined();
      expect(table.config).toBeDefined();
    });
  });

  describe("Template service", () => {
    it("has report-templates service file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/report-templates.ts")
        )
      ).toBe(true);
    });

    it("exports getTemplates function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-templates.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function getTemplates");
    });

    it("exports createTemplate function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-templates.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function createTemplate");
    });

    it("exports deleteTemplate function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/report-templates.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function deleteTemplate");
    });
  });

  describe("Template API route", () => {
    it("has templates API route file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/templates/route.ts")
        )
      ).toBe(true);
    });
  });

  describe("TemplateList component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("has template-list component file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/reports/template-list.tsx")
        )
      ).toBe(true);
    });

    it("renders templates with name and market", async () => {
      const { TemplateList } = await import(
        "@/components/reports/template-list"
      );

      render(
        React.createElement(TemplateList, {
          templates: [
            {
              id: "tpl-1",
              name: "Naples Monthly",
              marketName: "Naples, FL",
              createdAt: "2026-03-09T00:00:00Z",
            },
            {
              id: "tpl-2",
              name: "Aspen Quarterly",
              marketName: "Aspen, CO",
              createdAt: "2026-03-08T00:00:00Z",
            },
          ],
        })
      );

      expect(screen.getByText("Naples Monthly")).toBeInTheDocument();
      expect(screen.getByText("Aspen Quarterly")).toBeInTheDocument();
      expect(screen.getByText(/Naples, FL/)).toBeInTheDocument();
    });

    it("renders empty state", async () => {
      const { TemplateList } = await import(
        "@/components/reports/template-list"
      );

      render(
        React.createElement(TemplateList, {
          templates: [],
        })
      );

      expect(screen.getByText(/No templates/i)).toBeInTheDocument();
    });
  });

  describe("SaveTemplateDialog component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("has save-template-dialog component file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/reports/save-template-dialog.tsx"
          )
        )
      ).toBe(true);
    });

    it("renders template name input and save button", async () => {
      const { SaveTemplateDialog } = await import(
        "@/components/reports/save-template-dialog"
      );

      render(
        React.createElement(SaveTemplateDialog, {
          reportId: "rpt-1",
          onSave: jest.fn(),
          onClose: jest.fn(),
        })
      );

      expect(screen.getByPlaceholderText(/template name/i)).toBeInTheDocument();
      expect(screen.getByText(/Save Template/i)).toBeInTheDocument();
    });
  });
});
