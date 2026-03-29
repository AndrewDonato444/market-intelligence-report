import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// --- Mocks ---

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(
        (
          { initial, animate, exit, variants, whileTap, ...props }: Record<string, unknown>,
          ref: React.Ref<HTMLDivElement>,
        ) => React.createElement("div", { ...props, ref }),
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/reports",
}));

jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: React.forwardRef(
      (
        { href, children, ...props }: { href: string; children: React.ReactNode },
        ref: React.Ref<HTMLAnchorElement>,
      ) => React.createElement("a", { ...props, href, ref }, children),
    ),
  };
});

jest.mock("@/components/reports/download-pdf-button", () => ({
  DownloadPdfButton: ({ reportId }: { reportId: string }) => (
    <button data-testid={`download-pdf-${reportId}`}>Download PDF</button>
  ),
}));

import { ReportTileGrid } from "@/components/reports/report-tile-grid";

// --- Test Helpers ---

interface TestReport {
  id: string;
  title: string;
  status: "queued" | "generating" | "completed" | "failed";
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
  createdAt: Date;
  updatedAt: Date;
}

const makeReport = (overrides: Partial<TestReport> = {}): TestReport => ({
  id: "rpt-1",
  title: "Miami Luxury Market Intelligence — Q1 2026",
  status: "completed",
  marketId: "mkt-1",
  marketName: "Miami Luxury",
  marketCity: "Miami",
  marketState: "Florida",
  createdAt: new Date("2026-03-17"),
  updatedAt: new Date("2026-03-17"),
  ...overrides,
});

// --- Tests ---

describe("ReportTileGrid", () => {
  describe("Market grouping", () => {
    it("groups reports under market name headers", () => {
      const reports = [
        makeReport({ id: "rpt-1", marketId: "mkt-1", marketName: "Miami Luxury" }),
        makeReport({ id: "rpt-2", marketId: "mkt-2", marketName: "Newport Luxury", title: "Newport Report" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByText("Miami")).toBeInTheDocument();
      expect(screen.getByText("Newport")).toBeInTheDocument();
      expect(screen.getByTestId("market-group-mkt-1")).toBeInTheDocument();
      expect(screen.getByTestId("market-group-mkt-2")).toBeInTheDocument();
    });

    it("places multiple reports from the same market under one header", () => {
      const reports = [
        makeReport({ id: "rpt-1", marketId: "mkt-1", marketName: "Miami Luxury", title: "Report A" }),
        makeReport({ id: "rpt-2", marketId: "mkt-1", marketName: "Miami Luxury", title: "Report B" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      // Only one market header
      const headers = screen.getAllByText("Miami");
      expect(headers).toHaveLength(1);
      // Both tiles present
      expect(screen.getByTestId("report-tile-rpt-1")).toBeInTheDocument();
      expect(screen.getByTestId("report-tile-rpt-2")).toBeInTheDocument();
    });
  });

  describe("Tile layout", () => {
    it("renders completed reports as tiles with photo backgrounds", () => {
      const reports = [makeReport()];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByText("Miami Luxury Market Intelligence — Q1 2026")).toBeInTheDocument();
      const tile = screen.getByTestId("report-tile-rpt-1");
      expect(tile).toBeInTheDocument();
    });

    it("renders tiles in a responsive grid", () => {
      const reports = [
        makeReport({ id: "rpt-1" }),
        makeReport({ id: "rpt-2", title: "Another Report" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      const grid = screen.getByTestId("report-tile-grid");
      expect(grid).toBeInTheDocument();
    });

    it("shows Download PDF and Content Studio for completed reports", () => {
      const reports = [makeReport()];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByTestId("download-pdf-rpt-1")).toBeInTheDocument();
      expect(screen.getByText("Content Studio")).toBeInTheDocument();
    });

    it("Content Studio links to the kit page", () => {
      const reports = [makeReport()];
      render(<ReportTileGrid reports={reports}  />);

      const studioLink = screen.getByText("Content Studio");
      expect(studioLink.closest("a")).toHaveAttribute("href", "/reports/rpt-1/kit");
    });

    it("shows 'Content Studio' label (not 'View Kit' or 'Get Kit')", () => {
      const reports = [makeReport()];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByText("Content Studio")).toBeInTheDocument();
      expect(screen.queryByText("View Kit")).not.toBeInTheDocument();
      expect(screen.queryByText("Get Kit")).not.toBeInTheDocument();
    });
  });

  describe("Status indicators", () => {
    it("shows Ready pill for completed reports", () => {
      const reports = [makeReport({ status: "completed" })];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByText("Ready")).toBeInTheDocument();
    });

    it("shows Generating pill for generating reports", () => {
      const reports = [makeReport({ id: "rpt-gen", status: "generating" })];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByText("Generating")).toBeInTheDocument();
      expect(screen.queryByTestId("download-pdf-rpt-gen")).not.toBeInTheDocument();
    });

    it("shows Queued pill for queued reports", () => {
      const reports = [makeReport({ id: "rpt-q", status: "queued" })];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByText("Queued")).toBeInTheDocument();
      expect(screen.queryByTestId("download-pdf-rpt-q")).not.toBeInTheDocument();
    });
  });

  describe("Failed reports toggle", () => {
    it("hides failed reports by default", () => {
      const reports = [
        makeReport({ id: "rpt-ok", status: "completed" }),
        makeReport({ id: "rpt-fail", status: "failed", title: "Failed Report" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.getByTestId("report-tile-rpt-ok")).toBeInTheDocument();
      expect(screen.queryByTestId("report-tile-rpt-fail")).not.toBeInTheDocument();
    });

    it("shows toggle with failed report count when failed reports exist", () => {
      const reports = [
        makeReport({ id: "rpt-ok", status: "completed" }),
        makeReport({ id: "rpt-f1", status: "failed" }),
        makeReport({ id: "rpt-f2", status: "failed" }),
        makeReport({ id: "rpt-f3", status: "failed" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      const toggle = screen.getByTestId("failed-reports-toggle");
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveTextContent("Show failed reports (3)");
    });

    it("does not show toggle when no failed reports exist", () => {
      const reports = [makeReport({ status: "completed" })];
      render(<ReportTileGrid reports={reports}  />);

      expect(screen.queryByTestId("failed-reports-toggle")).not.toBeInTheDocument();
    });

    it("reveals failed reports when toggle is clicked", () => {
      const reports = [
        makeReport({ id: "rpt-ok", status: "completed" }),
        makeReport({ id: "rpt-fail", status: "failed", title: "Failed Report" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      fireEvent.click(screen.getByTestId("failed-reports-toggle"));

      expect(screen.getByText("Failed Report")).toBeInTheDocument();
      expect(screen.getByTestId("failed-reports-toggle")).toHaveTextContent(
        "Hide failed reports"
      );
    });

    it("hides failed reports again when toggle is clicked twice", () => {
      const reports = [
        makeReport({ id: "rpt-ok", status: "completed" }),
        makeReport({ id: "rpt-fail", status: "failed", title: "Failed Report" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      const toggle = screen.getByTestId("failed-reports-toggle");
      fireEvent.click(toggle);
      fireEvent.click(toggle);

      expect(screen.getByTestId("failed-reports-toggle")).toHaveTextContent(
        "Show failed reports (1)"
      );
    });

    it("shows failed reports as a simple list (not tiles)", () => {
      const reports = [
        makeReport({ id: "rpt-ok", status: "completed" }),
        makeReport({ id: "rpt-fail", status: "failed", title: "Failed Report" }),
      ];
      render(<ReportTileGrid reports={reports}  />);

      fireEvent.click(screen.getByTestId("failed-reports-toggle"));

      const failedList = screen.getByTestId("failed-reports-list");
      expect(failedList).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("renders nothing when no reports passed", () => {
      render(<ReportTileGrid reports={[]}  />);
      expect(screen.queryByTestId("report-tile-grid")).not.toBeInTheDocument();
    });
  });
});
