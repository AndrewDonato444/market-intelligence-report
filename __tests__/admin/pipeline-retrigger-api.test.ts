/**
 * Pipeline Re-trigger API Tests
 *
 * Tests the POST /api/admin/reports/[id]/retry endpoint.
 * Covers all Gherkin scenarios from:
 *   .specs/features/admin/pipeline-re-trigger.feature.md
 *
 * @jest-environment node
 *
 * ID: API-RTR-001 through API-RTR-008
 */

export {};

// --- Mocks (hoisted by jest) ---

const mockRequireAdmin = jest.fn<Promise<string | null>, []>();
jest.mock("@/lib/supabase/admin-auth", () => ({
  requireAdmin: () => mockRequireAdmin(),
}));

let mockDbSelectResult: unknown = [];
let mockDbError = false;

jest.mock("@/lib/db", () => ({
  get db() {
    return {
      select: () => {
        if (mockDbError) throw new Error("DB connection failed");
        const makeChain = (): unknown =>
          new Proxy(
            {},
            {
              get(_, prop) {
                if (String(prop) === "then") {
                  return (resolve: (v: unknown) => void) => resolve(mockDbSelectResult);
                }
                return () => makeChain();
              },
            }
          );
        return makeChain();
      },
    };
  },
  schema: {
    reports: {
      id: "reports.id",
      status: "reports.status",
      title: "reports.title",
      userId: "reports.user_id",
    },
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((col, val) => ({ col, val })),
}));

const mockPrepareRetry = jest.fn<Promise<void>, [string, string]>();
jest.mock("@/lib/services/report-error-tracking", () => ({
  prepareRetry: (reportId: string, adminId: string) =>
    mockPrepareRetry(reportId, adminId),
}));

const mockExecutePipeline = jest.fn<Promise<void>, [string]>();
jest.mock("@/lib/services/pipeline-executor", () => ({
  executePipeline: (reportId: string) => mockExecutePipeline(reportId),
}));

const mockLogActivity = jest.fn();
jest.mock("@/lib/services/activity-log", () => ({
  logActivity: (params: unknown) => mockLogActivity(params),
}));

// Mock next/server after() to execute callback immediately
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return {
    ...actual,
    after: (fn: () => void) => { fn(); },
  };
});

import { POST } from "@/app/api/admin/reports/[id]/retry/route";
import { NextRequest } from "next/server";

// --- Helpers ---

function createRequest(): NextRequest {
  return new NextRequest("http://localhost/api/admin/reports/test-id/retry", {
    method: "POST",
  });
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function resetMocks() {
  mockRequireAdmin.mockReset();
  mockDbSelectResult = [];
  mockDbError = false;
  mockPrepareRetry.mockReset().mockResolvedValue(undefined);
  mockExecutePipeline.mockReset().mockResolvedValue(undefined);
  mockLogActivity.mockReset();
}

// ============================================================================
// Scenario: Retry API requires admin authentication
// ============================================================================

describe("Scenario: Retry API requires admin authentication", () => {
  beforeEach(resetMocks);

  test("API-RTR-001: returns 401 when user is not admin", async () => {
    mockRequireAdmin.mockResolvedValue(null);

    const res = await POST(createRequest(), createParams("report-123"));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });
});

// ============================================================================
// Scenario: Admin triggers full pipeline re-run
// ============================================================================

describe("Scenario: Admin triggers full pipeline re-run", () => {
  beforeEach(resetMocks);

  test("API-RTR-002: returns 200 with retry info for failed report", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [
      {
        id: "report-456",
        status: "failed",
        title: "Naples Q1 Report",
        userId: "user-789",
      },
    ];

    const res = await POST(createRequest(), createParams("report-456"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.reportId).toBe("report-456");
    expect(body.status).toBe("queued");
    expect(body.retriedAt).toBeDefined();
    expect(body.retriedBy).toBe("admin-auth-123");
  });

  test("API-RTR-003: calls prepareRetry with correct report and admin IDs", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [
      {
        id: "report-456",
        status: "failed",
        title: "Test Report",
        userId: "user-789",
      },
    ];

    await POST(createRequest(), createParams("report-456"));

    expect(mockPrepareRetry).toHaveBeenCalledWith("report-456", "admin-auth-123");
  });

  test("API-RTR-004: triggers executePipeline asynchronously", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [
      {
        id: "report-456",
        status: "failed",
        title: "Test Report",
        userId: "user-789",
      },
    ];

    await POST(createRequest(), createParams("report-456"));

    expect(mockExecutePipeline).toHaveBeenCalledWith("report-456");
  });

  test("API-RTR-005: logs activity for the retry action", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [
      {
        id: "report-456",
        status: "failed",
        title: "Naples Q1 Report",
        userId: "user-789",
      },
    ];

    await POST(createRequest(), createParams("report-456"));

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-789",
        action: "pipeline_retried",
        entityType: "report",
        entityId: "report-456",
        metadata: expect.objectContaining({
          title: "Naples Q1 Report",
          retriedBy: "admin-auth-123",
        }),
      })
    );
  });
});

// ============================================================================
// Scenario: Report not found
// ============================================================================

describe("Scenario: Report not found", () => {
  beforeEach(resetMocks);

  test("API-RTR-006: returns 404 for nonexistent report", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [];

    const res = await POST(createRequest(), createParams("nonexistent"));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Report not found");
  });
});

// ============================================================================
// Scenario: Concurrent retry prevention
// ============================================================================

describe("Scenario: Concurrent retry prevention", () => {
  beforeEach(resetMocks);

  test("API-RTR-007: returns 409 for non-failed report (completed)", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [
      {
        id: "report-456",
        status: "completed",
        title: "Test Report",
        userId: "user-789",
      },
    ];

    const res = await POST(createRequest(), createParams("report-456"));

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("not in a retryable state");
    expect(mockPrepareRetry).not.toHaveBeenCalled();
    expect(mockExecutePipeline).not.toHaveBeenCalled();
  });

  test("API-RTR-008: returns 409 for generating report", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [
      {
        id: "report-456",
        status: "generating",
        title: "Test Report",
        userId: "user-789",
      },
    ];

    const res = await POST(createRequest(), createParams("report-456"));

    expect(res.status).toBe(409);
    expect(mockPrepareRetry).not.toHaveBeenCalled();
    expect(mockExecutePipeline).not.toHaveBeenCalled();
  });

  test("API-RTR-008b: returns 409 for queued report", async () => {
    mockRequireAdmin.mockResolvedValue("admin-auth-123");
    mockDbSelectResult = [
      {
        id: "report-456",
        status: "queued",
        title: "Test Report",
        userId: "user-789",
      },
    ];

    const res = await POST(createRequest(), createParams("report-456"));

    expect(res.status).toBe(409);
    expect(mockPrepareRetry).not.toHaveBeenCalled();
    expect(mockExecutePipeline).not.toHaveBeenCalled();
  });
});
