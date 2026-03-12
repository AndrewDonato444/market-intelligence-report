/**
 * Admin Entitlement Overrides API Tests
 *
 * Tests for GET/POST /api/admin/users/[id]/overrides
 * and DELETE /api/admin/users/[id]/overrides/[overrideId]
 *
 * Spec: .specs/features/subscription/admin-entitlement-overrides.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();

jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// --- DB mock ---
let mockDbSelectResult: unknown = [];
let mockDbInsertResult: unknown = [];
let mockDbDeleteResult: unknown = [];
let mockDbError = false;

const mockInsert = jest.fn();
const mockDelete = jest.fn();

function makeChain(result: () => unknown) {
  const chain = (): unknown =>
    new Proxy(
      {},
      {
        get(_, prop) {
          if (String(prop) === "then") {
            return (resolve: (v: unknown) => void) => resolve(result());
          }
          return (..._args: unknown[]) => chain();
        },
      }
    );
  return chain();
}

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: () => {
        if (mockDbError) throw new Error("DB error");
        return makeChain(() => mockDbSelectResult);
      },
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        if (mockDbError) throw new Error("DB error");
        return makeChain(() => mockDbInsertResult);
      },
      delete: (...args: unknown[]) => {
        mockDelete(...args);
        if (mockDbError) throw new Error("DB error");
        return makeChain(() => mockDbDeleteResult);
      },
    };
  },
  schema: {
    entitlementOverrides: {
      id: "entitlement_overrides.id",
      userId: "entitlement_overrides.user_id",
      entitlementType: "entitlement_overrides.entitlement_type",
      value: "entitlement_overrides.value",
      expiresAt: "entitlement_overrides.expires_at",
      grantedBy: "entitlement_overrides.granted_by",
      reason: "entitlement_overrides.reason",
      createdAt: "entitlement_overrides.created_at",
    },
  },
}));

function makeRequest(
  url: string,
  method = "GET",
  body?: Record<string, unknown>
) {
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

const sampleOverride = {
  id: "override-1",
  userId: "user-123",
  entitlementType: "reports_per_month",
  value: 20,
  expiresAt: "2026-06-15T00:00:00.000Z",
  grantedBy: "admin-user-id",
  reason: "Partner agreement",
  createdAt: "2026-03-12T00:00:00.000Z",
};

const sampleExpiredOverride = {
  id: "override-2",
  userId: "user-123",
  entitlementType: "social_media_kits",
  value: -1,
  expiresAt: "2025-11-30T00:00:00.000Z",
  grantedBy: "admin-user-id",
  reason: "Beta tester comp",
  createdAt: "2025-09-01T00:00:00.000Z",
};

describe("API-OVERRIDE: Admin Entitlement Overrides API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue("admin-user-id");
    mockDbSelectResult = [];
    mockDbInsertResult = [];
    mockDbDeleteResult = [];
    mockDbError = false;
  });

  describe("GET /api/admin/users/[id]/overrides", () => {
    it("API-OVERRIDE-01: returns 401 for non-admin", async () => {
      mockRequireAdmin.mockResolvedValue(null);
      const { GET } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await GET(
        makeRequest("/api/admin/users/user-123/overrides") as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(401);
    });

    it("API-OVERRIDE-02: returns all overrides for user sorted by createdAt desc", async () => {
      mockDbSelectResult = [sampleOverride, sampleExpiredOverride];
      const { GET } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await GET(
        makeRequest("/api/admin/users/user-123/overrides") as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.overrides).toHaveLength(2);
      expect(json.overrides[0].id).toBe("override-1");
    });

    it("API-OVERRIDE-03: returns empty array when no overrides exist", async () => {
      mockDbSelectResult = [];
      const { GET } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await GET(
        makeRequest("/api/admin/users/user-123/overrides") as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.overrides).toHaveLength(0);
    });

    it("API-OVERRIDE-04: returns 500 on DB error", async () => {
      mockDbError = true;
      const { GET } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await GET(
        makeRequest("/api/admin/users/user-123/overrides") as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/admin/users/[id]/overrides", () => {
    const validBody = {
      entitlementType: "reports_per_month",
      value: 20,
      expiresAt: "2026-06-15T00:00:00.000Z",
      reason: "Partner agreement",
    };

    it("API-OVERRIDE-05: returns 401 for non-admin", async () => {
      mockRequireAdmin.mockResolvedValue(null);
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", validBody) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(401);
    });

    it("API-OVERRIDE-06: creates override with grantedBy from admin context", async () => {
      mockDbInsertResult = [{ ...sampleOverride }];
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", validBody) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.override.entitlementType).toBe("reports_per_month");
      expect(json.override.grantedBy).toBe("admin-user-id");
    });

    it("API-OVERRIDE-07: creates permanent override when expiresAt is null", async () => {
      const permanentBody = { ...validBody, expiresAt: null };
      mockDbInsertResult = [{ ...sampleOverride, expiresAt: null }];
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", permanentBody) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.override.expiresAt).toBeNull();
    });

    it("API-OVERRIDE-08: returns 400 when entitlementType missing", async () => {
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", { value: 20 }) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(400);
    });

    it("API-OVERRIDE-09: returns 400 when value is missing", async () => {
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", { entitlementType: "reports_per_month" }) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(400);
    });

    it("API-OVERRIDE-10: returns 400 when value is 0", async () => {
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", { entitlementType: "reports_per_month", value: 0 }) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(400);
    });

    it("API-OVERRIDE-11: returns 400 when expiresAt is in the past", async () => {
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", { entitlementType: "reports_per_month", value: 10, expiresAt: "2020-01-01T00:00:00.000Z" }) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(400);
    });

    it("API-OVERRIDE-12: returns 400 for invalid entitlementType", async () => {
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", { entitlementType: "invalid_type", value: 10 }) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(400);
    });

    it("API-OVERRIDE-13: accepts value of -1 for unlimited", async () => {
      mockDbInsertResult = [{ ...sampleOverride, value: -1 }];
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", { entitlementType: "reports_per_month", value: -1 }) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(201);
    });

    it("API-OVERRIDE-14: returns 500 on DB error", async () => {
      mockDbError = true;
      const { POST } = await import("@/app/api/admin/users/[id]/overrides/route");
      const res = await POST(
        makeRequest("/api/admin/users/user-123/overrides", "POST", validBody) as never,
        { params: Promise.resolve({ id: "user-123" }) }
      );
      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /api/admin/users/[id]/overrides/[overrideId]", () => {
    it("API-OVERRIDE-15: returns 401 for non-admin", async () => {
      mockRequireAdmin.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/admin/users/[id]/overrides/[overrideId]/route");
      const res = await DELETE(
        makeRequest("/api/admin/users/user-123/overrides/override-1", "DELETE") as never,
        { params: Promise.resolve({ id: "user-123", overrideId: "override-1" }) }
      );
      expect(res.status).toBe(401);
    });

    it("API-OVERRIDE-16: deletes override and returns 200", async () => {
      mockDbDeleteResult = [{ id: "override-1" }];
      const { DELETE } = await import("@/app/api/admin/users/[id]/overrides/[overrideId]/route");
      const res = await DELETE(
        makeRequest("/api/admin/users/user-123/overrides/override-1", "DELETE") as never,
        { params: Promise.resolve({ id: "user-123", overrideId: "override-1" }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("API-OVERRIDE-17: returns 404 when override not found", async () => {
      mockDbDeleteResult = [];
      const { DELETE } = await import("@/app/api/admin/users/[id]/overrides/[overrideId]/route");
      const res = await DELETE(
        makeRequest("/api/admin/users/user-123/overrides/nonexistent", "DELETE") as never,
        { params: Promise.resolve({ id: "user-123", overrideId: "nonexistent" }) }
      );
      expect(res.status).toBe(404);
    });

    it("API-OVERRIDE-18: returns 500 on DB error", async () => {
      mockDbError = true;
      const { DELETE } = await import("@/app/api/admin/users/[id]/overrides/[overrideId]/route");
      const res = await DELETE(
        makeRequest("/api/admin/users/user-123/overrides/override-1", "DELETE") as never,
        { params: Promise.resolve({ id: "user-123", overrideId: "override-1" }) }
      );
      expect(res.status).toBe(500);
    });
  });
});
