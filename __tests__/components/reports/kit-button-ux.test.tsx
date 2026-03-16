/**
 * Social Media Kit Button UX Tests
 *
 * Tests for kit button UX improvements:
 * - Compact mode: all non-active kit states show "Get Kit" linking to report detail #social-media-kit
 * - No entitlement check needed in compact mode (detail page handles gating)
 * - Full mode behavior unchanged (upgrade card, generate button, etc.)
 *
 * Spec: .specs/features/social-media-kit/kit-button-ux.feature.md
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock next/link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...props }, children),
}));

// Mock fetch
let mockEntitlementResponse = {
  allowed: true,
  limit: 5,
  used: 2,
  remaining: 3,
};
let mockFetchShouldFail = false;

global.fetch = jest.fn(async (url: string | URL | Request) => {
  const urlStr =
    typeof url === "string"
      ? url
      : url instanceof URL
        ? url.toString()
        : url.url;

  if (
    urlStr.includes("/api/entitlements/check") &&
    urlStr.includes("social_media_kits")
  ) {
    if (mockFetchShouldFail) throw new Error("Network error");
    return {
      ok: true,
      json: async () => mockEntitlementResponse,
      status: 200,
    } as Response;
  }

  if (urlStr.includes("/kit/generate")) {
    return {
      ok: true,
      json: async () => ({ reportId: "report-1", status: "generating" }),
      status: 202,
    } as Response;
  }

  if (urlStr.includes("/kit/status")) {
    return {
      ok: true,
      json: async () => ({ kit: { status: "generating" } }),
      status: 200,
    } as Response;
  }

  return { ok: true, json: async () => ({}), status: 200 } as Response;
}) as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchShouldFail = false;
  mockEntitlementResponse = {
    allowed: true,
    limit: 5,
    used: 2,
    remaining: 3,
  };
});

describe("GenerateKitButton — Kit Button UX", () => {
  let GenerateKitButton: React.ComponentType<any>;

  beforeAll(async () => {
    const mod = await import("@/components/reports/generate-kit-button");
    GenerateKitButton = mod.GenerateKitButton;
  });

  describe("Compact mode — Starter user (not_included)", () => {
    beforeEach(() => {
      mockEntitlementResponse = {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
      };
    });

    it('CMP-KBU-01: shows "Get Kit" instead of "Pro Feature"', async () => {
      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      // Should NOT show "Pro Feature"
      expect(screen.queryByText(/pro feature/i)).not.toBeInTheDocument();
    });

    it("CMP-KBU-02: links to report detail page with #social-media-kit anchor", async () => {
      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      const link = screen.getByText("Get Kit").closest("a");
      expect(link).toHaveAttribute(
        "href",
        "/reports/report-1#social-media-kit"
      );
    });
  });

  describe("Compact mode — Professional user (allowed, no kit)", () => {
    beforeEach(() => {
      mockEntitlementResponse = {
        allowed: true,
        limit: 5,
        used: 2,
        remaining: 3,
      };
    });

    it('CMP-KBU-03: shows "Get Kit" link instead of generate button', async () => {
      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      const link = screen.getByText("Get Kit").closest("a");
      expect(link).toHaveAttribute(
        "href",
        "/reports/report-1#social-media-kit"
      );
    });
  });

  describe("Compact mode — Professional user at cap", () => {
    beforeEach(() => {
      mockEntitlementResponse = {
        allowed: false,
        limit: 5,
        used: 5,
        remaining: 0,
      };
    });

    it('CMP-KBU-04: shows "Get Kit" instead of "Limit reached"', async () => {
      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      // Should NOT show "Limit reached"
      expect(screen.queryByText(/limit reached/i)).not.toBeInTheDocument();
    });

    it("CMP-KBU-05: links to report detail with anchor", async () => {
      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      const link = screen.getByText("Get Kit").closest("a");
      expect(link).toHaveAttribute(
        "href",
        "/reports/report-1#social-media-kit"
      );
    });
  });

  describe("Compact mode — completed kit (unchanged)", () => {
    it('CMP-KBU-06: still shows "View Kit" linking to /kit page', () => {
      render(
        <GenerateKitButton
          reportId="report-1"
          initialKitStatus="completed"
          compact
        />
      );

      const link = screen.getByText("View Kit").closest("a");
      expect(link).toHaveAttribute("href", "/reports/report-1/kit");
    });
  });

  describe("Compact mode — generating (unchanged)", () => {
    it('CMP-KBU-07: still shows "Generating..." disabled', () => {
      render(
        <GenerateKitButton
          reportId="report-1"
          initialKitStatus="generating"
          compact
        />
      );

      expect(screen.getByText("Generating...")).toBeInTheDocument();
    });
  });

  describe("Compact mode — failed (unchanged)", () => {
    it('CMP-KBU-08: still shows "Retry Kit" button', () => {
      render(
        <GenerateKitButton
          reportId="report-1"
          initialKitStatus="failed"
          compact
        />
      );

      expect(screen.getByText("Retry Kit")).toBeInTheDocument();
    });
  });

  describe("Compact mode — fail-open", () => {
    it('CMP-KBU-09: shows "Get Kit" when entitlement check fails', async () => {
      mockFetchShouldFail = true;

      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      const link = screen.getByText("Get Kit").closest("a");
      expect(link).toHaveAttribute(
        "href",
        "/reports/report-1#social-media-kit"
      );
    });
  });

  describe("Full mode — unchanged behavior", () => {
    it("CMP-KBU-10: Starter user still sees upgrade card in full mode", async () => {
      mockEntitlementResponse = {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
      };

      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/professional feature/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/view plans/i)).toBeInTheDocument();
    });

    it("CMP-KBU-11: Professional user still sees generate button in full mode", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(
          screen.getByText(/generate social media kit/i)
        ).toBeInTheDocument();
      });
    });

    it("CMP-KBU-12: at-cap user still sees limit message in full mode", async () => {
      mockEntitlementResponse = {
        allowed: false,
        limit: 5,
        used: 5,
        remaining: 0,
      };

      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/monthly limit reached/i)).toBeInTheDocument();
      });
    });
  });
});
