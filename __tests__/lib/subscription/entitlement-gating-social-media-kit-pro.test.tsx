/**
 * Entitlement Gating for Social Media Kit as Pro Feature Tests
 *
 * Tests for #181: Social media kit restricted to Professional+ tiers with upgrade prompt.
 * Covers:
 * - Starter user sees upgrade prompt (not generate button)
 * - Professional user sees normal generate button
 * - Enterprise user sees normal generate button
 * - At-cap Professional user sees limit-reached (not upgrade prompt)
 * - Compact mode shows "Pro Feature" badge for Starter
 * - Fail-open shows generate button on entitlement check failure
 * - Upgrade prompt shows kit value preview
 * - Upgrade prompt links to /account
 *
 * Spec: .specs/features/subscription/entitlement-gating-social-media-kit-pro.feature.md
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock next/link
jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement("a", { href, ...props }, children),
  };
});

// Mock fetch globally
let mockEntitlementResponse: { allowed: boolean; limit: number; used: number; remaining: number } = {
  allowed: true,
  limit: 5,
  used: 2,
  remaining: 3,
};
let mockFetchShouldFail = false;

global.fetch = jest.fn(async (url: string | URL | Request) => {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;

  if (urlStr.includes("/api/entitlements/check") && urlStr.includes("social_media_kits")) {
    if (mockFetchShouldFail) {
      throw new Error("Network error");
    }
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

describe("GenerateKitButton — Pro Feature Gating (#181)", () => {
  let GenerateKitButton: React.ComponentType<any>;

  beforeAll(async () => {
    const mod = await import("@/components/reports/generate-kit-button");
    GenerateKitButton = mod.GenerateKitButton;
  });

  describe("Starter user (cap = 0)", () => {
    beforeEach(() => {
      mockEntitlementResponse = {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
      };
    });

    it("CMP-KP-01: shows upgrade prompt instead of generate button", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/professional feature/i)).toBeInTheDocument();
      });

      // Should NOT show the generate button
      expect(screen.queryByText(/generate social media kit/i)).not.toBeInTheDocument();
    });

    it("CMP-KP-02: upgrade prompt shows kit value preview", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/professional feature/i)).toBeInTheDocument();
      });

      // Should show what the kit includes
      expect(screen.getByText(/platform-optimized/i)).toBeInTheDocument();
      expect(screen.getByText(/persona-targeted/i)).toBeInTheDocument();
      expect(screen.getByText(/poll ideas/i)).toBeInTheDocument();
      expect(screen.getByText(/stat callouts/i)).toBeInTheDocument();
      expect(screen.getByText(/content calendar/i)).toBeInTheDocument();
    });

    it("CMP-KP-03: upgrade prompt links to account page", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/view plans/i)).toBeInTheDocument();
      });

      const link = screen.getByText(/view plans/i).closest("a");
      expect(link).toHaveAttribute("href", "/account");
    });

    it('CMP-KP-04: compact mode shows "Get Kit" linking to report detail for Starter', async () => {
      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      const link = screen.getByText("Get Kit").closest("a");
      expect(link).toHaveAttribute("href", "/reports/report-1#social-media-kit");
    });
  });

  describe("Professional user (cap > 0, has remaining)", () => {
    beforeEach(() => {
      mockEntitlementResponse = {
        allowed: true,
        limit: 5,
        used: 2,
        remaining: 3,
      };
    });

    it("CMP-KP-05: shows normal generate button", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/generate social media kit/i)).toBeInTheDocument();
      });

      // Should NOT show upgrade prompt
      expect(screen.queryByText(/professional feature/i)).not.toBeInTheDocument();
    });
  });

  describe("Enterprise user (unlimited)", () => {
    beforeEach(() => {
      mockEntitlementResponse = {
        allowed: true,
        limit: -1,
        used: 50,
        remaining: -1,
      };
    });

    it("CMP-KP-06: shows normal generate button for unlimited user", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/generate social media kit/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/professional feature/i)).not.toBeInTheDocument();
    });
  });

  describe("Professional user at cap", () => {
    beforeEach(() => {
      mockEntitlementResponse = {
        allowed: false,
        limit: 5,
        used: 5,
        remaining: 0,
      };
    });

    it("CMP-KP-07: shows limit-reached message, not upgrade prompt", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/monthly limit reached/i)).toBeInTheDocument();
      });

      // Shows usage count
      expect(screen.getByText(/5.*of.*5/)).toBeInTheDocument();

      // Does NOT show upgrade prompt
      expect(screen.queryByText(/professional feature/i)).not.toBeInTheDocument();
    });

    it('CMP-KP-08: compact mode shows "Get Kit" linking to report detail for at-cap Professional', async () => {
      render(<GenerateKitButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText("Get Kit")).toBeInTheDocument();
      });

      const link = screen.getByText("Get Kit").closest("a");
      expect(link).toHaveAttribute("href", "/reports/report-1#social-media-kit");
    });
  });

  describe("Fail-open behavior", () => {
    it("CMP-KP-09: shows generate button when entitlement check fails", async () => {
      mockFetchShouldFail = true;

      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/generate social media kit/i)).toBeInTheDocument();
      });
    });
  });

  describe("Entitlement preflight", () => {
    it("CMP-KP-10: fetches entitlement on mount", async () => {
      render(<GenerateKitButton reportId="report-1" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/entitlements/check?type=social_media_kits")
        );
      });
    });

    it("CMP-KP-11: does not fetch entitlement when kit is already completed", async () => {
      render(<GenerateKitButton reportId="report-1" initialKitStatus="completed" />);

      // Wait a tick
      await new Promise((r) => setTimeout(r, 50));

      const entitlementCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: any[]) => String(call[0]).includes("/api/entitlements/check")
      );
      expect(entitlementCalls).toHaveLength(0);
    });

    it("CMP-KP-12: does not fetch entitlement when kit is generating", async () => {
      render(<GenerateKitButton reportId="report-1" initialKitStatus="generating" />);

      // Wait a tick
      await new Promise((r) => setTimeout(r, 50));

      const entitlementCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: any[]) => String(call[0]).includes("/api/entitlements/check")
      );
      expect(entitlementCalls).toHaveLength(0);
    });
  });
});
