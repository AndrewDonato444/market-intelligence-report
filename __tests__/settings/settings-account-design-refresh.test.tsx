import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/settings/profile",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href, className, ...rest }: any) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  };
});

// Mock @/lib/supabase/client
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

import SettingsLayout from "@/app/(protected)/settings/layout";
import { SettingsNav } from "@/components/layout/settings-nav";
import { ProfileForm } from "@/components/profile/profile-form";
import { BrandPreview } from "@/components/profile/brand-preview";
import {
  AccountSettings,
  SubscriptionData,
} from "@/components/account/account-settings";
import { ChangePasswordSection } from "@/components/account/change-password-section";
import { PasswordInput } from "@/components/ui/password-input";

/**
 * Settings & Account Design Refresh Tests (Phase 5)
 *
 * Verifies that all settings/account components use the warm luxury palette
 * (--color-app-*) and updated typography (--font-display + --font-body).
 *
 * Token migration map is in:
 *   .specs/features/design-refresh/settings-account-design-refresh.feature.md
 */

// ──────────────────────────── Test data ────────────────────────────

const sampleProfileData = {
  name: "Jordan Ellis",
  email: "jordan@luxrealty.com",
  company: "Ashford & Associates",
  title: "Principal Broker",
  phone: "(239) 555-0147",
  bio: "Luxury market specialist",
  brandColors: {
    primary: "#0F172A",
    secondary: "#CA8A04",
    accent: "#1E3A5F",
  },
};

const sampleSubscriptionData: SubscriptionData = {
  tierName: "Professional",
  tierDescription: "For established practitioners who need deep market intelligence",
  displayPrice: "$39/mo",
  entitlements: {
    reports: { used: 3, limit: 5, remaining: 2 },
    markets: { used: 2, limit: 5, remaining: 3 },
    socialMediaKits: { used: 0, limit: 0, remaining: 0 },
    emailCampaigns: { used: 0, limit: 0, remaining: 0 },
    personasPerReport: { used: 0, limit: 3, remaining: 3 },
  },
  billingPeriod: { start: "2026-03-01", end: "2026-03-31" },
  nextTier: {
    name: "Enterprise",
    displayPrice: "$99/mo",
    entitlements: {
      reports_per_month: 20,
      markets_created: 15,
      social_media_kits: 1,
      email_campaigns: 1,
      personas_per_report: 5,
    },
  },
};

// ──────────────────────────── Helpers ────────────────────────────

/** Returns true if the className contains the given CSS variable reference */
function hasVar(el: HTMLElement, varName: string): boolean {
  const cls = el.className || "";
  return cls.includes(varName);
}

/** Recursively search for elements whose className contains a variable */
function findByVar(container: HTMLElement, varName: string): HTMLElement[] {
  const results: HTMLElement[] = [];
  const walk = (node: HTMLElement) => {
    if (node.className && typeof node.className === "string" && node.className.includes(varName)) {
      results.push(node);
    }
    Array.from(node.children).forEach((child) => walk(child as HTMLElement));
  };
  walk(container);
  return results;
}

// ──────────────────────────── Scenario 1 ────────────────────────────
// Settings page heading uses warm display font

describe("Settings layout heading", () => {
  it("uses --font-display and --color-app-text", () => {
    const { container } = render(
      <SettingsLayout>
        <div>child</div>
      </SettingsLayout>
    );
    const heading = container.querySelector("h1")!;
    expect(heading).toBeTruthy();
    expect(heading.className).toContain("--font-display");
    expect(heading.className).toContain("--color-app-text");
    // Must NOT contain old tokens
    expect(heading.className).not.toContain("--font-serif");
    expect(heading.className).not.toContain("--color-primary");
  });
});

// ──────────────────────────── Scenario 2 ────────────────────────────
// Settings tab navigation uses warm tokens

describe("SettingsNav warm tokens", () => {
  it("uses --font-body for tab labels", () => {
    const { container } = render(<SettingsNav currentPath="/settings/profile" />);
    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      expect(link.className).toContain("--font-body");
      expect(link.className).not.toContain("--font-sans");
    });
  });

  it("uses --color-app-border for the nav bottom border", () => {
    const { container } = render(<SettingsNav currentPath="/settings/profile" />);
    const nav = container.querySelector("nav")!;
    expect(nav.className).toContain("--color-app-border");
    expect(nav.className).not.toContain("--color-border");
  });

  it("active tab uses --color-app-text and --color-app-accent underline", () => {
    const { container } = render(<SettingsNav currentPath="/settings/profile" />);
    const activeLink = container.querySelector('a[href="/settings/profile"]')!;
    expect(activeLink.className).toContain("--color-app-text");
    expect(activeLink.className).toContain("--color-app-accent");
    expect(activeLink.className).not.toContain("--color-primary");
  });

  it("inactive tab uses --color-app-text-secondary", () => {
    const { container } = render(<SettingsNav currentPath="/settings/profile" />);
    const inactiveLink = container.querySelector('a[href="/settings/account"]')!;
    expect(inactiveLink.className).toContain("--color-app-text-secondary");
  });

  it("hover styles use --color-app-text and --color-app-border", () => {
    const { container } = render(<SettingsNav currentPath="/settings/account" />);
    // Check inactive (Profile) link has hover classes with app tokens
    const inactiveLink = container.querySelector('a[href="/settings/profile"]')!;
    expect(inactiveLink.className).toContain("--color-app-text");
    expect(inactiveLink.className).toContain("--color-app-border");
  });
});

// ──────────────────────────── Scenario 3 ────────────────────────────
// Profile form cards use warm palette

describe("ProfileForm cards warm palette", () => {
  it("card backgrounds use --color-app-surface", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const cards = findByVar(container, "--color-app-surface");
    expect(cards.length).toBeGreaterThanOrEqual(2); // "Your Profile" + "Report Branding"
  });

  it("card headings use --font-display and --color-app-text", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const headings = container.querySelectorAll("h2");
    headings.forEach((h) => {
      expect(h.className).toContain("--font-display");
      expect(h.className).toContain("--color-app-text");
      expect(h.className).not.toContain("--font-serif");
      expect(h.className).not.toContain("--color-primary");
    });
  });

  it("accent lines use --color-app-accent", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const accentLines = findByVar(container, "--color-app-accent");
    expect(accentLines.length).toBeGreaterThanOrEqual(2);
  });

  it("subtitles use --font-body and --color-app-text-secondary", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const subtitles = container.querySelectorAll("p");
    const cardSubtitles = Array.from(subtitles).filter(
      (p) =>
        p.textContent?.includes("How you appear") ||
        p.textContent?.includes("Colors that appear")
    );
    cardSubtitles.forEach((sub) => {
      expect(sub.className).toContain("--font-body");
      expect(sub.className).toContain("--color-app-text-secondary");
    });
  });
});

// ──────────────────────────── Scenario 4 ────────────────────────────
// Profile form inputs use warm tokens

describe("ProfileForm inputs warm tokens", () => {
  it("input labels use --font-body and --color-app-text", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const labels = container.querySelectorAll("label");
    labels.forEach((label) => {
      expect(label.className).toContain("--font-body");
      expect(label.className).toContain("--color-app-text");
      expect(label.className).not.toContain("--font-sans");
    });
  });

  it("input borders use --color-app-border", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const nameInput = container.querySelector("#name")!;
    expect(nameInput.className).toContain("--color-app-border");
    expect(nameInput.className).not.toContain("var(--color-border)");
  });

  it("input backgrounds use --color-app-surface", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const nameInput = container.querySelector("#name")!;
    expect(nameInput.className).toContain("--color-app-surface");
  });

  it("readonly email input uses --color-app-bg", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const emailInput = container.querySelector("#email")!;
    expect(emailInput.className).toContain("--color-app-bg");
    expect(emailInput.className).not.toContain("--color-background");
  });

  it("auth provider hint uses --color-app-text-tertiary", () => {
    render(<ProfileForm initialData={sampleProfileData} />);
    const hint = screen.getByText("Managed by your authentication provider");
    expect(hint.className).toContain("--color-app-text-tertiary");
  });

  it("input focus rings use --color-app-accent", () => {
    const { container } = render(<ProfileForm initialData={sampleProfileData} />);
    const nameInput = container.querySelector("#name")!;
    expect(nameInput.className).toContain("--color-app-accent");
  });
});

// ──────────────────────────── Scenario 5 ────────────────────────────
// Brand preview stays in report palette

describe("BrandPreview stays report-facing", () => {
  it("uses --color-report-bg for background", () => {
    const { container } = render(
      <BrandPreview company="Test Co" colors={sampleProfileData.brandColors} />
    );
    const wrapper = container.firstElementChild!;
    expect((wrapper as HTMLElement).className).toContain("--color-report-bg");
  });

  it("uses --font-serif and --font-sans for typography (not --font-display/--font-body)", () => {
    const { container } = render(
      <BrandPreview company="Test Co" colors={sampleProfileData.brandColors} />
    );
    const html = container.innerHTML;
    expect(html).toContain("--font-serif");
    expect(html).toContain("--font-sans");
    // Should NOT use display/body tokens
    expect(html).not.toContain("--font-display");
    expect(html).not.toContain("--font-body");
  });

  it("color picker border uses --color-app-border", () => {
    // The brand color picker border is in ProfileForm, not BrandPreview itself
    // BrandPreview's own border should use --color-app-border for the container
    const { container } = render(
      <BrandPreview company="Test Co" colors={sampleProfileData.brandColors} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("--color-app-border");
  });
});

// ──────────────────────────── Scenario 6 ────────────────────────────
// Save Profile button uses warm accent

describe("Save Profile button warm accent", () => {
  it("uses --color-app-accent bg, --color-app-accent-hover, --color-app-surface text, --font-body", () => {
    render(<ProfileForm initialData={sampleProfileData} />);
    const btn = screen.getByRole("button", { name: /save profile/i });
    expect(btn.className).toContain("--color-app-accent");
    expect(btn.className).toContain("--color-app-accent-hover");
    expect(btn.className).toContain("--color-app-surface");
    expect(btn.className).toContain("--font-body");
    expect(btn.className).not.toContain("--color-primary");
    expect(btn.className).not.toContain("--font-sans");
  });
});

// ──────────────────────────── Scenario 7 ────────────────────────────
// Account information card uses warm palette

describe("AccountSettings account info card", () => {
  it("card background uses --color-app-surface", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const cards = findByVar(container, "--color-app-surface");
    expect(cards.length).toBeGreaterThanOrEqual(3); // info + plan + session
  });

  it("section headings use --font-display and --color-app-text", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const headings = container.querySelectorAll("h2");
    headings.forEach((h) => {
      expect(h.className).toContain("--font-display");
      expect(h.className).toContain("--color-app-text");
      expect(h.className).not.toContain("--font-serif");
      expect(h.className).not.toContain("--color-primary");
    });
  });

  it("accent lines use --color-app-accent", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const accentLines = findByVar(container, "--color-app-accent");
    expect(accentLines.length).toBeGreaterThanOrEqual(3);
  });

  it("dt labels use --font-body, --color-app-text-tertiary", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const dtElements = container.querySelectorAll("dt");
    dtElements.forEach((dt) => {
      expect(dt.className).toContain("--font-body");
      expect(dt.className).toContain("--color-app-text-tertiary");
    });
  });

  it("dd values use --font-body and --color-app-text", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const ddElements = container.querySelectorAll("dd");
    ddElements.forEach((dd) => {
      expect(dd.className).toContain("--font-body");
      expect(dd.className).toContain("--color-app-text");
    });
  });

  it("stat numbers use --color-app-text", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    // Stats are in dd elements with text-2xl
    const boldDds = Array.from(container.querySelectorAll("dd")).filter((dd) =>
      dd.className.includes("text-2xl")
    );
    boldDds.forEach((dd) => {
      expect(dd.className).toContain("--color-app-text");
      expect(dd.className).not.toContain("--color-primary");
    });
  });
});

// ──────────────────────────── Scenario 8 ────────────────────────────
// Subscription tier card uses warm tokens

describe("Subscription tier card warm tokens", () => {
  it("tier card border uses --color-app-border", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    // Find the tier card (has the tier name)
    const tierText = screen.getByText("Professional");
    const tierCard = tierText.closest("div[class*='border']")!;
    expect((tierCard as HTMLElement).className).toContain("--color-app-border");
  });

  it("tier name uses --font-display and --color-app-text", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const tierName = screen.getByText("Professional");
    expect(tierName.className).toContain("--font-display");
    expect(tierName.className).toContain("--color-app-text");
  });

  it("price uses --font-body and --color-app-accent", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const price = screen.getByText("$39/mo");
    expect(price.className).toContain("--font-body");
    expect(price.className).toContain("--color-app-accent");
  });

  it("description uses --font-body and --color-app-text-secondary", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const desc = screen.getByText(/For established practitioners/);
    expect(desc.className).toContain("--font-body");
    expect(desc.className).toContain("--color-app-text-secondary");
  });
});

// ──────────────────────────── Scenario 9 ────────────────────────────
// Usage entitlement bars use warm tokens

describe("Usage entitlement bars warm tokens", () => {
  it("entitlement label uses --font-body and --color-app-text", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const reportsBar = container.querySelector('[data-testid="entitlement-reports"]')!;
    const label = reportsBar.querySelector("span")!;
    expect(label.className).toContain("--font-body");
    expect(label.className).toContain("--color-app-text");
  });

  it("usage count uses --font-body and --color-app-text-secondary", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const reportsBar = container.querySelector('[data-testid="entitlement-reports"]')!;
    const spans = reportsBar.querySelectorAll("span");
    const countSpan = Array.from(spans).find((s) => s.textContent?.includes("of"));
    expect(countSpan!.className).toContain("--font-body");
    expect(countSpan!.className).toContain("--color-app-text-secondary");
  });

  it("bar track uses --color-app-border", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const reportsBar = container.querySelector('[data-testid="entitlement-reports"]')!;
    const track = reportsBar.querySelector(".w-full.h-2")!;
    expect((track as HTMLElement).className).toContain("--color-app-border");
  });

  it("normal bar fill uses --color-app-text via inline style", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const fills = container.querySelectorAll('[data-testid="usage-bar-fill"]');
    const normalFill = Array.from(fills).find(
      (f) => !(f as HTMLElement).style.backgroundColor.includes("warning")
    );
    expect((normalFill as HTMLElement).style.backgroundColor).toContain(
      "var(--color-app-text)"
    );
  });

  it("warning bar fill preserves --color-warning", () => {
    // Create data where usage >= 80%
    const warningData: SubscriptionData = {
      ...sampleSubscriptionData,
      entitlements: {
        ...sampleSubscriptionData.entitlements,
        reports: { used: 4, limit: 5, remaining: 1 },
      },
    };
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={warningData}
      />
    );
    const reportsBar = container.querySelector('[data-testid="entitlement-reports"]')!;
    const fill = reportsBar.querySelector('[data-testid="usage-bar-fill"]')!;
    expect((fill as HTMLElement).style.backgroundColor).toContain("--color-warning");
  });

  it("remaining count uses --font-body and --color-app-text-secondary", () => {
    const { container } = render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const reportsBar = container.querySelector('[data-testid="entitlement-reports"]')!;
    const remaining = reportsBar.querySelector(".mt-1")!;
    expect((remaining as HTMLElement).className).toContain("--font-body");
    expect((remaining as HTMLElement).className).toContain("--color-app-text-secondary");
  });
});

// ──────────────────────────── Scenario 10 ────────────────────────────
// Upgrade prompt card uses warm tokens

describe("Upgrade prompt card warm tokens", () => {
  it("card border uses --color-app-border", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const upgradeTitle = screen.getByText(/Unlock more with/);
    const card = upgradeTitle.closest("div[class*='border']")!;
    expect((card as HTMLElement).className).toContain("--color-app-border");
  });

  it("tier name uses --font-display and --color-app-text", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const upgradeName = screen.getByText(/Unlock more with/);
    expect(upgradeName.className).toContain("--font-display");
    expect(upgradeName.className).toContain("--color-app-text");
  });

  it("upgrade button uses --color-app-accent background", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const upgradeBtn = screen.getByRole("button", { name: /contact us to upgrade/i });
    expect(upgradeBtn.className).toContain("--color-app-accent");
    expect(upgradeBtn.className).toContain("--color-app-surface");
  });
});

// ──────────────────────────── Scenario 11 ────────────────────────────
// Session management section uses warm palette

describe("Session management warm palette", () => {
  it("session heading uses --font-display and --color-app-text", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const heading = screen.getByText("Session Management");
    expect(heading.className).toContain("--font-display");
    expect(heading.className).toContain("--color-app-text");
  });

  it("body text uses --font-body and --color-app-text", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const body = screen.getByText(/Sign out from all active sessions/);
    expect(body.className).toContain("--font-body");
    expect(body.className).toContain("--color-app-text");
  });

  it("Sign Out Everywhere button preserves --color-error bg", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    const btn = screen.getByRole("button", { name: /sign out everywhere/i });
    expect(btn.className).toContain("--color-error");
  });
});

// ──────────────────────────── Scenario 12 ────────────────────────────
// Change password section uses app tokens (not mkt)

describe("ChangePasswordSection app tokens", () => {
  it("card bg uses --color-app-surface (not --color-mkt-surface)", () => {
    const { container } = render(<ChangePasswordSection />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("--color-app-surface");
    expect(wrapper.className).not.toContain("--color-mkt-surface");
  });

  it("card border uses --color-app-border (not --color-mkt-border)", () => {
    const { container } = render(<ChangePasswordSection />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("--color-app-border");
    expect(wrapper.className).not.toContain("--color-mkt-border");
  });

  it("heading uses --font-display and --color-app-text", () => {
    render(<ChangePasswordSection />);
    const heading = screen.getByText("Change Password");
    expect(heading.className).toContain("--font-display");
    expect(heading.className).toContain("--color-app-text");
    expect(heading.className).not.toContain("--color-mkt-text");
  });

  it("form labels use --font-body and --color-app-text", () => {
    const { container } = render(<ChangePasswordSection />);
    const labels = container.querySelectorAll("label");
    labels.forEach((label) => {
      expect(label.className).toContain("--font-body");
      expect(label.className).toContain("--color-app-text");
      expect(label.className).not.toContain("--color-mkt-text");
    });
  });

  it("submit button uses --color-app-accent bg, --color-app-accent-hover, --color-app-surface text", () => {
    render(<ChangePasswordSection />);
    const btn = screen.getByRole("button", { name: /update password/i });
    expect(btn.className).toContain("--color-app-accent");
    expect(btn.className).toContain("--color-app-accent-hover");
    expect(btn.className).toContain("--color-app-surface");
    expect(btn.className).not.toContain("--color-mkt-text");
    expect(btn.className).not.toContain("--color-mkt-darkest");
  });
});

// ──────────────────────────── Scenario 13 ────────────────────────────
// Password input uses warm tokens

describe("PasswordInput warm tokens", () => {
  it("input font uses --font-body (not --font-inter)", () => {
    const { container } = render(
      <PasswordInput id="test-pw" value="" onChange={() => {}} placeholder="Enter" />
    );
    const input = container.querySelector("input")!;
    expect(input.className).toContain("--font-body");
    expect(input.className).not.toContain("--font-inter");
  });

  it("input border uses --color-app-border", () => {
    const { container } = render(
      <PasswordInput id="test-pw" value="" onChange={() => {}} />
    );
    const input = container.querySelector("input")!;
    expect(input.className).toContain("--color-app-border");
  });

  it("input text uses --color-app-text", () => {
    const { container } = render(
      <PasswordInput id="test-pw" value="" onChange={() => {}} />
    );
    const input = container.querySelector("input")!;
    expect(input.className).toContain("--color-app-text");
  });

  it("placeholder uses --color-app-text-tertiary", () => {
    const { container } = render(
      <PasswordInput id="test-pw" value="" onChange={() => {}} />
    );
    const input = container.querySelector("input")!;
    expect(input.className).toContain("--color-app-text-tertiary");
  });

  it("focus ring uses --color-app-accent", () => {
    const { container } = render(
      <PasswordInput id="test-pw" value="" onChange={() => {}} />
    );
    const input = container.querySelector("input")!;
    expect(input.className).toContain("--color-app-accent");
  });

  it("eye icon uses --color-app-text-tertiary, hover uses --color-app-text-secondary", () => {
    const { container } = render(
      <PasswordInput id="test-pw" value="" onChange={() => {}} />
    );
    const toggleBtn = container.querySelector("button")!;
    expect(toggleBtn.className).toContain("--color-app-text-tertiary");
    expect(toggleBtn.className).toContain("--color-app-text-secondary");
  });
});

// ──────────────────────────── Scenario 14 ────────────────────────────
// All settings functionality is preserved (structural checks)

describe("Settings functionality preservation", () => {
  it("ProfileForm renders all form fields", () => {
    render(<ProfileForm initialData={sampleProfileData} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save profile/i })).toBeInTheDocument();
  });

  it("SettingsNav renders both tabs with correct links", () => {
    const { container } = render(<SettingsNav currentPath="/settings/profile" />);
    const links = container.querySelectorAll("a");
    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/settings/profile");
    expect(hrefs).toContain("/settings/account");
  });

  it("AccountSettings renders all sections", () => {
    render(
      <AccountSettings
        email="jordan@test.com"
        memberSince="2026-01-15"
        stats={{ reportCount: 12, marketCount: 3 }}
        subscriptionData={sampleSubscriptionData}
      />
    );
    expect(screen.getByText("Account Information")).toBeInTheDocument();
    expect(screen.getByText("Your Plan")).toBeInTheDocument();
    expect(screen.getByText("Session Management")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out everywhere/i })).toBeInTheDocument();
  });

  it("ChangePasswordSection renders all password fields", () => {
    render(<ChangePasswordSection />);
    expect(screen.getByText("Current password")).toBeInTheDocument();
    expect(screen.getByText("New password")).toBeInTheDocument();
    expect(screen.getByText("Confirm new password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("BrandPreview renders with company name and color bars", () => {
    const { container } = render(
      <BrandPreview company="Test Realty" colors={sampleProfileData.brandColors} />
    );
    expect(screen.getByText("Test Realty")).toBeInTheDocument();
    expect(screen.getByText("Market Intelligence Report")).toBeInTheDocument();
    expect(screen.getByText("$8.7M")).toBeInTheDocument();
  });
});
