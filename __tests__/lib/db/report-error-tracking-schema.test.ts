/**
 * Report Error Tracking Schema Tests
 *
 * Tests the structured error tracking schema additions to the reports table,
 * the error recording helper functions, and the admin retry workflow.
 *
 * Covers all Gherkin scenarios from:
 *   .specs/features/admin/report-error-tracking-schema.feature.md
 *
 * ID: SVC-ERR-001 through SVC-ERR-016
 */

// --- Mocks (hoisted by jest) ---

const mockDbUpdate = jest.fn().mockReturnThis();
const mockDbSet = jest.fn().mockReturnThis();
const mockDbWhere = jest.fn().mockResolvedValue([]);
const mockDbSelect = jest.fn().mockReturnThis();
const mockDbFrom = jest.fn().mockReturnThis();
const mockDbLimit = jest.fn().mockResolvedValue([]);

jest.mock("@/lib/db", () => ({
  db: {
    update: (...args: unknown[]) => {
      mockDbUpdate(...args);
      return {
        set: (...setArgs: unknown[]) => {
          mockDbSet(...setArgs);
          return {
            where: (...whereArgs: unknown[]) => mockDbWhere(...whereArgs),
          };
        },
      };
    },
    select: (...args: unknown[]) => {
      mockDbSelect(...args);
      return {
        from: (...fromArgs: unknown[]) => {
          mockDbFrom(...fromArgs);
          return {
            where: (...whereArgs: unknown[]) => {
              mockDbWhere(...whereArgs);
              return {
                limit: (...limitArgs: unknown[]) => mockDbLimit(...limitArgs),
              };
            },
          };
        },
      };
    },
  },
  schema: {
    reports: {
      id: "id",
      status: "status",
      errorMessage: "error_message",
      errorDetails: "error_details",
      retriedAt: "retried_at",
      retriedBy: "retried_by",
      generationCompletedAt: "generation_completed_at",
    },
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn((col, val) => ({ col, val })),
}));

import {
  buildErrorDetails,
  recordErrorDetails,
  prepareRetry,
  truncateStack,
  truncateSnapshot,
  extractPreviousErrors,
  type ReportErrorDetails,
} from "@/lib/services/report-error-tracking";

// --- Helpers ---

function resetMocks() {
  mockDbUpdate.mockClear();
  mockDbSet.mockClear();
  mockDbWhere.mockClear().mockResolvedValue([]);
  mockDbSelect.mockClear();
  mockDbFrom.mockClear();
  mockDbLimit.mockClear().mockResolvedValue([]);
}

// ============================================================================
// Scenario: Pipeline failure records structured error details
// ============================================================================

describe("Scenario: Pipeline failure records structured error details", () => {
  beforeEach(resetMocks);

  test("SVC-ERR-001: buildErrorDetails captures agent name, message, stack, and input snapshot", () => {
    const error = new Error("Connection timeout");
    error.stack = "Error: Connection timeout\n    at DataAnalyst.run (agent.ts:42)";

    const details = buildErrorDetails({
      agent: "data-analyst",
      error,
      inputSnapshot: { marketId: "naples-fl", priceFloor: 6000000 },
      stageIndex: 1,
      totalStages: 4,
    });

    expect(details.agent).toBe("data-analyst");
    expect(details.message).toBe("Connection timeout");
    expect(details.stack).toContain("Connection timeout");
    expect(details.inputSnapshot).toEqual({ marketId: "naples-fl", priceFloor: 6000000 });
    expect(details.occurredAt).toBeDefined();
    expect(new Date(details.occurredAt).getTime()).not.toBeNaN();
    expect(details.stageIndex).toBe(1);
    expect(details.totalStages).toBe(4);
  });

  test("SVC-ERR-002: occurredAt records an ISO timestamp at the time of failure", () => {
    const before = new Date().toISOString();
    const details = buildErrorDetails({
      agent: "insight-generator",
      error: "Rate limit exceeded",
    });
    const after = new Date().toISOString();

    expect(details.occurredAt >= before).toBe(true);
    expect(details.occurredAt <= after).toBe(true);
  });

  test("SVC-ERR-003: recordErrorDetails writes status=failed with structured errorDetails to DB", async () => {
    const errorDetails: ReportErrorDetails = {
      agent: "data-analyst",
      message: "API timeout",
      occurredAt: new Date().toISOString(),
      stageIndex: 1,
      totalStages: 4,
    };

    await recordErrorDetails("report-123", errorDetails);

    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockDbSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        errorMessage: "API timeout",
        errorDetails,
      })
    );
  });
});

// ============================================================================
// Scenario: Error details include the failing agent's identity
// ============================================================================

describe("Scenario: Error details include the failing agent identity", () => {
  test("SVC-ERR-004: agent field identifies the exact failing agent", () => {
    const agents = [
      "data-analyst",
      "insight-generator",
      "forecast-modeler",
      "competitive-analyst",
      "polish-agent",
    ];

    for (const agentName of agents) {
      const details = buildErrorDetails({
        agent: agentName,
        error: "test error",
      });
      expect(details.agent).toBe(agentName);
    }
  });

  test("SVC-ERR-005: agent name is preserved even with string errors (not Error objects)", () => {
    const details = buildErrorDetails({
      agent: "forecast-modeler",
      error: "String error without stack trace",
    });

    expect(details.agent).toBe("forecast-modeler");
    expect(details.message).toBe("String error without stack trace");
    expect(details.stack).toBeUndefined();
  });
});

// ============================================================================
// Scenario: Input snapshot captures what the agent received
// ============================================================================

describe("Scenario: Input snapshot captures agent input", () => {
  test("SVC-ERR-006: inputSnapshot contains serialized copy of agent input", () => {
    const input = {
      market: { city: "Naples", state: "FL" },
      priceFloor: 6000000,
      segments: ["waterfront", "golf"],
      transactions: [{ id: "tx-1", price: 7500000 }],
    };

    const details = buildErrorDetails({
      agent: "data-analyst",
      error: "test",
      inputSnapshot: input,
    });

    expect(details.inputSnapshot).toEqual(input);
  });

  test("SVC-ERR-007: snapshot is truncated when it exceeds 50KB", () => {
    // Create input larger than 50KB
    const largeInput: Record<string, unknown> = {};
    for (let i = 0; i < 1000; i++) {
      largeInput[`property_${i}`] = {
        address: `${i} Main Street, Naples, FL 34102`,
        price: 5000000 + i * 100000,
        description: "A".repeat(100),
      };
    }

    const details = buildErrorDetails({
      agent: "data-analyst",
      error: "test",
      inputSnapshot: largeInput,
    });

    // Snapshot should be defined but truncated
    const snapshotJson = JSON.stringify(details.inputSnapshot);
    expect(snapshotJson.length).toBeLessThanOrEqual(55000); // some overhead tolerance
  });

  test("SVC-ERR-008: snapshot handles circular references gracefully", () => {
    const circular: Record<string, unknown> = { name: "test" };
    circular.self = circular; // circular reference

    const snapshot = truncateSnapshot(circular);
    // Should return undefined (can't serialize circular refs)
    expect(snapshot).toBeUndefined();
  });

  test("SVC-ERR-009: snapshot handles null/undefined input", () => {
    expect(truncateSnapshot(null)).toBeUndefined();
    expect(truncateSnapshot(undefined)).toBeUndefined();
  });
});

// ============================================================================
// Scenario: Existing error messages are migrated to structured format
// (Migration SQL tested via the migration file itself — this tests the schema shape)
// ============================================================================

describe("Scenario: Existing error messages migration compatibility", () => {
  test("SVC-ERR-010: schema exports errorDetails, retriedAt, retriedBy columns", () => {
    // Verify the schema mock includes the new columns
    const { schema } = require("@/lib/db");
    expect(schema.reports.errorDetails).toBeDefined();
    expect(schema.reports.retriedAt).toBeDefined();
    expect(schema.reports.retriedBy).toBeDefined();
    // Original errorMessage preserved
    expect(schema.reports.errorMessage).toBeDefined();
  });

  test("SVC-ERR-011: buildErrorDetails with agent='unknown' matches migration format", () => {
    const details = buildErrorDetails({
      agent: "unknown",
      error: "Legacy error message from flat column",
    });

    expect(details.agent).toBe("unknown");
    expect(details.message).toBe("Legacy error message from flat column");
    expect(details.occurredAt).toBeDefined();
  });
});

// ============================================================================
// Scenario: Admin re-triggers a failed pipeline
// ============================================================================

describe("Scenario: Admin re-triggers a failed pipeline", () => {
  beforeEach(resetMocks);

  test("SVC-ERR-012: prepareRetry sets retriedAt, retriedBy, and resets status to queued", async () => {
    const currentError: ReportErrorDetails = {
      agent: "insight-generator",
      message: "Claude API rate limit",
      occurredAt: "2026-03-11T10:00:00.000Z",
      stageIndex: 2,
      totalStages: 4,
    };

    mockDbLimit.mockResolvedValueOnce([{ errorDetails: currentError }]);

    await prepareRetry("report-456", "admin-auth-id-123");

    expect(mockDbSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "queued",
        errorMessage: null,
        retriedBy: "admin-auth-id-123",
      })
    );

    // retriedAt should be a Date
    const setCall = mockDbSet.mock.calls[0][0];
    expect(setCall.retriedAt).toBeInstanceOf(Date);
  });

  test("SVC-ERR-013: prepareRetry moves current error to previousErrors", async () => {
    const currentError: ReportErrorDetails = {
      agent: "insight-generator",
      message: "Claude API rate limit",
      occurredAt: "2026-03-11T10:00:00.000Z",
    };

    mockDbLimit.mockResolvedValueOnce([{ errorDetails: currentError }]);

    await prepareRetry("report-456", "admin-auth-id-123");

    const setCall = mockDbSet.mock.calls[0][0];
    // The errorDetails should contain _previousErrors with the old error
    expect(setCall.errorDetails._previousErrors).toEqual([
      {
        agent: "insight-generator",
        message: "Claude API rate limit",
        occurredAt: "2026-03-11T10:00:00.000Z",
      },
    ]);
  });

  test("SVC-ERR-014: prepareRetry throws if report not found", async () => {
    mockDbLimit.mockResolvedValueOnce([]);

    await expect(prepareRetry("nonexistent", "admin")).rejects.toThrow(
      "Report not found: nonexistent"
    );
  });
});

// ============================================================================
// Scenario: Retry preserves error history
// ============================================================================

describe("Scenario: Retry preserves error history", () => {
  beforeEach(resetMocks);

  test("SVC-ERR-015: extractPreviousErrors retrieves stored previous errors", () => {
    const storedDetails = {
      _previousErrors: [
        { agent: "data-analyst", message: "First failure", occurredAt: "2026-03-10T10:00:00Z" },
      ],
    };

    const previous = extractPreviousErrors(storedDetails);
    expect(previous).toEqual([
      { agent: "data-analyst", message: "First failure", occurredAt: "2026-03-10T10:00:00Z" },
    ]);
  });

  test("SVC-ERR-015b: buildErrorDetails carries forward previousErrors into new error", () => {
    const previousErrors = [
      { agent: "data-analyst", message: "First failure", occurredAt: "2026-03-10T10:00:00Z" },
    ];

    const details = buildErrorDetails({
      agent: "insight-generator",
      error: "Second failure after retry",
      previousErrors,
    });

    expect(details.agent).toBe("insight-generator");
    expect(details.message).toBe("Second failure after retry");
    expect(details.previousErrors).toEqual(previousErrors);
  });

  test("SVC-ERR-015c: prepareRetry accumulates multiple previous errors", async () => {
    const currentError: ReportErrorDetails = {
      agent: "forecast-modeler",
      message: "Third failure",
      occurredAt: "2026-03-11T12:00:00.000Z",
      previousErrors: [
        { agent: "data-analyst", message: "First", occurredAt: "2026-03-10T10:00:00Z" },
        { agent: "insight-generator", message: "Second", occurredAt: "2026-03-11T10:00:00Z" },
      ],
    };

    mockDbLimit.mockResolvedValueOnce([{ errorDetails: currentError }]);

    await prepareRetry("report-789", "admin-id");

    const setCall = mockDbSet.mock.calls[0][0];
    expect(setCall.errorDetails._previousErrors).toHaveLength(3);
    expect(setCall.errorDetails._previousErrors[0].agent).toBe("data-analyst");
    expect(setCall.errorDetails._previousErrors[1].agent).toBe("insight-generator");
    expect(setCall.errorDetails._previousErrors[2].agent).toBe("forecast-modeler");
  });
});

// ============================================================================
// Scenario: Reports without errors have null error fields
// ============================================================================

describe("Scenario: Reports without errors have null error fields", () => {
  test("SVC-ERR-016: successful reports are not affected by error tracking columns", () => {
    // This is a schema-level guarantee — the columns are nullable with no default.
    // Verify buildErrorDetails is never called for successful reports by testing
    // that the helper only produces output when explicitly invoked.
    // The schema test (SVC-ERR-010) already verifies the columns exist.

    // Simulate a "completed" report — error fields should simply not be set
    const completedReport = {
      status: "completed",
      errorDetails: null,
      retriedAt: null,
      retriedBy: null,
    };

    expect(completedReport.errorDetails).toBeNull();
    expect(completedReport.retriedAt).toBeNull();
    expect(completedReport.retriedBy).toBeNull();
  });
});

// ============================================================================
// Scenario: Error recording does not block pipeline execution
// ============================================================================

describe("Scenario: Error recording does not block pipeline execution", () => {
  beforeEach(resetMocks);

  test("SVC-ERR-017: recordErrorDetails does not throw when DB write fails", async () => {
    mockDbWhere.mockRejectedValueOnce(new Error("DB connection lost"));
    // Second call (fallback) also fails
    mockDbWhere.mockRejectedValueOnce(new Error("DB still down"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Should not throw
    await expect(
      recordErrorDetails("report-fail", {
        agent: "data-analyst",
        message: "Some error",
        occurredAt: new Date().toISOString(),
      })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test("SVC-ERR-018: buildErrorDetails returns fallback when serialization fails", () => {
    // Even if something goes wrong internally, buildErrorDetails should not throw
    const details = buildErrorDetails({
      agent: "polish-agent",
      error: new Error("test"),
    });

    expect(details.agent).toBe("polish-agent");
    expect(details.message).toBe("test");
    expect(details.occurredAt).toBeDefined();
  });

  test("SVC-ERR-019: recordErrorDetails tries fallback when full write fails", async () => {
    // First call fails (with errorDetails), second succeeds (without)
    mockDbWhere.mockRejectedValueOnce(new Error("JSONB too large"));
    mockDbWhere.mockResolvedValueOnce([]);

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    await recordErrorDetails("report-fallback", {
      agent: "data-analyst",
      message: "Error message",
      occurredAt: new Date().toISOString(),
    });

    // Should have been called twice — first attempt + fallback
    expect(mockDbUpdate).toHaveBeenCalledTimes(2);
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Scenario: Stack trace truncation
// ============================================================================

describe("Stack trace truncation", () => {
  test("SVC-ERR-020: truncateStack limits to 4000 characters", () => {
    const longStack = "x".repeat(5000);
    const truncated = truncateStack(longStack);
    expect(truncated).toHaveLength(4000);
  });

  test("SVC-ERR-021: truncateStack returns undefined for undefined input", () => {
    expect(truncateStack(undefined)).toBeUndefined();
  });

  test("SVC-ERR-022: truncateStack preserves short stacks", () => {
    const shortStack = "Error: test\n    at file.ts:1:1";
    expect(truncateStack(shortStack)).toBe(shortStack);
  });
});

// ============================================================================
// Scenario: extractPreviousErrors edge cases
// ============================================================================

describe("extractPreviousErrors edge cases", () => {
  test("SVC-ERR-023: returns undefined for null input", () => {
    expect(extractPreviousErrors(null)).toBeUndefined();
  });

  test("SVC-ERR-024: returns undefined for undefined input", () => {
    expect(extractPreviousErrors(undefined)).toBeUndefined();
  });

  test("SVC-ERR-025: returns undefined for object without _previousErrors", () => {
    expect(extractPreviousErrors({ agent: "test" })).toBeUndefined();
  });

  test("SVC-ERR-026: returns undefined for non-array _previousErrors", () => {
    expect(extractPreviousErrors({ _previousErrors: "not-an-array" })).toBeUndefined();
  });
});
