/**
 * Usage Records Schema Tests
 *
 * Tests for the usage_records table:
 * - Table structure (columns, types, constraints)
 * - Period conventions (monthly vs cumulative)
 * - Unique composite index for atomic upsert
 * - Migration file validation
 * - Type exports
 *
 * Spec: .specs/features/subscription/usage-tracking.feature.md
 */

import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

// ============================================================
// SECTION 1: usage_records Table Structure
// ============================================================

describe("Usage Tracking — Table Structure", () => {
  describe("usageRecords table exists with correct columns", () => {
    const columns = Object.keys(schema.usageRecords);

    it("exports usageRecords table", () => {
      expect(schema.usageRecords).toBeDefined();
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

    it("has periodStart column (timestamptz)", () => {
      expect(columns).toContain("periodStart");
    });

    it("has periodEnd column (timestamptz, nullable)", () => {
      expect(columns).toContain("periodEnd");
      expect(schema.usageRecords.periodEnd.notNull).toBe(false);
    });

    it("has count column (integer, default 0)", () => {
      expect(columns).toContain("count");
    });

    it("has createdAt column (timestamptz)", () => {
      expect(columns).toContain("createdAt");
    });
  });

  describe("column constraints", () => {
    it("userId is NOT NULL", () => {
      expect(schema.usageRecords.userId.notNull).toBe(true);
    });

    it("entitlementType is NOT NULL", () => {
      expect(schema.usageRecords.entitlementType.notNull).toBe(true);
    });

    it("periodStart is NOT NULL", () => {
      expect(schema.usageRecords.periodStart.notNull).toBe(true);
    });

    it("count is NOT NULL", () => {
      expect(schema.usageRecords.count.notNull).toBe(true);
    });

    it("createdAt is NOT NULL", () => {
      expect(schema.usageRecords.createdAt.notNull).toBe(true);
    });

    it("periodEnd is nullable (null = cumulative)", () => {
      expect(schema.usageRecords.periodEnd.notNull).toBe(false);
    });
  });
});

// ============================================================
// SECTION 2: Migration File
// ============================================================

describe("Usage Tracking — Migration", () => {
  const migrationPath = path.join(
    process.cwd(),
    "lib/db/migrations/0007_add_usage_records.sql"
  );

  it("migration file exists", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("creates usage_records table", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("CREATE TABLE");
    expect(sql).toContain("usage_records");
  });

  it("has user_id FK to users with CASCADE", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("user_id");
    expect(sql.toLowerCase()).toContain("references");
    expect(sql.toLowerCase()).toContain("on delete cascade");
  });

  it("has entitlement_type column", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("entitlement_type");
  });

  it("has period_start column", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("period_start");
  });

  it("has period_end column", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("period_end");
  });

  it("has count column with default 0", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    expect(sql).toContain("count");
    expect(sql).toContain("DEFAULT 0");
  });

  it("has unique composite index on (user_id, entitlement_type, period_start)", () => {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    const lowerSql = sql.toLowerCase();
    expect(lowerSql).toContain("unique index");
    expect(lowerSql).toContain("user_id");
    expect(lowerSql).toContain("entitlement_type");
    expect(lowerSql).toContain("period_start");
  });
});

// ============================================================
// SECTION 3: Type Exports
// ============================================================

describe("Usage Tracking — Type Exports", () => {
  it("exports UsageRecordsTable select type", () => {
    const record: schema.UsageRecordsTable = {} as schema.UsageRecordsTable;
    expect(record).toBeDefined();
  });

  it("exports NewUsageRecord insert type", () => {
    const record: schema.NewUsageRecord = {} as schema.NewUsageRecord;
    expect(record).toBeDefined();
  });
});

// ============================================================
// SECTION 4: Existing Schema Preserved
// ============================================================

describe("Usage Tracking — Existing Schema Preserved", () => {
  it("entitlementOverrides table still exists from #171", () => {
    expect(schema.entitlementOverrides).toBeDefined();
  });

  it("subscriptionTiers table still exists from #170", () => {
    expect(schema.subscriptionTiers).toBeDefined();
  });

  it("subscriptions table still has tierId", () => {
    const columns = Object.keys(schema.subscriptions);
    expect(columns).toContain("tierId");
  });
});
