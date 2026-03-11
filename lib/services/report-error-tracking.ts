/**
 * Report Error Tracking Service
 *
 * Provides structured error recording for pipeline failures and admin retry workflows.
 * Replaces flat errorMessage with rich errorDetails JSONB containing agent identity,
 * stack traces, input snapshots, and retry history.
 */

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// --- Types ---

export interface ReportErrorDetails {
  /** Which pipeline agent failed */
  agent: string;
  /** Human-readable error message */
  message: string;
  /** Stack trace (truncated to 4000 chars) */
  stack?: string;
  /** Snapshot of the input data the agent received */
  inputSnapshot?: Record<string, unknown>;
  /** ISO timestamp when the error occurred */
  occurredAt: string;
  /** Pipeline stage number (1-based) */
  stageIndex?: number;
  /** Total number of pipeline stages */
  totalStages?: number;
  /** Previous errors if the pipeline was retried */
  previousErrors?: Array<{
    agent: string;
    message: string;
    occurredAt: string;
  }>;
}

const MAX_STACK_LENGTH = 4000;
const MAX_SNAPSHOT_BYTES = 50_000; // 50KB

// --- Helpers ---

/**
 * Truncates a stack trace to MAX_STACK_LENGTH characters.
 */
export function truncateStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  return stack.length > MAX_STACK_LENGTH
    ? stack.substring(0, MAX_STACK_LENGTH)
    : stack;
}

/**
 * Truncates an input snapshot to fit within MAX_SNAPSHOT_BYTES.
 * Returns undefined if serialization fails (e.g., circular references).
 */
export function truncateSnapshot(
  input: unknown
): Record<string, unknown> | undefined {
  if (input === null || input === undefined) return undefined;
  try {
    const json = JSON.stringify(input);
    if (json.length <= MAX_SNAPSHOT_BYTES) {
      return input as Record<string, unknown>;
    }
    // Too large — take top-level keys until budget exhausted
    if (typeof input === "object" && !Array.isArray(input)) {
      const result: Record<string, unknown> = {};
      let currentSize = 2; // "{}"
      for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        const entryJson = JSON.stringify({ [key]: value });
        if (currentSize + entryJson.length > MAX_SNAPSHOT_BYTES - 100) {
          break;
        }
        result[key] = value;
        currentSize += entryJson.length;
      }
      result._truncated = true;
      return result;
    }
    // Array or primitive — just note it was too large
    return { _truncated: true, _originalType: typeof input, _originalLength: json.length };
  } catch {
    // Circular reference or other serialization failure
    return undefined;
  }
}

/**
 * Builds a ReportErrorDetails object from pipeline failure data.
 * Designed to never throw — returns a minimal fallback if serialization fails.
 */
export function buildErrorDetails(params: {
  agent: string;
  error: Error | string;
  inputSnapshot?: unknown;
  stageIndex?: number;
  totalStages?: number;
  previousErrors?: ReportErrorDetails["previousErrors"];
}): ReportErrorDetails {
  const message =
    params.error instanceof Error ? params.error.message : String(params.error);
  const stack =
    params.error instanceof Error
      ? truncateStack(params.error.stack)
      : undefined;

  try {
    return {
      agent: params.agent,
      message,
      stack,
      inputSnapshot: truncateSnapshot(params.inputSnapshot),
      occurredAt: new Date().toISOString(),
      stageIndex: params.stageIndex,
      totalStages: params.totalStages,
      previousErrors: params.previousErrors,
    };
  } catch {
    // Fallback — just agent + message, never throws
    return {
      agent: params.agent,
      message,
      occurredAt: new Date().toISOString(),
    };
  }
}

/**
 * Records structured error details on a failed report.
 * Also sets errorMessage for backward compatibility.
 * Designed to never throw — logs errors to console.
 */
export async function recordErrorDetails(
  reportId: string,
  errorDetails: ReportErrorDetails
): Promise<void> {
  try {
    await db
      .update(schema.reports)
      .set({
        status: "failed",
        errorMessage: errorDetails.message, // backward compat
        errorDetails,
        generationCompletedAt: new Date(),
      })
      .where(eq(schema.reports.id, reportId));
  } catch (err) {
    console.error(
      `[error-tracking] Failed to record error details for report ${reportId}:`,
      err instanceof Error ? err.message : err
    );
    // Try minimal fallback — just errorMessage + status
    try {
      await db
        .update(schema.reports)
        .set({
          status: "failed",
          errorMessage: errorDetails.message,
          generationCompletedAt: new Date(),
        })
        .where(eq(schema.reports.id, reportId));
    } catch {
      // Completely failed — pipeline status update must not be blocked
      console.error(
        `[error-tracking] Fallback also failed for report ${reportId}`
      );
    }
  }
}

/**
 * Prepares a report for pipeline retry by an admin.
 * Moves current errorDetails to previousErrors history, resets status to queued.
 */
export async function prepareRetry(
  reportId: string,
  adminAuthId: string
): Promise<void> {
  // Fetch current report to get existing errorDetails
  const [report] = await db
    .select({
      errorDetails: schema.reports.errorDetails,
    })
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId))
    .limit(1);

  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }

  // Build previousErrors from current errorDetails
  const currentError = report.errorDetails as ReportErrorDetails | null;
  let previousErrors: ReportErrorDetails["previousErrors"] = [];

  if (currentError) {
    // Carry forward any existing previousErrors
    if (currentError.previousErrors) {
      previousErrors = [...currentError.previousErrors];
    }
    // Add current error to history
    previousErrors.push({
      agent: currentError.agent,
      message: currentError.message,
      occurredAt: currentError.occurredAt,
    });
  }

  // Store previousErrors temporarily in errorDetails so next failure can access them
  // On retry: clear errorDetails, set retriedAt/retriedBy, reset status
  await db
    .update(schema.reports)
    .set({
      status: "queued",
      errorMessage: null,
      errorDetails: previousErrors.length > 0 ? { _previousErrors: previousErrors } as any : null,
      retriedAt: new Date(),
      retriedBy: adminAuthId,
    })
    .where(eq(schema.reports.id, reportId));
}

/**
 * Retrieves pending previousErrors from a report that was retried.
 * Used by the pipeline when recording a new failure after retry.
 */
export function extractPreviousErrors(
  errorDetails: unknown
): ReportErrorDetails["previousErrors"] {
  if (!errorDetails || typeof errorDetails !== "object") return undefined;
  const details = errorDetails as Record<string, unknown>;
  if (Array.isArray(details._previousErrors)) {
    return details._previousErrors as ReportErrorDetails["previousErrors"];
  }
  return undefined;
}
