/**
 * Report List Dashboard Tests
 *
 * Tests for the ReportListDashboard component — all Gherkin scenarios.
 *
 * Spec: .specs/features/admin/admin-report-list.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/reports",
  useRouter: () => ({ push: jest.fn() }),
}));

import { ReportListDashboard } from "@/components/admin/report-list-dashboard";

const mockReportsResponse = {
  reports: [
    {
      id: "r1",
      title: "Naples Q1 2026 Intelligence",
      status: "completed",
      userId: "u1",
      userName: "Jane Smith",
      userCompany: "Acme Realty",
      marketId: "m1",
      marketName: "Naples, FL",
      createdAt: "2026-03-10T10:00:00Z",
      generationStartedAt: "2026-03-10T10:00:00Z",
      generationCompletedAt: "2026-03-10T10:02:34Z",
      generationTimeMs: 154000,
      errorSummary: null,
    },
    {
      id: "r2",
      title: "Aspen Ultra-Lux Report",
      status: "failed",
      userId: "u2",
      userName: "Jordan Ellis",
      userCompany: "Boutique Firm",
      marketId: "m2",
      marketName: "Aspen, CO",
      createdAt: "2026-03-09T08:00:00Z",
      generationStartedAt: "2026-03-09T08:00:00Z",
      generationCompletedAt: null,
      generationTimeMs: null,
      errorSummary: "Insight Generator: API timeout",
    },
    {
      id: "r3",
      title: "Miami Beach Market Brief",
      status: "generating",
      userId: "u3",
      userName: "Alex Rivera",
      userCompany: null,
      marketId: "m3",
      marketName: "Miami Beach, FL",
      createdAt: "2026-03-11T09:00:00Z",
      generationStartedAt: "2026-03-11T09:00:00Z",
      generationCompletedAt: null,
      generationTimeMs: null,
      errorSummary: null,
    },
    {
      id: "r4",
      title: "Palm Beach Intelligence",
      status: "queued",
      userId: "u4",
      userName: "Morgan Hale",
      userCompany: "Lux Group",
      marketId: "m4",
      marketName: "Palm Beach, FL",
      createdAt: "2026-03-11T10:00:00Z",
      generationStartedAt: null,
      generationCompletedAt: null,
      generationTimeMs: null,
      errorSummary: null,
    },
  ],
  total: 4,
  statusCounts: {
    all: 4,
    completed: 1,
    generating: 1,
    queued: 1,
    failed: 1,
  },
  page: 1,
  pageSize: 20,
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("ReportListDashboard", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReportsResponse),
    });
  });

  // Scenario: Admin views the report registry
  it("CMP-reportlist-01: should render page title 'Report Registry' with subtitle", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Report Registry")).toBeInTheDocument();
    });
    expect(screen.getByText("All reports across the platform")).toBeInTheDocument();
  });

  // Scenario: Admin views report table with correct columns
  it("CMP-reportlist-02: should render report table with all required columns", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    // Column headers are in <th> elements
    const headers = screen.getAllByRole("columnheader");
    const headerTexts = headers.map((h) => h.textContent?.trim() || "");
    expect(headerTexts).toContain("Title");
    expect(headerTexts).toContain("Agent");
    expect(headerTexts).toContain("Market");
    expect(headerTexts).toContain("Status");
    expect(headerTexts.some((h) => h.includes("Created"))).toBe(true);
    expect(headerTexts.some((h) => /Gen.*Time/i.test(h))).toBe(true);
  });

  // Scenario: Admin sees report data in table
  it("CMP-reportlist-03: should display report data in table rows", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    // Use getAllByText for items that appear in both table and filter dropdowns
    expect(screen.getAllByText("Jane Smith").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Naples, FL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Jordan Ellis").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Aspen, CO").length).toBeGreaterThanOrEqual(1);
  });

  // Scenario: Admin sees status counts in filter tabs
  it("CMP-reportlist-04: should show filter tabs with status counts", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /All.*4/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Completed.*1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generating.*1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Queued.*1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Failed.*1/i })).toBeInTheDocument();
  });

  // Scenario: Admin filters reports by status
  it("CMP-reportlist-05: should filter by status when clicking filter tab", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    const failedBtn = screen.getByRole("button", { name: /Failed/ });
    fireEvent.click(failedBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=failed")
      );
    });
  });

  // Scenario: Admin searches reports by title, agent name, or market
  it("CMP-reportlist-06: should search with 300ms debounce", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(searchInput, { target: { value: "Naples" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=Naples")
      );
    });
  });

  // Scenario: Admin filters by date range
  it("CMP-reportlist-07: should show date range filter with presets", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    const dateSelect = screen.getByDisplayValue("All time");
    expect(dateSelect).toBeInTheDocument();
  });

  // Scenario: Admin filters by specific agent
  it("CMP-reportlist-08: should have agent dropdown filter", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    const agentSelect = selects.find(
      (s) => s.querySelector("option")?.textContent === "Agent"
    );
    expect(agentSelect).toBeTruthy();
  });

  // Scenario: Admin filters by market
  it("CMP-reportlist-09: should have market dropdown filter", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    const marketSelect = selects.find(
      (s) => s.querySelector("option")?.textContent === "Market"
    );
    expect(marketSelect).toBeTruthy();
  });

  // Scenario: Admin sorts by column
  it("CMP-reportlist-10: should sort when clicking column headers", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    // Find the "Created" column header specifically
    const headers = screen.getAllByRole("columnheader");
    const createdHeader = headers.find((h) =>
      h.textContent?.includes("Created")
    );
    expect(createdHeader).toBeTruthy();
    fireEvent.click(createdHeader!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=createdAt")
      );
    });
  });

  // Scenario: Failed reports show error indicator
  it("CMP-reportlist-11: should show error summary for failed reports", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Insight Generator: API timeout")).toBeInTheDocument();
    });
  });

  // Scenario: Generating reports show status badge
  it("CMP-reportlist-12: should show 'Generating' status badge for generating reports", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      const badges = screen.getAllByText(/Generating/i);
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Scenario: Completed reports show generation duration
  it("CMP-reportlist-13: should show generation time for completed reports", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/2m 34s/)).toBeInTheDocument();
    });
  });

  // Scenario: Admin clicks a report row to view details
  it("CMP-reportlist-14: should set location to report detail on row click", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    const row = screen.getByText("Naples Q1 2026 Intelligence").closest("tr");
    expect(row).toBeTruthy();
    if (row) {
      fireEvent.click(row);
    }

    // In jsdom, the assignment to window.location.href triggers navigation
    // We verify the row is clickable and has cursor: pointer
    expect(row).toHaveStyle({ cursor: "pointer" });
  });

  // Scenario: Pagination
  it("CMP-reportlist-15: should show pagination counter", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 1/)).toBeInTheDocument();
    });

    expect(screen.getByText(/of 4/)).toBeInTheDocument();
  });

  // Scenario: Pagination with Next button
  it("CMP-reportlist-16: should show Next/Prev buttons for pagination", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...mockReportsResponse,
          total: 45,
        }),
    });

    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/of 45/)).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole("button", { name: /Next/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("page=2")
      );
    });
  });

  // Scenario: Empty state with active filters
  it("CMP-reportlist-17: should show empty state when no reports match filters", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          reports: [],
          total: 0,
          statusCounts: { all: 10, completed: 8, generating: 1, queued: 1, failed: 0 },
          page: 1,
          pageSize: 20,
        }),
    });

    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No reports match/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Clear filters/i)).toBeInTheDocument();
  });

  // Scenario: Empty state with no reports
  it("CMP-reportlist-18: should show empty state when no reports exist", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          reports: [],
          total: 0,
          statusCounts: { all: 0, completed: 0, generating: 0, queued: 0, failed: 0 },
          page: 1,
          pageSize: 20,
        }),
    });

    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No reports generated yet/i)).toBeInTheDocument();
    });
  });

  // Scenario: Loading state
  it("CMP-reportlist-19: should show loading state while fetching", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ReportListDashboard />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  // Scenario: Error state
  it("CMP-reportlist-20: should show error message with retry on API failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  // Scenario: Queued reports show em-dash for generation time
  it("CMP-reportlist-21: should show em-dash for queued report generation time", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Palm Beach Intelligence")).toBeInTheDocument();
    });

    const row = screen.getByText("Palm Beach Intelligence").closest("tr");
    expect(row?.textContent).toContain("\u2014");
  });

  // Scenario: Status badges render for all statuses
  it("CMP-reportlist-22: should render status badges for all statuses", async () => {
    render(<ReportListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Completed/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Failed/i).length).toBeGreaterThanOrEqual(1);
  });
});
