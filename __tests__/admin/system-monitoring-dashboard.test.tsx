/**
 * System Monitoring Dashboard Tests
 *
 * Tests for the SystemMonitoringDashboard component.
 *
 * Spec: .specs/features/admin/system-monitoring-dashboard.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/monitoring",
}));

import { SystemMonitoringDashboard } from "@/components/admin/system-monitoring-dashboard";

const mockMonitoringData = {
  summary: {
    totalApiCalls: 1247,
    totalCost: 12.3456,
    cacheHitRate: 67.3,
    pipelineSuccessRate: 94.1,
  },
  byProvider: [
    {
      provider: "realestateapi",
      callCount: 800,
      totalCost: 8.4,
      cacheHits: 340,
      avgResponseTimeMs: 45,
    },
    {
      provider: "anthropic",
      callCount: 400,
      totalCost: 3.8,
      cacheHits: 0,
      avgResponseTimeMs: 120,
    },
  ],
  cacheHealth: {
    bySource: [
      { source: "realestateapi", entryCount: 120 },
      { source: "scrapingdog", entryCount: 45 },
    ],
    totalEntries: 165,
    expiringSoon: 17,
    expired: 3,
  },
  pipelineHealth: {
    total: 17,
    completed: 16,
    failed: 1,
    generating: 0,
    queued: 0,
    avgDurationMs: 154000,
    recentFailures: [
      {
        title: "Naples Q1 Report",
        errorMessage: "Anthropic rate limit exceeded",
        createdAt: "2026-03-10T12:00:00Z",
      },
    ],
  },
  dataSources: [
    {
      name: "realestateapi",
      status: "healthy",
      latencyMs: 45,
      lastChecked: "2026-03-10T12:00:00Z",
    },
    {
      name: "scrapingdog",
      status: "unhealthy",
      latencyMs: 0,
      lastChecked: "2026-03-10T12:00:00Z",
      error: "API key unauthorized",
    },
  ],
  timestamp: "2026-03-10T12:00:00Z",
};

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("SystemMonitoringDashboard", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMonitoringData),
    });
  });

  // Scenario: Admin views system monitoring dashboard
  it("CMP-monitoring-01: should render summary cards with correct values", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("1,247")).toBeInTheDocument();
    });

    expect(screen.getByText("$12.3456")).toBeInTheDocument();
    expect(screen.getByText("67.3%")).toBeInTheDocument();
    expect(screen.getByText("94.1%")).toBeInTheDocument();
  });

  it("CMP-monitoring-02: should render page title and description", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("System Monitoring")).toBeInTheDocument();
    });

    expect(screen.getByText("Cache stats, API costs, pipeline health")).toBeInTheDocument();
  });

  // Scenario: API cost breakdown by provider
  it("CMP-monitoring-03: should render provider breakdown table", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("API Costs by Provider")).toBeInTheDocument();
    });

    // "realestateapi" appears in both provider table and cache table — use getAllByText
    expect(screen.getAllByText("realestateapi").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("anthropic")).toBeInTheDocument();
    expect(screen.getByText("800")).toBeInTheDocument();
    expect(screen.getByText("400")).toBeInTheDocument();
  });

  // Scenario: Cache health section
  it("CMP-monitoring-04: should render cache health stats", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Cache Health")).toBeInTheDocument();
    });

    expect(screen.getByText("165")).toBeInTheDocument(); // total entries
    // "17" appears in both pipeline total and expiring soon — use getAllByText
    expect(screen.getAllByText("17").length).toBeGreaterThanOrEqual(1);
    // "3" can appear in multiple places — expired count
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  // Scenario: Pipeline health section
  it("CMP-monitoring-05: should render pipeline health stats", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Pipeline Health")).toBeInTheDocument();
    });

    expect(screen.getByText("16")).toBeInTheDocument(); // completed
    expect(screen.getByText("1")).toBeInTheDocument(); // failed
  });

  it("CMP-monitoring-06: should render recent failures", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Recent Failures")).toBeInTheDocument();
    });

    expect(screen.getByText(/Naples Q1 Report/)).toBeInTheDocument();
    expect(screen.getByText("Anthropic rate limit exceeded")).toBeInTheDocument();
  });

  // Scenario: Data source status
  it("CMP-monitoring-07: should render data source health", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Data Sources")).toBeInTheDocument();
    });

    expect(screen.getByText("healthy")).toBeInTheDocument();
    expect(screen.getByText("unhealthy")).toBeInTheDocument();
  });

  // Scenario: Admin filters by time period
  it("CMP-monitoring-08: should fetch data with selected period", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/admin/monitoring?period=7d");
    });

    fireEvent.click(screen.getByText("24h"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/admin/monitoring?period=24h");
    });
  });

  // Loading state
  it("CMP-monitoring-09: should show loading spinner while fetching", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<SystemMonitoringDashboard />);

    expect(screen.getByText("Loading monitoring data...")).toBeInTheDocument();
  });

  // Error state
  it("CMP-monitoring-10: should show error message on fetch failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch: 500")).toBeInTheDocument();
    });
  });

  // Health check action
  it("CMP-monitoring-11: should trigger health check on button click", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Check All")).toBeInTheDocument();
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          results: {},
          dataSources: mockMonitoringData.dataSources,
        }),
    });

    fireEvent.click(screen.getByText("Check All"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/admin/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "health-check" }),
      });
    });
  });

  // Refresh button
  it("CMP-monitoring-12: should refetch data on Refresh click", async () => {
    render(<SystemMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Refresh"));

    await waitFor(() => {
      // Should have been called twice: initial + refresh
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
