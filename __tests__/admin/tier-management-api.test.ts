/**
 * Admin Tier Management API Tests
 *
 * Tests for GET/POST /api/admin/tiers and GET/PATCH/DELETE /api/admin/tiers/[id]
 *
 * Spec: .specs/features/admin/admin-tier-management.feature.md
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
let mockDbUpdateResult: unknown = [];
let mockDbDeleteResult: unknown = [];
let mockDbError = false;

const mockInsert = jest.fn();

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
      update: () => {
        if (mockDbError) throw new Error("DB error");
        return makeChain(() => mockDbUpdateResult);
      },
      delete: () => {
        if (mockDbError) throw new Error("DB error");
        return makeChain(() => mockDbDeleteResult);
      },
    };
  },
  schema: {
    subscriptionTiers: {
      id: "subscription_tiers.id",
      name: "subscription_tiers.name",
      slug: "subscription_tiers.slug",
      description: "subscription_tiers.description",
      entitlements: "subscription_tiers.entitlements",
      displayPrice: "subscription_tiers.display_price",
      monthlyPriceInCents: "subscription_tiers.monthly_price_in_cents",
      isActive: "subscription_tiers.is_active",
      sortOrder: "subscription_tiers.sort_order",
      createdAt: "subscription_tiers.created_at",
      updatedAt: "subscription_tiers.updated_at",
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

const sampleTier = {
  id: "tier-1",
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
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("API-TIER: Admin Tier Management API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue("admin-user-id");
    mockDbSelectResult = [];
    mockDbInsertResult = [];
    mockDbUpdateResult = [];
    mockDbDeleteResult = [];
    mockDbError = false;
  });

  describe("GET /api/admin/tiers", () => {
    it("API-TIER-01: returns 401 for non-admin", async () => {
      mockRequireAdmin.mockResolvedValue(null);
      const { GET } = await import("@/app/api/admin/tiers/route");
      const res = await GET(makeRequest("/api/admin/tiers") as never);
      expect(res.status).toBe(401);
    });

    it("API-TIER-02: returns list of tiers sorted by sortOrder", async () => {
      mockDbSelectResult = [
        { ...sampleTier, sortOrder: 1, name: "Starter" },
        { ...sampleTier, sortOrder: 2, name: "Professional" },
      ];
      const { GET } = await import("@/app/api/admin/tiers/route");
      const res = await GET(makeRequest("/api/admin/tiers") as never);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.tiers).toHaveLength(2);
      expect(json.tiers[0].name).toBe("Starter");
    });

    it("API-TIER-03: returns 500 on DB error", async () => {
      mockDbError = true;
      const { GET } = await import("@/app/api/admin/tiers/route");
      const res = await GET(makeRequest("/api/admin/tiers") as never);
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/admin/tiers", () => {
    const newTierBody = {
      name: "Ultra Premium",
      slug: "ultra-premium",
      description: "Top tier",
      displayPrice: "$499/mo",
      monthlyPriceInCents: 49900,
      entitlements: {
        reports_per_month: 25,
        markets_created: 10,
        social_media_kits: -1,
        personas_per_report: 3,
      },
      sortOrder: 4,
      isActive: true,
    };

    it("API-TIER-04: returns 401 for non-admin", async () => {
      mockRequireAdmin.mockResolvedValue(null);
      const { POST } = await import("@/app/api/admin/tiers/route");
      const res = await POST(
        makeRequest("/api/admin/tiers", "POST", newTierBody) as never
      );
      expect(res.status).toBe(401);
    });

    it("API-TIER-05: creates a new tier and returns it", async () => {
      mockDbInsertResult = [{ ...sampleTier, ...newTierBody, id: "tier-new" }];
      const { POST } = await import("@/app/api/admin/tiers/route");
      const res = await POST(
        makeRequest("/api/admin/tiers", "POST", newTierBody) as never
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.tier.name).toBe("Ultra Premium");
    });

    it("API-TIER-06: returns 400 when required fields missing", async () => {
      const { POST } = await import("@/app/api/admin/tiers/route");
      const res = await POST(
        makeRequest("/api/admin/tiers", "POST", { name: "" }) as never
      );
      expect(res.status).toBe(400);
    });

    it("API-TIER-07: returns 409 on duplicate name", async () => {
      mockDbError = false;
      mockInsert.mockImplementationOnce(() => {
        const err = new Error("unique constraint violation");
        (err as Error & { code: string }).code = "23505";
        throw err;
      });
      const { POST } = await import("@/app/api/admin/tiers/route");
      const res = await POST(
        makeRequest("/api/admin/tiers", "POST", newTierBody) as never
      );
      expect(res.status).toBe(409);
    });
  });

  describe("PATCH /api/admin/tiers/[id]", () => {
    it("API-TIER-08: returns 401 for non-admin", async () => {
      mockRequireAdmin.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/admin/tiers/[id]/route");
      const res = await PATCH(
        makeRequest("/api/admin/tiers/tier-1", "PATCH", {
          displayPrice: "$299/mo",
        }) as never,
        { params: Promise.resolve({ id: "tier-1" }) }
      );
      expect(res.status).toBe(401);
    });

    it("API-TIER-09: updates tier and returns updated data", async () => {
      mockDbUpdateResult = [{ ...sampleTier, displayPrice: "$299/mo" }];
      const { PATCH } = await import("@/app/api/admin/tiers/[id]/route");
      const res = await PATCH(
        makeRequest("/api/admin/tiers/tier-1", "PATCH", {
          displayPrice: "$299/mo",
        }) as never,
        { params: Promise.resolve({ id: "tier-1" }) }
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.tier.displayPrice).toBe("$299/mo");
    });

    it("API-TIER-10: returns 404 when tier not found", async () => {
      mockDbUpdateResult = [];
      const { PATCH } = await import("@/app/api/admin/tiers/[id]/route");
      const res = await PATCH(
        makeRequest("/api/admin/tiers/nonexistent", "PATCH", {
          displayPrice: "$299/mo",
        }) as never,
        { params: Promise.resolve({ id: "nonexistent" }) }
      );
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/admin/tiers/[id]", () => {
    it("API-TIER-11: returns 401 for non-admin", async () => {
      mockRequireAdmin.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/admin/tiers/[id]/route");
      const res = await DELETE(
        makeRequest("/api/admin/tiers/tier-1", "DELETE") as never,
        { params: Promise.resolve({ id: "tier-1" }) }
      );
      expect(res.status).toBe(401);
    });

    it("API-TIER-12: deletes tier and returns 200", async () => {
      mockDbDeleteResult = [{ id: "tier-1" }];
      const { DELETE } = await import("@/app/api/admin/tiers/[id]/route");
      const res = await DELETE(
        makeRequest("/api/admin/tiers/tier-1", "DELETE") as never,
        { params: Promise.resolve({ id: "tier-1" }) }
      );
      expect(res.status).toBe(200);
    });

    it("API-TIER-13: returns 404 when tier not found for delete", async () => {
      mockDbDeleteResult = [];
      const { DELETE } = await import("@/app/api/admin/tiers/[id]/route");
      const res = await DELETE(
        makeRequest("/api/admin/tiers/nonexistent", "DELETE") as never,
        { params: Promise.resolve({ id: "nonexistent" }) }
      );
      expect(res.status).toBe(404);
    });
  });
});
