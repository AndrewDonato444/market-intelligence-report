/**
 * Stale Report Reaping Tests
 *
 * Regression: Reports stuck in "generating" after Vercel function timeout
 * are never cleaned up because:
 *   1. reapStaleReports() was only called from user-facing reports page
 *   2. reapStaleReports() used createdAt instead of generationStartedAt,
 *      causing retried reports to be immediately reaped
 *
 * ID: SVC-REAP-001 through SVC-REAP-005
 *
 * @jest-environment node
 */

export {}; // module boundary

// --- Mock setup ---

const mockUpdate = jest.fn();
const mockSet = jest.fn();
const mockWhere = jest.fn();

jest.mock("@/lib/db", () => {
  const dbObj = {
    update: (...args: unknown[]) => {
      mockUpdate(...args);
      return { set: (...sArgs: unknown[]) => { mockSet(...sArgs); return { where: (...wArgs: unknown[]) => { mockWhere(...wArgs); return Promise.resolve([]); } }; } };
    },
  };
  return {
    db: dbObj,
    schema: {
      reports: {
        id: "reports.id",
        status: "reports.status",
        createdAt: "reports.created_at",
        generationStartedAt: "reports.generation_started_at",
        updatedAt: "reports.updated_at",
        errorMessage: "reports.error_message",
      },
    },
  };
});

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((...args: unknown[]) => ({ _type: "eq", args })),
  and: jest.fn((...args: unknown[]) => ({ _type: "and", args })),
  or: jest.fn((...args: unknown[]) => ({ _type: "or", args })),
  lt: jest.fn((...args: unknown[]) => ({ _type: "lt", args })),
}));

jest.mock("@/lib/services/report-history", () => ({
  recordSectionEdit: jest.fn(),
}));

jest.mock("@/lib/services/buyer-personas", () => ({
  setReportPersonas: jest.fn(),
}));

jest.mock("@/lib/services/report-validation", () => ({
  validateReportConfig: jest.fn(),
  REPORT_SECTIONS: [],
  REQUIRED_SECTIONS: [],
}));

import { lt } from "drizzle-orm";

describe("reapStaleReports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("SVC-REAP-001: Regression — uses generationStartedAt (not createdAt) for staleness check", async () => {
    const { reapStaleReports } = await import("@/lib/services/report");

    await reapStaleReports();

    // lt() should be called with the generationStartedAt column, NOT createdAt
    expect(lt).toHaveBeenCalled();
    const ltCall = (lt as jest.Mock).mock.calls[0];
    // The first argument should reference generationStartedAt
    expect(ltCall[0]).toBe("reports.generation_started_at");
  });

  it("SVC-REAP-002: sets status to failed with timeout error message", async () => {
    const { reapStaleReports } = await import("@/lib/services/report");

    await reapStaleReports();

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errorMessage: expect.stringContaining("timed out"),
      })
    );
  });
});
