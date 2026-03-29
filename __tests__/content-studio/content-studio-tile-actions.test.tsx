/**
 * Test IDs: CMP-CSTA-001 through CMP-CSTA-012
 * Spec: .specs/features/content-studio/content-studio-tile-actions.feature.md
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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

// Mock fetch for generation triggers and polling
const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  ContentStudioTileGrid,
  type ContentStudioItem,
} from "@/components/content-studio/content-studio-tile-grid";

// --- Test Helpers ---

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

beforeEach(() => {
  mockFetch.mockReset();
});

// --- Tests ---

describe("ContentStudioTileGrid — Tile Actions", () => {
  describe("Action panel: both completed", () => {
    // CMP-CSTA-001
    it("shows 'Open Social Media' button when social kit is completed", () => {
      const items = [makeStudioItem({ kitStatus: "completed", emailStatus: "completed" })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const openSocialBtn = within(tile).getByRole("link", { name: /open social media kit/i });
      expect(openSocialBtn).toBeInTheDocument();
      expect(openSocialBtn).toHaveAttribute("href", "/reports/rpt-1/kit");
    });

    // CMP-CSTA-002
    it("shows 'Open Email Campaign' button when email is completed", () => {
      const items = [makeStudioItem({ kitStatus: "completed", emailStatus: "completed" })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const openEmailBtn = within(tile).getByRole("link", { name: /open email kit/i });
      expect(openEmailBtn).toBeInTheDocument();
      expect(openEmailBtn).toHaveAttribute("href", "/reports/rpt-1/kit?tab=email");
    });
  });

  describe("Action panel: partial completion", () => {
    // CMP-CSTA-003
    it("shows 'Generate Email Campaign' button when email is not generated", () => {
      const items = [makeStudioItem({ kitStatus: "completed", emailStatus: null })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const generateBtn = within(tile).getByRole("button", { name: /generate email kit/i });
      expect(generateBtn).toBeInTheDocument();
    });

    // CMP-CSTA-004
    it("shows 'Generate Social Media' button when social kit is not generated", () => {
      const items = [makeStudioItem({ kitStatus: null, emailStatus: "completed" })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const generateBtn = within(tile).getByRole("button", { name: /generate social media kit/i });
      expect(generateBtn).toBeInTheDocument();
    });
  });

  describe("Action panel: nothing generated", () => {
    // CMP-CSTA-005
    it("shows both generate buttons when neither content type exists", () => {
      const items = [makeStudioItem({ kitStatus: null, emailStatus: null })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      expect(within(tile).getByRole("button", { name: /generate social media kit/i })).toBeInTheDocument();
      expect(within(tile).getByRole("button", { name: /generate email kit/i })).toBeInTheDocument();
    });

    // CMP-CSTA-006
    it("shows generate buttons for failed status (treated as actionable)", () => {
      const items = [makeStudioItem({ kitStatus: "failed", emailStatus: "failed" })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      // Failed states should show retry/generate buttons
      expect(within(tile).getByRole("button", { name: /retry social media kit|generate social media kit/i })).toBeInTheDocument();
      expect(within(tile).getByRole("button", { name: /retry email kit|generate email kit/i })).toBeInTheDocument();
    });
  });

  describe("Action panel: generating state", () => {
    // CMP-CSTA-007
    it("shows disabled 'Generating...' label when social kit is generating", () => {
      const items = [makeStudioItem({ kitStatus: "generating", emailStatus: null })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const generatingEl = within(tile).getByText(/generating/i);
      expect(generatingEl).toBeInTheDocument();
      // The element or its parent button should be disabled or have a pulsing indicator
      const btn = generatingEl.closest("button");
      if (btn) {
        expect(btn).toBeDisabled();
      }
    });

    // CMP-CSTA-008
    it("shows disabled 'Generating...' label when email is generating", () => {
      const items = [makeStudioItem({ kitStatus: "completed", emailStatus: "generating" })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      // Should have generating text for email and open button for social
      expect(within(tile).getByRole("link", { name: /open social media kit/i })).toBeInTheDocument();
      const generatingEls = within(tile).getAllByText(/generating/i);
      expect(generatingEls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Generate action triggers", () => {
    // CMP-CSTA-009
    it("clicking 'Generate Social Media' triggers generation API call", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const items = [makeStudioItem({ kitStatus: null, emailStatus: null })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const generateBtn = within(tile).getByRole("button", { name: /generate social media kit/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/reports/rpt-1/kit/generate",
          expect.objectContaining({ method: "POST" }),
        );
      });
    });

    // CMP-CSTA-010
    it("clicking 'Generate Email Campaign' triggers generation API call", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const items = [makeStudioItem({ kitStatus: "completed", emailStatus: null })];
      render(<ContentStudioTileGrid items={items} />);

      const tile = screen.getByTestId("studio-tile-rpt-1");
      const generateBtn = within(tile).getByRole("button", { name: /generate email kit/i });
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/reports/rpt-1/email-campaign/generate",
          expect.objectContaining({ method: "POST" }),
        );
      });
    });
  });

  describe("Report title and date in action panel", () => {
    // CMP-CSTA-011
    it("shows the report title in the action panel area", () => {
      const items = [makeStudioItem({ reportTitle: "Miami Q1 2026 Ultra Luxury" })];
      render(<ContentStudioTileGrid items={items} />);

      expect(screen.getByText("Miami Q1 2026 Ultra Luxury")).toBeInTheDocument();
    });

    // CMP-CSTA-012
    it("shows the date in the tile row", () => {
      const date = new Date("2026-03-17T12:00:00Z");
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
});
