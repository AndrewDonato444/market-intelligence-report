/**
 * Admin Tier Management Dashboard Tests
 *
 * Tests for the TierManagementDashboard component + sidebar nav update.
 *
 * Spec: .specs/features/admin/admin-tier-management.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

// Mock next/navigation
const mockPathname = jest.fn<string, []>(() => "/admin/tiers");
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

afterEach(() => cleanup());

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

const sampleTiers = [
  {
    id: "tier-1",
    name: "Starter",
    slug: "starter",
    description: "Basic plan",
    entitlements: {
      reports_per_month: 2,
      markets_created: 1,
      social_media_kits: 0,
      personas_per_report: 1,
    },
    displayPrice: "Free",
    monthlyPriceInCents: 0,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "tier-2",
    name: "Professional",
    slug: "professional",
    description: "Full features",
    entitlements: {
      reports_per_month: 10,
      markets_created: 3,
      social_media_kits: 1,
      personas_per_report: 3,
    },
    displayPrice: "$199/mo",
    monthlyPriceInCents: 19900,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "tier-3",
    name: "Enterprise",
    slug: "enterprise",
    description: "Unlimited",
    entitlements: {
      reports_per_month: -1,
      markets_created: -1,
      social_media_kits: -1,
      personas_per_report: 3,
    },
    displayPrice: "Custom",
    monthlyPriceInCents: null,
    isActive: false,
    sortOrder: 3,
  },
];

function setupFetchMock() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ tiers: sampleTiers }),
  });
}

describe("CMP-TIER: Tier Management Dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMock();
  });

  describe("Scenario: Admin views list of tiers", () => {
    it("CMP-TIER-01: renders tier names", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => {
        expect(screen.getByText("Starter")).toBeInTheDocument();
        expect(screen.getByText("Professional")).toBeInTheDocument();
        expect(screen.getByText("Enterprise")).toBeInTheDocument();
      });
    });

    it("CMP-TIER-02: renders display prices", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => {
        expect(screen.getByText("Free")).toBeInTheDocument();
        expect(screen.getByText("$199/mo")).toBeInTheDocument();
        expect(screen.getByText("Custom")).toBeInTheDocument();
      });
    });

    it("CMP-TIER-03: renders active/inactive status", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => {
        const activeLabels = screen.getAllByText("Active");
        expect(activeLabels).toHaveLength(2);
        expect(screen.getByText("Inactive")).toBeInTheDocument();
      });
    });

    it("CMP-TIER-04: renders entitlement summaries", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => {
        expect(screen.getByText(/2 reports\/mo/)).toBeInTheDocument();
        expect(screen.getByText(/10 reports\/mo/)).toBeInTheDocument();
      });
    });

    it("CMP-TIER-05: shows Unlimited for -1 entitlements", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => {
        expect(screen.getAllByText(/Unlimited/).length).toBeGreaterThan(0);
      });
    });

    it("CMP-TIER-06: renders page heading", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      expect(screen.getByText("Subscription Tiers")).toBeInTheDocument();
    });

    it("CMP-TIER-07: renders Add Tier button", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      expect(screen.getByText("Add Tier")).toBeInTheDocument();
    });
  });

  describe("Scenario: Loading and error states", () => {
    it("CMP-TIER-08: shows loading state initially", () => {
      mockFetch.mockReturnValue(new Promise(() => {})); // Never resolves
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    it("CMP-TIER-09: shows error state on fetch failure", async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      });
    });
  });

  describe("Scenario: Admin creates a new tier", () => {
    it("CMP-TIER-10: clicking Add Tier shows form", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => expect(screen.getByText("Starter")).toBeInTheDocument());

      fireEvent.click(screen.getByText("Add Tier"));
      expect(screen.getByText("Add New Tier")).toBeInTheDocument();
    });

    it("CMP-TIER-11: form has required fields", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => expect(screen.getByText("Starter")).toBeInTheDocument());

      fireEvent.click(screen.getByText("Add Tier"));
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Display Price/i)).toBeInTheDocument();
    });
  });

  describe("Scenario: Edit and delete actions", () => {
    it("CMP-TIER-12: renders Edit buttons for each tier", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => expect(screen.getByText("Starter")).toBeInTheDocument());

      const editButtons = screen.getAllByText("Edit");
      expect(editButtons.length).toBe(3);
    });

    it("CMP-TIER-13: renders Delete buttons for each tier", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => expect(screen.getByText("Starter")).toBeInTheDocument());

      const deleteButtons = screen.getAllByText("Delete");
      expect(deleteButtons.length).toBe(3);
    });
  });

  describe("Scenario: Reorder tiers", () => {
    it("CMP-TIER-14: renders move up/down buttons", async () => {
      const { TierManagementDashboard } = require("@/components/admin/tier-management-dashboard");
      render(React.createElement(TierManagementDashboard));

      await waitFor(() => expect(screen.getByText("Starter")).toBeInTheDocument());

      const upButtons = screen.getAllByLabelText(/Move up/i);
      const downButtons = screen.getAllByLabelText(/Move down/i);
      expect(upButtons.length).toBeGreaterThan(0);
      expect(downButtons.length).toBeGreaterThan(0);
    });
  });
});

describe("CMP-TIER-SIDEBAR: Sidebar navigation", () => {
  it("CMP-TIER-15: shows Subscription Tiers nav item in admin sidebar", () => {
    const { AdminSidebar } = require("@/components/layout/admin-sidebar");
    render(React.createElement(AdminSidebar));

    expect(screen.getByText("Subscription Tiers")).toBeInTheDocument();
  });

  it("CMP-TIER-16: Subscription Tiers links to /admin/tiers", () => {
    const { AdminSidebar } = require("@/components/layout/admin-sidebar");
    render(React.createElement(AdminSidebar));

    const link = screen.getByText("Subscription Tiers").closest("a");
    expect(link).toHaveAttribute("href", "/admin/tiers");
  });

  it("CMP-TIER-17: marks Subscription Tiers as active when on /admin/tiers", () => {
    mockPathname.mockReturnValue("/admin/tiers");
    const { AdminSidebar } = require("@/components/layout/admin-sidebar");
    render(React.createElement(AdminSidebar));

    const link = screen.getByText("Subscription Tiers").closest("a");
    expect(link?.className).toContain("color-app-text");
  });
});
