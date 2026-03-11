---
feature: Report Eval Runner
domain: admin
source: lib/eval/report-eval/runner.ts, lib/eval/report-eval/judge.ts
tests:
  - __tests__/eval/report-eval-runner.test.ts
components: []
personas:
  - internal-developer
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Report Eval Runner

**Source Files**: `lib/eval/report-eval/runner.ts`, `lib/eval/report-eval/judge.ts`
**Depends On**: Report Eval Test Cases (#140), LLM-as-Judge (`lib/eval/judge.ts`), Report Assembler (`lib/agents/report-assembler.ts`)

## Feature: Report Eval Runner

Execute report-level evaluations using LLM-as-judge scoring (1-5) with per-criterion breakdown across 6 dimensions. Mirrors the per-agent eval runner pattern but operates on complete `AssembledReport` objects.

### Scenario: Report judge scores an assembled report against a rubric

Given a report eval test case (e.g. "rtc-01")
And its associated report fixture (e.g. "report-strong-market")
When the report judge is invoked
Then it calls Claude with a report-specific system prompt covering 6 criteria
And returns a `ReportEvalJudgeResponse` with score (1-5), reason, and breakdown (6 fields)

### Scenario: Single test case runs end-to-end

Given test case ID "rtc-01"
When `runSingleReportTestCase("rtc-01")` is called
Then it loads the fixture via `getReportFixture()`
And calls the report judge
And returns a `ReportEvalRunResult` with `judgeScore`, `judgeReason`, `judgeBreakdown`, `durationMs`, `timestamp`, `testCaseId`, `description`, `criterion`, and `report`

### Scenario: Batch runner executes all 18 test cases

Given all 18 report eval test cases
When `runAllReportTestCases()` is called
Then it executes with concurrency control (default 3)
And calls `onProgress` after each completion
And returns 18 `ReportEvalRunResult` objects

### Scenario: Report eval summary aggregates by criterion

Given a set of completed `ReportEvalRunResult` objects
When `buildReportEvalSummary()` is called
Then it produces `passRate`, `avgScore`, `avgBreakdown` (per-dimension averages across all 6 criteria), `byCriterion` (per-criterion pass rate and avg score), `byFixture` (per-fixture pass rate and avg score), and `byTestCase` (per-test-case score and pass/fail)

### Scenario: API endpoint runs a single report eval

Given an admin user
When POST `/api/eval/report/run` with `{ testCaseId: "rtc-01" }`
Then it executes the report eval runner
And returns the `ReportEvalRunResult` fields as JSON (excluding the full `report` to avoid large payloads)
And adds `reportSectionCount` and `reportConfidence` derived from the report metadata

### Scenario: API endpoint lists report test cases

Given an admin user
When GET `/api/eval/report/test-cases`
Then it returns all 18 test cases with fixture names

### Scenario: Judge handles empty/null report gracefully

Given a report fixture with null narratives (e.g. "report-empty-market")
When the judge evaluates it
Then it returns a valid score (not an error)
And the reason explains the null content assessment
