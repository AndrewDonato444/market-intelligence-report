/**
 * Eval Suite Types
 *
 * Type definitions for the pipeline evaluation system.
 * Test cases, run results, judge responses, and report summaries.
 */

// --- Test Case ---

export type EvalAgent =
  | "insight-generator"
  | "forecast-modeler"
  | "polish-agent"
  | "full-pipeline";

export type EvalCategory =
  | "narrative-quality"
  | "data-grounding"
  | "schema-compliance"
  | "tone-voice"
  | "edge-case"
  | "cross-section";

export interface EvalTestCase {
  id: string;
  description: string;
  agent: EvalAgent;
  category: EvalCategory;
  fixtureId: string;
  expectedRubric: string;
  schemaCheck?: boolean;
  requiredFields?: string[];
}

// --- Judge ---

export interface JudgeBreakdown {
  dataGrounding: number; // 1–5
  narrativeQuality: number; // 1–5
  schemaCompliance: number; // 1–5
  toneVoice: number; // 1–5
}

export interface JudgeRequest {
  testCaseDescription: string;
  agent: string;
  expectedRubric: string;
  actualResponse: unknown;
  inputFixtureSummary: string;
}

export interface JudgeResponse {
  score: number; // 1–5
  reason: string;
  breakdown: JudgeBreakdown;
}

// --- Run Result ---

export interface EvalRunResult {
  testCaseId: string;
  runIndex: number;
  description: string;
  agent: string;
  response: unknown;
  judgeScore: number;
  judgeReason: string;
  judgeBreakdown: JudgeBreakdown;
  timestamp: string;
  error?: string;
  durationMs: number;
}

// --- Report Summary ---

export interface AgentSummary {
  runs: number;
  passRate: number;
  avgScore: number;
}

export interface CategorySummary {
  runs: number;
  passRate: number;
  avgScore: number;
}

export interface TestCaseSummary {
  testCaseId: string;
  runs: EvalRunResult[];
  avgScore: number;
  minScore: number;
  maxScore: number;
}

export interface EvalReportSummary {
  totalRuns: number;
  passRate: number; // % of runs with score >= 4
  avgScore: number;
  avgBreakdown: JudgeBreakdown;
  byAgent: Record<string, AgentSummary>;
  byCategory: Record<string, CategorySummary>;
  byTestCase: TestCaseSummary[];
}

// --- Constants ---

export const PASS_THRESHOLD = 4;
export const MAX_CONCURRENCY = 3;
