/**
 * Entitlement Gating for Bulk Email Campaigns Tests
 *
 * Tests for #182: Email campaign generation restricted to Professional+ tiers.
 * Covers:
 * - Starter user sees upgrade prompt (not generate button)
 * - Professional user sees normal generate button
 * - Enterprise user sees normal generate button
 * - At-cap Professional user sees limit-reached (not upgrade prompt)
 * - Compact mode shows "Pro Feature" badge for Starter
 * - Fail-open shows generate button on entitlement check failure
 * - Upgrade prompt shows email campaign value preview
 * - Upgrade prompt links to /account
 *
 * Spec: .specs/features/subscription/entitlement-gating-bulk-email-campaigns.feature.md
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

  if (urlStr.includes("/api/entitlements/check") && urlStr.includes("email_campaigns")) {
    if (mockFetchShouldFail) {
      throw new Error("Network error");
    }
    return {
      ok: true,
      json: async () => mockEntitlementResponse,
      status: 200,
    } as Response;
  }

  if (urlStr.includes("/email-campaign/generate")) {
    return {
      ok: true,
      json: async () => ({ reportId: "report-1", status: "generating" }),
      status: 202,
    } as Response;
  }

  if (urlStr.includes("/email-campaign/status")) {
    return {
      ok: true,
      json: async () => ({ campaign: { status: "generating" } }),
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

describe("GenerateEmailButton — Pro Feature Gating (#182)", () => {
  let GenerateEmailButton: React.ComponentType<any>;

  beforeAll(async () => {
    const mod = await import("@/components/reports/generate-email-button");
    GenerateEmailButton = mod.GenerateEmailButton;
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

    it("CMP-EP-01: shows upgrade prompt instead of generate button", async () => {
      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/professional feature/i)).toBeInTheDocument();
      });

      // Should NOT show the generate button
      expect(screen.queryByText(/generate email campaign/i)).not.toBeInTheDocument();
    });

    it("CMP-EP-02: upgrade prompt shows email campaign value preview", async () => {
      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/professional feature/i)).toBeInTheDocument();
      });

      // Should show what email campaigns include
      expect(screen.getByText(/drip sequences/i)).toBeInTheDocument();
      expect(screen.getByText(/market update newsletters/i)).toBeInTheDocument();
      expect(screen.getByText(/persona-targeted/i)).toBeInTheDocument();
      expect(screen.getByText(/subject lines/i)).toBeInTheDocument();
      expect(screen.getByText(/campaign scheduling/i)).toBeInTheDocument();
    });

    it("CMP-EP-03: upgrade prompt links to account page", async () => {
      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/view plans/i)).toBeInTheDocument();
      });

      const link = screen.getByText(/view plans/i).closest("a");
      expect(link).toHaveAttribute("href", "/account");
    });

    it("CMP-EP-04: compact mode shows Pro Feature badge for Starter", async () => {
      render(<GenerateEmailButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText(/pro feature/i)).toBeInTheDocument();
      });

      const link = screen.getByText(/pro feature/i).closest("a");
      expect(link).toHaveAttribute("href", "/account");

      // Should NOT show generate button
      expect(screen.queryByText(/generate emails/i)).not.toBeInTheDocument();
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

    it("CMP-EP-05: shows normal generate button", async () => {
      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/generate email campaign/i)).toBeInTheDocument();
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

    it("CMP-EP-06: shows normal generate button for unlimited user", async () => {
      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/generate email campaign/i)).toBeInTheDocument();
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

    it("CMP-EP-07: shows limit-reached message, not upgrade prompt", async () => {
      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/monthly limit reached/i)).toBeInTheDocument();
      });

      // Shows usage count
      expect(screen.getByText(/5.*of.*5/)).toBeInTheDocument();

      // Does NOT show upgrade prompt
      expect(screen.queryByText(/professional feature/i)).not.toBeInTheDocument();
    });

    it("CMP-EP-08: compact mode shows limit-reached for at-cap Professional", async () => {
      render(<GenerateEmailButton reportId="report-1" compact />);

      await waitFor(() => {
        expect(screen.getByText(/limit reached/i)).toBeInTheDocument();
      });

      // Should NOT show Pro Feature badge
      expect(screen.queryByText(/pro feature/i)).not.toBeInTheDocument();
    });
  });

  describe("Fail-open behavior", () => {
    it("CMP-EP-09: shows generate button when entitlement check fails", async () => {
      mockFetchShouldFail = true;

      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(screen.getByText(/generate email campaign/i)).toBeInTheDocument();
      });
    });
  });

  describe("Entitlement preflight", () => {
    it("CMP-EP-10: fetches entitlement on mount", async () => {
      render(<GenerateEmailButton reportId="report-1" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/entitlements/check?type=email_campaigns")
        );
      });
    });

    it("CMP-EP-11: does not fetch entitlement when campaign is already completed", async () => {
      render(<GenerateEmailButton reportId="report-1" initialCampaignStatus="completed" />);

      // Wait a tick
      await new Promise((r) => setTimeout(r, 50));

      const entitlementCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: any[]) => String(call[0]).includes("/api/entitlements/check")
      );
      expect(entitlementCalls).toHaveLength(0);
    });

    it("CMP-EP-12: does not fetch entitlement when campaign is generating", async () => {
      render(<GenerateEmailButton reportId="report-1" initialCampaignStatus="generating" />);

      // Wait a tick
      await new Promise((r) => setTimeout(r, 50));

      const entitlementCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call: any[]) => String(call[0]).includes("/api/entitlements/check")
      );
      expect(entitlementCalls).toHaveLength(0);
    });
  });
});
