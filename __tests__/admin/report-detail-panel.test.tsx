/**
 * Report Detail Panel Component Tests
 *
 * Tests for components/admin/report-detail-panel.tsx
 *
 * Spec: .specs/features/admin/admin-report-detail.feature.md
 *
 * @jest-environment jsdom
 */

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

const completedResponse = {
  report: {
    id: "report-1",
    title: "Naples Q1 2026 Intelligence",
    status: "completed",
    config: null,
    version: 1,
    createdAt: "2026-03-10T00:00:00Z",
    updatedAt: "2026-03-10T00:00:00Z",
    generationStartedAt: "2026-03-10T10:23:00Z",
    generationCompletedAt: "2026-03-10T10:25:34Z",
    generationTimeMs: 154000,
    errorMessage: null,
    errorDetails: null,
    retriedAt: null,
    retriedBy: null,
    pdfUrl: null,
    shareToken: null,
  },
  user: {
    id: "user-1",
    name: "Jane Smith",
    company: "Acme Realty",
    email: "jane@acme.com",
  },
  market: {
    id: "market-1",
    name: "Naples, FL",
    city: "Naples",
    state: "FL",
    luxuryTier: "luxury",
    priceFloor: 3000000,
  },
  sections: [
    {
      id: "section-1",
      sectionType: "executive_summary",
      title: "Executive Summary",
      agentName: "InsightGenerator",
      sortOrder: 1,
      generatedAt: "2026-03-10T10:24:00Z",
    },
    {
      id: "section-2",
      sectionType: "market_analysis",
      title: "Market Analysis Matrix",
      agentName: "DataAnalyst",
      sortOrder: 2,
      generatedAt: "2026-03-10T10:24:30Z",
    },
  ],
  apiUsage: [
    {
      id: "usage-1",
      provider: "anthropic",
      endpoint: "messages",
      cost: "0.052000",
      tokensUsed: 4500,
      responseTimeMs: 4200,
      cached: 0,
      createdAt: "2026-03-10T10:24:00Z",
    },
  ],
  totalApiCost: "0.0520",
};

describe("ReportDetailPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Scenario: Admin views a completed report detail
  it("CMP-reportdetail-01: should render report title, status, and metadata", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => completedResponse,
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Acme Realty")).toBeInTheDocument();
    expect(screen.getByText("Naples, FL")).toBeInTheDocument();
  });

  // Scenario: Admin views agent execution breakdown
  it("CMP-reportdetail-02: should render report sections table", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => completedResponse,
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText("Report Sections (2)")).toBeInTheDocument();
    });

    expect(screen.getByText("Executive Summary")).toBeInTheDocument();
    expect(screen.getByText("InsightGenerator")).toBeInTheDocument();
    expect(screen.getByText("Market Analysis Matrix")).toBeInTheDocument();
    expect(screen.getByText("DataAnalyst")).toBeInTheDocument();
  });

  // Scenario: Admin views API cost breakdown
  it("CMP-reportdetail-03: should render API usage table with total cost", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => completedResponse,
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText("API Usage")).toBeInTheDocument();
    });

    expect(screen.getByText("Total: $0.0520")).toBeInTheDocument();
    expect(screen.getByText("anthropic")).toBeInTheDocument();
    expect(screen.getByText("messages")).toBeInTheDocument();
  });

  // Scenario: Report not found
  it("CMP-reportdetail-04: should show not found message for 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: "Report not found" }),
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="nonexistent" />);

    await waitFor(() => {
      expect(screen.getByText("Report not found")).toBeInTheDocument();
    });
  });

  // Scenario: Admin navigates back to report list
  it("CMP-reportdetail-05: should have back link to report registry", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => completedResponse,
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText("Naples Q1 2026 Intelligence")).toBeInTheDocument();
    });

    const backLink = screen.getByText("← Back to Report Registry");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/admin/reports");
  });

  // Scenario: Error state
  it("CMP-reportdetail-06: should show error message with retry button", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "Server error" }),
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  // Scenario: Admin views a failed report detail
  it("CMP-reportdetail-07: should render error details for failed reports", async () => {
    const failedResponse = {
      ...completedResponse,
      report: {
        ...completedResponse.report,
        status: "failed",
        errorDetails: {
          agent: "InsightGenerator",
          message: "API timeout after 30s",
          occurredAt: "2026-03-10T10:25:00Z",
          stageIndex: 2,
          totalStages: 6,
          stack: "Error: API timeout\n  at InsightGenerator.run",
          previousErrors: [
            { agent: "DataAnalyst", message: "Rate limit exceeded", occurredAt: "2026-03-10T10:24:00Z" },
          ],
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => failedResponse,
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText("Error Details")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/InsightGenerator/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/API timeout after 30s/)).toBeInTheDocument();
    expect(screen.getByText(/3 of 6/)).toBeInTheDocument();

    // Stack trace toggle
    const toggleButton = screen.getByText("▶ Show Stack Trace");
    expect(toggleButton).toBeInTheDocument();

    // Previous errors
    expect(screen.getByText(/DataAnalyst: Rate limit exceeded/)).toBeInTheDocument();
  });

  // Scenario: Stack trace toggle
  it("CMP-reportdetail-08: should toggle stack trace visibility", async () => {
    const failedResponse = {
      ...completedResponse,
      report: {
        ...completedResponse.report,
        status: "failed",
        errorDetails: {
          agent: "InsightGenerator",
          message: "API timeout",
          occurredAt: "2026-03-10T10:25:00Z",
          stack: "Error: API timeout\n  at InsightGenerator.run",
        },
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => failedResponse,
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText("▶ Show Stack Trace")).toBeInTheDocument();
    });

    // Stack not visible initially
    expect(screen.queryByText(/at InsightGenerator.run/)).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(screen.getByText("▶ Show Stack Trace"));
    expect(screen.getByText(/at InsightGenerator.run/)).toBeInTheDocument();
    expect(screen.getByText("▼ Hide Stack Trace")).toBeInTheDocument();
  });

  // Scenario: Admin views a queued report
  it("CMP-reportdetail-09: should show 'Not started yet' for queued reports", async () => {
    const queuedResponse = {
      ...completedResponse,
      report: {
        ...completedResponse.report,
        status: "queued",
        generationStartedAt: null,
        generationCompletedAt: null,
        generationTimeMs: null,
      },
      sections: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => queuedResponse,
    });

    const { ReportDetailPanel } = await import("@/components/admin/report-detail-panel");
    render(<ReportDetailPanel reportId="report-1" />);

    await waitFor(() => {
      expect(screen.getByText("Not started yet")).toBeInTheDocument();
    });

    expect(screen.getByText("queued")).toBeInTheDocument();
  });
});
