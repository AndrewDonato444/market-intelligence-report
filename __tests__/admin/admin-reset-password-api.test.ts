/**
 * Admin Reset Password API Tests
 *
 * Tests for POST /api/admin/users/[id]/reset-password
 *
 * Spec: .specs/features/auth/password-management.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();

jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

// --- Supabase admin mock ---
const mockResetPasswordForEmail = jest.fn();

jest.mock("@/lib/supabase/admin-client", () => ({
  getSupabaseAdmin: () => ({
    auth: {
      resetPasswordForEmail: (...args: unknown[]) =>
        mockResetPasswordForEmail(...args),
    },
  }),
}));

// --- DB mock ---
let mockDbSelectResult: unknown = [];

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

const mockInsert = jest.fn();

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: () => makeChain(() => mockDbSelectResult),
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return makeChain(() => [{ id: "activity-uuid" }]);
      },
    };
  },
  schema: {
    users: {
      id: "users.id",
      email: "users.email",
      authId: "users.auth_id",
    },
    userActivity: {
      id: "user_activity.id",
    },
  },
}));

function makeRequest(userId: string) {
  return new Request(
    `http://localhost:3000/api/admin/users/${userId}/reset-password`,
    { method: "POST" }
  );
}

let POST: (
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) => Promise<Response>;

beforeAll(async () => {
  const mod = await import(
    "@/app/api/admin/users/[id]/reset-password/route"
  );
  POST = mod.POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAdmin.mockResolvedValue("admin-user-id");
  mockDbSelectResult = [
    { id: "user-uuid", email: "jordan@example.com", authId: "auth-uuid" },
  ];
  mockResetPasswordForEmail.mockResolvedValue({ error: null });
});

describe("POST /api/admin/users/[id]/reset-password", () => {
  // API-PWD-20: Admin triggers password reset
  it("API-PWD-20: sends reset email for valid user", async () => {
    const res = await POST(makeRequest("user-uuid"), {
      params: Promise.resolve({ id: "user-uuid" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("jordan@example.com");
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "jordan@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback"),
      })
    );
  });

  // API-PWD-21: Activity is logged
  it("API-PWD-21: logs password reset to activity table", async () => {
    await POST(makeRequest("user-uuid"), {
      params: Promise.resolve({ id: "user-uuid" }),
    });

    expect(mockInsert).toHaveBeenCalled();
  });

  // API-PWD-22: Non-admin user is rejected
  it("API-PWD-22: returns 403 for non-admin", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const res = await POST(makeRequest("user-uuid"), {
      params: Promise.resolve({ id: "user-uuid" }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Unauthorized");
  });

  // API-PWD-23: User not found
  it("API-PWD-23: returns 404 for unknown user", async () => {
    mockDbSelectResult = [];

    const res = await POST(makeRequest("nonexistent"), {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toContain("not found");
  });

  // API-PWD-24: Supabase reset error
  it("API-PWD-24: returns 500 if Supabase reset fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "Failed to send" },
    });

    const res = await POST(makeRequest("user-uuid"), {
      params: Promise.resolve({ id: "user-uuid" }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
