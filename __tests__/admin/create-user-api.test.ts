/**
 * Admin Create User API Tests
 *
 * Tests for POST /api/admin/users/create
 *
 * Spec: .specs/features/admin/create-user.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();

jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// --- Supabase admin mock ---
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockResetPasswordForEmail = jest.fn();

jest.mock("@/lib/supabase/admin-client", () => ({
  getSupabaseAdmin: () => ({
    auth: {
      admin: {
        createUser: (...args: unknown[]) => mockCreateUser(...args),
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
      resetPasswordForEmail: (...args: unknown[]) =>
        mockResetPasswordForEmail(...args),
    },
  }),
}));

// --- DB mock ---
let mockDbSelectResult: unknown = [];
let mockDbInsertResult: unknown = [];
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
    };
  },
  schema: {
    users: {
      id: "users.id",
      authId: "users.auth_id",
      email: "users.email",
      name: "users.name",
      company: "users.company",
      phone: "users.phone",
      title: "users.title",
      role: "users.role",
      status: "users.status",
    },
    subscriptions: {
      id: "subscriptions.id",
      userId: "subscriptions.user_id",
      tierId: "subscriptions.tier_id",
      status: "subscriptions.status",
    },
    subscriptionTiers: {
      id: "subscription_tiers.id",
      name: "subscription_tiers.name",
      isActive: "subscription_tiers.is_active",
    },
    userActivity: {
      id: "user_activity.id",
    },
  },
}));

function makeRequest(
  url: string,
  method = "POST",
  body?: Record<string, unknown>
) {
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

const validBody = {
  email: "newuser@example.com",
  firstName: "Jordan",
  lastName: "Ellis",
  company: "Ellis Luxury Group",
  phone: "555-123-4567",
  title: "Managing Broker",
  role: "user",
  tierId: "tier-uuid-123",
  sendInvite: true,
};

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/admin/users/create/route");
  POST = mod.POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDbSelectResult = [];
  mockDbInsertResult = [{ id: "new-user-uuid" }];
  mockDbError = false;
  mockRequireAdmin.mockResolvedValue("admin-user-id");
  mockCreateUser.mockResolvedValue({
    data: { user: { id: "supabase-auth-uuid" } },
    error: null,
  });
  mockDeleteUser.mockResolvedValue({ data: {}, error: null });
  mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
});

describe("POST /api/admin/users/create", () => {
  // API-CREATE-USER-01
  it("rejects unauthenticated requests", async () => {
    mockRequireAdmin.mockResolvedValue(null);
    const res = await POST(makeRequest("/api/admin/users/create", "POST", validBody));
    expect(res.status).toBe(403);
  });

  // API-CREATE-USER-02
  it("validates email is required", async () => {
    const body = { ...validBody, email: "" };
    const res = await POST(makeRequest("/api/admin/users/create", "POST", body));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/email/i);
  });

  // API-CREATE-USER-03
  it("creates user successfully with all fields", async () => {
    const res = await POST(makeRequest("/api/admin/users/create", "POST", validBody));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.userId).toBeDefined();

    // Verify Supabase auth was called
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "newuser@example.com",
        email_confirm: true,
      })
    );

    // Verify DB insert was called (profile + subscription + activity)
    expect(mockInsert).toHaveBeenCalled();
  });

  // API-CREATE-USER-04
  it("creates user with only email (minimal fields)", async () => {
    const body = { email: "minimal@example.com", role: "user", tierId: "tier-uuid-123" };
    const res = await POST(makeRequest("/api/admin/users/create", "POST", body));
    expect(res.status).toBe(201);
  });

  // API-CREATE-USER-05
  it("sends invite email when sendInvite is true", async () => {
    const res = await POST(makeRequest("/api/admin/users/create", "POST", validBody));
    expect(res.status).toBe(201);
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "newuser@example.com",
      expect.any(Object)
    );
    const json = await res.json();
    expect(json.message).toMatch(/invite/i);
  });

  // API-CREATE-USER-06
  it("skips invite email when sendInvite is false", async () => {
    const body = { ...validBody, sendInvite: false };
    const res = await POST(makeRequest("/api/admin/users/create", "POST", body));
    expect(res.status).toBe(201);
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  // API-CREATE-USER-07
  it("returns 409 for duplicate email", async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered", status: 422 },
    });
    const res = await POST(makeRequest("/api/admin/users/create", "POST", validBody));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already exists/i);
  });

  // API-CREATE-USER-08
  it("returns 500 when Supabase auth fails", async () => {
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Internal server error", status: 500 },
    });
    const res = await POST(makeRequest("/api/admin/users/create", "POST", validBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/failed to create/i);
  });

  // API-CREATE-USER-09
  it("returns 500 and cleans up auth user when DB insert fails", async () => {
    mockDbError = true;
    const res = await POST(makeRequest("/api/admin/users/create", "POST", validBody));
    expect(res.status).toBe(500);
    // Should clean up the orphaned Supabase auth user
    expect(mockDeleteUser).toHaveBeenCalledWith("supabase-auth-uuid");
  });

  // API-CREATE-USER-10
  it("assigns admin role when specified", async () => {
    const body = { ...validBody, role: "admin" };
    const res = await POST(makeRequest("/api/admin/users/create", "POST", body));
    expect(res.status).toBe(201);
    // Role should be passed through to DB insert
    expect(mockInsert).toHaveBeenCalled();
  });
});
