import fs from "fs";
import path from "path";
import "@testing-library/jest-dom";

describe("Market Definition Wizard", () => {
  describe("File structure", () => {
    it("has markets list page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/markets/page.tsx")
        )
      ).toBe(true);
    });

    it("has new market page", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/(protected)/markets/new/page.tsx")
        )
      ).toBe(true);
    });

    it("has markets API route", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "app/api/markets/route.ts"))
      ).toBe(true);
    });

    it("has market service", () => {
      expect(
        fs.existsSync(path.join(process.cwd(), "lib/services/market.ts"))
      ).toBe(true);
    });

    it("has market validation module", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/market-validation.ts")
        )
      ).toBe(true);
    });

    it("has MarketWizard component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/markets/market-wizard.tsx")
        )
      ).toBe(true);
    });

    it("has StepIndicator component", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/markets/step-indicator.tsx")
        )
      ).toBe(true);
    });
  });

  describe("Market validation", () => {
    let validateMarketData: typeof import("@/lib/services/market-validation")["validateMarketData"];

    beforeAll(async () => {
      const mod = await import("@/lib/services/market-validation");
      validateMarketData = mod.validateMarketData;
    });

    it("passes with valid complete data", () => {
      const result = validateMarketData({
        name: "Naples Luxury",
        geography: { city: "Naples", state: "Florida", county: "Collier" },
        luxuryTier: "ultra_luxury",
        priceFloor: 5000000,
        priceCeiling: 25000000,
        segments: ["waterfront"],
        propertyTypes: ["single_family"],
      });
      expect(result.success).toBe(true);
    });

    it("fails when name is empty", () => {
      const result = validateMarketData({
        name: "",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "luxury",
        priceFloor: 1000000,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("name");
    });

    it("fails when city is missing", () => {
      const result = validateMarketData({
        name: "Test",
        geography: { city: "", state: "Florida" },
        luxuryTier: "luxury",
        priceFloor: 1000000,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("city");
    });

    it("fails when state is missing", () => {
      const result = validateMarketData({
        name: "Test",
        geography: { city: "Naples", state: "" },
        luxuryTier: "luxury",
        priceFloor: 1000000,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("state");
    });

    it("fails when luxury tier is invalid", () => {
      const result = validateMarketData({
        name: "Test",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "invalid" as any,
        priceFloor: 1000000,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("luxuryTier");
    });

    it("fails when price floor is below $500K", () => {
      const result = validateMarketData({
        name: "Test",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "luxury",
        priceFloor: 100000,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("priceFloor");
    });

    it("fails when price ceiling is less than floor", () => {
      const result = validateMarketData({
        name: "Test",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "luxury",
        priceFloor: 5000000,
        priceCeiling: 3000000,
      });
      expect(result.success).toBe(false);
      expect(result.errors).toHaveProperty("priceCeiling");
    });

    it("accepts null/undefined price ceiling", () => {
      const result = validateMarketData({
        name: "Test",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "luxury",
        priceFloor: 1000000,
        priceCeiling: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts all three luxury tiers", () => {
      for (const tier of ["luxury", "high_luxury", "ultra_luxury"] as const) {
        const result = validateMarketData({
          name: "Test",
          geography: { city: "Naples", state: "Florida" },
          luxuryTier: tier,
          priceFloor: 1000000,
        });
        expect(result.success).toBe(true);
      }
    });

    it("trims geography fields", () => {
      const result = validateMarketData({
        name: "  Test Market  ",
        geography: {
          city: "  Naples  ",
          state: "  Florida  ",
          county: "  Collier  ",
        },
        luxuryTier: "luxury",
        priceFloor: 1000000,
      });
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("Test Market");
      expect(result.data?.geography.city).toBe("Naples");
      expect(result.data?.geography.state).toBe("Florida");
      expect(result.data?.geography.county).toBe("Collier");
    });

    it("allows optional segments and property types", () => {
      const result = validateMarketData({
        name: "Test",
        geography: { city: "Naples", state: "Florida" },
        luxuryTier: "luxury",
        priceFloor: 1000000,
      });
      expect(result.success).toBe(true);
      expect(result.data?.segments).toBeUndefined();
      expect(result.data?.propertyTypes).toBeUndefined();
    });
  });

  describe("Available options exports", () => {
    it("exports AVAILABLE_SEGMENTS", async () => {
      const { AVAILABLE_SEGMENTS } = await import(
        "@/lib/services/market-validation"
      );
      expect(Array.isArray(AVAILABLE_SEGMENTS)).toBe(true);
      expect(AVAILABLE_SEGMENTS.length).toBeGreaterThan(5);
      expect(AVAILABLE_SEGMENTS).toContain("waterfront");
      expect(AVAILABLE_SEGMENTS).toContain("golf course");
    });

    it("exports AVAILABLE_PROPERTY_TYPES", async () => {
      const { AVAILABLE_PROPERTY_TYPES } = await import(
        "@/lib/services/market-validation"
      );
      expect(Array.isArray(AVAILABLE_PROPERTY_TYPES)).toBe(true);
      expect(AVAILABLE_PROPERTY_TYPES.length).toBeGreaterThan(5);
      expect(AVAILABLE_PROPERTY_TYPES).toContain("single_family");
      expect(AVAILABLE_PROPERTY_TYPES).toContain("estate");
    });
  });

  describe("MarketWizard component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    // Mock next/navigation
    jest.mock("next/navigation", () => ({
      useRouter: () => ({ push: jest.fn() }),
      usePathname: () => "/markets/new",
    }));

    it("renders the wizard title", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(React.createElement(MarketWizard));

      expect(screen.getByText("Define Your Market")).toBeInTheDocument();
    });

    it("shows step 1 geography fields by default", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(React.createElement(MarketWizard));

      expect(screen.getByLabelText(/market name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^state/i)).toBeInTheDocument();
    });

    it("renders step indicator with three steps", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(React.createElement(MarketWizard));

      expect(screen.getByText("Geography")).toBeInTheDocument();
      expect(screen.getByText("Pricing")).toBeInTheDocument();
      expect(screen.getByText("Segments")).toBeInTheDocument();
    });

    it("renders Next button on step 1", async () => {
      const { MarketWizard } = await import(
        "@/components/markets/market-wizard"
      );
      render(React.createElement(MarketWizard));

      expect(
        screen.getByRole("button", { name: /next/i })
      ).toBeInTheDocument();
    });
  });

  describe("StepIndicator component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("renders all step labels", async () => {
      const { StepIndicator } = await import(
        "@/components/markets/step-indicator"
      );
      render(
        React.createElement(StepIndicator, {
          steps: ["One", "Two", "Three"],
          currentStep: 0,
        })
      );

      expect(screen.getByText("One")).toBeInTheDocument();
      expect(screen.getByText("Two")).toBeInTheDocument();
      expect(screen.getByText("Three")).toBeInTheDocument();
    });
  });

  describe("API route", () => {
    it("route file exports GET and POST handlers", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("export async function GET");
      expect(routeContent).toContain("export async function POST");
    });

    it("route uses Clerk auth", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("@clerk/nextjs/server");
      expect(routeContent).toContain("auth()");
    });

    it("route validates input with validateMarketData", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("validateMarketData");
    });

    it("route returns 401 for unauthenticated requests", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("401");
    });

    it("route returns 422 for validation errors", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("422");
    });

    it("route returns 201 on successful creation", () => {
      const routeContent = fs.readFileSync(
        path.join(process.cwd(), "app/api/markets/route.ts"),
        "utf8"
      );
      expect(routeContent).toContain("201");
    });
  });

  describe("Markets list page", () => {
    it("includes Define New Market link", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/markets/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain('href="/markets/new"');
      expect(pageContent).toContain("Define New Market");
    });

    it("shows empty state when no markets exist", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/markets/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain("No markets defined yet");
    });

    it("uses getMarkets service", () => {
      const pageContent = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/markets/page.tsx"),
        "utf8"
      );
      expect(pageContent).toContain("getMarkets");
    });
  });
});
