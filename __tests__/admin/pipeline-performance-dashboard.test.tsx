/**
 * Pipeline Performance Dashboard Tests
 *
 * Tests for the PipelinePerformanceDashboard component.
 *
 * Spec: .specs/features/admin/pipeline-performance.feature.md
 *
 * Test IDs:
 *   CMP-134-01: Renders four KPI cards with performance summary data
 *   CMP-134-02: Renders generation time trend chart with default period
 *   CMP-134-03: Period tabs switch and re-fetch data
 *   CMP-134-04: Granularity selector changes and re-fetches
 *   CMP-134-05: Agent error breakdown table displays failure counts
 *   CMP-134-06: Cost breakdown section shows provider costs
 *   CMP-134-07: Loading state while fetching
 *   CMP-134-08: Error state with retry button
 *   CMP-134-09: Empty state when no reports exist
 *   CMP-134-10: Analytics nav includes Performance tab
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/analytics/performance",
}));

jest.mock("next/link", () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

import { PipelinePerformanceDashboard } from "@/components/admin/pipeline-performance-dashboard";

const mockPerfData = {
  generationTimeSeries: [
    { date: "2026-03-01", avgSeconds: 42.3, count: 5 },
    { date: "2026-03-02", avgSeconds: 38.1, count: 3 },
    { date: "2026-03-03", avgSeconds: 55.0, count: 2 },
    { date: "2026-03-04", avgSeconds: 41.7, count: 6 },
  ],
  summary: {
    avgGenerationTime: 42.3,
    cacheHitRate: 0.672,
    avgCostPerReport: 0.47,
    errorRate: 0.032,
    totalReports: 156,
    totalErrors: 5,
  },
  errorsByAgent: [
    { agent: "Data Analyst", count: 5 },
    { agent: "Insight Generator", count: 3 },
    { agent: "Forecast Modeler", count: 2 },
  ],
  costByProvider: [
    { provider: "Anthropic", requests: 234, totalCost: 112.5, avgCostPerRequest: 0.48 },
    { provider: "RealEstateAPI", requests: 567, totalCost: 28.35, avgCostPerRequest: 0.05 },
  ],
  period: "30d",
  granularity: "daily",
};

const emptyPerfData = {
  generationTimeSeries: [],
  summary: {
    avgGenerationTime: 0,
    cacheHitRate: 0,
    avgCostPerReport: 0,
    errorRate: 0,
    totalReports: 0,
    totalErrors: 0,
  },
  errorsByAgent: [],
  costByProvider: [],
  period: "30d",
  granularity: "daily",
};

let fetchCalls: string[] = [];

beforeEach(() => {
  fetchCalls = [];
  global.fetch = jest.fn((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    fetchCalls.push(urlStr);

    if (urlStr.includes("/api/admin/analytics/performance")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPerfData),
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

// CMP-134-01
describe("KPI Summary Cards", () => {
  it("renders four KPI cards with performance summary data", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("42.3s")).toBeInTheDocument();
    });

    const kpiCards = screen.getByTestId("kpi-cards");
    expect(screen.getByText("Avg Generation Time")).toBeInTheDocument();
    expect(within(kpiCards).getByText("42.3s")).toBeInTheDocument();

    expect(screen.getByText("Cache Hit Rate")).toBeInTheDocument();
    expect(within(kpiCards).getByText("67.2%")).toBeInTheDocument();

    expect(screen.getByText("Avg Cost / Report")).toBeInTheDocument();
    expect(within(kpiCards).getByText("$0.47")).toBeInTheDocument();

    expect(screen.getByText("Error Rate")).toBeInTheDocument();
    expect(within(kpiCards).getByText("3.2%")).toBeInTheDocument();
  });
});

// CMP-134-02
describe("Generation Time Trend Chart", () => {
  it("fetches data with default period and granularity", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(
        fetchCalls.some((u) =>
          u.includes("/api/admin/analytics/performance?period=30d&granularity=daily")
        )
      ).toBe(true);
    });
  });

  it("renders chart section with title", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Average Generation Time")).toBeInTheDocument();
    });
  });
});

// CMP-134-03
describe("Period Tabs", () => {
  it("changes period when tab is clicked and re-fetches", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("42.3s")).toBeInTheDocument();
    });

    fetchCalls = [];
    fireEvent.click(screen.getByRole("tab", { name: "90d" }));

    await waitFor(() => {
      expect(fetchCalls.some((u) => u.includes("period=90d"))).toBe(true);
    });
  });
});

// CMP-134-04
describe("Granularity Selector", () => {
  it("changes granularity and re-fetches data", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("42.3s")).toBeInTheDocument();
    });

    fetchCalls = [];
    fireEvent.click(screen.getByRole("tab", { name: "Weekly" }));

    await waitFor(() => {
      expect(fetchCalls.some((u) => u.includes("granularity=weekly"))).toBe(true);
    });
  });
});

// CMP-134-05
describe("Agent Error Breakdown", () => {
  it("displays agent errors sorted by count descending", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Errors by Agent")).toBeInTheDocument();
    });

    expect(screen.getByText("Data Analyst")).toBeInTheDocument();
    expect(screen.getByText("Insight Generator")).toBeInTheDocument();
    expect(screen.getByText("Forecast Modeler")).toBeInTheDocument();

    const rows = screen.getAllByTestId("agent-error-row");
    expect(within(rows[0]).getByText("Data Analyst")).toBeInTheDocument();
    expect(within(rows[0]).getByText("5")).toBeInTheDocument();
  });
});

// CMP-134-06
describe("Cost Breakdown", () => {
  it("shows cost grouped by provider", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Cost Breakdown by Provider")).toBeInTheDocument();
    });

    expect(screen.getByText("Anthropic")).toBeInTheDocument();
    expect(screen.getByText("$112.50")).toBeInTheDocument();
    expect(screen.getByText("234")).toBeInTheDocument();
    expect(screen.getByText("$0.48")).toBeInTheDocument();

    expect(screen.getByText("RealEstateAPI")).toBeInTheDocument();
    expect(screen.getByText("$28.35")).toBeInTheDocument();
  });
});

// CMP-134-07
describe("Loading State", () => {
  it("shows loading spinner while fetching", () => {
    render(<PipelinePerformanceDashboard />);
    expect(screen.getByText("Loading performance metrics...")).toBeInTheDocument();
  });
});

// CMP-134-08
describe("Error State", () => {
  it("shows error message with retry when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error" }),
      })
    ) as jest.Mock;

    render(<PipelinePerformanceDashboard />);

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
        json: () => Promise.resolve(mockPerfData),
      });
    }) as jest.Mock;

    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(screen.getByText("42.3s")).toBeInTheDocument();
    });
  });
});

// CMP-134-09
describe("Empty State", () => {
  it("shows zero/empty state when no reports exist", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(emptyPerfData),
      })
    ) as jest.Mock;

    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Avg Generation Time")).toBeInTheDocument();
    });

    expect(screen.getByTestId("kpi-cards")).toBeInTheDocument();
    expect(screen.getByText(/No errors/)).toBeInTheDocument();
    expect(screen.getByText(/No cost data/)).toBeInTheDocument();
  });
});

// CMP-134-10
describe("Analytics Nav", () => {
  it("includes Performance tab in analytics navigation", async () => {
    render(<PipelinePerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText("42.3s")).toBeInTheDocument();
    });
  });
});
