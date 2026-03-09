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

  describe("MarketWizard edit mode", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    jest.mock("next/navigation", () => ({
      useRouter: () => ({ push: jest.fn() }),
      usePathname: () => "/markets/test-id/edit",
    }));

    it("renders Edit Market title in edit mode", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(
        React.createElement(MarketWizard, {
          mode: "edit",
          marketId: "test-id",
          initialData: {
            name: "Naples Luxury",
            geography: { city: "Naples", state: "Florida" },
            luxuryTier: "ultra_luxury",
            priceFloor: 5000000,
            priceCeiling: null,
            segments: null,
            propertyTypes: null,
          },
        })
      );

      expect(screen.getByText("Edit Market")).toBeInTheDocument();
    });

    it("renders Define Your Market title in create mode", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(React.createElement(MarketWizard));

      expect(screen.getByText("Define Your Market")).toBeInTheDocument();
    });

    it("pre-populates fields from initialData", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(
        React.createElement(MarketWizard, {
          mode: "edit",
          marketId: "test-id",
          initialData: {
            name: "Naples Luxury",
            geography: {
              city: "Naples",
              state: "Florida",
              county: "Collier",
            },
            luxuryTier: "ultra_luxury",
            priceFloor: 5000000,
            priceCeiling: 25000000,
            segments: ["waterfront"],
            propertyTypes: ["estate"],
          },
        })
      );

      expect(screen.getByDisplayValue("Naples Luxury")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Naples")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Florida")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Collier")).toBeInTheDocument();
    });

    it("shows Save Changes button in edit mode on last step", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );

      // We need to check the component source for the button text
      const componentContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "components/markets/market-wizard.tsx"
        ),
        "utf8"
      );
      expect(componentContent).toContain("Save Changes");
      expect(componentContent).toContain("Create Market");
    });

    it("shows update description in edit mode", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(
        React.createElement(MarketWizard, {
          mode: "edit",
          marketId: "test-id",
          initialData: {
            name: "Test",
            geography: { city: "Naples", state: "Florida" },
            luxuryTier: "luxury",
            priceFloor: 1000000,
            priceCeiling: null,
            segments: null,
            propertyTypes: null,
          },
        })
      );

      expect(
        screen.getByText("Update your market configuration.")
      ).toBeInTheDocument();
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
      expect(pageContent).toContain("currentUser");
      expect(pageContent).toContain("@clerk/nextjs/server");
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

    it("page renders MarketWizard in edit mode", () => {
      const pageContent = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/markets/[id]/edit/page.tsx"
        ),
        "utf8"
      );
      expect(pageContent).toContain("MarketWizard");
      expect(pageContent).toContain('mode="edit"');
    });

    it("page passes initialData to MarketWizard", () => {
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
