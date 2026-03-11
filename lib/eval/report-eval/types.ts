/**
 * Report Eval Types
 *
 * Type definitions for the report-level evaluation system.
 * Evaluates complete assembled reports (9 sections) against 6 quality criteria.
 * Complements the per-agent eval suite (lib/eval/types.ts).
 */

import type { AssembledReport } from "@/lib/agents/report-assembler";

// --- Criteria ---

export type ReportEvalCriterion =
  | "data-accuracy"
  | "completeness"
  | "narrative-quality"
  | "formatting"
  | "actionability"
  | "persona-alignment";

export const REPORT_EVAL_CRITERIA: ReportEvalCriterion[] = [
  "data-accuracy",
  "completeness",
  "narrative-quality",
  "formatting",
  "actionability",
  "persona-alignment",
];

// --- Test Case ---

export interface ReportEvalTestCase {
  id: string;
  description: string;
  criterion: ReportEvalCriterion;
  fixtureId: string;
  expectedRubric: string;
  requiredSections?: string[];
}

// --- Judge ---

export interface ReportEvalJudgeBreakdown {
  dataAccuracy: number; // 1-5
  completeness: number; // 1-5
  narrativeQuality: number; // 1-5
  formatting: number; // 1-5
  actionability: number; // 1-5
  personaAlignment: number; // 1-5
}

export interface ReportEvalJudgeResponse {
  score: number; // 1-5
  reason: string;
  breakdown: ReportEvalJudgeBreakdown;
}

// --- Run Result ---

export interface ReportEvalRunResult {
  testCaseId: string;
  description: string;
  criterion: ReportEvalCriterion;
  report: AssembledReport;
  judgeScore: number;
  judgeReason: string;
  judgeBreakdown: ReportEvalJudgeBreakdown;
  timestamp: string;
  error?: string;
  durationMs: number;
}

// --- Fixture ---

export interface ReportEvalFixture {
  id: string;
  name: string;
  description: string;
  report: AssembledReport;
  sourceFixtureId: string;
}

// --- Constants ---

export const REPORT_EVAL_PASS_THRESHOLD = 4;
