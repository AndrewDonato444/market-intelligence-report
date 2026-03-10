import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

jest.mock("next/navigation", () => ({
  usePathname: () => "/settings/usage",
  useRouter: () => ({ push: jest.fn() }),
}));

describe("Regression: Usage page resolves authId to DB userId", () => {
  it("PG-USG-R1: usage page imports getProfile for userId resolution", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "app/(protected)/settings/usage/page.tsx"),
      "utf-8"
    );
    expect(content).toContain('import { getProfile }');
  });

  it("PG-USG-R2: usage page passes profile.id (not authId) to getUsageSummary", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "app/(protected)/settings/usage/page.tsx"),
      "utf-8"
    );
    // Must use profile.id, NOT authId directly
    expect(content).toContain("getUsageSummary(profile.id)");
    expect(content).not.toMatch(/getUsageSummary\(authId\)/);
  });

  it("PG-USG-R3: usage page passes profile.id (not authId) to getUsageLog", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "app/(protected)/settings/usage/page.tsx"),
      "utf-8"
    );
    expect(content).toContain("getUsageLog(profile.id");
    expect(content).not.toMatch(/getUsageLog\(authId/);
  });
});

describe("Usage Dashboard", () => {
  describe("Settings nav includes Usage tab", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen, cleanup } = require("@testing-library/react");

    afterEach(() => cleanup());

    it("SettingsNav renders Usage tab", async () => {
      const { SettingsNav } = await import(
        "@/components/layout/settings-nav"
      );

      render(
        React.createElement(SettingsNav, {
          currentPath: "/settings/usage",
        })
      );

      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Usage")).toBeInTheDocument();
    });
  });

  describe("UsageSummaryCards component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen, cleanup } = require("@testing-library/react");

    afterEach(() => cleanup());

    it("has usage-summary-cards component file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/account/usage-summary-cards.tsx"
          )
        )
      ).toBe(true);
    });

    it("displays total cost, total calls, and cache hit rate", async () => {
      const { UsageSummaryCards } = await import(
        "@/components/account/usage-summary-cards"
      );

      render(
        React.createElement(UsageSummaryCards, {
          totalCost: 12.34,
          totalCalls: 247,
          cacheHitRate: 68,
        })
      );

      expect(screen.getByText("$12.34")).toBeInTheDocument();
      expect(screen.getByText("247")).toBeInTheDocument();
      expect(screen.getByText("68%")).toBeInTheDocument();
    });
  });

  describe("UsageByProvider component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen, cleanup } = require("@testing-library/react");

    afterEach(() => cleanup());

    it("has usage-by-provider component file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/account/usage-by-provider.tsx"
          )
        )
      ).toBe(true);
    });

    it("renders provider breakdown with costs and calls", async () => {
      const { UsageByProvider } = await import(
        "@/components/account/usage-by-provider"
      );

      render(
        React.createElement(UsageByProvider, {
          providers: [
            {
              provider: "RealEstateAPI",
              totalCost: 8.5,
              callCount: 180,
              cacheHits: 112,
            },
            {
              provider: "ScrapingDog",
              totalCost: 3.84,
              callCount: 67,
              cacheHits: 52,
            },
          ],
        })
      );

      expect(screen.getByText("RealEstateAPI")).toBeInTheDocument();
      expect(screen.getByText("ScrapingDog")).toBeInTheDocument();
      expect(screen.getByText("$8.50")).toBeInTheDocument();
      expect(screen.getByText("$3.84")).toBeInTheDocument();
    });
  });

  describe("UsageLog component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen, cleanup } = require("@testing-library/react");

    afterEach(() => cleanup());

    it("has usage-log component file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/account/usage-log.tsx"
          )
        )
      ).toBe(true);
    });

    it("renders recent API call entries", async () => {
      const { UsageLog } = await import(
        "@/components/account/usage-log"
      );

      render(
        React.createElement(UsageLog, {
          entries: [
            {
              id: "log-1",
              provider: "RealEstateAPI",
              endpoint: "/v2/PropertySearch",
              cost: "0.050000",
              responseTimeMs: 234,
              cached: 0,
              createdAt: "2026-03-09T12:00:00Z",
            },
            {
              id: "log-2",
              provider: "ScrapingDog",
              endpoint: "/google_local",
              cost: "0.020000",
              responseTimeMs: 189,
              cached: 0,
              createdAt: "2026-03-09T11:30:00Z",
            },
          ],
        })
      );

      expect(screen.getByText("RealEstateAPI")).toBeInTheDocument();
      expect(screen.getByText("ScrapingDog")).toBeInTheDocument();
      expect(screen.getByText(/PropertySearch/)).toBeInTheDocument();
    });

    it("renders empty state when no entries", async () => {
      const { UsageLog } = await import(
        "@/components/account/usage-log"
      );

      render(
        React.createElement(UsageLog, {
          entries: [],
        })
      );

      expect(screen.getByText(/No API calls/i)).toBeInTheDocument();
    });
  });

  describe("Usage dashboard page", () => {
    it("has usage dashboard page file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/(protected)/settings/usage/page.tsx"
          )
        )
      ).toBe(true);
    });
  });
});
