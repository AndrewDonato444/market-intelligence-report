/**
 * User Analytics Dashboard Tests
 *
 * Tests for the UserAnalyticsDashboard component.
 *
 * Spec: .specs/features/admin/user-analytics.feature.md
 *
 * Test IDs:
 *   CMP-133-01: Renders four KPI cards with user summary data
 *   CMP-133-02: Renders signup trend chart with default period
 *   CMP-133-03: Period tabs switch and re-fetch data
 *   CMP-133-04: Granularity selector changes and re-fetches
 *   CMP-133-05: Power users table displays top report generators
 *   CMP-133-06: Churn indicators section shows at-risk users
 *   CMP-133-07: Loading state while fetching
 *   CMP-133-08: Error state with retry button
 *   CMP-133-09: Empty state when no users
 *   CMP-133-10: User name links to admin user detail page
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/analytics/users",
}));

jest.mock("next/link", () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

import { UserAnalyticsDashboard } from "@/components/admin/user-analytics-dashboard";

const mockUserData = {
  signups: [
    { date: "2026-03-01", count: 5 },
    { date: "2026-03-02", count: 3 },
    { date: "2026-03-03", count: 0 },
    { date: "2026-03-04", count: 8 },
  ],
  summary: {
    totalUsers: 247,
    activeUsers: 189,
    newSignups: 34,
    inactiveOver60d: 23,
  },
  powerUsers: [
    {
      id: "user-1",
      name: "Jordan Ellis",
      email: "jordan@example.com",
      reportCount: 47,
      lastReportDate: "2026-03-10T12:00:00Z",
    },
    {
      id: "user-2",
      name: "Morgan Hale",
      email: "morgan@example.com",
      reportCount: 38,
      lastReportDate: "2026-03-09T12:00:00Z",
    },
  ],
  churnRisk: [
    {
      id: "user-3",
      name: "Casey Morgan",
      email: "casey@example.com",
      lastReportDate: "2026-02-05T12:00:00Z",
      daysSinceLastReport: 34,
    },
    {
      id: "user-4",
      name: "Robin Park",
      email: "robin@example.com",
      lastReportDate: "2026-01-28T12:00:00Z",
      daysSinceLastReport: 42,
    },
  ],
  period: "30d",
  granularity: "daily",
};

const emptyUserData = {
  signups: [],
  summary: {
    totalUsers: 0,
    activeUsers: 0,
    newSignups: 0,
    inactiveOver60d: 0,
  },
  powerUsers: [],
  churnRisk: [],
  period: "30d",
  granularity: "daily",
};

let fetchCallCount = 0;
let fetchCalls: string[] = [];

beforeEach(() => {
  fetchCallCount = 0;
  fetchCalls = [];
  global.fetch = jest.fn((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    fetchCalls.push(urlStr);
    fetchCallCount++;

    if (urlStr.includes("/api/admin/analytics/users")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

// CMP-133-01
describe("KPI Summary Cards", () => {
  it("renders four KPI cards with user summary data", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("247")).toBeInTheDocument();
    });

    const kpiCards = screen.getByTestId("kpi-cards");
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("247")).toBeInTheDocument();

    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("189")).toBeInTheDocument();

    expect(screen.getByText("New Signups")).toBeInTheDocument();
    // "34" appears both in KPI card and churn table — check within kpi-cards
    expect(within(kpiCards).getByText("34")).toBeInTheDocument();

    expect(screen.getByText(/Inactive/)).toBeInTheDocument();
    expect(screen.getByText("23")).toBeInTheDocument();
  });
});

// CMP-133-02
describe("Signup Trend Chart", () => {
  it("fetches data with default period and granularity", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(
        fetchCalls.some((u) =>
          u.includes("/api/admin/analytics/users?period=30d&granularity=daily")
        )
      ).toBe(true);
    });
  });

  it("renders chart section with title", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("New Signups Over Time")).toBeInTheDocument();
    });
  });
});

// CMP-133-03
describe("Period Tabs", () => {
  it("changes period when tab is clicked and re-fetches", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("247")).toBeInTheDocument();
    });

    fetchCalls = [];
    fireEvent.click(screen.getByRole("tab", { name: "90d" }));

    await waitFor(() => {
      expect(fetchCalls.some((u) => u.includes("period=90d"))).toBe(true);
    });
  });
});

// CMP-133-04
describe("Granularity Selector", () => {
  it("changes granularity and re-fetches data", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("247")).toBeInTheDocument();
    });

    fetchCalls = [];
    fireEvent.click(screen.getByRole("tab", { name: "Weekly" }));

    await waitFor(() => {
      expect(fetchCalls.some((u) => u.includes("granularity=weekly"))).toBe(
        true
      );
    });
  });
});

// CMP-133-05
describe("Power Users Table", () => {
  it("displays top report generators", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Top Report Generators")).toBeInTheDocument();
    });

    expect(screen.getByText("Jordan Ellis")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.getByText("Morgan Hale")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
  });
});

// CMP-133-06
describe("Churn Indicators", () => {
  it("shows at-risk users with days since last report", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("At-Risk Users")).toBeInTheDocument();
    });

    expect(screen.getByText("Casey Morgan")).toBeInTheDocument();
    // "34" appears in both KPI and churn — verify Casey's row has 34 days
    const caseyRow = screen.getByText("Casey Morgan").closest("tr")!;
    expect(within(caseyRow).getByText("34")).toBeInTheDocument();

    expect(screen.getByText("Robin Park")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    // Header count
    expect(screen.getByText(/2 users/)).toBeInTheDocument();
  });
});

// CMP-133-07
describe("Loading State", () => {
  it("shows loading spinner while fetching", () => {
    render(<UserAnalyticsDashboard />);
    expect(screen.getByText("Loading user analytics...")).toBeInTheDocument();
  });
});

// CMP-133-08
describe("Error State", () => {
  it("shows error message with retry when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as jest.Mock;

    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("retries when Retry button is clicked", async () => {
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Server error" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });
    }) as jest.Mock;

    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(screen.getByText("247")).toBeInTheDocument();
    });
  });
});

// CMP-133-09
describe("Empty State", () => {
  it("shows zero/empty state when no users exist", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(emptyUserData),
      })
    ) as jest.Mock;

    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });

    expect(screen.getByTestId("kpi-cards")).toBeInTheDocument();
    // Empty power users and churn sections
    expect(screen.getByText(/No power users/)).toBeInTheDocument();
  });
});

// CMP-133-10
describe("User Links", () => {
  it("links user names to admin user detail page", async () => {
    render(<UserAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jordan Ellis")).toBeInTheDocument();
    });

    const link = screen.getByText("Jordan Ellis").closest("a");
    expect(link).toHaveAttribute("href", "/admin/users/user-1");
  });
});
