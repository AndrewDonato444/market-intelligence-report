import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

jest.mock("next/navigation", () => ({
  usePathname: () => "/settings/account",
  useRouter: () => ({ push: jest.fn() }),
}));

describe("Subscription Management", () => {
  describe("Database schema", () => {
    it("has subscriptions table", async () => {
      const schemaModule = await import("@/lib/db/schema");
      expect(schemaModule.subscriptions).toBeDefined();
    });

    it("subscriptions has required columns", async () => {
      const schemaModule = await import("@/lib/db/schema");
      const table = schemaModule.subscriptions;
      expect(table.userId).toBeDefined();
      expect(table.stripeCustomerId).toBeDefined();
      expect(table.stripeSubscriptionId).toBeDefined();
      expect(table.plan).toBeDefined();
      expect(table.status).toBeDefined();
    });
  });

  describe("Stripe client", () => {
    it("has stripe client file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/stripe/client.ts")
        )
      ).toBe(true);
    });

    it("exports getStripe function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/stripe/client.ts"),
        "utf-8"
      );
      expect(content).toContain("export function getStripe");
    });

    it("has plans configuration", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/stripe/plans.ts")
        )
      ).toBe(true);
    });

    it("plans config exports PLANS array", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/stripe/plans.ts"),
        "utf-8"
      );
      expect(content).toContain("export const PLANS");
    });
  });

  describe("Subscription service", () => {
    it("has subscription service file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/services/subscription.ts")
        )
      ).toBe(true);
    });

    it("exports getSubscription function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/subscription.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function getSubscription");
    });

    it("exports createCheckoutSession function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/subscription.ts"),
        "utf-8"
      );
      expect(content).toContain(
        "export async function createCheckoutSession"
      );
    });

    it("exports createPortalSession function", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/services/subscription.ts"),
        "utf-8"
      );
      expect(content).toContain(
        "export async function createPortalSession"
      );
    });
  });

  describe("Stripe API routes", () => {
    it("has checkout route", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/stripe/checkout/route.ts")
        )
      ).toBe(true);
    });

    it("checkout route exports POST handler", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/api/stripe/checkout/route.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function POST");
    });

    it("has portal route", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/stripe/portal/route.ts")
        )
      ).toBe(true);
    });

    it("has webhook route", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/stripe/webhook/route.ts")
        )
      ).toBe(true);
    });

    it("webhook route handles checkout.session.completed", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/api/stripe/webhook/route.ts"),
        "utf-8"
      );
      expect(content).toContain("checkout.session.completed");
    });
  });

  describe("SubscriptionManagement component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen, cleanup } = require("@testing-library/react");

    afterEach(() => cleanup());

    it("has subscription-management component file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/account/subscription-management.tsx"
          )
        )
      ).toBe(true);
    });

    it("shows current plan and status when subscribed", async () => {
      const { SubscriptionManagement } = await import(
        "@/components/account/subscription-management"
      );

      render(
        React.createElement(SubscriptionManagement, {
          subscription: {
            plan: "professional",
            status: "active",
            currentPeriodStart: "2026-03-01T00:00:00Z",
            currentPeriodEnd: "2026-03-31T00:00:00Z",
          },
          stripeConfigured: true,
        })
      );

      expect(screen.getByText(/Professional/)).toBeInTheDocument();
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Manage Billing/i })
      ).toBeInTheDocument();
    });

    it("shows free plan when no subscription", async () => {
      const { SubscriptionManagement } = await import(
        "@/components/account/subscription-management"
      );

      render(
        React.createElement(SubscriptionManagement, {
          subscription: null,
          stripeConfigured: true,
        })
      );

      expect(screen.getByText(/Free/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Upgrade/i })
      ).toBeInTheDocument();
    });

    it("shows setup message when Stripe not configured", async () => {
      const { SubscriptionManagement } = await import(
        "@/components/account/subscription-management"
      );

      render(
        React.createElement(SubscriptionManagement, {
          subscription: null,
          stripeConfigured: false,
        })
      );

      expect(
        screen.getByText(/billing is not yet set up/i)
      ).toBeInTheDocument();
    });
  });
});
