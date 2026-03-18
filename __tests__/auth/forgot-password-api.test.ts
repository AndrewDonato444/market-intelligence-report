/**
 * Forgot Password API Tests
 *
 * Tests for POST /api/auth/forgot-password
 *
 * Spec: .specs/features/auth/password-management.feature.md
 *
 * @jest-environment node
 */

export {}; // Module boundary

// --- Supabase mock ---
const mockResetPasswordForEmail = jest.fn();

jest.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      auth: {
        resetPasswordForEmail: (...args: unknown[]) =>
          mockResetPasswordForEmail(...args),
      },
    }),
}));

function makeRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

let POST: (req: Request) => Promise<Response>;

beforeAll(async () => {
  const mod = await import("@/app/api/auth/forgot-password/route");
  POST = mod.POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockResetPasswordForEmail.mockResolvedValue({ error: null });
});

describe("POST /api/auth/forgot-password", () => {
  // API-PWD-01: Valid email submitted
  it("API-PWD-01: sends reset email for valid email", async () => {
    const res = await POST(makeRequest({ email: "jordan@example.com" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("Check your email");
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "jordan@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/auth/callback") })
    );
  });

  // API-PWD-02: Email not found — silent success (no enumeration)
  it("API-PWD-02: returns success even for unknown email", async () => {
    // Supabase returns success even for unknown emails
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const res = await POST(makeRequest({ email: "unknown@example.com" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // API-PWD-03: Missing email field
  it("API-PWD-03: returns 400 for missing email", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("email");
  });

  // API-PWD-04: Invalid email format
  it("API-PWD-04: returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("email");
  });

  // API-PWD-05: Supabase error is handled gracefully
  it("API-PWD-05: still returns 200 if Supabase errors (no leak)", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    });

    const res = await POST(makeRequest({ email: "jordan@example.com" }));
    const data = await res.json();

    // We always return success to prevent email enumeration
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  // API-PWD-06: Email is trimmed and lowercased
  it("API-PWD-06: normalizes email before sending", async () => {
    await POST(makeRequest({ email: "  Jordan@Example.COM  " }));

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "jordan@example.com",
      expect.any(Object)
    );
  });
});
