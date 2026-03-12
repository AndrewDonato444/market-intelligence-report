/**
 * Admin Entitlement Overrides Panel Tests
 *
 * Tests for the EntitlementOverridesPanel component.
 *
 * Spec: .specs/features/subscription/admin-entitlement-overrides.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/users/user-123",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

afterEach(() => cleanup());

const mockFetch = jest.fn();
global.fetch = mockFetch;

const sampleOverrides = [
  {
    id: "override-1",
    userId: "user-123",
    entitlementType: "reports_per_month",
    value: 20,
    expiresAt: "2026-06-15T00:00:00.000Z",
    grantedBy: "admin@msa.com",
    reason: "Partner agreement — 3 months of boosted capacity",
    createdAt: "2026-03-12T00:00:00.000Z",
  },
  {
    id: "override-2",
    userId: "user-123",
    entitlementType: "social_media_kits",
    value: -1,
    expiresAt: "2025-11-30T00:00:00.000Z",
    grantedBy: "ops@msa.com",
    reason: "Beta tester comp",
    createdAt: "2025-09-01T00:00:00.000Z",
  },
];

const sampleTierInfo = {
  tierName: "Professional",
  entitlements: {
    reports_per_month: 10,
    markets_created: 3,
    social_media_kits: 1,
    personas_per_report: 3,
  },
};

describe("CMP-OVERRIDE: Entitlement Overrides Panel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/overrides") && !url.includes("/overrides/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ overrides: sampleOverrides, tier: sampleTierInfo }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it("CMP-OVERRIDE-01: renders loading state initially", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("CMP-OVERRIDE-02: displays overrides list after loading", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText("Reports per month")).toBeInTheDocument();
    });
    expect(screen.getByText(/Partner agreement/)).toBeInTheDocument();
  });

  it("CMP-OVERRIDE-03: displays entitlement type labels in user vocabulary", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText("Reports per month")).toBeInTheDocument();
    });
    expect(screen.getByText("Social media kits")).toBeInTheDocument();
  });

  it("CMP-OVERRIDE-04: displays value as 'Unlimited' for -1", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText(/Unlimited/)).toBeInTheDocument();
    });
  });

  it("CMP-OVERRIDE-05: shows expired badge for expired overrides", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getAllByText(/Expired/i).length).toBeGreaterThan(0);
    });
  });

  it("CMP-OVERRIDE-06: shows Grant Override button", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText("Grant Override")).toBeInTheDocument();
    });
  });

  it("CMP-OVERRIDE-07: opens grant form when Grant Override clicked", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText("Grant Override")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Grant Override"));
    await waitFor(() => {
      expect(screen.getByText("Grant Entitlement Override")).toBeInTheDocument();
    });
  });

  it("CMP-OVERRIDE-08: shows Revoke button for active overrides", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText("Revoke")).toBeInTheDocument();
    });
  });

  it("CMP-OVERRIDE-09: calls DELETE API when revoking", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === "DELETE") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      }
      if (url.includes("/overrides")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ overrides: sampleOverrides, tier: sampleTierInfo }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText("Revoke")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Revoke"));
    // Confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/Confirm/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Confirm/i));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/overrides/override-1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("CMP-OVERRIDE-10: shows effective entitlements summary", async () => {
    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText(/Effective Entitlements/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Professional")).toBeInTheDocument();
  });

  it("CMP-OVERRIDE-11: shows empty state when no overrides exist", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/overrides")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ overrides: [], tier: sampleTierInfo }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText(/No overrides/i)).toBeInTheDocument();
    });
  });

  it("CMP-OVERRIDE-12: shows error state on fetch failure", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 500 })
    );

    const { EntitlementOverridesPanel } = await import(
      "@/components/admin/entitlement-overrides-panel"
    );
    render(<EntitlementOverridesPanel userId="user-123" userName="Alex Rivera" />);
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });
});
