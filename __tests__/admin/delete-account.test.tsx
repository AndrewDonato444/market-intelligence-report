/**
 * Delete Account Tests
 *
 * Tests for the delete account UI actions in UserDetailPanel
 * and the DELETE /api/admin/users/[id]/delete endpoint.
 *
 * Spec: .specs/features/admin/delete-account.feature.md
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

describe("Delete Account", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // Scenario: Active user shows Delete Account button
  it("CMP-delete-01: should show Delete Account button for active user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });
  });

  // Scenario: Suspended user shows Delete Account button
  it("CMP-delete-02: should show Delete Account button for suspended user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(
        makeDetailResponse({ userOverrides: { status: "suspended", suspendedAt: "2026-03-11T10:00:00Z" } })
      ),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });
  });

  // Scenario: Delete button not shown for already deleted user
  it("CMP-delete-03: should not show Delete Account button for deleted user", async () => {
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

    expect(screen.queryByText("Delete Account")).not.toBeInTheDocument();
  });

  // Scenario: Admin cannot delete themselves
  it("CMP-delete-04: should not show Delete Account button for own account", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse({ isOwnAccount: true })),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    expect(screen.queryByText("Delete Account")).not.toBeInTheDocument();
  });

  // Scenario: Confirmation dialog appears on delete click
  it("CMP-delete-05: should show confirmation dialog when Delete Account clicked", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete Account"));

    expect(screen.getByText(/permanently delete/)).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  // Scenario: Cancel hides confirmation dialog
  it("CMP-delete-06: should hide confirmation dialog on Cancel", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete Account"));
    expect(screen.getByText(/permanently delete/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText(/permanently delete/)).not.toBeInTheDocument();
  });

  // Scenario: Confirming delete calls API and shows success
  it("CMP-delete-07: should call delete API and show success on confirm", async () => {
    const deletedResponse = makeDetailResponse({
      userOverrides: { status: "deleted", deletedAt: "2026-03-11T12:00:00Z" },
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
        json: () => Promise.resolve({ success: true, status: "deleted" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(deletedResponse),
      });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });

    // Open confirmation
    fireEvent.click(screen.getByText("Delete Account"));

    // Find the confirm button (the one in the dialog)
    const confirmButtons = screen.getAllByText("Delete Account");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("Account deleted")).toBeInTheDocument();
    });

    // Verify DELETE was called
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/users/u1/delete",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  // Scenario: Error message shown on API failure
  it("CMP-delete-08: should show error message on API failure", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(makeDetailResponse()),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Failed to delete account" }),
      });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });

    // Open confirmation and confirm
    fireEvent.click(screen.getByText("Delete Account"));
    const confirmButtons = screen.getAllByText("Delete Account");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("Failed to delete account")).toBeInTheDocument();
    });
  });

  // Scenario: Confirmation dialog warns about orphaned reports
  it("CMP-delete-09: should warn about orphaned reports in confirmation", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(makeDetailResponse()),
    });

    render(<UserDetailPanel userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Delete Account"));

    expect(screen.getByText(/reports will be kept/)).toBeInTheDocument();
  });
});
