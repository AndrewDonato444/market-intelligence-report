---
feature: Report Eval Dashboard
domain: admin
source: app/admin/eval/report/page.tsx, components/eval/report-eval-dashboard.tsx
tests:
  - __tests__/eval/report-eval-dashboard.test.ts
components:
  - ReportEvalDashboard
  - ReportEvalSummaryPanel
  - ReportEvalTestCaseTable
  - ReportEvalTestCaseRow
  - ReportEvalCriterionBreakdown
  - ReportEvalFixtureComparison
personas:
  - internal-developer
  - team-leader
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Report Eval Dashboard

**Source Files**: `app/admin/eval/report/page.tsx`, `components/eval/report-eval-dashboard.tsx`
**Design System**: .specs/design-system/tokens.md
**Personas**: Internal developer (primary), Team Leader Innovator (admin ops perspective)
**Depends On**: Report Eval Runner (#141), Report Eval Test Cases (#140)

## Feature: Report Eval Dashboard

Admin UI for running end-to-end report quality evaluations, viewing scores per criterion and per fixture, comparing report quality across different market scenarios, and filtering/sorting results. Mirrors the existing Pipeline Eval Suite (`/admin/eval`) pattern but is purpose-built for report-level evaluations with 6-criterion breakdown and 8 fixtures.

### Scenario: Admin navigates to the report eval dashboard

Given an admin user is authenticated
When they navigate to `/admin/eval/report`
Then they see the Report Eval Dashboard page
And the page title reads "Report Eval Suite"
And a subtitle reads "End-to-end quality scoring — 18 test cases across 6 criteria"
And they see a summary panel, criterion breakdown, and test case table

### Scenario: Summary panel shows aggregate metrics before any runs

Given no report eval results exist in localStorage
When the dashboard loads
Then the summary panel shows:
  - Test Cases: 18
  - Pass Rate: --
  - Avg Score: --
And the "Run All" button is enabled
And the "Export JSON" button is hidden

### Scenario: Admin runs all 18 report eval test cases

Given the admin clicks "Run All"
Then a confirmation dialog asks "This will make ~36 API calls to Claude (18 fixtures + 18 judge calls). Proceed?"
When confirmed, a progress bar appears showing "Running report evaluations... 0 / 18"
And test cases execute with concurrency 3 (matching `MAX_CONCURRENCY`)
And each completed test case updates the progress bar and populates its row score
And when all 18 complete, the batch progress bar disappears
And the summary panel updates with live pass rate and average score

### Scenario: Admin runs a single report eval test case

Given test case "rtc-01" has not been run
When the admin clicks "Run" on that row
Then a spinner appears in the score column for that row
And the API call `POST /api/eval/report/run { testCaseId: "rtc-01" }` is made
And on success, the score (1-5) appears color-coded (green >= 4, amber = 3, red <= 2)
And the result is stored in localStorage under key `report-eval-suite-results`

### Scenario: Admin views the 6-criterion breakdown panel

Given at least one report eval has completed
Then a "By Criterion" panel appears below the summary
And it shows a row for each of the 6 criteria:
  - Data Accuracy
  - Completeness
  - Narrative Quality
  - Formatting
  - Actionability
  - Persona Alignment
Each row displays: criterion name, number of runs, pass rate (%), and average score (1-5)
And each row has a horizontal bar chart showing the average score (out of 5) with color-coding

### Scenario: Admin views the fixture comparison panel

Given at least one report eval has completed
Then a "By Fixture" panel appears below the criterion breakdown
And it shows a row for each of the 8 fixtures:
  - report-strong-market
  - report-empty-market
  - report-low-data
  - report-contradictory
  - report-single-segment
  - report-ultra-luxury
  - report-stale-sources
  - report-partial-upstream
Each row displays: fixture name (human-readable), number of test cases run, pass rate (%), average score
And fixtures are sorted by average score ascending (worst first — surface problems)

### Scenario: Admin expands a test case row to see details

Given test case "rtc-07" has been run and scored 4
When the admin clicks the row
Then it expands to show:
  - Expected Rubric (from the test case definition)
  - Judge Score: 4/5 with color-coded badge (green)
  - 6-dimension breakdown bars (data accuracy, completeness, narrative quality, formatting, actionability, persona alignment) with numeric values
  - Judge Reason (the LLM explanation)
  - Report metadata: section count, confidence level
  - Duration (e.g., "3.2s")
And clicking again collapses the row

### Scenario: Admin filters test cases by criterion

Given the test case table is showing all 18 rows
When the admin selects "Data Accuracy" from the criterion filter dropdown
Then only the 3 data accuracy test cases are visible
And the summary panel updates to reflect only filtered results
And selecting "All Criteria" removes the filter

### Scenario: Admin filters test cases by fixture

Given the test case table is showing all 18 rows
When the admin selects "report-empty-market" from the fixture filter dropdown
Then only test cases using that fixture are visible
And the summary recalculates for the filtered set

### Scenario: Admin sorts test cases by score

Given all 18 test cases have been run
When the admin clicks the "Score" column header
Then rows sort by score ascending (lowest first — surface failures)
And clicking again sorts descending
And the current sort direction is indicated by an arrow icon

### Scenario: Admin exports report eval results

Given at least one report eval has been run
When the admin clicks "Export JSON"
Then a JSON file downloads with filename `report-eval-results-YYYY-MM-DD.json`
And the file contains: `exportedAt`, `results` (array of all run results), and `summary` (total, passing count, pass rate, average score)

### Scenario: Admin cancels a running batch

Given a batch run is in progress (7 of 18 complete)
When the admin clicks "Cancel"
Then in-flight requests are aborted
And results from the 7 completed test cases are preserved
And the progress bar disappears and "Run All" becomes available again

### Scenario: Results persist across page reloads

Given the admin has run 18 test cases
When they navigate away and return to `/admin/eval/report`
Then all 18 results are restored from localStorage
And the summary panel and breakdown panels reflect the stored results

### Scenario: Admin clears stored results

Given stored results exist from a previous run
When the admin clicks "Clear Results"
Then localStorage is cleared for the report eval key
And all scores reset to "--"
And the criterion and fixture breakdown panels disappear

### Scenario: Page handles API errors gracefully

Given the API endpoint `/api/eval/report/test-cases` returns an error
When the dashboard loads
Then an error state displays: "Failed to load report eval suite" with the error message
And no test case table or summary panel is shown

### Scenario: Non-admin user is redirected

Given a non-admin user
When they navigate to `/admin/eval/report`
Then they are redirected to `/dashboard`

## User Journey

1. Admin navigates to `/admin/eval` (existing Pipeline Eval Suite)
2. **Admin clicks "Report Evals" tab or navigates to `/admin/eval/report`** (this feature)
3. Runs all 18 report-level evals to assess end-to-end report quality
4. Reviews criterion breakdown to identify weak dimensions
5. Reviews fixture comparison to identify problematic market scenarios
6. Drills into failing test cases to understand why
7. Exports results for team review or regression tracking (#143)

## UI Mockup

```
┌─ Page Shell (bg: background) ──────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Summary Panel (bg: surface, radius: md, shadow: sm) ────────────────┐  │
│  │  REPORT EVAL SUITE (font: serif, text-xl, weight: semibold)          │  │
│  │  End-to-end quality scoring — 18 test cases across 6 criteria        │  │
│  │  (text: sm, color: text-secondary)                                   │  │
│  │                                                   [Run All] [Export]  │  │
│  │                                                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                           │  │
│  │  │    18    │  │  88.9%   │  │   4.2    │                           │  │
│  │  │Test Cases│  │Pass Rate │  │Avg Score │                           │  │
│  │  └──────────┘  └──────────┘  └──────────┘                           │  │
│  │                                                                      │  │
│  │  ── Progress Bar (only during batch run) ──────────────────────────  │  │
│  │  Running report evaluations... 7 / 18            [Cancel]            │  │
│  │  [████████████░░░░░░░░░░] 39%                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─ By Criterion (bg: surface, radius: md, shadow: sm) ─────────────────┐ │
│  │  BY CRITERION (text: xs, weight: medium, color: text-secondary)      │ │
│  │                                                                      │ │
│  │  Data Accuracy     3 runs  100.0%  ████████████████████ 4.7          │ │
│  │  Completeness      3 runs  100.0%  ██████████████████░░ 4.3          │ │
│  │  Narrative Quality 3 runs   66.7%  ████████████████░░░░ 3.8          │ │
│  │  Formatting        3 runs  100.0%  ████████████████████ 4.8          │ │
│  │  Actionability     3 runs   66.7%  ██████████████░░░░░░ 3.5          │ │
│  │  Persona Alignment 3 runs  100.0%  ████████████████████ 4.5          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ By Fixture (bg: surface, radius: md, shadow: sm) ───────────────────┐ │
│  │  BY FIXTURE (text: xs, weight: medium, color: text-secondary)        │ │
│  │                                                                      │ │
│  │  Low Data Market         3 runs   33.3%  ████████░░░░ 3.2            │ │
│  │  Empty Market            3 runs   66.7%  ██████████░░ 3.7            │ │
│  │  Contradictory Sources   2 runs   50.0%  █████████░░░ 3.5            │ │
│  │  Stale Sources           2 runs  100.0%  ██████████████ 4.3          │ │
│  │  Single Segment          2 runs  100.0%  ██████████████ 4.5          │ │
│  │  Partial Upstream        1 run   100.0%  ██████████████ 4.5          │ │
│  │  Ultra Luxury            2 runs  100.0%  ████████████████ 4.7        │ │
│  │  Strong Market           3 runs  100.0%  ████████████████ 4.8        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌─ Test Case Table (bg: surface, radius: md, shadow: sm) ──────────────┐ │
│  │  Filter: [All Criteria ▾]  [All Fixtures ▾]       [Clear Results]    │ │
│  │                                                                      │ │
│  │  ID     │ Description              │ Criterion   │ Fixture  │Score│  │ │
│  │  ───────┼──────────────────────────┼─────────────┼──────────┼─────│  │ │
│  │  rtc-01 │ Strong market numbers... │ Data Acc.   │ Strong   │ 5   │  │ │
│  │  rtc-02 │ Low-data does not fab... │ Data Acc.   │ Low Data │ 4   │  │ │
│  │  rtc-03 │ Stale sources flagged... │ Data Acc.   │ Stale    │ 5   │  │ │
│  │  rtc-04 │ All 9 sections popul...  │ Complete.   │ Strong   │ 5   │  │ │
│  │  ...                                                                 │ │
│  │                                                                      │ │
│  │  ┌─ Expanded Row (bg: neutral-50) ────────────────────────────────┐  │ │
│  │  │  Expected Rubric          │  Judge Evaluation                  │  │ │
│  │  │  "Themes flow from        │  Score: 4/5 (bg: emerald-50)      │  │ │
│  │  │   briefing to narrative"  │                                    │  │ │
│  │  │                           │  Data Accuracy   ████████████ 4    │  │ │
│  │  │                           │  Completeness    ████████████ 4    │  │ │
│  │  │                           │  Narr. Quality   ██████████░░ 3    │  │ │
│  │  │                           │  Formatting      ████████████ 5    │  │ │
│  │  │                           │  Actionability   ████████████ 4    │  │ │
│  │  │                           │  Persona Align.  ████████████ 4    │  │ │
│  │  │                           │                                    │  │ │
│  │  │                           │  "Themes introduced in executive   │  │ │
│  │  │                           │   briefing carry through to..."    │  │ │
│  │  │                           │                                    │  │ │
│  │  │                           │  Sections: 9 · Confidence: high    │  │ │
│  │  │                           │  Duration: 3.2s                    │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Component References

- Summary panel pattern: mirrors `components/eval/eval-report-summary.tsx`
- Test case table pattern: mirrors `components/eval/eval-test-case-table.tsx`
- Row expand pattern: mirrors `components/eval/eval-test-case-row.tsx`
- Auth gate: `lib/supabase/admin-auth.ts` -> `requireAdmin()`
- API endpoints: `app/api/eval/report/run/route.ts`, `app/api/eval/report/test-cases/route.ts`
- Types: `lib/eval/report-eval/types.ts` -> `ReportEvalRunResult`, `ReportEvalJudgeBreakdown`, `ReportEvalCriterion`
- Runner: `lib/eval/report-eval/runner.ts` -> `buildReportEvalSummary()`

## Implementation Notes

### What already exists (from #140 + #141)
- All 18 test cases with rubrics and 8 fixtures
- Report eval runner with single/batch execution
- Judge scoring with 6-dimension breakdown
- API endpoints for running evals and listing test cases
- `buildReportEvalSummary()` computes aggregate stats by criterion, fixture, and test case

### What this feature adds
- New route: `app/admin/eval/report/page.tsx` (server component with `requireAdmin()`)
- New components in `components/eval/`:
  - `report-eval-dashboard.tsx` -- main client component (mirrors `eval-dashboard.tsx`)
  - `report-eval-summary-panel.tsx` -- top-level metrics (test cases, pass rate, avg score)
  - `report-eval-test-case-table.tsx` -- sortable/filterable table of 18 test cases
  - `report-eval-test-case-row.tsx` -- expandable row with 6-criterion breakdown bars
  - `report-eval-criterion-breakdown.tsx` -- aggregated by-criterion panel
  - `report-eval-fixture-comparison.tsx` -- aggregated by-fixture panel
- localStorage key: `report-eval-suite-results` (separate from agent eval results)
- Criterion filter dropdown and fixture filter dropdown
- "Clear Results" action

### Key differences from agent eval dashboard
- **6-criterion breakdown** in expanded rows (vs agent eval's 4-dimension breakdown)
- **By Criterion panel** -- new panel aggregating scores across the 6 criteria
- **By Fixture panel** -- new panel comparing scores across 8 market scenario fixtures
- **Fixture filter** -- new dropdown to filter by market scenario (agent eval only has agent filter)
- **Report metadata** in expanded rows: section count, confidence level (from `reportSectionCount` and `reportConfidence` in API response)
- Table columns: ID, Description, Criterion (replaces Agent), Fixture (replaces Category), Score, Actions

## Learnings

- The existing agent eval dashboard (`components/eval/eval-dashboard.tsx`) is a proven pattern -- localStorage persistence, batch execution with concurrency control, abort handling, JSON export. Reuse the same architecture.
- The `buildReportEvalSummary()` function from the runner already computes `byCriterion` and `byFixture` breakdowns -- the dashboard should use these rather than re-computing client-side.
- Report eval API responses exclude the full `report` object to avoid large payloads, but include `reportSectionCount` and `reportConfidence` -- these are the metadata to show in expanded rows.

### 2026-03-11 — Implementation
- **Decision**: Client-side aggregation over `buildReportEvalSummary()`. The dashboard already holds all results in a Map, so simple loops to compute byCriterion/byFixture stats are more straightforward than calling the runner's server-side function. The runner function is designed for server-side use and imports test-case utilities that would bloat the client bundle.
- **Decision**: Separate `ReportEvalDashboardResult` interface (not reusing `ReportEvalRunResult`). The API response shape differs — no `report` field, but adds `reportSectionCount` and `reportConfidence`. A dedicated type avoids confusion and type assertion noise.
- **Pattern**: The fixture comparison panel derives fixture IDs from test cases (via `testCaseFixture` lookup map) rather than storing fixture ID on each result. This keeps the API response lean while still enabling fixture-level aggregation on the client.
- **Gotcha**: Floating-point math in bar width calculations — `(4.2 / 5) * 100` is `84.00000000000001`, not `84`. Use `toBeCloseTo()` in tests.
