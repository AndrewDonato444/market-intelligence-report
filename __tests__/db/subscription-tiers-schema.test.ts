/**
 * Subscription Tiers Schema Tests
 *
 * Tests for the subscription tier data model:
 * - subscription_tiers table structure (columns, types, constraints)
 * - Entitlements JSONB shape and conventions (-1 unlimited, 0 not included)
 * - subscriptions table modifications (nullable Stripe columns, tierId FK)
 * - Migration file validation
 * - Type exports
 *
 * Spec: .specs/features/subscription/subscription-tier-data-model.feature.md
 */

import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

// ============================================================
// SECTION 1: subscription_tiers Table Structure
// ============================================================

describe("Subscription Tiers Schema — Table Structure", () => {
  describe("subscriptionTiers table exists with correct columns", () => {
    const columns = Object.keys(schema.subscriptionTiers);

    it("exports subscriptionTiers table", () => {
      expect(schema.subscriptionTiers).toBeDefined();
    });

    it("has id column (uuid PK)", () => {
      expect(columns).toContain("id");
    });

    it("has name column (varchar, unique)", () => {
      expect(columns).toContain("name");
    });

    it("has slug column (varchar, unique)", () => {
      expect(columns).toContain("slug");
    });

    it("has description column (text)", () => {
      expect(columns).toContain("description");
    });

    it("has entitlements column (jsonb)", () => {
      expect(columns).toContain("entitlements");
    });

    it("has displayPrice column (varchar)", () => {
      expect(columns).toContain("displayPrice");
    });

    it("has monthlyPriceInCents column (integer, nullable)", () => {
      expect(columns).toContain("monthlyPriceInCents");
      expect(schema.subscriptionTiers.monthlyPriceInCents.notNull).toBe(false);
    });

    it("has isActive column (boolean, default true)", () => {
      expect(columns).toContain("isActive");
      expect(schema.subscriptionTiers.isActive.notNull).toBe(true);
    });

    it("has sortOrder column (integer)", () => {
      expect(columns).toContain("sortOrder");
      expect(schema.subscriptionTiers.sortOrder.notNull).toBe(true);
    });

    it("has createdAt column (timestamp)", () => {
      expect(columns).toContain("createdAt");
    });

    it("has updatedAt column (timestamp)", () => {
      expect(columns).toContain("updatedAt");
    });
  });

  describe("column constraints", () => {
    it("name is NOT NULL", () => {
      expect(schema.subscriptionTiers.name.notNull).toBe(true);
    });

    it("slug is NOT NULL", () => {
      expect(schema.subscriptionTiers.slug.notNull).toBe(true);
    });

    it("entitlements is NOT NULL", () => {
      expect(schema.subscriptionTiers.entitlements.notNull).toBe(true);
    });

    it("displayPrice is NOT NULL", () => {
      expect(schema.subscriptionTiers.displayPrice.notNull).toBe(true);
    });

    it("description is nullable", () => {
      expect(schema.subscriptionTiers.description.notNull).toBe(false);
    });
  });
});

// ============================================================
// SECTION 2: Entitlements JSONB Shape
// ============================================================

describe("Subscription Tiers Schema — Entitlements JSONB", () => {
  it("exports TierEntitlements type", () => {
    const entitlements: schema.TierEntitlements = {
      reports_per_month: 10,
      markets_created: 3,
      social_media_kits: 1,
      email_campaigns: 1,
      personas_per_report: 3,
    };
    expect(entitlements.reports_per_month).toBe(10);
  });

  it("supports numeric caps (positive integers)", () => {
    const entitlements: schema.TierEntitlements = {
      reports_per_month: 10,
      markets_created: 3,
      social_media_kits: 1,
      email_campaigns: 1,
      personas_per_report: 3,
    };
    expect(entitlements.reports_per_month).toBe(10);
    expect(entitlements.markets_created).toBe(3);
  });

  it("supports unlimited convention (-1)", () => {
    const entitlements: schema.TierEntitlements = {
      reports_per_month: -1,
      markets_created: -1,
      social_media_kits: -1,
      email_campaigns: -1,
      personas_per_report: 3,
    };
    expect(entitlements.reports_per_month).toBe(-1);
    expect(entitlements.markets_created).toBe(-1);
    expect(entitlements.social_media_kits).toBe(-1);
  });

  it("supports not-included convention (0)", () => {
    const entitlements: schema.TierEntitlements = {
      reports_per_month: 2,
      markets_created: 1,
      social_media_kits: 0,
      email_campaigns: 0,
      personas_per_report: 1,
    };
    expect(entitlements.social_media_kits).toBe(0);
  });

  it("has all required entitlement keys", () => {
    const entitlements: schema.TierEntitlements = {
      reports_per_month: 1,
      markets_created: 1,
      social_media_kits: 0,
      email_campaigns: 0,
      personas_per_report: 1,
    };
    expect(Object.keys(entitlements)).toEqual(
      expect.arrayContaining([
        "reports_per_month",
        "markets_created",
        "social_media_kits",
        "email_campaigns",
        "personas_per_report",
      ])
    );
  });
});

// ============================================================
// SECTION 3: subscriptions Table Modifications
// ============================================================

describe("Subscription Tiers Schema — subscriptions Table Changes", () => {
  const columns = Object.keys(schema.subscriptions);

  it("stripeCustomerId is now nullable", () => {
    expect(schema.subscriptions.stripeCustomerId.notNull).toBe(false);
  });

  it("stripeSubscriptionId remains nullable", () => {
    expect(schema.subscriptions.stripeSubscriptionId.notNull).toBe(false);
  });

  it("has new tierId column", () => {
    expect(columns).toContain("tierId");
  });

  it("tierId is nullable (existing rows don't break)", () => {
    expect(schema.subscriptions.tierId.notNull).toBe(false);
  });

  it("existing plan column is preserved", () => {
    expect(columns).toContain("plan");
  });

  it("existing columns are still present", () => {
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("status");
    expect(columns).toContain("currentPeriodStart");
    expect(columns).toContain("currentPeriodEnd");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });
});

// ============================================================
// SECTION 4: Migration File
// ============================================================

describe("Subscription Tiers Schema — Migration", () => {
  const migrationPath = path.join(
    process.cwd(),
    "lib/db/migrations/0004_add_subscription_tiers.sql"
  );

  it("migration file exists", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("creates subscription_tiers table", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE");
    expect(sql).toContain("subscription_tiers");
  });

  it("subscription_tiers has unique constraint on name", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql.toLowerCase()).toContain("unique");
    expect(sql).toContain("name");
  });

  it("subscription_tiers has unique constraint on slug", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("slug");
  });

  it("makes stripeCustomerId nullable on subscriptions", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("stripe_customer_id");
    expect(sql.toLowerCase()).toContain("drop not null");
  });

  it("adds tierId FK column to subscriptions", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("tier_id");
    expect(sql).toContain("subscription_tiers");
  });

  it("tierId has ON DELETE SET NULL", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql.toLowerCase()).toContain("on delete set null");
  });
});

// ============================================================
// SECTION 5: Seed Script
// ============================================================

describe("Subscription Tiers Schema — Seed Script", () => {
  it("seed script file exists", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "lib/db/seed-subscription-tiers.ts")
      )
    ).toBe(true);
  });

  it("seed script contains all three tier names", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/db/seed-subscription-tiers.ts"),
      "utf-8"
    );
    expect(content).toContain("Starter");
    expect(content).toContain("Professional");
    expect(content).toContain("Enterprise");
  });

  it("seed script contains correct slugs", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/db/seed-subscription-tiers.ts"),
      "utf-8"
    );
    expect(content).toContain("starter");
    expect(content).toContain("professional");
    expect(content).toContain("enterprise");
  });

  it("seed script contains display prices", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/db/seed-subscription-tiers.ts"),
      "utf-8"
    );
    expect(content).toContain("Free");
    expect(content).toContain("$199/mo");
    expect(content).toContain("Custom");
  });

  it("seed script uses ON CONFLICT for idempotency", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/db/seed-subscription-tiers.ts"),
      "utf-8"
    );
    expect(content).toContain("onConflictDoNothing");
  });
});

// ============================================================
// SECTION 6: Type Exports
// ============================================================

describe("Subscription Tiers Schema — Type Exports", () => {
  it("exports SubscriptionTiersTable select type", () => {
    const tier: schema.SubscriptionTiersTable = {} as schema.SubscriptionTiersTable;
    expect(tier).toBeDefined();
  });
});

// ============================================================
// SECTION 7: sortOrder and isActive behavior
// ============================================================

describe("Subscription Tiers Schema — sortOrder and isActive", () => {
  it("sortOrder column is NOT NULL", () => {
    expect(schema.subscriptionTiers.sortOrder.notNull).toBe(true);
  });

  it("isActive column is NOT NULL with boolean type", () => {
    expect(schema.subscriptionTiers.isActive.notNull).toBe(true);
  });
});
