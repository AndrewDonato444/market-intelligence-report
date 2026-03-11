/**
 * Volume Metrics Dashboard Tests
 *
 * Tests for the VolumeMetricsDashboard component.
 *
 * Spec: .specs/features/admin/volume-metrics-dashboard.feature.md
 *
 * Test IDs:
 *   CMP-131-01: Renders KPI summary cards with overview data
 *   CMP-131-02: Renders volume chart with time series data
 *   CMP-131-03: Period tabs switch and re-fetch volume data
 *   CMP-131-04: Granularity selector changes and re-fetches
 *   CMP-131-05: Loading state while fetching
 *   CMP-131-06: Error state with retry button
 *   CMP-131-07: Empty state when no data
 *   CMP-131-08: Refresh button re-fetches data
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/analytics",
}));

import { VolumeMetricsDashboard } from "@/components/admin/volume-metrics-dashboard";

const mockOverviewData = {
  reportVolume: {
    last24h: 12,
    last7d: 67,
    last30d: 234,
    allTime: 1089,
  },
  userCount: {
    total: 45,
    active: 28,
    newLast30d: 6,
  },
  errorRate: {
    last7d: { failed: 3, total: 67, rate: 0.0448 },
    last30d: { failed: 9, total: 234, rate: 0.0385 },
  },
  avgGenerationTime: {
    last7d: 142.5,
    last30d: 138.2,
  },
};

const mockVolumeData = {
  timeSeries: [
    { date: "2026-03-01", total: 8, completed: 7, failed: 1 },
    { date: "2026-03-02", total: 5, completed: 5, failed: 0 },
    { date: "2026-03-03", total: 0, completed: 0, failed: 0 },
    { date: "2026-03-04", total: 12, completed: 11, failed: 1 },
  ],
  period: "30d",
  granularity: "daily",
};

const emptyOverviewData = {
  reportVolume: { last24h: 0, last7d: 0, last30d: 0, allTime: 0 },
  userCount: { total: 0, active: 0, newLast30d: 0 },
  errorRate: {
    last7d: { failed: 0, total: 0, rate: 0 },
    last30d: { failed: 0, total: 0, rate: 0 },
  },
  avgGenerationTime: { last7d: 0, last30d: 0 },
};

const emptyVolumeData = {
  timeSeries: [],
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

    if (urlStr.includes("/api/admin/analytics/volume")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVolumeData),
      });
    }
    if (urlStr.includes("/api/admin/analytics")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOverviewData),
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

// CMP-131-01
describe("KPI Summary Cards", () => {
  it("renders four KPI cards with overview data", async () => {
    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("1,089")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Reports")).toBeInTheDocument();
    expect(screen.getByText("1,089")).toBeInTheDocument();

    expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
    expect(screen.getByText("234")).toBeInTheDocument();

    expect(screen.getByText("Error Rate (30d)")).toBeInTheDocument();
    expect(screen.getByText("3.9%")).toBeInTheDocument();

    expect(screen.getByText("Avg Gen Time (30d)")).toBeInTheDocument();
    expect(screen.getByText("138.2s")).toBeInTheDocument();
  });
});

// CMP-131-02
describe("Volume Chart", () => {
  it("fetches volume data with default period and granularity", async () => {
    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(fetchCalls.some((u) => u.includes("/api/admin/analytics/volume?period=30d&granularity=daily"))).toBe(true);
    });
  });

  it("renders chart section with title", async () => {
    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Report Volume Over Time")).toBeInTheDocument();
    });
  });
});

// CMP-131-03
describe("Period Tabs", () => {
  it("changes period when tab is clicked and re-fetches", async () => {
    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("1,089")).toBeInTheDocument();
    });

    fetchCalls = [];
    fireEvent.click(screen.getByRole("tab", { name: "90d" }));

    await waitFor(() => {
      expect(fetchCalls.some((u) => u.includes("period=90d"))).toBe(true);
    });
  });
});

// CMP-131-04
describe("Granularity Selector", () => {
  it("changes granularity and re-fetches volume data", async () => {
    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("1,089")).toBeInTheDocument();
    });

    fetchCalls = [];
    fireEvent.click(screen.getByRole("tab", { name: "Weekly" }));

    await waitFor(() => {
      expect(fetchCalls.some((u) => u.includes("granularity=weekly"))).toBe(true);
    });
  });
});

// CMP-131-05
describe("Loading State", () => {
  it("shows loading spinner while fetching", () => {
    render(<VolumeMetricsDashboard />);
    expect(screen.getByText("Loading analytics data...")).toBeInTheDocument();
  });
});

// CMP-131-06
describe("Error State", () => {
  it("shows error message with retry when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as jest.Mock;

    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load analytics/)).toBeInTheDocument();
    });
  });
});

// CMP-131-07
describe("Empty State", () => {
  it("shows zero values when no reports exist", async () => {
    global.fetch = jest.fn((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url.toString();
      if (urlStr.includes("/api/admin/analytics/volume")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(emptyVolumeData),
        });
      }
      if (urlStr.includes("/api/admin/analytics")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(emptyOverviewData),
        });
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
    }) as jest.Mock;

    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Reports")).toBeInTheDocument();
    });

    // All-time reports should be 0
    const kpiCards = screen.getByTestId("kpi-cards");
    expect(kpiCards).toBeInTheDocument();
    expect(screen.getByText(/No report data/)).toBeInTheDocument();
  });
});

// CMP-131-08
describe("Refresh Button", () => {
  it("re-fetches data when refresh is clicked", async () => {
    render(<VolumeMetricsDashboard />);

    await waitFor(() => {
      expect(screen.getByText("1,089")).toBeInTheDocument();
    });

    const initialCount = fetchCallCount;
    fireEvent.click(screen.getByText("Refresh"));

    await waitFor(() => {
      expect(fetchCallCount).toBeGreaterThan(initialCount);
    });
  });
});
