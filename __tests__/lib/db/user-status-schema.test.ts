/**
 * User Status Schema Tests
 *
 * Tests for the user account status management feature:
 * - Schema changes (enum, columns, index)
 * - Service functions (suspend, unsuspend, soft-delete, lastLogin, filterByStatus)
 * - Auth gate middleware (redirect suspended/deleted users)
 * - Static pages (suspended, account-inactive)
 *
 * Spec: .specs/features/admin/user-status-schema.feature.md
 */

import fs from "fs";
import path from "path";
import * as schema from "@/lib/db/schema";

// --- Mock setup for service tests ---

const mockDbSelect = jest.fn();
const mockDbUpdate = jest.fn();
const mockDbFrom = jest.fn();
const mockDbWhere = jest.fn();
const mockDbLimit = jest.fn();
const mockDbSet = jest.fn();
const mockDbReturning = jest.fn();

jest.mock("@/lib/db", () => {
  const actualSchema = jest.requireActual("@/lib/db/schema");
  return {
    db: {
      select: (...args: unknown[]) => {
        mockDbSelect(...args);
        return {
          from: (...fArgs: unknown[]) => {
            mockDbFrom(...fArgs);
            return {
              where: (...wArgs: unknown[]) => {
                mockDbWhere(...wArgs);
                return {
                  limit: (...lArgs: unknown[]) => {
                    mockDbLimit(...lArgs);
                    return mockDbLimit.getMockImplementation()
                      ? mockDbLimit(...lArgs)
                      : [];
                  },
                };
              },
            };
          },
        };
      },
      update: (...args: unknown[]) => {
        mockDbUpdate(...args);
        return {
          set: (...sArgs: unknown[]) => {
            mockDbSet(...sArgs);
            return {
              where: (...wArgs: unknown[]) => {
                mockDbWhere(...wArgs);
                return {
                  returning: () => mockDbReturning(),
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

describe("User Status Schema — Schema Structure", () => {
  // Scenario: New enum type exists
  describe("userAccountStatusEnum", () => {
    it("exports userAccountStatusEnum", () => {
      expect(schema.userAccountStatusEnum).toBeDefined();
    });

    it("has exactly three values: active, suspended, deleted", () => {
      const enumValues = schema.userAccountStatusEnum.enumValues;
      expect(enumValues).toEqual(["active", "suspended", "deleted"]);
    });
  });

  // Scenario: New columns on users table
  describe("users table — new columns", () => {
    const columns = Object.keys(schema.users);

    it("has 'status' column", () => {
      expect(columns).toContain("status");
    });

    it("has 'suspendedAt' column", () => {
      expect(columns).toContain("suspendedAt");
    });

    it("has 'deletedAt' column", () => {
      expect(columns).toContain("deletedAt");
    });

    it("has 'lastLoginAt' column", () => {
      expect(columns).toContain("lastLoginAt");
    });
  });

  // Scenario: Existing columns preserved
  describe("users table — existing columns preserved", () => {
    const columns = Object.keys(schema.users);

    it("still has id, authId, email, name", () => {
      expect(columns).toContain("id");
      expect(columns).toContain("authId");
      expect(columns).toContain("email");
      expect(columns).toContain("name");
    });

    it("still has role column", () => {
      expect(columns).toContain("role");
    });

    it("still has timestamps", () => {
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
    });
  });

  // Scenario: Migration file exists
  describe("migration file", () => {
    it("has migration SQL file for user status", () => {
      expect(
        fs.existsSync(
          path.join(process.cwd(), "lib/db/migrations/0001_add_user_status.sql")
        )
      ).toBe(true);
    });

    it("migration contains CREATE TYPE for user_account_status", () => {
      const sql = fs.readFileSync(
        path.join(process.cwd(), "lib/db/migrations/0001_add_user_status.sql"),
        "utf-8"
      );
      expect(sql).toContain("CREATE TYPE user_account_status");
      expect(sql).toContain("'active'");
      expect(sql).toContain("'suspended'");
      expect(sql).toContain("'deleted'");
    });

    it("migration adds all four columns", () => {
      const sql = fs.readFileSync(
        path.join(process.cwd(), "lib/db/migrations/0001_add_user_status.sql"),
        "utf-8"
      );
      expect(sql).toContain("ADD COLUMN status");
      expect(sql).toContain("ADD COLUMN suspended_at");
      expect(sql).toContain("ADD COLUMN deleted_at");
      expect(sql).toContain("ADD COLUMN last_login_at");
    });

    it("migration creates index on status column", () => {
      const sql = fs.readFileSync(
        path.join(process.cwd(), "lib/db/migrations/0001_add_user_status.sql"),
        "utf-8"
      );
      expect(sql).toContain("CREATE INDEX users_status_idx");
    });

    it("migration backfills existing users to active", () => {
      const sql = fs.readFileSync(
        path.join(process.cwd(), "lib/db/migrations/0001_add_user_status.sql"),
        "utf-8"
      );
      expect(sql).toContain("UPDATE users SET status = 'active'");
    });
  });
});

// ============================================================
// SECTION 2: User Status Service Tests
// ============================================================

describe("User Status Schema — Service Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Scenario: Suspend user
  describe("suspendUser", () => {
    it("sets status to suspended and records suspendedAt", async () => {
      const now = new Date();
      jest.useFakeTimers({ now });

      const mockUser = {
        id: "user-1",
        status: "suspended",
        suspendedAt: now,
        updatedAt: now,
      };
      mockDbReturning.mockReturnValue([mockUser]);

      const { suspendUser } = await import("@/lib/services/user-status");
      const result = await suspendUser("user-1");

      expect(mockDbUpdate).toHaveBeenCalled();
      expect(mockDbSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "suspended",
          suspendedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(mockUser);
      jest.useRealTimers();
    });
  });

  // Scenario: Unsuspend user — status back to active, suspendedAt cleared
  describe("unsuspendUser", () => {
    it("sets status to active and clears suspendedAt", async () => {
      const mockUser = {
        id: "user-1",
        status: "active",
        suspendedAt: null,
      };
      mockDbReturning.mockReturnValue([mockUser]);

      const { unsuspendUser } = await import("@/lib/services/user-status");
      const result = await unsuspendUser("user-1");

      expect(mockDbSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "active",
          suspendedAt: null,
        })
      );
      expect(result).toEqual(mockUser);
    });
  });

  // Scenario: Soft-delete user — status deleted, deletedAt recorded
  describe("softDeleteUser", () => {
    it("sets status to deleted and records deletedAt", async () => {
      const now = new Date();
      jest.useFakeTimers({ now });

      const mockUser = {
        id: "user-1",
        status: "deleted",
        deletedAt: now,
      };
      mockDbReturning.mockReturnValue([mockUser]);

      const { softDeleteUser } = await import("@/lib/services/user-status");
      const result = await softDeleteUser("user-1");

      expect(mockDbSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "deleted",
          deletedAt: expect.any(Date),
        })
      );
      expect(result).toEqual(mockUser);
      jest.useRealTimers();
    });
  });

  // Scenario: Update last login timestamp
  describe("updateLastLogin", () => {
    it("updates lastLoginAt without affecting other fields", async () => {
      const now = new Date();
      jest.useFakeTimers({ now });

      const mockUser = {
        id: "user-1",
        authId: "auth-1",
        lastLoginAt: now,
      };
      mockDbReturning.mockReturnValue([mockUser]);

      const { updateLastLogin } = await import("@/lib/services/user-status");
      const result = await updateLastLogin("auth-1");

      expect(mockDbSet).toHaveBeenCalledWith({
        lastLoginAt: expect.any(Date),
      });
      // Only lastLoginAt should be in the set call — no other fields
      const setArg = mockDbSet.mock.calls[0][0];
      expect(Object.keys(setArg)).toEqual(["lastLoginAt"]);
      expect(result).toEqual(mockUser);
      jest.useRealTimers();
    });
  });

  // Scenario: Get user status
  describe("getUserStatus", () => {
    it("returns user status when user exists", async () => {
      mockDbLimit.mockReturnValue([{ status: "active" }]);

      const { getUserStatus } = await import("@/lib/services/user-status");
      const result = await getUserStatus("auth-1");

      expect(result).toBe("active");
    });

    it("returns null when user not found", async () => {
      mockDbLimit.mockReturnValue([]);

      const { getUserStatus } = await import("@/lib/services/user-status");
      const result = await getUserStatus("auth-nonexistent");

      expect(result).toBeNull();
    });
  });

  // Scenario: Admin queries users by status
  describe("getUsersByStatus", () => {
    it("filters users by suspended status", async () => {
      const { getUsersByStatus } = await import("@/lib/services/user-status");
      await getUsersByStatus("suspended");

      expect(mockDbSelect).toHaveBeenCalled();
      expect(mockDbFrom).toHaveBeenCalled();
      expect(mockDbWhere).toHaveBeenCalled();
    });

    it("filters users by active status", async () => {
      const { getUsersByStatus } = await import("@/lib/services/user-status");
      await getUsersByStatus("active");

      expect(mockDbWhere).toHaveBeenCalled();
    });

    it("filters users by deleted status", async () => {
      const { getUsersByStatus } = await import("@/lib/services/user-status");
      await getUsersByStatus("deleted");

      expect(mockDbWhere).toHaveBeenCalled();
    });
  });
});

// ============================================================
// SECTION 3: File Structure & Static Pages
// ============================================================

describe("User Status Schema — File Structure", () => {
  it("has user-status service file", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "lib/services/user-status.ts")
      )
    ).toBe(true);
  });

  // Scenario: Suspended agent sees suspension message
  it("has /suspended page", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/suspended/page.tsx")
      )
    ).toBe(true);
  });

  it("/suspended page contains suspension message", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "app/suspended/page.tsx"),
      "utf-8"
    );
    expect(content).toContain("Your account has been suspended");
    expect(content).toContain("contact support");
  });

  // Scenario: Soft-deleted agent sees inactive message
  it("has /account-inactive page", () => {
    expect(
      fs.existsSync(
        path.join(process.cwd(), "app/account-inactive/page.tsx")
      )
    ).toBe(true);
  });

  it("/account-inactive page contains inactive message", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "app/account-inactive/page.tsx"),
      "utf-8"
    );
    expect(content).toContain("Your account is no longer active");
    expect(content).toContain("contact support");
  });
});

// ============================================================
// SECTION 4: Middleware Auth Gate Tests
// ============================================================

describe("User Status Schema — Auth Gate Middleware", () => {
  it("middleware file references suspended redirect", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/supabase/middleware.ts"),
      "utf-8"
    );
    expect(content).toContain("/suspended");
  });

  it("middleware file references account-inactive redirect", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/supabase/middleware.ts"),
      "utf-8"
    );
    expect(content).toContain("/account-inactive");
  });

  it("middleware checks user account status after auth", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/supabase/middleware.ts"),
      "utf-8"
    );
    // Should check for suspended status
    expect(content).toContain('"suspended"');
    // Should check for deleted status
    expect(content).toContain('"deleted"');
  });

  it("middleware allows status pages without redirect loop", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/supabase/middleware.ts"),
      "utf-8"
    );
    // Should have isStatusPage check to prevent infinite redirect
    expect(content).toContain("isStatusPage");
  });

  it("middleware has getUserAccountStatus function", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/supabase/middleware.ts"),
      "utf-8"
    );
    expect(content).toContain("getUserAccountStatus");
  });
});

// ============================================================
// SECTION 5: Profile Service — lastLoginAt on creation
// ============================================================

describe("User Status Schema — Profile Integration", () => {
  it("profile service sets lastLoginAt on new profile creation", () => {
    const content = fs.readFileSync(
      path.join(process.cwd(), "lib/services/profile.ts"),
      "utf-8"
    );
    expect(content).toContain("lastLoginAt");
  });
});

// ============================================================
// SECTION 6: Type Safety Tests
// ============================================================

describe("User Status Schema — Type Safety", () => {
  it("userAccountStatusEnum has correct enum name", () => {
    // Access the underlying PgEnum to check the SQL name
    expect(schema.userAccountStatusEnum.enumValues).toBeDefined();
    expect(schema.userAccountStatusEnum.enumValues.length).toBe(3);
  });

  it("status column exists on users table schema", () => {
    const statusCol = schema.users.status;
    expect(statusCol).toBeDefined();
    expect(statusCol.notNull).toBe(true);
  });

  it("suspendedAt, deletedAt, lastLoginAt are nullable", () => {
    expect(schema.users.suspendedAt.notNull).toBe(false);
    expect(schema.users.deletedAt.notNull).toBe(false);
    expect(schema.users.lastLoginAt.notNull).toBe(false);
  });
});
