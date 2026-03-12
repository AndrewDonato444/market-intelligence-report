/**
 * Default Tier Assignment on Signup Tests
 *
 * Tests for ensureUserProfile creating a subscription with Starter tier:
 * - SVC-DTA-001: New user gets subscription with Starter tier
 * - SVC-DTA-002: Existing user with subscription is not affected
 * - SVC-DTA-003: ensureUserProfile remains idempotent (no duplicate subscriptions)
 * - SVC-DTA-004: Starter tier not found — graceful degradation
 * - SVC-DTA-005: Subscription has correct period dates
 * - SVC-DTA-006: Subscription userId matches the created user
 *
 * Spec: .specs/features/subscription/default-tier-assignment-on-signup.feature.md
 */

// --- Mock Setup ---

let mockUsers: Array<Record<string, unknown>> = [];
let mockTiers: Array<Record<string, unknown>> = [];
let insertedSubscription: Record<string, unknown> | null = null;
let consoleWarnSpy: jest.SpyInstance;

const STARTER_TIER_ID = "tier-starter-uuid";
const USER_ID = "user-uuid-123";
const AUTH_ID = "auth-id-abc";
const EMAIL = "agent@example.com";

// Mock activity log
jest.mock("@/lib/services/activity-log", () => ({
  logActivity: jest.fn(),
}));

// Mock the database module
jest.mock("@/lib/db", () => {
  return {
    db: {
      select: jest.fn(),
      insert: jest.fn(),
    },
    schema: {
      users: { authId: "auth_id", id: "id" },
      subscriptions: { userId: "user_id", tierId: "tier_id" },
      subscriptionTiers: { slug: "slug", id: "id", isActive: "is_active" },
    },
  };
});

const { db } = jest.requireMock("@/lib/db") as {
  db: {
    select: jest.Mock;
    insert: jest.Mock;
  };
};

function setupSelectMock() {
  db.select.mockImplementation(() => {
    const chain: Record<string, unknown> = {};
    let tableQueried: string | null = null;

    chain.from = jest.fn().mockImplementation((table: unknown) => {
      const mockSchema = (jest.requireMock("@/lib/db") as { schema: Record<string, unknown> }).schema;
      if (table === mockSchema.users) tableQueried = "users";
      else if (table === mockSchema.subscriptionTiers) tableQueried = "tiers";
      return chain;
    });
    chain.where = jest.fn().mockReturnValue(chain);
    chain.limit = jest.fn().mockImplementation(() => {
      if (tableQueried === "users") return mockUsers;
      if (tableQueried === "tiers") return mockTiers;
      return [];
    });
    return chain;
  });
}

function setupInsertMock() {
  db.insert.mockImplementation((table: unknown) => {
    const mockSchema = (jest.requireMock("@/lib/db") as { schema: Record<string, unknown> }).schema;
    let insertTable: string | null = null;

    if (table === mockSchema.users) insertTable = "users";
    else if (table === mockSchema.subscriptions) insertTable = "subscriptions";

    const chain: Record<string, unknown> = {};
    chain.values = jest.fn().mockImplementation((vals: Record<string, unknown>) => {
      if (insertTable === "subscriptions") {
        insertedSubscription = vals;
      }
      return chain;
    });
    chain.onConflictDoNothing = jest.fn().mockReturnValue(chain);
    chain.returning = jest.fn().mockImplementation(() => {
      if (insertTable === "users") {
        return [{ id: USER_ID, authId: AUTH_ID, email: EMAIL, name: "agent" }];
      }
      if (insertTable === "subscriptions") {
        return insertedSubscription ? [{ id: "sub-uuid", ...insertedSubscription }] : [];
      }
      return [];
    });
    return chain;
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUsers = [];
  mockTiers = [];
  insertedSubscription = null;
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  setupSelectMock();
  setupInsertMock();
});

afterEach(() => {
  consoleWarnSpy.mockRestore();
});

// Import after mocks are set up
import { ensureUserProfile } from "@/lib/services/profile";

describe("Default Tier Assignment on Signup", () => {
  // SVC-DTA-001
  test("new user gets a subscription with Starter tier on first login", async () => {
    mockUsers = [];
    mockTiers = [{ id: STARTER_TIER_ID, slug: "starter" }];

    await ensureUserProfile(AUTH_ID, EMAIL);

    // Should have inserted into subscriptions table
    expect(db.insert).toHaveBeenCalledTimes(2); // users + subscriptions
    expect(insertedSubscription).not.toBeNull();
    expect(insertedSubscription!.tierId).toBe(STARTER_TIER_ID);
    expect(insertedSubscription!.plan).toBe("free");
    expect(insertedSubscription!.status).toBe("active");
    expect(insertedSubscription!.stripeCustomerId).toBeNull();
    expect(insertedSubscription!.stripeSubscriptionId).toBeNull();
  });

  // SVC-DTA-002
  test("existing user with subscription is not affected", async () => {
    mockUsers = [{ id: USER_ID, authId: AUTH_ID, email: EMAIL }];

    await ensureUserProfile(AUTH_ID, EMAIL);

    // Should NOT insert anything (user exists, early return)
    expect(db.insert).not.toHaveBeenCalled();
  });

  // SVC-DTA-003
  test("ensureUserProfile remains idempotent — no duplicate subscriptions", async () => {
    mockUsers = [];
    mockTiers = [{ id: STARTER_TIER_ID, slug: "starter" }];

    await ensureUserProfile(AUTH_ID, EMAIL);
    expect(db.insert).toHaveBeenCalledTimes(2);

    // Second call — user now exists
    jest.clearAllMocks();
    mockUsers = [{ id: USER_ID, authId: AUTH_ID, email: EMAIL }];
    setupSelectMock();
    setupInsertMock();

    await ensureUserProfile(AUTH_ID, EMAIL);
    expect(db.insert).not.toHaveBeenCalled();
  });

  // SVC-DTA-004
  test("Starter tier not found — graceful degradation, no subscription created", async () => {
    mockUsers = [];
    mockTiers = []; // No starter tier

    await ensureUserProfile(AUTH_ID, EMAIL);

    // Should create user but NOT subscription
    expect(db.insert).toHaveBeenCalledTimes(1); // only users
    expect(insertedSubscription).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Starter tier not found")
    );
  });

  // SVC-DTA-005
  test("subscription has correct period dates", async () => {
    mockUsers = [];
    mockTiers = [{ id: STARTER_TIER_ID, slug: "starter" }];

    const before = new Date();
    await ensureUserProfile(AUTH_ID, EMAIL);
    const after = new Date();

    expect(insertedSubscription).not.toBeNull();
    const start = insertedSubscription!.currentPeriodStart as Date;
    const end = insertedSubscription!.currentPeriodEnd as Date;

    expect(start.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(start.getTime()).toBeLessThanOrEqual(after.getTime());

    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(30, 0);
  });

  // SVC-DTA-006
  test("subscription userId matches the created user", async () => {
    mockUsers = [];
    mockTiers = [{ id: STARTER_TIER_ID, slug: "starter" }];

    await ensureUserProfile(AUTH_ID, EMAIL);

    expect(insertedSubscription).not.toBeNull();
    expect(insertedSubscription!.userId).toBe(USER_ID);
  });
});
