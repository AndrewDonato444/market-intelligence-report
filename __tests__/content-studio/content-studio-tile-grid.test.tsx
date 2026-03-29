/**
 * Test IDs: CMP-CSTG-001 through CMP-CSTG-014
 * Spec: .specs/features/content-studio/content-studio-listing.feature.md
 */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import React from "react";

// --- Mocks ---

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

import { ContentStudioTileGrid } from "@/components/content-studio/content-studio-tile-grid";

// --- Test Helpers ---

interface ContentStudioItem {
  reportId: string;
  reportTitle: string;
  marketId: string;
  marketName: string;
  marketCity: string;
  marketState: string;
  kitStatus: "queued" | "generating" | "completed" | "failed" | null;
  kitGeneratedAt: string | null;
  emailStatus: "queued" | "generating" | "completed" | "failed" | null;
  emailGeneratedAt: string | null;
  latestActivityAt: Date;
}

const makeStudioItem = (overrides: Partial<ContentStudioItem> = {}): ContentStudioItem => ({
  reportId: "rpt-1",
  reportTitle: "Naples Q1 2026 Luxury Report",
  marketId: "mkt-1",
  marketName: "Naples Luxury",
  marketCity: "Naples",
  marketState: "Florida",
  kitStatus: "completed",
  kitGeneratedAt: "2026-03-29T12:00:00Z",
  emailStatus: "completed",
  emailGeneratedAt: "2026-03-29T13:00:00Z",
  latestActivityAt: new Date("2026-03-29T13:00:00Z"),
  ...overrides,
});

// --- Tests ---

describe("ContentStudioTileGrid", () => {
  describe("Market grouping", () => {
    // CMP-CSTG-001
    it("groups content studios under market name headers", () => {
      const items = [
        makeStudioItem({ reportId: "rpt-1", marketId: "mkt-1", marketName: "Naples Luxury" }),
        makeStudioItem({
          reportId: "rpt-2",
          marketId: "mkt-2",
          marketName: "Miami Luxury",
          reportTitle: "Miami Q1 2026 Luxury Report",
          marketCity: "Miami",
        }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      expect(screen.getByTestId("studio-market-group-mkt-1")).toBeInTheDocument();
      expect(screen.getByTestId("studio-market-group-mkt-2")).toBeInTheDocument();
    });

    // CMP-CSTG-002
    it("places multiple studios from the same market under one header", () => {
      const items = [
        makeStudioItem({ reportId: "rpt-1", marketId: "mkt-1", reportTitle: "Naples Q1" }),
        makeStudioItem({ reportId: "rpt-2", marketId: "mkt-1", reportTitle: "Naples Q4" }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      expect(screen.getByTestId("studio-market-group-mkt-1")).toBeInTheDocument();
      expect(screen.getByTestId("studio-tile-rpt-1")).toBeInTheDocument();
      expect(screen.getByTestId("studio-tile-rpt-2")).toBeInTheDocument();
    });

    // CMP-CSTG-003
    it("sorts studios within a market by latest activity (newest first)", () => {
      const items = [
        makeStudioItem({
          reportId: "rpt-old",
          marketId: "mkt-1",
          reportTitle: "Old Report",
          latestActivityAt: new Date("2025-12-01"),
        }),
        makeStudioItem({
          reportId: "rpt-new",
          marketId: "mkt-1",
          reportTitle: "New Report",
          latestActivityAt: new Date("2026-03-29"),
        }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      const tiles = screen.getAllByTestId(/^studio-tile-/);
      expect(tiles[0]).toHaveAttribute("data-testid", "studio-tile-rpt-new");
      expect(tiles[1]).toHaveAttribute("data-testid", "studio-tile-rpt-old");
    });
  });

  describe("Card content", () => {
    // CMP-CSTG-004
    it("shows the report title on the card", () => {
      const items = [makeStudioItem()];
      render(<ContentStudioTileGrid items={items} />);

      expect(screen.getByText("Naples Q1 2026 Luxury Report")).toBeInTheDocument();
    });

    // CMP-CSTG-005
    it("has an action button linking to the content studio for that report", () => {
      const items = [makeStudioItem({ reportId: "rpt-abc" })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-abc");
      const link = within(tile).getByRole("link", { name: /open social media kit/i });
      expect(link).toHaveAttribute("href", "/reports/rpt-abc/kit");
    });

    // CMP-CSTG-006
    it("shows date on the card", () => {
      const date = new Date("2026-03-29T12:00:00Z");
      const expected = date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
      const items = [makeStudioItem({ latestActivityAt: date })];
      render(<ContentStudioTileGrid items={items} />);

      expect(screen.getByText(expected)).toBeInTheDocument();
    });
  });

  describe("Content type action buttons", () => {
    // CMP-CSTG-007
    it("shows Open buttons for both types when both are completed", () => {
      const items = [
        makeStudioItem({ kitStatus: "completed", emailStatus: "completed" }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      expect(within(tile).getByRole("link", { name: /open social media kit/i })).toBeInTheDocument();
      expect(within(tile).getByRole("link", { name: /open email kit/i })).toBeInTheDocument();
    });

    // CMP-CSTG-008
    it("shows Open Social and Generate Email when only social is completed", () => {
      const items = [
        makeStudioItem({ kitStatus: "completed", emailStatus: null }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      expect(within(tile).getByRole("link", { name: /open social media kit/i })).toBeInTheDocument();
      expect(within(tile).getByRole("button", { name: /generate email kit/i })).toBeInTheDocument();
    });

    // CMP-CSTG-009
    it("shows Generate Social and Open Email when only email is completed", () => {
      const items = [
        makeStudioItem({ kitStatus: null, emailStatus: "completed" }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      expect(within(tile).getByRole("button", { name: /generate social media kit/i })).toBeInTheDocument();
      expect(within(tile).getByRole("link", { name: /open email kit/i })).toBeInTheDocument();
    });

    // CMP-CSTG-010
    it("shows generating indicator for content still being generated", () => {
      const items = [
        makeStudioItem({ kitStatus: "generating", emailStatus: null }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const generatingBtn = within(tile).getAllByText(/generating/i)[0]?.closest("button");
      expect(generatingBtn).toBeInTheDocument();
      expect(generatingBtn).toBeDisabled();
    });

    // CMP-CSTG-011
    it("shows generating indicator for queued content", () => {
      const items = [
        makeStudioItem({ kitStatus: "queued", emailStatus: null }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const generatingBtn = within(tile).getAllByText(/generating/i)[0]?.closest("button");
      expect(generatingBtn).toBeInTheDocument();
      expect(generatingBtn).toBeDisabled();
    });
  });

  describe("Empty state", () => {
    // CMP-CSTG-012
    it("shows empty state when no items are passed", () => {
      render(<ContentStudioTileGrid items={[]} />);

      expect(screen.getByText("No content studios yet.")).toBeInTheDocument();
      expect(
        screen.getByText("Generate content from a completed report to see it here.")
      ).toBeInTheDocument();
    });

    // CMP-CSTG-013
    it("shows a link to View Reports in the empty state", () => {
      render(<ContentStudioTileGrid items={[]} />);

      const link = screen.getByText("View Reports");
      expect(link.closest("a")).toHaveAttribute("href", "/reports");
    });
  });

  describe("Grid layout", () => {
    // CMP-CSTG-014
    it("renders in a responsive grid", () => {
      const items = [
        makeStudioItem({ reportId: "rpt-1" }),
        makeStudioItem({ reportId: "rpt-2", reportTitle: "Another Report" }),
      ];
      render(<ContentStudioTileGrid items={items} />);

      expect(screen.getByTestId("content-studio-tile-grid")).toBeInTheDocument();
    });
  });
});
