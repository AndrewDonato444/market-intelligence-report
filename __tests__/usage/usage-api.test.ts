import fs from "fs";
import path from "path";

describe("API Usage Tracking", () => {
  describe("File structure", () => {
    it("has api-usage service", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/services/api-usage.ts"))
      ).toBe(true);
    });

    it("has usage summary API route", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "app/api/usage/route.ts"))
      ).toBe(true);
    });

    it("has usage log API route", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "app/api/usage/log/route.ts"))
      ).toBe(true);
    });
  });

  describe("api-usage service exports", () => {
    let module: typeof import("@/lib/services/api-usage");

    beforeAll(async () => {
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
      module = await import("@/lib/services/api-usage");
    });

    it("exports logApiCall function", () => {
      expect(typeof module.logApiCall).toBe("function");
    });

    it("exports getUsageSummary function", () => {
      expect(typeof module.getUsageSummary).toBe("function");
    });

    it("exports getUsageLog function", () => {
      expect(typeof module.getUsageLog).toBe("function");
    });
  });

  describe("Usage summary API route structure", () => {
    it("exports a GET handler", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/usage/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
      expect(routeContent).toContain("getUsageSummary");
      expect(routeContent).toContain("auth()");
    });

    it("checks authentication", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/usage/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("Unauthorized");
      expect(routeContent).toContain("401");
    });

    it("supports since query parameter", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/usage/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("since");
    });
  });

  describe("Usage log API route structure", () => {
    it("exports a GET handler", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/usage/log/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
      expect(routeContent).toContain("getUsageLog");
      expect(routeContent).toContain("auth()");
    });

    it("supports pagination parameters", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/usage/log/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("limit");
      expect(routeContent).toContain("offset");
    });

    it("supports provider filter", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/usage/log/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("provider");
    });
  });
});
