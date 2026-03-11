/**
 * User Detail Panel Tests
 *
 * Tests for the UserDetailPanel component.
 *
 * Spec: .specs/features/admin/admin-user-detail.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/users/u1",
  useRouter: () => ({ push: jest.fn() }),
}));

import { UserDetailPanel } from "@/components/admin/user-detail-panel";

const mockDetailResponse = {
  user: {
    id: "u1",
    name: "Jane Smith",
    email: "jane@acme.com",
    company: "Acme Real Estate",
    title: "Senior Agent",
    phone: "(555) 123-4567",
    bio: "Luxury specialist",
    logoUrl: null,
    status: "active",
    role: "user",
    lastLoginAt: "2026-03-10T14:30:00Z",
    suspendedAt: null,
    deletedAt: null,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-03-10T14:30:00Z",
  },
  reportCounts: {
    total: 12,
    completed: 10,
    failed: 1,
    generating: 1,
    queued: 0,
  },
  markets: [
    {
      id: "m1",
      name: "Naples Market",
      city: "Naples",
      state: "FL",
      luxuryTier: "luxury",
      priceFloor: 1000000,
    },
    {
      id: "m2",
      name: "Aspen Market",
      city: "Aspen",
      state: "CO",
      luxuryTier: "ultra_luxury",
      priceFloor: 5000000,
    },
  ],
  activity: [
    {
      id: "a1",
      action: "report.created",
      entityType: "report",
      entityId: "r1",
      metadata: null,
      createdAt: "2026-03-10T14:30:00Z",
    },
    {
      id: "a2",
      action: "market.updated",
      entityType: "market",
      entityId: "m1",
      metadata: null,
      createdAt: "2026-03-09T08:00:00Z",
    },
  ],
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("UserDetailPanel", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockDetailResponse),
    });
  });

  // Scenario: Admin views user profile info
  it("CMP-userdetail-01: should render user profile information", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    expect(screen.getByText("jane@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Acme Real Estate")).toBeInTheDocument();
    expect(screen.getByText(/Senior Agent/)).toBeInTheDocument();
  });

  // Scenario: Admin sees status badge
  it("CMP-userdetail-02: should render status badge", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("active")).toBeInTheDocument();
    });
  });

  // Scenario: Admin sees dates
  it("CMP-userdetail-03: should render created and last login dates", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText(/Created:/)).toBeInTheDocument();
    });

    expect(screen.getByText(/Last Login:/)).toBeInTheDocument();
  });

  // Scenario: Admin views report counts
  it("CMP-userdetail-04: should render report count stats", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  // Scenario: Admin views report breakdown by status
  it("CMP-userdetail-05: should render report counts by status", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Reports by Status")).toBeInTheDocument();
    });

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Generating")).toBeInTheDocument();
  });

  // Scenario: Admin views markets
  it("CMP-userdetail-06: should render user's markets", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Naples, FL")).toBeInTheDocument();
    });

    expect(screen.getByText("Aspen, CO")).toBeInTheDocument();
  });

  // Scenario: Admin views market count stat
  it("CMP-userdetail-07: should show market count in stats", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      const marketLabels = screen.getAllByText("Markets");
      expect(marketLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Scenario: Admin views activity timeline
  it("CMP-userdetail-08: should render activity timeline", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("report.created")).toBeInTheDocument();
    });

    expect(screen.getByText("market.updated")).toBeInTheDocument();
  });

  // Scenario: Admin navigates back to user list
  it("CMP-userdetail-09: should render back link to user list", async () => {
    render(<UserDetailPanel userId="u1" />);

    const backLink = screen.getByText("← Back to Users");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/admin/users");
  });

  // Scenario: Loading state
  it("CMP-userdetail-10: should show loading state while fetching", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<UserDetailPanel userId="u1" />);

    expect(screen.getByText("Loading user details...")).toBeInTheDocument();
  });

  // Scenario: User not found
  it("CMP-userdetail-11: should show user not found message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "User not found" }),
    });

    render(<UserDetailPanel userId="invalid" />);

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument();
    });
  });

  // Scenario: Error state
  it("CMP-userdetail-12: should show error with retry button on fetch failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });

    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  // Scenario: Empty markets
  it("CMP-userdetail-13: should show empty state for no markets", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          ...mockDetailResponse,
          markets: [],
        }),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("No markets defined")).toBeInTheDocument();
    });
  });

  // Scenario: Empty activity
  it("CMP-userdetail-14: should show empty state for no activity", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          ...mockDetailResponse,
          activity: [],
        }),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("No activity recorded")).toBeInTheDocument();
    });
  });

  // Verify API call
  it("CMP-userdetail-15: should fetch from correct API endpoint", async () => {
    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/admin/users/u1");
    });
  });
});
