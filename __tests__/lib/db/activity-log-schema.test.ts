/**
 * Activity Log Schema Tests
 *
 * Tests for the user activity logging feature:
 * - Schema structure (table, columns, indexes)
 * - Service functions (logActivity, getActivityByUser, getActivityByEntity)
 * - Non-blocking behavior (logActivity never throws)
 * - Insert hooks in API routes
 * - Migration file
 *
 * Spec: .specs/features/admin/activity-log-schema.feature.md
 */

import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

// --- Mock setup for service tests ---

const mockDbInsert = jest.fn();
const mockDbSelect = jest.fn();
const mockDbFrom = jest.fn();
const mockDbWhere = jest.fn();
const mockDbOrderBy = jest.fn();
const mockDbLimit = jest.fn();
const mockDbOffset = jest.fn();
const mockDbValues = jest.fn();

jest.mock("@/lib/db", () => {
  const actualSchema = jest.requireActual("@/lib/db/schema");
  return {
    db: {
      insert: (...args: unknown[]) => {
        mockDbInsert(...args);
        return {
          values: (...vArgs: unknown[]) => {
            mockDbValues(...vArgs);
            return mockDbValues.getMockImplementation()
              ? mockDbValues(...vArgs)
              : undefined;
          },
        };
      },
      select: (...args: unknown[]) => {
        mockDbSelect(...args);
        return {
          from: (...fArgs: unknown[]) => {
            mockDbFrom(...fArgs);
            return {
              where: (...wArgs: unknown[]) => {
                mockDbWhere(...wArgs);
                return {
                  orderBy: (...oArgs: unknown[]) => {
                    mockDbOrderBy(...oArgs);
                    return {
                      limit: (...lArgs: unknown[]) => {
                        mockDbLimit(...lArgs);
                        return {
                          offset: (...offArgs: unknown[]) => {
                            mockDbOffset(...offArgs);
                            return mockDbOffset.getMockImplementation()
                              ? mockDbOffset(...offArgs)
                              : [];
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    },
    schema: actualSchema,
  };
});

// ============================================================
// SECTION 1: Schema Structure Tests
// ============================================================

describe("Activity Log Schema — Schema Structure", () => {
  // Scenario: Activity table exists with required columns
  describe("userActivity table", () => {
    it("exports userActivity table", () => {
      expect(schema.userActivity).toBeDefined();
    });

    const columns = Object.keys(schema.userActivity);

    it("has 'id' column", () => {
      expect(columns).toContain("id");
    });

    it("has 'userId' column", () => {
      expect(columns).toContain("userId");
    });

    it("has 'action' column", () => {
      expect(columns).toContain("action");
    });

    it("has 'entityType' column", () => {
      expect(columns).toContain("entityType");
    });

    it("has 'entityId' column", () => {
      expect(columns).toContain("entityId");
    });

    it("has 'metadata' column", () => {
      expect(columns).toContain("metadata");
    });

    it("has 'createdAt' column", () => {
      expect(columns).toContain("createdAt");
    });
  });

  describe("column constraints", () => {
    it("userId is not nullable", () => {
      expect(schema.userActivity.userId.notNull).toBe(true);
    });

    it("action is not nullable", () => {
      expect(schema.userActivity.action.notNull).toBe(true);
    });

    it("entityType is not nullable", () => {
      expect(schema.userActivity.entityType.notNull).toBe(true);
    });

    it("entityId is nullable", () => {
      expect(schema.userActivity.entityId.notNull).toBe(false);
    });

    it("metadata is nullable", () => {
      expect(schema.userActivity.metadata.notNull).toBe(false);
    });

    it("createdAt is not nullable", () => {
      expect(schema.userActivity.createdAt.notNull).toBe(true);
    });
  });

  // Scenario: Migration file exists
  describe("migration file", () => {
    it("has migration SQL file for activity log", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/db/migrations/0002_add_activity_log.sql")
        )
      ).toBe(true);
    });

    it("migration creates user_activity table", () => {
      const sql = fs.readFileSync(
        path.join(process.cwd(), "lib/db/migrations/0002_add_activity_log.sql"),
        "utf-8"
      );
      expect(sql).toContain("CREATE TABLE");
      expect(sql).toContain("user_activity");
    });

    it("migration creates indexes", () => {
      const sql = fs.readFileSync(
        path.join(process.cwd(), "lib/db/migrations/0002_add_activity_log.sql"),
        "utf-8"
      );
      expect(sql).toContain("user_activity_user_id_idx");
      expect(sql).toContain("user_activity_created_at_idx");
      expect(sql).toContain("user_activity_user_created_idx");
    });

    it("migration has foreign key to users table", () => {
      const sql = fs.readFileSync(
        path.join(process.cwd(), "lib/db/migrations/0002_add_activity_log.sql"),
        "utf-8"
      );
      expect(sql).toContain("REFERENCES");
      expect(sql).toContain("users");
      expect(sql).toContain("ON DELETE CASCADE");
    });
  });
});

// ============================================================
// SECTION 2: Activity Log Service Tests
// ============================================================

describe("Activity Log Schema — Service Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Scenario: Log activity for a user action
  describe("logActivity", () => {
    it("inserts an activity record with all fields", async () => {
      const { logActivity } = await import("@/lib/services/activity-log");
      await logActivity({
        userId: "user-1",
        action: "report_created",
        entityType: "report",
        entityId: "report-1",
        metadata: { title: "Naples Q1 Report", marketName: "Naples" },
      });

      expect(mockDbInsert).toHaveBeenCalledWith(schema.userActivity);
      expect(mockDbValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          action: "report_created",
          entityType: "report",
          entityId: "report-1",
          metadata: { title: "Naples Q1 Report", marketName: "Naples" },
        })
      );
    });

    it("works without optional entityId and metadata", async () => {
      const { logActivity } = await import("@/lib/services/activity-log");
      await logActivity({
        userId: "user-1",
        action: "login",
        entityType: "user",
      });

      expect(mockDbInsert).toHaveBeenCalledWith(schema.userActivity);
      expect(mockDbValues).toHaveBeenCalled();
    });

    // Scenario: Activity log does not block the parent action
    it("never throws — catches DB errors silently", async () => {
      mockDbValues.mockImplementation(() => {
        throw new Error("DB connection failed");
      });

      const { logActivity } = await import("@/lib/services/activity-log");

      // Should NOT throw
      await expect(
        logActivity({
          userId: "user-1",
          action: "login",
          entityType: "user",
        })
      ).resolves.toBeUndefined();
    });

    it("logs error to console when insert fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockDbValues.mockImplementation(() => {
        throw new Error("DB connection failed");
      });

      const { logActivity } = await import("@/lib/services/activity-log");
      await logActivity({
        userId: "user-1",
        action: "login",
        entityType: "user",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("activity log"),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  // Scenario: Query activity timeline for a user
  describe("getActivityByUser", () => {
    it("queries activities for a user with default pagination", async () => {
      mockDbOffset.mockReturnValue([]);

      const { getActivityByUser } = await import("@/lib/services/activity-log");
      await getActivityByUser("user-1");

      expect(mockDbSelect).toHaveBeenCalled();
      expect(mockDbFrom).toHaveBeenCalledWith(schema.userActivity);
      expect(mockDbWhere).toHaveBeenCalled();
      expect(mockDbOrderBy).toHaveBeenCalled();
      expect(mockDbLimit).toHaveBeenCalledWith(50);
      expect(mockDbOffset).toHaveBeenCalledWith(0);
    });

    it("accepts custom limit and offset", async () => {
      mockDbOffset.mockReturnValue([]);

      const { getActivityByUser } = await import("@/lib/services/activity-log");
      await getActivityByUser("user-1", { limit: 10, offset: 20 });

      expect(mockDbLimit).toHaveBeenCalledWith(10);
      expect(mockDbOffset).toHaveBeenCalledWith(20);
    });
  });

  // Scenario: Query activity by entity
  describe("getActivityByEntity", () => {
    it("queries activities for a specific entity", async () => {
      mockDbOffset.mockReturnValue([]);

      const { getActivityByEntity } = await import("@/lib/services/activity-log");
      await getActivityByEntity("report", "report-1");

      expect(mockDbSelect).toHaveBeenCalled();
      expect(mockDbFrom).toHaveBeenCalledWith(schema.userActivity);
      expect(mockDbWhere).toHaveBeenCalled();
      expect(mockDbOrderBy).toHaveBeenCalled();
    });
  });
});

// ============================================================
// SECTION 3: File Structure Tests
// ============================================================

describe("Activity Log Schema — File Structure", () => {
  it("has activity-log service file", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "lib/services/activity-log.ts")
      )
    ).toBe(true);
  });

  it("has activity-log migration file", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "lib/db/migrations/0002_add_activity_log.sql")
      )
    ).toBe(true);
  });
});

// ============================================================
// SECTION 4: Type Export Tests
// ============================================================

describe("Activity Log Schema — Type Exports", () => {
  it("exports UserActivity type from db index", () => {
    // Verify the schema table can infer types
    type ActivityEntry = typeof schema.userActivity.$inferSelect;
    type NewActivityEntry = typeof schema.userActivity.$inferInsert;

    // Type-level checks (compile-time)
    const _typeCheck: ActivityEntry = {
      id: "test",
      userId: "test",
      action: "login",
      entityType: "user",
      entityId: null,
      metadata: null,
      createdAt: new Date(),
    };
    expect(_typeCheck).toBeDefined();
  });
});

// ============================================================
// SECTION 5: Insert Hook Integration Tests
// ============================================================

describe("Activity Log Schema — Insert Hooks", () => {
  it("report creation API route imports logActivity", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "app/api/reports/route.ts"),
      "utf-8"
    );
    expect(content).toContain("logActivity");
  });

  it("market creation API route imports logActivity", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "app/api/markets/route.ts"),
      "utf-8"
    );
    expect(content).toContain("logActivity");
  });

  it("profile service calls logActivity on profile update", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/services/profile.ts"),
      "utf-8"
    );
    expect(content).toContain("logActivity");
  });

  it("pipeline executor logs activity on completion", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/services/pipeline-executor.ts"),
      "utf-8"
    );
    expect(content).toContain("logActivity");
  });
});
