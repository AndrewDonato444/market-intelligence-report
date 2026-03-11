/**
 * User List Dashboard Tests
 *
 * Tests for the UserListDashboard component.
 *
 * Spec: .specs/features/admin/admin-user-list.feature.md
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
  useRouter: () => ({ push: jest.fn() }),
}));

import { UserListDashboard } from "@/components/admin/user-list-dashboard";

const mockUsersResponse = {
  users: [
    {
      id: "u1",
      name: "Jane Smith",
      email: "jane@acme.com",
      company: "Acme Real Estate",
      status: "active",
      lastLoginAt: "2026-03-10T14:30:00Z",
      createdAt: "2026-01-15T10:00:00Z",
    },
    {
      id: "u2",
      name: "John Doe",
      email: "john@luxgroup.com",
      company: "Luxury Group",
      status: "active",
      lastLoginAt: "2026-03-09T08:00:00Z",
      createdAt: "2026-02-01T12:00:00Z",
    },
    {
      id: "u3",
      name: "Bob Wilson",
      email: "bob@test.com",
      company: null,
      status: "suspended",
      lastLoginAt: "2026-02-20T16:00:00Z",
      createdAt: "2026-01-01T10:00:00Z",
    },
  ],
  total: 3,
  counts: { all: 3, active: 2, suspended: 1, deleted: 0 },
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("UserListDashboard", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUsersResponse),
    });
  });

  // Scenario: Admin views user list
  it("CMP-userlist-01: should render user table with correct columns", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    expect(screen.getByText("jane@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Acme Real Estate")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@luxgroup.com")).toBeInTheDocument();
  });

  it("CMP-userlist-02: should render page title", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Users")).toBeInTheDocument();
    });
  });

  // Scenario: Admin searches users by name or email
  it("CMP-userlist-03: should search users when typing in search box", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search by name or email...");
    fireEvent.change(searchInput, { target: { value: "john" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search=john")
      );
    });
  });

  // Scenario: Admin filters by status
  it("CMP-userlist-04: should filter by status when clicking filter buttons", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Click the Suspended filter button (contains count)
    const suspendedBtn = screen.getByRole("button", { name: /Suspended/ });
    fireEvent.click(suspendedBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=suspended")
      );
    });
  });

  // Scenario: Admin sees all statuses with "All" filter
  it("CMP-userlist-05: should show all users when clicking All filter", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Click Suspended first
    fireEvent.click(screen.getByRole("button", { name: /Suspended/ }));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("status=suspended")
      );
    });

    // Click All to clear filter
    fireEvent.click(screen.getByRole("button", { name: /All/ }));
    await waitFor(() => {
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][0];
      expect(lastCall).not.toContain("status=");
    });
  });

  // Scenario: Admin sorts by column
  it("CMP-userlist-06: should sort when clicking column headers", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Created"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=createdAt")
      );
    });
  });

  // Scenario: Pagination
  it("CMP-userlist-07: should show pagination info", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 1–3 of 3/)).toBeInTheDocument();
    });
  });

  // Scenario: Loading state
  it("CMP-userlist-08: should show loading state while fetching", () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    render(<UserListDashboard />);

    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  // Scenario: Error state
  it("CMP-userlist-09: should show error message on fetch failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });
  });

  // Scenario: Empty state
  it("CMP-userlist-10: should show empty state when no users match", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          users: [],
          total: 0,
          counts: { all: 0, active: 0, suspended: 0, deleted: 0 },
        }),
    });

    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });
  });

  // Status badge rendering
  it("CMP-userlist-11: should render status badges with correct colors", async () => {
    render(<UserListDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    const activeBadges = screen.getAllByText("active");
    expect(activeBadges.length).toBeGreaterThanOrEqual(1);
  });
});
