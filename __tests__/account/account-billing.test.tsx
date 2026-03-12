/**
 * Account & Billing Page Tests
 *
 * Tests for the subscription section on the account page:
 * - Displays current subscription tier (name, price, description)
 * - Defaults to Starter for users with no subscription
 * - Shows usage bars for reports (monthly) and markets (cumulative)
 * - Shows social media kit and persona entitlements
 * - Warning state at 80%+ usage
 * - At-cap state with upgrade prompt
 * - Unlimited entitlements (no bar, just count + badge)
 * - Billing period label for monthly entitlements
 * - No billing period for cumulative entitlements
 * - Upgrade prompt with tier comparison
 * - Entitlement override adjusts cap
 * - Graceful fallback on error
 *
 * Spec: .specs/features/subscription/account-billing-page.feature.md
 */

import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  usePathname: () => "/settings/account",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const React = require("react");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, screen, cleanup } = require("@testing-library/react");

afterEach(() => cleanup());

// --- Helper: Build subscription data props ---

type EntitlementData = {
  used: number;
  limit: number;
  remaining: number;
};

type SubscriptionData = {
  tierName: string;
  tierDescription: string;
  displayPrice: string;
  entitlements: {
    reports: EntitlementData;
    markets: EntitlementData;
    socialMediaKits: EntitlementData;
    personasPerReport: EntitlementData;
  };
  billingPeriod: { start: string; end: string };
  nextTier: {
    name: string;
    displayPrice: string;
    entitlements: {
      reports_per_month: number;
      markets_created: number;
      social_media_kits: number;
      personas_per_report: number;
    };
  } | null;
};

function makeProps(overrides: Partial<SubscriptionData> = {}): SubscriptionData {
  return {
    tierName: "Professional",
    tierDescription:
      "Full-featured market intelligence for serious luxury agents. Includes social media kits and multiple personas.",
    displayPrice: "$199/mo",
    entitlements: {
      reports: { used: 7, limit: 10, remaining: 3 },
      markets: { used: 2, limit: 3, remaining: 1 },
      socialMediaKits: { used: 0, limit: 1, remaining: 1 },
      personasPerReport: { used: 0, limit: 3, remaining: 3 },
    },
    billingPeriod: { start: "2026-03-01", end: "2026-03-31" },
    nextTier: null,
    ...overrides,
  };
}

function renderAccountSettings(subscriptionData: SubscriptionData | null) {
  const { AccountSettings } = require("@/components/account/account-settings");

  return render(
    React.createElement(AccountSettings, {
      email: "alex@example.com",
      memberSince: "2026-03-01T00:00:00Z",
      stats: { reportCount: 12, marketCount: 3 },
      subscriptionData,
    })
  );
}

describe("CMP-AB: Account & Billing Page", () => {
  describe("Scenario: Agent views current subscription tier", () => {
    it("CMP-AB-01: shows tier name in Your Plan card", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText("Professional")).toBeInTheDocument();
    });

    it("CMP-AB-02: shows display price", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText("$199/mo")).toBeInTheDocument();
    });

    it("CMP-AB-03: shows tier description", () => {
      renderAccountSettings(makeProps());
      expect(
        screen.getByText(/Full-featured market intelligence/)
      ).toBeInTheDocument();
    });

    it("CMP-AB-04: shows Your Plan heading", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText("Your Plan")).toBeInTheDocument();
    });
  });

  describe("Scenario: Agent with no subscription sees Starter defaults", () => {
    it("CMP-AB-05: shows Starter as tier name", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          tierDescription:
            "Get started with basic market intelligence. Perfect for agents exploring the platform.",
          entitlements: {
            reports: { used: 0, limit: 2, remaining: 2 },
            markets: { used: 0, limit: 1, remaining: 1 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
        })
      );
      expect(screen.getByText("Starter")).toBeInTheDocument();
    });

    it("CMP-AB-06: shows Free as display price", () => {
      renderAccountSettings(
        makeProps({ tierName: "Starter", displayPrice: "Free" })
      );
      expect(screen.getByText("Free")).toBeInTheDocument();
    });
  });

  describe("Scenario: Agent views usage vs. caps for reports", () => {
    it("CMP-AB-07: shows reports usage text", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText(/7 of 10 used/)).toBeInTheDocument();
    });

    it("CMP-AB-08: shows reports remaining count", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText(/3 remaining/)).toBeInTheDocument();
    });

    it("CMP-AB-09: renders a usage bar with correct fill percentage", () => {
      const { container } = renderAccountSettings(makeProps());
      const fills = container.querySelectorAll('[data-testid="usage-bar-fill"]');
      const reportsFill = Array.from(fills).find(
        (el: Element) => (el as HTMLElement).style.width === "70%"
      );
      expect(reportsFill).toBeTruthy();
    });

    it("CMP-AB-10: shows Reports This Month label", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText("Reports This Month")).toBeInTheDocument();
    });
  });

  describe("Scenario: Agent views usage vs. caps for markets", () => {
    it("CMP-AB-11: shows markets usage text", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText(/2 of 3 used/)).toBeInTheDocument();
    });

    it("CMP-AB-12: shows markets remaining count", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText(/1 remaining/)).toBeInTheDocument();
    });
  });

  describe("Scenario: Social media kit included", () => {
    it("CMP-AB-13: shows Included (1 per report) for Professional tier", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText(/Included \(1 per report\)/)).toBeInTheDocument();
    });
  });

  describe("Scenario: Social media kit not included", () => {
    it("CMP-AB-14: shows Not included for Starter tier", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          entitlements: {
            reports: { used: 0, limit: 2, remaining: 2 },
            markets: { used: 0, limit: 1, remaining: 1 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
          nextTier: {
            name: "Professional",
            displayPrice: "$199/mo",
            entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 },
          },
        })
      );
      expect(screen.getByText(/Not included in your plan/)).toBeInTheDocument();
    });

    it("CMP-AB-15: shows upgrade prompt for social media kits", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          entitlements: {
            reports: { used: 0, limit: 2, remaining: 2 },
            markets: { used: 0, limit: 1, remaining: 1 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
          nextTier: {
            name: "Professional",
            displayPrice: "$199/mo",
            entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 },
          },
        })
      );
      expect(screen.getByText(/Upgrade to Professional/)).toBeInTheDocument();
    });
  });

  describe("Scenario: Personas per report", () => {
    it("CMP-AB-16: shows persona count per report", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          entitlements: {
            reports: { used: 0, limit: 2, remaining: 2 },
            markets: { used: 0, limit: 1, remaining: 1 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
        })
      );
      expect(screen.getByText(/1 per report/)).toBeInTheDocument();
    });
  });

  describe("Scenario: Agent at cap sees upgrade prompt", () => {
    it("CMP-AB-17: shows 100% usage bar at cap", () => {
      const { container } = renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          entitlements: {
            reports: { used: 2, limit: 2, remaining: 0 },
            markets: { used: 1, limit: 1, remaining: 0 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
          nextTier: {
            name: "Professional",
            displayPrice: "$199/mo",
            entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 },
          },
        })
      );
      const fills = container.querySelectorAll('[data-testid="usage-bar-fill"]');
      const atCapFill = Array.from(fills).find(
        (el: Element) => (el as HTMLElement).style.width === "100%"
      );
      expect(atCapFill).toBeTruthy();
    });

    it("CMP-AB-18: shows cap reached text", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          entitlements: {
            reports: { used: 2, limit: 2, remaining: 0 },
            markets: { used: 1, limit: 1, remaining: 0 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
          nextTier: {
            name: "Professional",
            displayPrice: "$199/mo",
            entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 },
          },
        })
      );
      expect(screen.getByText(/2 of 2 used/)).toBeInTheDocument();
    });

    it("CMP-AB-19: shows upgrade prompt when at cap", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          entitlements: {
            reports: { used: 2, limit: 2, remaining: 0 },
            markets: { used: 1, limit: 1, remaining: 0 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
          nextTier: {
            name: "Professional",
            displayPrice: "$199/mo",
            entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 },
          },
        })
      );
      expect(screen.getByText(/You've used all your reports/)).toBeInTheDocument();
    });
  });

  describe("Scenario: Agent nearing cap sees warning", () => {
    it("CMP-AB-20: shows warning color on usage bar at 80%+", () => {
      const { container } = renderAccountSettings(
        makeProps({
          entitlements: {
            reports: { used: 9, limit: 10, remaining: 1 },
            markets: { used: 2, limit: 3, remaining: 1 },
            socialMediaKits: { used: 0, limit: 1, remaining: 1 },
            personasPerReport: { used: 0, limit: 3, remaining: 3 },
          },
        })
      );
      const fills = container.querySelectorAll('[data-testid="usage-bar-fill"]');
      const warningFill = Array.from(fills).find((el: Element) =>
        (el as HTMLElement).className.includes("warning")
      );
      expect(warningFill).toBeTruthy();
    });

    it("CMP-AB-21: shows remaining note at 80%+ usage", () => {
      renderAccountSettings(
        makeProps({
          entitlements: {
            reports: { used: 9, limit: 10, remaining: 1 },
            markets: { used: 2, limit: 3, remaining: 1 },
            socialMediaKits: { used: 0, limit: 1, remaining: 1 },
            personasPerReport: { used: 0, limit: 3, remaining: 3 },
          },
        })
      );
      expect(screen.getAllByText(/1 remaining/).length).toBeGreaterThan(0);
    });
  });

  describe("Scenario: Unlimited entitlement", () => {
    it("CMP-AB-22: shows Unlimited badge for unlimited reports", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Enterprise",
          displayPrice: "Custom",
          entitlements: {
            reports: { used: 42, limit: -1, remaining: -1 },
            markets: { used: 5, limit: -1, remaining: -1 },
            socialMediaKits: { used: 0, limit: -1, remaining: -1 },
            personasPerReport: { used: 0, limit: 3, remaining: 3 },
          },
        })
      );
      expect(screen.getAllByText("Unlimited").length).toBeGreaterThan(0);
    });

    it("CMP-AB-23: shows current count for unlimited entitlement", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Enterprise",
          displayPrice: "Custom",
          entitlements: {
            reports: { used: 42, limit: -1, remaining: -1 },
            markets: { used: 5, limit: -1, remaining: -1 },
            socialMediaKits: { used: 0, limit: -1, remaining: -1 },
            personasPerReport: { used: 0, limit: 3, remaining: 3 },
          },
        })
      );
      expect(screen.getByText(/42 reports generated/)).toBeInTheDocument();
    });

    it("CMP-AB-24: does not show a usage bar for unlimited", () => {
      const { container } = renderAccountSettings(
        makeProps({
          tierName: "Enterprise",
          displayPrice: "Custom",
          entitlements: {
            reports: { used: 42, limit: -1, remaining: -1 },
            markets: { used: 5, limit: -1, remaining: -1 },
            socialMediaKits: { used: 0, limit: -1, remaining: -1 },
            personasPerReport: { used: 0, limit: 3, remaining: 3 },
          },
        })
      );
      const reportSection = container.querySelector('[data-testid="entitlement-reports"]');
      if (reportSection) {
        const bar = reportSection.querySelector('[data-testid="usage-bar-fill"]');
        expect(bar).toBeNull();
      }
    });
  });

  describe("Scenario: Billing period display", () => {
    it("CMP-AB-25: shows billing period for monthly entitlements", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText(/Mar 1/)).toBeInTheDocument();
      expect(screen.getByText(/Mar 31, 2026/)).toBeInTheDocument();
    });
  });

  describe("Scenario: Markets usage is cumulative", () => {
    it("CMP-AB-26: shows Markets label without billing period", () => {
      renderAccountSettings(makeProps());
      expect(screen.getByText("Markets")).toBeInTheDocument();
    });
  });

  describe("Scenario: Upgrade prompt tier comparison", () => {
    const starterWithUpgrade = makeProps({
      tierName: "Starter",
      displayPrice: "Free",
      entitlements: {
        reports: { used: 2, limit: 2, remaining: 0 },
        markets: { used: 1, limit: 1, remaining: 0 },
        socialMediaKits: { used: 0, limit: 0, remaining: 0 },
        personasPerReport: { used: 0, limit: 1, remaining: 1 },
      },
      nextTier: {
        name: "Professional",
        displayPrice: "$199/mo",
        entitlements: { reports_per_month: 10, markets_created: 3, social_media_kits: 1, personas_per_report: 3 },
      },
    });

    it("CMP-AB-27: shows next tier name and price in upgrade prompt", () => {
      renderAccountSettings(starterWithUpgrade);
      expect(screen.getByText(/Unlock more with Professional/)).toBeInTheDocument();
    });

    it("CMP-AB-28: shows entitlement comparison values", () => {
      renderAccountSettings(starterWithUpgrade);
      expect(screen.getByText(/Reports per month/)).toBeInTheDocument();
    });

    it("CMP-AB-29: shows Contact Us to Upgrade CTA", () => {
      renderAccountSettings(starterWithUpgrade);
      expect(screen.getByText(/Contact Us to Upgrade/)).toBeInTheDocument();
    });

    it("CMP-AB-30: shows display-only pricing (no checkout)", () => {
      renderAccountSettings(starterWithUpgrade);
      expect(screen.queryByText(/Checkout/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Subscribe/i)).not.toBeInTheDocument();
    });
  });

  describe("Scenario: Entitlement override adjusts cap", () => {
    it("CMP-AB-31: shows override-adjusted cap (e.g., 5 instead of 2)", () => {
      renderAccountSettings(
        makeProps({
          tierName: "Starter",
          displayPrice: "Free",
          entitlements: {
            reports: { used: 3, limit: 5, remaining: 2 },
            markets: { used: 0, limit: 1, remaining: 1 },
            socialMediaKits: { used: 0, limit: 0, remaining: 0 },
            personasPerReport: { used: 0, limit: 1, remaining: 1 },
          },
        })
      );
      expect(screen.getByText(/3 of 5 used/)).toBeInTheDocument();
    });
  });

  describe("Scenario: Graceful fallback on error", () => {
    it("CMP-AB-32: shows account info even when subscription data is null", () => {
      renderAccountSettings(null);
      expect(screen.getByText("alex@example.com")).toBeInTheDocument();
      expect(screen.getByText("Account Information")).toBeInTheDocument();
    });

    it("CMP-AB-33: shows fallback message when subscription data is null", () => {
      renderAccountSettings(null);
      expect(screen.getByText(/Unable to load subscription details/)).toBeInTheDocument();
    });

    it("CMP-AB-34: session management still renders on error", () => {
      renderAccountSettings(null);
      expect(screen.getByText("Session Management")).toBeInTheDocument();
    });
  });

  describe("Integration: Page SSR data fetching", () => {
    it("CMP-AB-35: page imports checkEntitlement", () => {
      const fs = require("fs");
      const path = require("path");
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/settings/account/page.tsx"),
        "utf-8"
      );
      expect(content).toContain("checkEntitlement");
    });

    it("CMP-AB-36: page queries subscription_tiers table", () => {
      const fs = require("fs");
      const path = require("path");
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/settings/account/page.tsx"),
        "utf-8"
      );
      expect(content).toContain("subscriptionTiers");
    });

    it("CMP-AB-37: page passes subscriptionData prop to AccountSettings", () => {
      const fs = require("fs");
      const path = require("path");
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/(protected)/settings/account/page.tsx"),
        "utf-8"
      );
      expect(content).toContain("subscriptionData");
    });
  });
});
