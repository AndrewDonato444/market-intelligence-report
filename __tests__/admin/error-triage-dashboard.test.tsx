/**
 * Error Triage Dashboard Component Tests
 *
 * Tests for components/admin/error-triage-dashboard.tsx
 *
 * Spec: .specs/features/admin/error-triage-view.feature.md
 *
 * @jest-environment jsdom
 */

export {}; // Ensure this file is treated as a module to avoid TS2451

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockResponse = {
  errors: [
    {
      id: "report-1",
      title: "Naples Q1 2026 Intelligence",
      userId: "user-1",
      userName: "Jane Smith",
      userCompany: "Acme Realty",
      marketName: "Naples, FL",
      failingAgent: "Insight Generator",
      errorMessage: "API timeout after 30s",
      failedAt: "2026-03-11T14:34:00Z",
      stageIndex: 2,
      totalStages: 6,
      stack: "Error: API timeout\n  at InsightGenerator.run",
      previousErrors: [
        { agent: "Data Analyst", message: "Rate limited", occurredAt: "2026-03-10T10:00:00Z" },
      ],
      retriedAt: "2026-03-11T15:00:00Z",
      retriedBy: "admin-1",
    },
    {
      id: "report-2",
      title: "Aspen Ultra-Lux Report",
      userId: "user-2",
      userName: "Jordan Ellis",
      userCompany: null,
      marketName: "Aspen, CO",
      failingAgent: "Competitive Analyst",
      errorMessage: "Missing peer market data for comparison",
      failedAt: "2026-03-09T16:22:00Z",
      stageIndex: null,
      totalStages: null,
      stack: null,
      previousErrors: [],
      retriedAt: null,
      retriedBy: null,
    },
  ],
  total: 2,
  summary: {
    totalErrors: 5,
    errorsToday: 1,
    mostFailingAgent: { agent: "Insight Generator", count: 3 },
    retryRate: { retried: 2, total: 5 },
  },
  failingAgents: ["Competitive Analyst", "Data Analyst", "Insight Generator"],
  page: 1,
  pageSize: 20,
};

const emptyResponse = {
  errors: [],
  total: 0,
  summary: {
    totalErrors: 0,
    errorsToday: 0,
    mostFailingAgent: null,
    retryRate: { retried: 0, total: 0 },
  },
  failingAgents: [],
  page: 1,
  pageSize: 20,
};

describe("ErrorTriageDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Scenario: Admin views the error triage page
  it("CMP-errortriage-01: should render page title and subtitle", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Error Triage")).toBeInTheDocument();
      expect(screen.getByText("Failed reports requiring attention")).toBeInTheDocument();
    });
  });

  // Scenario: Summary cards show aggregate error metrics
  it("CMP-errortriage-02: should display summary cards with metrics", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Total Errors")).toBeInTheDocument();
      expect(screen.getByText("Errors Today")).toBeInTheDocument();
      expect(screen.getByText("Most Failing Agent")).toBeInTheDocument();
      expect(screen.getByText("3 failures")).toBeInTheDocument();
      expect(screen.getByText("Retry Rate")).toBeInTheDocument();
      expect(screen.getByText("2 of 5")).toBeInTheDocument();
    });
  });

  // Scenario: Admin sees failed reports with error details
  it("CMP-errortriage-03: should display failed reports in table", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
      expect(screen.getByText("Aspen Ultra-Lux Report")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Jordan Ellis")).toBeInTheDocument();
    });
  });

  // Scenario: Admin expands error details inline
  it("CMP-errortriage-04: should expand row to show error details and link", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    // Click the first row's expand toggle cell  
    const expandCells = screen.getAllByText("\u25B6");
    fireEvent.click(expandCells[0]);

    // After expansion, the row detail should show the full error and a View Report link
    await waitFor(() => {
      expect(screen.getByText("View Report")).toBeInTheDocument();
    });
  });

  // Scenario: Admin clicks through to report detail
  it("CMP-errortriage-05: should link to report detail page", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    // Expand first row
    const expandCells = screen.getAllByText("\u25B6");
    fireEvent.click(expandCells[0]);

    await waitFor(() => {
      const viewLink = screen.getByText("View Report");
      expect(viewLink.closest("a")).toHaveAttribute("href", "/admin/reports/report-1");
    });
  });

  // Scenario: Empty state
  it("CMP-errortriage-06: should show empty state when no failures", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No failed reports")).toBeInTheDocument();
    });
  });

  // Scenario: Error state
  it("CMP-errortriage-07: should show error state on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load error data/)).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  // Scenario: Admin sees retry status in table
  it("CMP-errortriage-08: should show retry indicators in table rows", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      // The table should render — verify by checking for agent names
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      // The Retried column header should be present
      expect(screen.getByText("Retried")).toBeInTheDocument();
    });
  });

  // Scenario: Search input exists
  it("CMP-errortriage-09: should have a search input", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search errors...")).toBeInTheDocument();
    });
  });

  // Scenario: Failing agent filter dropdown populated
  it("CMP-errortriage-10: should populate failing agent dropdown from API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { ErrorTriageDashboard } = await import(
      "@/components/admin/error-triage-dashboard"
    );
    render(<ErrorTriageDashboard />);

    await waitFor(() => {
      const options = screen.getAllByRole("option");
      const optionTexts = options.map((o) => o.textContent);
      expect(optionTexts).toContain("Insight Generator");
      expect(optionTexts).toContain("Data Analyst");
      expect(optionTexts).toContain("Competitive Analyst");
    });
  });
});
