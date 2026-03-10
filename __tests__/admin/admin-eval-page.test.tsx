/**
 * Admin Eval Page Tests
 *
 * Tests for the admin eval page server component that uses
 * requireAdmin() to gate access.
 *
 * Spec: .specs/features/admin/admin-dashboard.feature.md
 */

// Mock next/navigation
const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("REDIRECT"); // simulate Next.js redirect behavior
  },
}));

// Mock requireAdmin
const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: (...args: unknown[]) => mockRequireAdmin(...(args as [])),
}));

// Mock EvalDashboard
jest.mock("@/components/eval/eval-dashboard", () => ({
  EvalDashboard: () => <div data-testid="eval-dashboard">EvalDashboard</div>,
}));

import React from "react";
import AdminEvalPage from "@/app/admin/eval/page";

describe("Admin Eval Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Scenario: Admin user accesses admin dashboard
  it("should render EvalDashboard when user is admin", async () => {
    mockRequireAdmin.mockResolvedValue("admin-123");

    const result = await AdminEvalPage();
    expect(result).toBeTruthy();
    expect(mockRequireAdmin).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  // Scenario: Non-admin user is rejected from admin routes
  it("should redirect to /dashboard when user is not admin", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    await expect(AdminEvalPage()).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  // Scenario: Unauthenticated user is rejected
  it("should redirect when no user is authenticated", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    await expect(AdminEvalPage()).rejects.toThrow("REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});
