import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Market Configuration Persistence + Edit", () => {
  describe("File structure", () => {
    it("has market edit page", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/(protected)/markets/[id]/edit/page.tsx"
          )
        )
      ).toBe(true);
    });

    it("has individual market API route", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/markets/[id]/route.ts")
        )
      ).toBe(true);
    });

    it("has updateMarket in market service", () => {
      const serviceContent = fs.readFileSync(
        path.join(process.cwd(), "lib/services/market.ts"),
        "utf8"
      );
      expect(serviceContent).toContain("export async function updateMarket");
    });
  });

  describe("MarketCreationShell edit mode", () => {
    it("shell component has Save Changes text for edit mode", () => {
      const shellContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "components/markets/market-creation-shell.tsx"
        ),
        "utf8"
      );
      expect(shellContent).toContain("Save Changes");
      expect(shellContent).toContain("Save Market");
    });

    it("shell component has edit description text", () => {
      const shellContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "components/markets/market-creation-shell.tsx"
        ),
        "utf8"
      );
      expect(shellContent).toContain("Update the market");
    });

    it("shell component has Edit Your Market title", () => {
      const shellContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "components/markets/market-creation-shell.tsx"
        ),
        "utf8"
      );
      expect(shellContent).toContain("Edit Your Market");
    });
  });

  describe("Individual market API route", () => {
    it("route file exports GET and PUT handlers", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
      expect(routeContent).toContain("export async function PUT");
    });

    it("route uses Supabase auth", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("@/lib/supabase/auth");
      expect(routeContent).toContain("getAuthUserId");
    });

    it("route returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("401");
      expect(routeContent).toContain("Unauthorized");
    });

    it("route returns 404 when market not found", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("404");
      expect(routeContent).toContain("Market not found");
    });

    it("route returns 422 for validation errors", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("422");
      expect(routeContent).toContain("Validation failed");
    });

    it("route uses validateMarketData for PUT", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("validateMarketData");
    });

    it("route uses updateMarket service", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("updateMarket");
    });

    it("route uses getMarket service for GET", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/[id]/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("getMarket");
    });
  });

  describe("Market edit page", () => {
    it("page uses currentUser from Clerk", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/edit/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("getAuthUserId");
      expect(pageContent).toContain("@/lib/supabase/auth");
    });

    it("page uses getMarket service", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/edit/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("getMarket");
    });

    it("page renders MarketCreationShell in edit mode", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/edit/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("MarketCreationShell");
      expect(pageContent).toContain('mode="edit"');
    });

    it("page passes initialData to MarketCreationShell", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/edit/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("initialData");
      expect(pageContent).toContain("marketId");
    });

    it("page handles not found", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/edit/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("notFound");
    });
  });

  describe("Markets list page includes edit link", () => {
    it("markets list page links to edit page", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/markets/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain("/edit");
      expect(pageContent).toContain("Edit");
    });
  });

  describe("Market service has updateMarket function", () => {
    it("updateMarket updates all market fields", () => {
      const serviceContent = fs.readFileSync(
        path.join(process.cwd(), "lib/services/market.ts"),
        "utf8"
      );
      expect(serviceContent).toContain("export async function updateMarket");
      expect(serviceContent).toContain(".update(schema.markets)");
      expect(serviceContent).toContain(".set(");
    });

    it("updateMarket verifies user ownership", () => {
      const serviceContent = fs.readFileSync(
        path.join(process.cwd(), "lib/services/market.ts"),
        "utf8"
      );
      // The function checks both marketId and userId
      const updateFnMatch = serviceContent.match(
        /export async function updateMarket[\s\S]*?(?=export async function|$)/
      );
      expect(updateFnMatch).not.toBeNull();
      expect(updateFnMatch![0]).toContain("schema.markets.userId");
      expect(updateFnMatch![0]).toContain("schema.markets.id");
    });

    it("updateMarket sets updatedAt timestamp", () => {
      const serviceContent = fs.readFileSync(
        path.join(process.cwd(), "lib/services/market.ts"),
        "utf8"
      );
      const updateFnMatch = serviceContent.match(
        /export async function updateMarket[\s\S]*?(?=export async function|$)/
      );
      expect(updateFnMatch).not.toBeNull();
      expect(updateFnMatch![0]).toContain("updatedAt");
    });
  });
});
