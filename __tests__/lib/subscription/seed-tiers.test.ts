/**
 * Subscription Tier Seed Script Tests
 *
 * Tests for the seed-subscription-tiers.ts script:
 * - Correct tier data (Starter, Professional, Enterprise)
 * - Correct entitlement values per tier
 * - Idempotency (ON CONFLICT DO NOTHING)
 * - sortOrder for display ordering
 *
 * Spec: .specs/features/subscription/subscription-tier-data-model.feature.md
 */

import * as schema from "@/lib/db/schema";
import type { TierEntitlements } from "@/lib/db/schema";

// --- Mock setup ---
const mockInsertValues: unknown[] = [];
const mockOnConflictDoNothing = jest.fn().mockResolvedValue([]);

jest.mock("@/lib/db", () => {
  const actualSchema = jest.requireActual("@/lib/db/schema");
  return {
    db: {
      insert: jest.fn().mockReturnValue({
        values: jest.fn((...args: unknown[]) => {
          mockInsertValues.push(...args);
          return {
            onConflictDoNothing: mockOnConflictDoNothing,
          };
        }),
      }),
    },
    schema: actualSchema,
  };
});

// ============================================================
// SECTION 1: Seed Data Validation
// ============================================================

describe("Seed Subscription Tiers — Data Validation", () => {
  it("defines exactly 3 default tiers", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    expect(DEFAULT_TIERS).toHaveLength(3);
  });

  it("Starter tier has correct entitlements", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    const starter = DEFAULT_TIERS.find((t) => t.slug === "starter");
    expect(starter).toBeDefined();
    expect(starter!.name).toBe("Starter");
    expect(starter!.displayPrice).toBe("Free");
    expect(starter!.sortOrder).toBe(1);
    const e = starter!.entitlements as TierEntitlements;
    expect(e.reports_per_month).toBe(2);
    expect(e.markets_created).toBe(1);
    expect(e.social_media_kits).toBe(1);
    expect(e.personas_per_report).toBe(1);
  });

  it("Professional tier has correct entitlements", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    const pro = DEFAULT_TIERS.find((t) => t.slug === "professional");
    expect(pro).toBeDefined();
    expect(pro!.name).toBe("Professional");
    expect(pro!.displayPrice).toBe("$199/mo");
    expect(pro!.sortOrder).toBe(2);
    const e = pro!.entitlements as TierEntitlements;
    expect(e.reports_per_month).toBe(10);
    expect(e.markets_created).toBe(3);
    expect(e.social_media_kits).toBe(1);
    expect(e.personas_per_report).toBe(3);
  });

  it("Enterprise tier has correct entitlements", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    const ent = DEFAULT_TIERS.find((t) => t.slug === "enterprise");
    expect(ent).toBeDefined();
    expect(ent!.name).toBe("Enterprise");
    expect(ent!.displayPrice).toBe("Custom");
    expect(ent!.sortOrder).toBe(3);
    const e = ent!.entitlements as TierEntitlements;
    expect(e.reports_per_month).toBe(-1);
    expect(e.markets_created).toBe(-1);
    expect(e.social_media_kits).toBe(-1);
    expect(e.personas_per_report).toBe(3);
  });
});

// ============================================================
// SECTION 2: Seed Function Behavior
// ============================================================

describe("Seed Subscription Tiers — Function Behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertValues.length = 0;
  });

  it("seedSubscriptionTiers function exists and is callable", async () => {
    const { seedSubscriptionTiers } = await import(
      "@/lib/db/seed-subscription-tiers"
    );
    expect(typeof seedSubscriptionTiers).toBe("function");
  });

  it("calls onConflictDoNothing for idempotency", async () => {
    const { seedSubscriptionTiers } = await import(
      "@/lib/db/seed-subscription-tiers"
    );
    await seedSubscriptionTiers();
    expect(mockOnConflictDoNothing).toHaveBeenCalled();
  });

  it("tiers are sorted by sortOrder ascending", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    const sortOrders = DEFAULT_TIERS.map((t) => t.sortOrder);
    expect(sortOrders).toEqual([1, 2, 3]);
  });
});

// ============================================================
// SECTION 3: Entitlement Convention Tests
// ============================================================

describe("Seed Subscription Tiers — Entitlement Conventions", () => {
  it("Enterprise uses -1 for unlimited entitlements", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    const ent = DEFAULT_TIERS.find((t) => t.slug === "enterprise")!;
    const e = ent.entitlements as TierEntitlements;
    expect(e.reports_per_month).toBe(-1);
    expect(e.markets_created).toBe(-1);
    expect(e.social_media_kits).toBe(-1);
  });

  it("Starter includes 1 social media kit per month", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    const starter = DEFAULT_TIERS.find((t) => t.slug === "starter")!;
    const e = starter.entitlements as TierEntitlements;
    expect(e.social_media_kits).toBe(1);
  });

  it("all tiers have isActive = true by default", async () => {
    const { DEFAULT_TIERS } = await import("@/lib/db/seed-subscription-tiers");
    for (const tier of DEFAULT_TIERS) {
      expect(tier.isActive).toBe(true);
    }
  });
});
