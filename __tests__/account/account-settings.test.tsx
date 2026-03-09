import "@testing-library/jest-dom";
import fs from "fs";
import path from "path";

jest.mock("next/navigation", () => ({
  usePathname: () => "/settings/account",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

describe("Account Settings", () => {
  describe("Settings sub-navigation", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen } = require("@testing-library/react");

    it("has SettingsNav component file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "components/layout/settings-nav.tsx")
        )
      ).toBe(true);
    });

    it("renders Profile and Account tabs", async () => {
      const { SettingsNav } = await import(
        "@/components/layout/settings-nav"
      );

      render(
        React.createElement(SettingsNav, {
          currentPath: "/settings/profile",
        })
      );

      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Account")).toBeInTheDocument();
    });

    it("highlights the active tab", async () => {
      const { SettingsNav } = await import(
        "@/components/layout/settings-nav"
      );

      const { container } = render(
        React.createElement(SettingsNav, {
          currentPath: "/settings/account",
        })
      );

      const accountLink = container.querySelector(
        'a[href="/settings/account"]'
      );
      expect(accountLink).toBeTruthy();
      expect(accountLink.className).toContain("font-medium");
    });
  });

  describe("AccountSettings component", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { render, screen, cleanup } = require("@testing-library/react");

    afterEach(() => cleanup());

    it("has AccountSettings component file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "components/account/account-settings.tsx"
          )
        )
      ).toBe(true);
    });

    it("displays email address", async () => {
      const { AccountSettings } = await import(
        "@/components/account/account-settings"
      );

      render(
        React.createElement(AccountSettings, {
          email: "jordan@luxuryrealty.com",
          memberSince: "2026-01-15T00:00:00Z",
          stats: { reportCount: 12, marketCount: 3 },
        })
      );

      expect(
        screen.getByText("jordan@luxuryrealty.com")
      ).toBeInTheDocument();
    });

    it("displays member since date", async () => {
      const { AccountSettings } = await import(
        "@/components/account/account-settings"
      );

      render(
        React.createElement(AccountSettings, {
          email: "jordan@luxuryrealty.com",
          memberSince: "2026-01-15T00:00:00Z",
          stats: { reportCount: 0, marketCount: 0 },
        })
      );

      expect(screen.getByText(/January 2026/)).toBeInTheDocument();
    });

    it("displays report and market counts", async () => {
      const { AccountSettings } = await import(
        "@/components/account/account-settings"
      );

      render(
        React.createElement(AccountSettings, {
          email: "jordan@luxuryrealty.com",
          memberSince: "2026-01-15T00:00:00Z",
          stats: { reportCount: 12, marketCount: 3 },
        })
      );

      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("renders Sign Out Everywhere button", async () => {
      const { AccountSettings } = await import(
        "@/components/account/account-settings"
      );

      render(
        React.createElement(AccountSettings, {
          email: "jordan@luxuryrealty.com",
          memberSince: "2026-01-15T00:00:00Z",
          stats: { reportCount: 0, marketCount: 0 },
        })
      );

      expect(
        screen.getByRole("button", { name: /Sign Out Everywhere/i })
      ).toBeInTheDocument();
    });
  });

  describe("Account stats API", () => {
    it("has account stats API route file", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "app/api/account/stats/route.ts")
        )
      ).toBe(true);
    });

    it("account stats route exports GET handler", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/api/account/stats/route.ts"),
        "utf-8"
      );
      expect(content).toContain("export async function GET");
    });

    it("account stats route queries reports and markets", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "app/api/account/stats/route.ts"),
        "utf-8"
      );
      expect(content).toContain("reports");
      expect(content).toContain("markets");
    });
  });

  describe("Account settings page", () => {
    it("has account settings page file", () => {
      expect(
        fs.existsSync(
          path.join(
            process.cwd(),
            "app/(protected)/settings/account/page.tsx"
          )
        )
      ).toBe(true);
    });

    it("settings layout includes SettingsNav", () => {
      const content = fs.readFileSync(
        path.join(
          process.cwd(),
          "app/(protected)/settings/layout.tsx"
        ),
        "utf-8"
      );
      expect(content).toContain("SettingsNav");
    });
  });
});
