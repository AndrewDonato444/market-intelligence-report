/**
 * Eval Suite — Runner
 *
 * Executes agents against fixtures and produces scored results.
 * Builds AgentContext from fixtures, calls the appropriate agent,
 * optionally validates schema, then scores via LLM-as-judge.
 */

import type { AgentContext, AgentResult } from "@/lib/agents/orchestrator";
import type {
  EvalRunResult,
  EvalReportSummary,
  JudgeBreakdown,
} from "./types";
import { PASS_THRESHOLD, MAX_CONCURRENCY } from "./types";
import { getTestCase, EVAL_TEST_CASES } from "./test-cases";
import { getFixture, summarizeFixture } from "./fixtures";
import { scoreWithJudge } from "./judge";
import { executeInsightGenerator } from "@/lib/agents/insight-generator";
import { executeForecastModeler } from "@/lib/agents/forecast-modeler";
import { executePolishAgent } from "@/lib/agents/polish-agent";

// --- Schema validation ---

export function validateSchema(
  response: unknown,
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  if (response == null || typeof response !== "object") {
    return { valid: false, errors: ["Response is not a valid object"] };
  }

  const errors: string[] = [];
  for (const fieldPath of requiredFields) {
    const parts = fieldPath.split(".");
    let current: unknown = response;
    for (const part of parts) {
      if (current == null || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = (current as Record<string, unknown>)[part];
    }
    if (current === undefined) {
      errors.push(`Missing field: ${fieldPath}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// --- Agent dispatch ---

const AGENT_EXECUTORS: Record<
  string,
  (ctx: AgentContext) => Promise<AgentResult>
> = {
  "insight-generator": executeInsightGenerator,
  "forecast-modeler": executeForecastModeler,
  "polish-agent": executePolishAgent,
};

function buildAgentContext(
  fixture: ReturnType<typeof getFixture>
): AgentContext {
  return {
    reportId: `eval-${fixture.id}`,
    userId: "eval-system",
    market: fixture.market,
    reportConfig: {},
    upstreamResults: fixture.upstreamResults ?? {},
    abortSignal: new AbortController().signal,
    computedAnalytics: fixture.computedAnalytics,
  };
}

// --- Single test case execution ---

export async function runSingleTestCase(
  testCaseId: string
): Promise<EvalRunResult> {
  const start = Date.now();
  const testCase = getTestCase(testCaseId);
  const fixture = getFixture(testCase.fixtureId);
  const context = buildAgentContext(fixture);

  let agentResponse: unknown = null;
  let error: string | undefined;

  // Run the agent
  const executor = AGENT_EXECUTORS[testCase.agent];
  if (!executor) {
    return {
      testCaseId,
      runIndex: 1,
      description: testCase.description,
      agent: testCase.agent,
      response: null,
      judgeScore: 1,
      judgeReason: `Unknown agent: ${testCase.agent}`,
      judgeBreakdown: { dataGrounding: 1, narrativeQuality: 1, schemaCompliance: 1, toneVoice: 1 },
      timestamp: new Date().toISOString(),
      error: `Unknown agent: ${testCase.agent}`,
      durationMs: Date.now() - start,
    };
  }

  try {
    const result = await executor(context);
    // Extract the raw agent output from metadata for schema validation and judging.
    // Each agent wraps its parsed output under a named key in metadata:
    //   insight-generator → metadata.insights
    //   forecast-modeler  → metadata.forecastOutput
    //   polish-agent      → metadata.polishOutput
    const meta = result.metadata as Record<string, unknown>;
    agentResponse =
      meta.insights ?? meta.forecastOutput ?? meta.polishOutput ?? meta;
  } catch (err: unknown) {
    error = (err as Error).message || "Agent execution failed";
    return {
      testCaseId,
      runIndex: 1,
      description: testCase.description,
      agent: testCase.agent,
      response: null,
      judgeScore: 1,
      judgeReason: `Agent failed: ${error}`,
      judgeBreakdown: { dataGrounding: 1, narrativeQuality: 1, schemaCompliance: 1, toneVoice: 1 },
      timestamp: new Date().toISOString(),
      error,
      durationMs: Date.now() - start,
    };
  }

  // Schema pre-check (deterministic, saves judge tokens)
  if (testCase.schemaCheck && testCase.requiredFields) {
    const schemaResult = validateSchema(agentResponse, testCase.requiredFields);
    if (!schemaResult.valid) {
      return {
        testCaseId,
        runIndex: 1,
        description: testCase.description,
        agent: testCase.agent,
        response: agentResponse,
        judgeScore: 1,
        judgeReason: `Schema validation failed: ${schemaResult.errors.join("; ")}`,
        judgeBreakdown: { dataGrounding: 1, narrativeQuality: 1, schemaCompliance: 1, toneVoice: 1 },
        timestamp: new Date().toISOString(),
        error: `Schema validation failed: ${schemaResult.errors.join("; ")}`,
        durationMs: Date.now() - start,
      };
    }
  }

  // Score with LLM judge
  const fixtureSummary = summarizeFixture(fixture);
  const judgeResult = await scoreWithJudge({
    testCaseDescription: testCase.description,
    agent: testCase.agent,
    expectedRubric: testCase.expectedRubric,
    actualResponse: agentResponse,
    inputFixtureSummary: fixtureSummary,
  });

  return {
    testCaseId,
    runIndex: 1,
    description: testCase.description,
    agent: testCase.agent,
    response: agentResponse,
    judgeScore: judgeResult.score,
    judgeReason: judgeResult.reason,
    judgeBreakdown: judgeResult.breakdown,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

// --- Batch execution ---

export async function runAllTestCases(
  opts?: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<EvalRunResult[]> {
  const concurrency = opts?.concurrency ?? MAX_CONCURRENCY;
  const total = EVAL_TEST_CASES.length;
  const results: EvalRunResult[] = [];
  let completed = 0;

  const queue = [...EVAL_TEST_CASES.map((tc) => tc.id)];
  const executing = new Set<Promise<void>>();

  async function runNext(): Promise<void> {
    const id = queue.shift();
    if (!id) return;

    const result = await runSingleTestCase(id);
    results.push(result);
    completed++;
    opts?.onProgress?.(completed, total);
  }

  // Fill initial pool
  while (queue.length > 0 && executing.size < concurrency) {
    const p = runNext().then(() => {
      executing.delete(p);
    });
    executing.add(p);
  }

  // Process remaining
  while (executing.size > 0) {
    await Promise.race(executing);
    while (queue.length > 0 && executing.size < concurrency) {
      const p = runNext().then(() => {
        executing.delete(p);
      });
      executing.add(p);
    }
  }

  return results;
}

// --- Report summary ---

export function buildReportSummary(
  results: EvalRunResult[]
): EvalReportSummary {
  const total = results.length;
  if (total === 0) {
    return {
      totalRuns: 0,
      passRate: 0,
      avgScore: 0,
      avgBreakdown: { dataGrounding: 0, narrativeQuality: 0, schemaCompliance: 0, toneVoice: 0 },
      byAgent: {},
      byCategory: {},
      byTestCase: [],
    };
  }

  const passing = results.filter((r) => r.judgeScore >= PASS_THRESHOLD).length;
  const passRate = Number(((passing / total) * 100).toFixed(1));
  const avgScore = Number((results.reduce((s, r) => s + r.judgeScore, 0) / total).toFixed(1));

  // Average breakdown
  const avgBreakdown: JudgeBreakdown = {
    dataGrounding: avg(results.map((r) => r.judgeBreakdown.dataGrounding)),
    narrativeQuality: avg(results.map((r) => r.judgeBreakdown.narrativeQuality)),
    schemaCompliance: avg(results.map((r) => r.judgeBreakdown.schemaCompliance)),
    toneVoice: avg(results.map((r) => r.judgeBreakdown.toneVoice)),
  };

  // By agent
  const byAgent: EvalReportSummary["byAgent"] = {};
  const agentGroups = groupBy(results, (r) => r.agent);
  for (const [agent, agentResults] of Object.entries(agentGroups)) {
    const agentPassing = agentResults.filter((r) => r.judgeScore >= PASS_THRESHOLD).length;
    byAgent[agent] = {
      runs: agentResults.length,
      passRate: Number(((agentPassing / agentResults.length) * 100).toFixed(1)),
      avgScore: Number((agentResults.reduce((s, r) => s + r.judgeScore, 0) / agentResults.length).toFixed(1)),
    };
  }

  // By category (look up test case to get category)
  const byCategory: EvalReportSummary["byCategory"] = {};
  for (const result of results) {
    try {
      const tc = getTestCase(result.testCaseId);
      if (!byCategory[tc.category]) {
        byCategory[tc.category] = { runs: 0, passRate: 0, avgScore: 0 };
      }
      byCategory[tc.category].runs++;
    } catch {
      // skip if test case not found
    }
  }
  // Calculate stats per category
  for (const category of Object.keys(byCategory)) {
    const catResults = results.filter((r) => {
      try {
        return getTestCase(r.testCaseId).category === category;
      } catch {
        return false;
      }
    });
    const catPassing = catResults.filter((r) => r.judgeScore >= PASS_THRESHOLD).length;
    byCategory[category] = {
      runs: catResults.length,
      passRate: Number(((catPassing / catResults.length) * 100).toFixed(1)),
      avgScore: Number((catResults.reduce((s, r) => s + r.judgeScore, 0) / catResults.length).toFixed(1)),
    };
  }

  // By test case
  const testCaseGroups = groupBy(results, (r) => r.testCaseId);
  const byTestCase = Object.entries(testCaseGroups).map(([tcId, runs]) => ({
    testCaseId: tcId,
    runs,
    avgScore: Number((runs.reduce((s, r) => s + r.judgeScore, 0) / runs.length).toFixed(1)),
    minScore: Math.min(...runs.map((r) => r.judgeScore)),
    maxScore: Math.max(...runs.map((r) => r.judgeScore)),
  }));

  return {
    totalRuns: total,
    passRate,
    avgScore,
    avgBreakdown,
    byAgent,
    byCategory,
    byTestCase,
  };
}

// --- Helpers ---

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}
