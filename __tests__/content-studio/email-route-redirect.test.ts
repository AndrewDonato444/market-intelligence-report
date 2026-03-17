/**
 * Email Route Redirect Test
 *
 * Tests that /reports/[id]/emails redirects to /reports/[id]/kit?tab=email
 *
 * Spec: .specs/features/content-studio/unified-content-studio.feature.md
 * Scenario: Legacy email route redirects
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT"); // Next.js redirect throws
  },
  notFound: jest.fn(),
}));

jest.mock("@/lib/supabase/auth", () => ({
  getAuthUserId: () => Promise.resolve("test-user-id"),
}));

jest.mock("@/lib/services/report", () => ({
  getReportWithMarket: () =>
    Promise.resolve({ id: "test-id", status: "completed", title: "Test" }),
}));

jest.mock("@/lib/services/email-campaign", () => ({
  getEmailCampaign: () => Promise.resolve(null),
}));

jest.mock("@/lib/services/entitlement-check", () => ({
  checkEntitlement: () => Promise.resolve({ allowed: true, limit: 5, used: 0, remaining: 5 }),
}));

jest.mock("@/lib/db", () => ({
  get db() { return {}; },
}));

jest.mock("@/lib/services/cache", () => ({}));
jest.mock("@/lib/services/api-usage", () => ({}));
jest.mock("@/lib/config/env", () => ({ env: {} }));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PG-CS-001: Legacy /emails route redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects /reports/[id]/emails to /reports/[id]/kit?tab=email", async () => {
    const { default: EmailCampaignPage } = await import(
      "@/app/(protected)/reports/[id]/emails/page"
    );

    try {
      await EmailCampaignPage({ params: Promise.resolve({ id: "test-id" }) });
    } catch (e: unknown) {
      // redirect() throws NEXT_REDIRECT — expected
      if (e instanceof Error && e.message !== "NEXT_REDIRECT") throw e;
    }

    expect(mockRedirect).toHaveBeenCalledWith("/reports/test-id/kit?tab=email");
  });
});
