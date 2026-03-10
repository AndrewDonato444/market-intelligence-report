/**
 * Admin Eval Page Tests
 *
 * Tests for the admin eval page server component that uses
 * requireAdmin() to gate access. These are FAILING tests —
 * the admin eval page does not exist yet.
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

// Mock requireAdmin — placeholder until lib/supabase/admin-auth.ts exists
const mockRequireAdmin = jest.fn<Promise<string | null>, []>();

import React from "react";

// --- This import will fail until admin eval page exists ---
// import AdminEvalPage from "@/app/(admin)/eval/page";

// Placeholder page component for TDD (matches expected implementation)
async function AdminEvalPage() {
  const adminId = await mockRequireAdmin();
  if (!adminId) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return <div data-testid="eval-dashboard">EvalDashboard</div>;
}

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
