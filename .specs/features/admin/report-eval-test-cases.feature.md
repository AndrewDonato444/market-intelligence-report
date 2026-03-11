---
feature: Report Eval Test Cases
domain: admin
source: lib/eval/report-eval/types.ts, lib/eval/report-eval/test-cases.ts, lib/eval/report-eval/fixtures.ts
tests:
  - __tests__/eval/report-eval-test-cases.test.ts
  - __tests__/eval/report-eval-fixtures.test.ts
components: []
personas:
  - internal-developer
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Report Eval Test Cases

**Source Files**: `lib/eval/report-eval/types.ts`, `lib/eval/report-eval/test-cases.ts`, `lib/eval/report-eval/fixtures.ts`
**Depends On**: Report Assembler (`lib/agents/report-assembler.ts`), Existing Eval Fixtures (`lib/eval/fixtures.ts`)

## Feature: Report Eval Test Cases

Define evaluation criteria for **complete assembled reports** (the output of `assembleReport()` after all agents have run). Complements the existing per-agent eval suite by evaluating the full 9-section report.

### Six Evaluation Criteria (1-5 each)

| Criterion | What It Measures |
|-----------|-----------------|
| **Data Accuracy** | Numbers in narratives match source analytics. No fabricated metrics. |
| **Completeness** | All 9 sections present. No null narratives where data exists. |
| **Narrative Quality** | Cohesive story across sections. No contradictions. |
| **Formatting** | Correct section ordering (1-9). Valid JSON structure. |
| **Actionability** | Timing is specific. Recommendations reference market data. |
| **Persona Alignment** | Analytical tone. No promotional language. Calibrated uncertainty. |

## Scenario: Report eval types are defined

Given the report eval module exists at `lib/eval/report-eval/types.ts`
When a developer imports the types
Then `ReportEvalCriterion` includes 6 criterion types
And `ReportEvalTestCase` has id, description, criterion, fixtureId, expectedRubric, requiredSections
And `ReportEvalJudgeBreakdown` has all 6 criteria as number fields (1-5)

## Scenario: Report eval test cases are defined

Given the test case registry at `lib/eval/report-eval/test-cases.ts`
When loaded
Then there are at least 18 test cases covering all 6 criteria
And each test case references a valid fixture ID

## Scenario: Report eval fixtures produce assembled reports

Given the fixture factory at `lib/eval/report-eval/fixtures.ts`
When `getReportFixture(fixtureId)` is called
Then it returns an `AssembledReport` built by `assembleReport()` with real fixture data

## Scenario: Strong market fixture has all sections populated

Given fixture "report-strong-market"
When inspected, all 9 sections exist with non-null narrative content

## Scenario: Empty market fixture degrades gracefully

Given fixture "report-empty-market"
When inspected, all 9 sections exist, headline shows 0 properties, confidence is "low"
