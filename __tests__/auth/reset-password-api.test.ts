/**
 * Reset Password API Tests
 *
 * Tests for POST /api/auth/reset-password
 *
 * Spec: .specs/features/auth/password-management.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

// --- Supabase mock ---
const mockUpdateUser = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: (...args: unknown[]) => mockGetUser(...args),
        updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      },
    }),
}));

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/auth/reset-password/route");
  POST = mod.POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-uuid", email: "jordan@example.com" } },
    error: null,
  });
  mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });
});

describe("POST /api/auth/reset-password", () => {
  // API-PWD-10: Valid password reset
  it("API-PWD-10: updates password for authenticated user", async () => {
    const res = await POST(makeRequest({ password: "newSecure123!" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newSecure123!" });
  });

  // API-PWD-11: No session (expired/invalid link)
  it("API-PWD-11: returns 401 if user has no session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No session" } });

    const res = await POST(makeRequest({ password: "newSecure123!" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("expired");
  });

  // API-PWD-12: Password too short
  it("API-PWD-12: returns 400 for password under 8 characters", async () => {
    const res = await POST(makeRequest({ password: "short" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("8");
  });

  // API-PWD-13: Missing password field
  it("API-PWD-13: returns 400 for missing password", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  // API-PWD-14: Supabase updateUser fails
  it("API-PWD-14: returns 500 if updateUser fails", async () => {
    mockUpdateUser.mockResolvedValue({
      data: null,
      error: { message: "Password update failed" },
    });

    const res = await POST(makeRequest({ password: "newSecure123!" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
