import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
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

// Mock fetch globally for dashboard components
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ users: [], total: 0, page: 1, limit: 20 }),
});

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AnalyticsNav } from "@/components/admin/analytics-nav";
import { ExportButton } from "@/components/admin/export-button";

/**
 * Admin Pages Design Refresh Tests (Phase 8)
 *
 * Verifies all admin components use the warm luxury palette
 * (--color-app-*) and updated typography (--font-display + --font-body).
 *
 * Token migration map is in:
 *   .specs/features/design-refresh/admin-design-refresh.feature.md
 */

// ──────────────────────────── Helpers ────────────────────────────

/** Recursively search for elements whose className contains a variable */
function findByVar(container: HTMLElement, varName: string): HTMLElement[] {
  const results: HTMLElement[] = [];
  const walk = (node: HTMLElement) => {
    if (
      node.className &&
      typeof node.className === "string" &&
      node.className.includes(varName)
    ) {
      results.push(node);
    }
    Array.from(node.children).forEach((child) => walk(child as HTMLElement));
  };
  walk(container);
  return results;
}

/** Read a source file for content checks */
function readSource(relPath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relPath), "utf8");
}

// ──────────────────────────── Source file lists ────────────────────────────

const DASHBOARD_COMPONENTS = [
  "components/admin/user-list-dashboard.tsx",
  "components/admin/user-detail-panel.tsx",
  "components/admin/create-user-form.tsx",
  "components/admin/report-list-dashboard.tsx",
  "components/admin/report-detail-panel.tsx",
  "components/admin/error-triage-dashboard.tsx",
  "components/admin/data-sources-dashboard.tsx",
  "components/admin/system-monitoring-dashboard.tsx",
  "components/admin/volume-metrics-dashboard.tsx",
  "components/admin/geographic-analytics-dashboard.tsx",
  "components/admin/user-analytics-dashboard.tsx",
  "components/admin/pipeline-performance-dashboard.tsx",
  "components/admin/kit-analytics-dashboard.tsx",
  "components/admin/tier-management-dashboard.tsx",
  "components/admin/entitlement-overrides-panel.tsx",
  "components/admin/test-suite-dashboard.tsx",
  "components/admin/pipeline-visualizer.tsx",
  "components/admin/waitlist-dashboard.tsx",
];

// ──────────────────────────── Scenario 1 ────────────────────────────
// AdminSidebar uses warm palette and DM Sans typography

describe("AdminSidebar warm palette", () => {
  it("uses --color-app-sidebar-bg for background", () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector("aside")!;
    expect(aside.className).toContain("--color-app-sidebar-bg");
    expect(aside.className).not.toContain("var(--color-surface)");
  });

  it("uses --color-app-border for right border", () => {
    const { container } = render(<AdminSidebar />);
    const aside = container.querySelector("aside")!;
    expect(aside.className).toContain("--color-app-border");
  });

  it("nav item labels use --font-body (not --font-sans)", () => {
    const { container } = render(<AdminSidebar />);
    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      expect(link.className).toContain("--font-body");
      expect(link.className).not.toContain("--font-sans");
    });
  });

  it("active nav item uses --color-app-active-bg background", () => {
    const { container } = render(<AdminSidebar />);
    // /admin/users is active (via mocked usePathname)
    const activeLink = container.querySelector('a[href="/admin/users"]')!;
    expect(activeLink.className).toContain("--color-app-active-bg");
    expect(activeLink.className).not.toContain("--color-primary-light");
  });

  it("active nav item text is --color-app-text", () => {
    const { container } = render(<AdminSidebar />);
    const activeLink = container.querySelector('a[href="/admin/users"]')!;
    expect(activeLink.className).toContain("--color-app-text");
    expect(activeLink.className).not.toContain("--color-primary");
  });

  it("active nav icon uses --color-app-accent", () => {
    const { container } = render(<AdminSidebar />);
    const activeLink = container.querySelector('a[href="/admin/users"]')!;
    const iconSpan = activeLink.querySelector("span")!;
    expect(iconSpan.className).toContain("--color-app-accent");
    expect(iconSpan.className).not.toContain("--color-accent");
  });

  it("inactive nav items use --color-app-text-secondary", () => {
    const { container } = render(<AdminSidebar />);
    const inactiveLink = container.querySelector('a[href="/admin/reports"]')!;
    expect(inactiveLink.className).toContain("--color-app-text-secondary");
  });

  it("hover uses --color-app-active-bg and --color-app-text", () => {
    const { container } = render(<AdminSidebar />);
    const inactiveLink = container.querySelector('a[href="/admin/reports"]')!;
    expect(inactiveLink.className).toContain("--color-app-active-bg");
    expect(inactiveLink.className).toContain("--color-app-text");
  });

  it("footer text uses --font-body and --color-app-text-tertiary", () => {
    render(<AdminSidebar />);
    const footer = screen.getByText("Modern Signal Advisory");
    expect(footer.className).toContain("--font-body");
    expect(footer.className).not.toContain("--font-sans");
    expect(footer.className).toContain("--color-app-text-tertiary");
  });

  it("footer border uses --color-app-border", () => {
    const { container } = render(<AdminSidebar />);
    const footerDiv = container.querySelector("aside > div:last-child")!;
    expect((footerDiv as HTMLElement).className).toContain("--color-app-border");
  });
});

// ──────────────────────────── Scenario 2 ────────────────────────────
// AnalyticsNav tabs use warm palette

describe("AnalyticsNav warm palette", () => {
  it("tab bar bottom border uses --color-app-border", () => {
    const { container } = render(<AnalyticsNav />);
    const nav = container.querySelector("nav")!;
    expect(nav.className).toContain("--color-app-border");
    expect(nav.className).not.toContain("var(--color-border)");
  });

  it("all tab labels use --font-body", () => {
    const { container } = render(<AnalyticsNav />);
    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      expect(link.className).toContain("--font-body");
    });
  });

  it("active tab uses --color-app-accent for text and border", () => {
    // Volume tab is active when pathname === /admin/analytics
    // We mocked pathname as /admin/users, so no active analytics tab
    // But we can check the source file for the right tokens
    const source = readSource("components/admin/analytics-nav.tsx");
    expect(source).toContain("--color-app-accent");
    expect(source).not.toContain("--color-primary");
  });

  it("active tab background uses --color-app-surface", () => {
    const source = readSource("components/admin/analytics-nav.tsx");
    expect(source).toContain("--color-app-surface");
    expect(source).not.toContain("var(--color-surface)");
  });

  it("inactive tab uses --color-app-text-secondary", () => {
    const source = readSource("components/admin/analytics-nav.tsx");
    expect(source).toContain("--color-app-text-secondary");
  });

  it("hover uses --color-app-text and --color-app-surface", () => {
    const source = readSource("components/admin/analytics-nav.tsx");
    expect(source).toContain("hover:text-[var(--color-app-text)]");
    expect(source).toContain("hover:bg-[var(--color-app-surface)]");
  });
});

// ──────────────────────────── Scenario 3 ────────────────────────────
// Dashboard headings use Cormorant Garamond

describe("Dashboard headings use --font-display", () => {
  // Exclude panel components that don't have page-level h1 headings
  const DASHBOARD_WITH_H1 = DASHBOARD_COMPONENTS.filter(
    (f) => !f.includes("entitlement-overrides-panel")
  );

  it.each(DASHBOARD_WITH_H1)(
    "%s uses --font-display for h1 headings",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--font-display");
    }
  );

  it("entitlement-overrides-panel uses --font-body for section headings (no h1)", () => {
    const source = readSource("components/admin/entitlement-overrides-panel.tsx");
    expect(source).toContain("--font-body");
    expect(source).toContain("--color-app-text");
  });
});

// ──────────────────────────── Scenario 4 ────────────────────────────
// Dashboard cards and panels use warm surface tokens

describe("Dashboard cards use warm surface tokens", () => {
  it.each(DASHBOARD_COMPONENTS)(
    "%s uses --color-app-surface for card backgrounds",
    (filePath) => {
      const source = readSource(filePath);
      // Should use warm app-surface, not cold surface
      expect(source).toContain("--color-app-surface");
    }
  );

  it.each(DASHBOARD_COMPONENTS)(
    "%s uses --color-app-border for card borders",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-app-border");
    }
  );

  it.each(DASHBOARD_COMPONENTS)(
    "%s uses --font-body for body text",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--font-body");
      expect(source).not.toContain("--font-sans");
    }
  );

  it.each(DASHBOARD_COMPONENTS)(
    "%s uses --color-app-text for heading text color",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-app-text");
    }
  );

  it.each(DASHBOARD_COMPONENTS)(
    "%s uses --color-app-text-secondary for labels",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-app-text-secondary");
    }
  );
});

// ──────────────────────────── Scenario 5 ────────────────────────────
// Admin tables use warm borders and typography

describe("Admin tables use warm tokens", () => {
  const TABLE_COMPONENTS = [
    "components/admin/user-list-dashboard.tsx",
    "components/admin/report-list-dashboard.tsx",
    "components/admin/error-triage-dashboard.tsx",
    "components/admin/waitlist-dashboard.tsx",
  ];

  it.each(TABLE_COMPONENTS)(
    "%s uses --color-app-bg for alternating row backgrounds",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-app-bg");
    }
  );
});

// ──────────────────────────── Scenario 6 ────────────────────────────
// Admin action buttons use warm gold accent

describe("Admin buttons use warm accent", () => {
  const BUTTON_COMPONENTS = [
    "components/admin/user-list-dashboard.tsx",
    "components/admin/create-user-form.tsx",
    "components/admin/data-sources-dashboard.tsx",
    "components/admin/tier-management-dashboard.tsx",
    "components/admin/pipeline-visualizer.tsx",
  ];

  it.each(BUTTON_COMPONENTS)(
    "%s uses --color-app-accent for primary buttons",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-app-accent");
    }
  );
});

// ──────────────────────────── Scenario 7 ────────────────────────────
// Admin form inputs use warm tokens

describe("Admin form inputs use warm tokens", () => {
  const FORM_COMPONENTS = [
    "components/admin/user-list-dashboard.tsx",
    "components/admin/create-user-form.tsx",
    "components/admin/error-triage-dashboard.tsx",
    "components/admin/waitlist-dashboard.tsx",
    "components/admin/tier-management-dashboard.tsx",
  ];

  it.each(FORM_COMPONENTS)(
    "%s uses --color-app-border for input borders",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-app-border");
    }
  );

  it.each(FORM_COMPONENTS)(
    "%s uses --color-app-text for input text",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-app-text");
    }
  );
});

// ──────────────────────────── Scenario 8 ────────────────────────────
// Status badges retain semantic colors

describe("Status badges preserve semantic colors", () => {
  const STATUS_COMPONENTS = [
    "components/admin/user-list-dashboard.tsx",
    "components/admin/system-monitoring-dashboard.tsx",
    "components/admin/pipeline-visualizer.tsx",
    "components/admin/data-sources-dashboard.tsx",
    "components/admin/waitlist-dashboard.tsx",
  ];

  it.each(STATUS_COMPONENTS)(
    "%s preserves --color-success for active/healthy status",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-success");
    }
  );

  it.each(STATUS_COMPONENTS)(
    "%s preserves --color-error for error/failed status",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("--color-error");
    }
  );
});

// ──────────────────────────── Scenario 9 ────────────────────────────
// Admin page entrance animation

describe("Dashboard components use .app-fade-in", () => {
  it.each(DASHBOARD_COMPONENTS)(
    "%s uses app-fade-in animation class",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).toContain("app-fade-in");
    }
  );
});

// ──────────────────────────── Scenario 10 ────────────────────────────
// ExportButton uses warm accent

describe("ExportButton warm accent", () => {
  it("uses --color-app-border for outline", () => {
    const { container } = render(
      <ExportButton onExportCsv={() => {}} onExportJson={() => {}} />
    );
    const btn = screen.getByTestId("export-button");
    expect(btn.className).toContain("--color-app-border");
  });

  it("uses --color-app-text-secondary for text/icon", () => {
    render(<ExportButton onExportCsv={() => {}} onExportJson={() => {}} />);
    const btn = screen.getByTestId("export-button");
    expect(btn.className).toContain("--color-app-text-secondary");
  });

  it("hover uses --color-app-active-bg", () => {
    render(<ExportButton onExportCsv={() => {}} onExportJson={() => {}} />);
    const btn = screen.getByTestId("export-button");
    expect(btn.className).toContain("--color-app-active-bg");
    expect(btn.className).not.toContain("--color-primary-light");
  });

  it("dropdown uses --color-app-surface background", () => {
    const source = readSource("components/admin/export-button.tsx");
    expect(source).toContain("--color-app-surface");
  });

  it("dropdown items hover uses --color-app-active-bg", () => {
    const source = readSource("components/admin/export-button.tsx");
    expect(source).toContain("--color-app-active-bg");
  });
});

// ──────────────────────────── Scenario 11 ────────────────────────────
// Cold tokens completely removed from admin components

describe("No cold aesthetic tokens remain in admin components", () => {
  const ALL_ADMIN_FILES = [
    "components/layout/admin-sidebar.tsx",
    "components/admin/analytics-nav.tsx",
    "components/admin/export-button.tsx",
    ...DASHBOARD_COMPONENTS,
  ];

  it.each(ALL_ADMIN_FILES)(
    "%s does not reference --color-primary (cold navy)",
    (filePath) => {
      const source = readSource(filePath);
      // --color-primary should be replaced with --color-app-accent or --color-app-text
      // But allow --color-primary in SVG chart strokes (volume, pipeline-performance, user-analytics)
      // and STATUS_COLORS objects which use semantic colors
      // We check there's no --color-primary used for UI elements
      expect(source).not.toContain("bg-[var(--color-primary)]");
      expect(source).not.toContain("text-[var(--color-primary)]");
      expect(source).not.toContain("border-[var(--color-primary)]");
    }
  );

  it.each(ALL_ADMIN_FILES)(
    "%s does not reference --color-primary-light",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).not.toContain("--color-primary-light");
    }
  );

  it.each(ALL_ADMIN_FILES)(
    "%s does not reference --font-sans",
    (filePath) => {
      const source = readSource(filePath);
      expect(source).not.toContain("--font-sans");
    }
  );

  it.each(ALL_ADMIN_FILES)(
    "%s does not reference --color-surface for backgrounds (uses --color-app-surface)",
    (filePath) => {
      const source = readSource(filePath);
      // Should not have bare --color-surface (without -app- prefix)
      // Allow --color-app-surface
      const matches = source.match(/--color-surface(?!-)/g) || [];
      // Filter out any that are part of --color-app-surface
      const coldMatches = matches.filter((m) => {
        const idx = source.indexOf(m);
        const prefix = source.substring(Math.max(0, idx - 4), idx);
        return !prefix.includes("app-");
      });
      expect(coldMatches.length).toBe(0);
    }
  );

  it.each(ALL_ADMIN_FILES)(
    "%s does not reference --color-border (uses --color-app-border)",
    (filePath) => {
      const source = readSource(filePath);
      // Must not have bare --color-border (without -app- prefix)
      // Tricky: --color-border-strong should also be migrated
      // Allow semantic like --color-app-border
      const lines = source.split("\n");
      lines.forEach((line) => {
        if (line.includes("--color-border") && !line.includes("--color-app-border")) {
          // Allow in comments and allow --color-border-strong fallback references
          if (!line.trim().startsWith("//") && !line.trim().startsWith("*")) {
            // Check for cold border token usage
            const hasColdBorder = /--color-border(?!-)/.test(line) && !line.includes("--color-app-border");
            if (hasColdBorder) {
              // This is a cold token reference that should have been migrated
              expect(line).not.toMatch(/--color-border(?!-)/);
            }
          }
        }
      });
    }
  );
});

// ──────────────────────────── Scenario 12 ────────────────────────────
// Existing functionality preserved

describe("AdminSidebar functionality preserved", () => {
  it("renders all nav items", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Back to App")).toBeInTheDocument();
    expect(screen.getByText("Waitlist")).toBeInTheDocument();
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Report Registry")).toBeInTheDocument();
    expect(screen.getByText("Error Triage")).toBeInTheDocument();
    expect(screen.getByText("Eval Suite")).toBeInTheDocument();
    expect(screen.getByText("Data Sources")).toBeInTheDocument();
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Test Suite")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("System Monitor")).toBeInTheDocument();
    expect(screen.getByText("Subscription Tiers")).toBeInTheDocument();
  });

  it("Back to App links to /dashboard", () => {
    const { container } = render(<AdminSidebar />);
    const backLink = container.querySelector('a[href="/dashboard"]');
    expect(backLink).toBeTruthy();
  });

  it("renders Modern Signal Advisory footer", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Modern Signal Advisory")).toBeInTheDocument();
  });
});

describe("AnalyticsNav functionality preserved", () => {
  it("renders all 5 tabs", () => {
    render(<AnalyticsNav />);
    expect(screen.getByText("Volume")).toBeInTheDocument();
    expect(screen.getByText("Geographic")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("Social Media Kits")).toBeInTheDocument();
  });
});

describe("ExportButton functionality preserved", () => {
  it("renders export button", () => {
    render(<ExportButton onExportCsv={() => {}} onExportJson={() => {}} />);
    expect(screen.getByTestId("export-button")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });
});
