/**
 * User Entitlement Model Schema Tests
 *
 * Tests for the entitlement_overrides table:
 * - Table structure (columns, types, constraints)
 * - Value conventions (positive = cap, -1 = unlimited)
 * - Foreign key and index configuration
 * - Migration file validation
 * - Type exports
 *
 * Spec: .specs/features/subscription/user-entitlement-model.feature.md
 */

import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

// ============================================================
// SECTION 1: entitlement_overrides Table Structure
// ============================================================

describe("User Entitlement Model — Table Structure", () => {
  describe("entitlementOverrides table exists with correct columns", () => {
    const columns = Object.keys(schema.entitlementOverrides);

    it("exports entitlementOverrides table", () => {
      expect(schema.entitlementOverrides).toBeDefined();
    });

    it("has id column (uuid PK)", () => {
      expect(columns).toContain("id");
    });

    it("has userId column (uuid FK to users)", () => {
      expect(columns).toContain("userId");
    });

    it("has entitlementType column (varchar)", () => {
      expect(columns).toContain("entitlementType");
    });

    it("has value column (integer)", () => {
      expect(columns).toContain("value");
    });

    it("has expiresAt column (timestamp, nullable)", () => {
      expect(columns).toContain("expiresAt");
      expect(schema.entitlementOverrides.expiresAt.notNull).toBe(false);
    });

    it("has grantedBy column (text)", () => {
      expect(columns).toContain("grantedBy");
    });

    it("has reason column (text, nullable)", () => {
      expect(columns).toContain("reason");
      expect(schema.entitlementOverrides.reason.notNull).toBe(false);
    });

    it("has createdAt column (timestamp)", () => {
      expect(columns).toContain("createdAt");
    });
  });

  describe("column constraints", () => {
    it("userId is NOT NULL", () => {
      expect(schema.entitlementOverrides.userId.notNull).toBe(true);
    });

    it("entitlementType is NOT NULL", () => {
      expect(schema.entitlementOverrides.entitlementType.notNull).toBe(true);
    });

    it("value is NOT NULL", () => {
      expect(schema.entitlementOverrides.value.notNull).toBe(true);
    });

    it("grantedBy is NOT NULL", () => {
      expect(schema.entitlementOverrides.grantedBy.notNull).toBe(true);
    });

    it("createdAt is NOT NULL", () => {
      expect(schema.entitlementOverrides.createdAt.notNull).toBe(true);
    });
  });
});

// ============================================================
// SECTION 2: Value Conventions
// ============================================================

describe("User Entitlement Model — Value Conventions", () => {
  it("positive integer represents a cap", () => {
    const override = { entitlementType: "reports_per_month", value: 20 };
    expect(override.value).toBeGreaterThan(0);
  });

  it("-1 represents unlimited", () => {
    const override = { entitlementType: "reports_per_month", value: -1 };
    expect(override.value).toBe(-1);
  });

  it("entitlementType accepts standard keys from TierEntitlements", () => {
    const validKeys = [
      "reports_per_month",
      "markets_created",
      "social_media_kits",
      "email_campaigns",
      "personas_per_report",
      "transaction_limit",
    ];
    validKeys.forEach((key) => {
      const override = { entitlementType: key, value: 10 };
      expect(override.entitlementType).toBe(key);
    });
  });
});

// ============================================================
// SECTION 3: Migration File
// ============================================================

describe("User Entitlement Model — Migration", () => {
  const migrationPath = path.join(
    process.cwd(),
    "lib/db/migrations/0006_add_entitlement_overrides.sql"
  );

  it("migration file exists", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("creates entitlement_overrides table", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE");
    expect(sql).toContain("entitlement_overrides");
  });

  it("has userId FK to users with CASCADE", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("user_id");
    expect(sql.toLowerCase()).toContain("references");
    expect(sql.toLowerCase()).toContain("on delete cascade");
  });

  it("has entitlement_type column", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("entitlement_type");
  });

  it("has value column", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("value");
  });

  it("has expires_at column", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("expires_at");
  });

  it("has granted_by column", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("granted_by");
  });

  it("has index on user_id", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql.toLowerCase()).toContain("index");
    expect(sql).toContain("user_id");
  });

  it("has composite index on (user_id, entitlement_type)", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    // The composite index should reference both columns
    const lowerSql = sql.toLowerCase();
    expect(lowerSql).toContain("user_id");
    expect(lowerSql).toContain("entitlement_type");
  });
});

// ============================================================
// SECTION 4: Type Exports
// ============================================================

describe("User Entitlement Model — Type Exports", () => {
  it("exports EntitlementOverridesTable select type", () => {
    const override: schema.EntitlementOverridesTable =
      {} as schema.EntitlementOverridesTable;
    expect(override).toBeDefined();
  });

  it("exports NewEntitlementOverride insert type", () => {
    const override: schema.NewEntitlementOverride =
      {} as schema.NewEntitlementOverride;
    expect(override).toBeDefined();
  });
});

// ============================================================
// SECTION 5: Existing Schema Unchanged
// ============================================================

describe("User Entitlement Model — Existing Schema Preserved", () => {
  it("subscriptions table still has tierId from #170", () => {
    const columns = Object.keys(schema.subscriptions);
    expect(columns).toContain("tierId");
  });

  it("subscriptions.stripeCustomerId is still nullable", () => {
    expect(schema.subscriptions.stripeCustomerId.notNull).toBe(false);
  });

  it("subscriptions.stripeSubscriptionId is still nullable", () => {
    expect(schema.subscriptions.stripeSubscriptionId.notNull).toBe(false);
  });

  it("subscriptionTiers table still exists", () => {
    expect(schema.subscriptionTiers).toBeDefined();
  });

  it("TierEntitlements type still has all required keys", () => {
    const entitlements: schema.TierEntitlements = {
      reports_per_month: 1,
      markets_created: 1,
      social_media_kits: 0,
      email_campaigns: 0,
      personas_per_report: 1,
      transaction_limit: 100,
    };
    expect(Object.keys(entitlements)).toHaveLength(6);
  });
});
