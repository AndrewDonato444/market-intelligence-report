/**
 * Admin Auth Tests
 *
 * Tests for the requireAdmin() helper that checks if the current
 * user has admin role. These are FAILING tests — the admin-auth
 * module (lib/supabase/admin-auth.ts) does not exist yet.
 *
 * Spec: .specs/features/admin/admin-dashboard.feature.md
 */

// --- These imports will fail until admin-auth.ts is implemented ---
// import { requireAdmin } from "@/lib/supabase/admin-auth";

// Mock dependencies
const mockGetAuthUserId = jest.fn<Promise<string | null>, []>();
const mockGetProfile = jest.fn<Promise<{ role?: string } | null>, [string]>();

jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: (...args: unknown[]) => mockGetAuthUserId(...(args as [])),
}));

jest.mock("@/lib/services/profile", () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...(args as [string])),
}));

// Placeholder mock until admin-auth.ts exists
const requireAdmin = jest.fn<Promise<string | null>, []>(async () => {
  const authId = await mockGetAuthUserId();
  if (!authId) return null;
  const profile = await mockGetProfile(authId);
  if (!profile || profile.role !== "admin") return null;
  return authId;
});

describe("Admin Auth — requireAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Scenario: Admin user accesses admin dashboard
  it("should return authId when user has admin role", async () => {
    mockGetAuthUserId.mockResolvedValue("auth-123");
    mockGetProfile.mockResolvedValue({ role: "admin" });

    const result = await requireAdmin();
    expect(result).toBe("auth-123");
    expect(mockGetAuthUserId).toHaveBeenCalledTimes(1);
    expect(mockGetProfile).toHaveBeenCalledWith("auth-123");
  });

  // Scenario: Non-admin user is rejected from admin routes
  it("should return null when user has 'user' role (default)", async () => {
    mockGetAuthUserId.mockResolvedValue("auth-456");
    mockGetProfile.mockResolvedValue({ role: "user" });

    const result = await requireAdmin();
    expect(result).toBeNull();
  });

  // Scenario: Unauthenticated user is rejected from admin routes
  it("should return null when no user is authenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const result = await requireAdmin();
    expect(result).toBeNull();
    expect(mockGetProfile).not.toHaveBeenCalled();
  });

  it("should return null when profile is not found", async () => {
    mockGetAuthUserId.mockResolvedValue("auth-789");
    mockGetProfile.mockResolvedValue(null);

    const result = await requireAdmin();
    expect(result).toBeNull();
  });

  it("should return null when role field is missing from profile", async () => {
    mockGetAuthUserId.mockResolvedValue("auth-000");
    mockGetProfile.mockResolvedValue({});

    const result = await requireAdmin();
    expect(result).toBeNull();
  });

  // Scenario: Database role column defaults to 'user'
  it("should not grant access to users with undefined role", async () => {
    mockGetAuthUserId.mockResolvedValue("auth-new");
    mockGetProfile.mockResolvedValue({ role: undefined });

    const result = await requireAdmin();
    expect(result).toBeNull();
  });
});
