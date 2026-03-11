/**
 * Suspend/Unsuspend Account Tests
 *
 * Tests for the suspend/unsuspend UI actions in UserDetailPanel
 * and the PATCH /api/admin/users/[id]/status endpoint.
 *
 * Spec: .specs/features/admin/suspend-unsuspend.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/users/u1",
  useRouter: () => ({ push: jest.fn() }),
}));

import { UserDetailPanel } from "@/components/admin/user-detail-panel";

const baseUser = {
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
};

const makeDetailResponse = (opts: {
  userOverrides?: Record<string, unknown>;
  isOwnAccount?: boolean;
} = {}) => ({
  user: { ...baseUser, ...(opts.userOverrides || {}) },
  isOwnAccount: opts.isOwnAccount ?? false,
  reportCounts: { total: 5, completed: 4, failed: 1, generating: 0, queued: 0 },
  markets: [],
  activity: [],
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Suspend/Unsuspend Account", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // Scenario: Active user shows Suspend button
  it("CMP-suspend-01: should show Suspend Account button for active user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Suspend Account")).toBeInTheDocument();
    });
  });

  // Scenario: Active user does NOT show Unsuspend button
  it("CMP-suspend-02: should not show Unsuspend button for active user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    expect(screen.queryByText("Unsuspend Account")).not.toBeInTheDocument();
  });

  // Scenario: Suspended user shows Unsuspend button
  it("CMP-suspend-03: should show Unsuspend Account button for suspended user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(
        makeDetailResponse({ userOverrides: { status: "suspended", suspendedAt: "2026-03-11T10:00:00Z" } })
      ),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Unsuspend Account")).toBeInTheDocument();
    });
  });

  // Scenario: Suspended user does NOT show Suspend button
  it("CMP-suspend-04: should not show Suspend button for suspended user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(
        makeDetailResponse({ userOverrides: { status: "suspended", suspendedAt: "2026-03-11T10:00:00Z" } })
      ),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Unsuspend Account")).toBeInTheDocument();
    });

    expect(screen.queryByText("Suspend Account")).not.toBeInTheDocument();
  });

  // Scenario: Confirmation dialog appears on suspend click
  it("CMP-suspend-05: should show confirmation dialog when Suspend clicked", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Suspend Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Suspend Account"));

    expect(screen.getByText(/Are you sure you want to suspend/)).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  // Scenario: Cancel hides confirmation dialog
  it("CMP-suspend-06: should hide confirmation dialog on Cancel", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Suspend Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Suspend Account"));
    expect(screen.getByText("Cancel")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/Are you sure/)).not.toBeInTheDocument();
  });

  // Scenario: Confirming suspend calls API and shows success
  it("CMP-suspend-07: should call suspend API and show success on confirm", async () => {
    const suspendedResponse = makeDetailResponse({
      userOverrides: { status: "suspended", suspendedAt: "2026-03-11T10:00:00Z" },
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(makeDetailResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, status: "suspended" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(suspendedResponse),
      });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Suspend Account")).toBeInTheDocument();
    });

    // Open confirmation
    fireEvent.click(screen.getByText("Suspend Account"));

    // Find the confirm button (the one in the dialog)
    const confirmButtons = screen.getAllByText("Suspend Account");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("Account suspended")).toBeInTheDocument();
    });

    // Verify PATCH was called
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/users/u1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "suspend" }),
      })
    );
  });

  // Scenario: Unsuspend calls API directly (no confirmation needed)
  it("CMP-suspend-08: should call unsuspend API directly", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(
          makeDetailResponse({ userOverrides: { status: "suspended", suspendedAt: "2026-03-11T10:00:00Z" } })
        ),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, status: "active" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(makeDetailResponse()),
      });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Unsuspend Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Unsuspend Account"));

    await waitFor(() => {
      expect(screen.getByText("Account unsuspended")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/users/u1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "unsuspend" }),
      })
    );
  });

  // Scenario: No action buttons for own account
  it("CMP-suspend-09: should not show action buttons for own account", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse({ isOwnAccount: true })),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    expect(screen.queryByText("Suspend Account")).not.toBeInTheDocument();
    expect(screen.queryByText("Unsuspend Account")).not.toBeInTheDocument();
  });

  // Scenario: No action buttons for deleted user
  it("CMP-suspend-10: should not show action buttons for deleted user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(
        makeDetailResponse({ userOverrides: { status: "deleted", deletedAt: "2026-03-11T10:00:00Z" } })
      ),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    expect(screen.queryByText("Suspend Account")).not.toBeInTheDocument();
    expect(screen.queryByText("Unsuspend Account")).not.toBeInTheDocument();
  });

  // Scenario: Error message shown on API failure
  it("CMP-suspend-11: should show error message on API failure", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(
          makeDetailResponse({ userOverrides: { status: "suspended", suspendedAt: "2026-03-11T10:00:00Z" } })
        ),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Failed to update user status" }),
      });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Unsuspend Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Unsuspend Account"));

    await waitFor(() => {
      expect(screen.getByText("Failed to update user status")).toBeInTheDocument();
    });
  });
});
