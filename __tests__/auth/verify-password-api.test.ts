/**
 * Verify Password API Tests
 *
 * Tests for POST /api/auth/verify-password
 *
 * Spec: .specs/features/auth/password-management.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

// --- Supabase mock ---
const mockGetUser = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        getUser: (...args: unknown[]) => mockGetUser(...args),
        signInWithPassword: (...args: unknown[]) =>
          mockSignInWithPassword(...args),
      },
    }),
}));

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/verify-password", {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/auth/verify-password/route");
  POST = mod.POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-uuid", email: "jordan@example.com" } },
    error: null,
  });
  mockSignInWithPassword.mockResolvedValue({
    data: { user: {} },
    error: null,
  });
});

describe("POST /api/auth/verify-password", () => {
  // API-PWD-30: Correct password
  it("API-PWD-30: returns success for correct password", async () => {
    const res = await POST(makeRequest({ password: "correctPassword1" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "jordan@example.com",
      password: "correctPassword1",
    });
  });

  // API-PWD-31: Wrong password
  it("API-PWD-31: returns 401 for wrong password", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    const res = await POST(makeRequest({ password: "wrongPassword" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("incorrect");
  });

  // API-PWD-32: Not authenticated
  it("API-PWD-32: returns 401 if no session", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "No session" },
    });

    const res = await POST(makeRequest({ password: "anyPassword" }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("authenticated");
  });

  // API-PWD-33: Missing password
  it("API-PWD-33: returns 400 for missing password", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
