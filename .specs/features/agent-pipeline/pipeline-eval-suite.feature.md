---
feature: Pipeline Evaluation Suite
domain: agent-pipeline
source: app/admin/eval/page.tsx, components/eval/eval-dashboard.tsx, app/api/eval/run/route.ts, app/api/eval/test-cases/route.ts, lib/eval/runner.ts, lib/eval/judge.ts, lib/eval/test-cases.ts, lib/eval/fixtures.ts, lib/eval/types.ts
tests:
  - __tests__/eval/eval-runner.test.ts
  - __tests__/eval/eval-judge.test.ts
  - __tests__/eval/eval-fixtures.test.ts
components:
  - EvalDashboard
  - EvalTestCaseTable
  - EvalTestCaseRow
  - EvalReportSummary
personas:
  - internal-developer
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Pipeline Evaluation Suite

**Source Files**: `app/admin/eval/page.tsx`, `components/eval/eval-dashboard.tsx`, `app/api/eval/run/route.ts`, `app/api/eval/test-cases/route.ts`, `lib/eval/runner.ts`, `lib/eval/judge.ts`, `lib/eval/test-cases.ts`, `lib/eval/fixtures.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Admin Auth (`lib/supabase/admin-auth.ts`), Insight Generator (`lib/agents/insight-generator.ts`), Forecast Modeler (`lib/agents/forecast-modeler.ts`), Polish Agent (`lib/agents/polish-agent.ts`), JSON Utils (`lib/utils/json.ts`)

---

## Feature: Pipeline Evaluation Suite

An evaluation dashboard at `/admin/eval` (admin-only, requires `role = 'admin'`) that tests the 3-agent report pipeline against a curated set of ~24 test cases. Each test case provides a market data fixture (ComputedAnalytics) and evaluates the output of one or more agents against expected quality criteria. The system runs each agent with the fixture data and uses an LLM-as-judge (Sonnet 4.6) to score how well the agent's output meets the expected rubric. Results show the score prominently in each row with optional expand for details.

Unlike the agentic chat eval (which tests question→answer accuracy), this eval tests:
- **Narrative quality**: Does the agent produce strategic, insight-driven text?
- **Data grounding**: Does the narrative reference specific numbers from the input data?
- **Schema compliance**: Does the JSON output match the required structure?
- **Tone/voice**: Does the output match the persona-appropriate tone?
- **Edge-case handling**: How does the agent behave with low/missing data?
- **Cross-section consistency**: Does the polish agent catch contradictions?

---

## Scenario: View evaluation test cases list

Given the user navigates to `/admin/eval`
When the page loads
Then they see a list of ~24 test cases
And each row shows: description, agent (insight-generator | forecast-modeler | polish-agent | full-pipeline), category, score (or —), Run button
And they see a summary header with total test cases, pass rate, avg score

## Scenario: Run a single test case

Given the user is on the admin eval page
And a test case exists (e.g. "Insight Generator — strong market, high confidence")
When they click "Run" for that test case
Then the system sends the fixture data to the target agent
And the agent's JSON response is displayed
And the LLM judge compares the response to the expected rubric
And the score (1–5) is shown prominently in the Score column
And they can expand to see judge reasoning and full response

## Scenario: Run all test cases

Given the user is on the admin eval page
When they click "Run All"
Then the system clears previous stats and runs each of the ~24 test cases once in parallel (with concurrency limit to avoid rate limits)
And progress is shown (e.g. "Completed 7/24...")
And each case updates with its result as it completes
And the user can cancel mid-run (immediately clears UI, stops new work; in-flight requests complete in background but results are discarded)
And a summary report is generated when done

## Scenario: LLM-as-judge scoring

Given the agent returns a JSON response
And the test case has an expected rubric (key facts, quality criteria, or reference output)
When the judge evaluates
Then the judge receives: test case description, agent name, expected rubric, actual JSON response, and the input fixture data
And the judge returns a structured score: `{ score: 1–5, reason: string, breakdown: { dataGrounding: 1-5, narrativeQuality: 1-5, schemaCompliance: 1-5, toneVoice: 1-5 } }`
And score 1 = poor match, 5 = excellent match
And the reason explains what was correct or incorrect
And the breakdown scores each dimension independently

## Scenario: View evaluation report

Given runs have been executed
When the user views the report section
Then the Report Summary is at the top with "Pass = score 4 or 5" clearly stated
And they see aggregate metrics: pass rate, avg score, total runs
And they see a table: description | agent | category | score | actions
And the score is visible at a glance for each test case
And rows are collapsed by default; they can expand a row to see details
And Description, Agent, Category, and Score columns are sortable (click header to sort)
And the report persists for the session (or can be exported)

## Scenario: Expanded row shows clearly labeled sections

Given a test case has been run and the row is expanded
When the user views the expanded content
Then they see three labeled sections: **Expected Rubric**, **Judge Evaluation**, **Agent Response**
And the Expected Rubric section shows what the judge was looking for (left column)
And the Judge Evaluation section shows the judge's score (1–5), breakdown dimension bars, reasoning, and duration (right column)
And the Agent Response section shows the agent's full JSON output (full width below)

## Scenario: Export report

Given a report has been generated
When the user clicks "Export"
Then they can download a JSON file with: test case, agent, category, expected rubric, score, breakdown scores, judge reasons
And the export includes timestamps for each run

## Scenario: Loading and error states

Given the user triggers a run (single or batch)
When the system is processing
Then they see a loading indicator (spinner or progress bar)
And if the agent API fails, they see an error for that run with retry option
And if the judge API fails, they see "Judge error" with the raw response still visible
And partial results are preserved (don't lose completed runs on one failure)

## Scenario: Test case configuration

Given the admin eval page loads
When test cases are fetched
Then they come from a TypeScript module (`lib/eval/test-cases.ts`)
And each test case has: `id`, `description`, `agent`, `category`, `fixtureId`, `expectedRubric`
And categories are: "narrative-quality", "data-grounding", "schema-compliance", "tone-voice", "edge-case", "cross-section"

## Scenario: Deterministic pre-checks before judge

Given a test case has `schemaCheck: true`
When the agent returns its response
Then the runner validates JSON schema compliance **before** calling the judge
And if the response is not valid JSON, the run fails immediately with score 1 and a clear reason
And if required fields are missing, the run fails immediately with score 1
This prevents wasting judge tokens on structurally broken responses

---

## Data Model

### Test Case (input)

```typescript
{
  id: string;                    // e.g. "tc-01"
  description: string;           // e.g. "Insight Generator — strong market, high confidence"
  agent: "insight-generator" | "forecast-modeler" | "polish-agent" | "full-pipeline";
  category: "narrative-quality" | "data-grounding" | "schema-compliance" | "tone-voice" | "edge-case" | "cross-section";
  fixtureId: string;             // references a ComputedAnalytics fixture
  expectedRubric: string;        // Natural language rubric for the judge
  schemaCheck?: boolean;         // If true, validate JSON structure before judging
  requiredFields?: string[];     // JSON paths that must exist in response
}
```

### Market Data Fixture

```typescript
{
  id: string;                    // e.g. "fixture-strong-market"
  name: string;                  // e.g. "Palm Beach Strong Market"
  description: string;           // What this fixture tests
  market: MarketData;            // Market definition (name, geography, tier, etc.)
  computedAnalytics: ComputedAnalytics;  // Pre-computed analytics input
  upstreamResults?: Record<string, AgentResult>;  // For polish-agent (needs upstream)
}
```

### Run Result

```typescript
{
  testCaseId: string;
  runIndex: number;              // 1 (one-off runs)
  description: string;
  agent: string;
  response: unknown;             // The agent's full JSON output
  judgeScore: number;            // 1–5
  judgeReason: string;
  judgeBreakdown: {
    dataGrounding: number;       // 1–5: Does narrative reference input numbers?
    narrativeQuality: number;    // 1–5: Is it strategic, not generic?
    schemaCompliance: number;    // 1–5: Does JSON match expected structure?
    toneVoice: number;           // 1–5: Appropriate for luxury audience?
  };
  timestamp: string;             // ISO
  error?: string;                // If agent or judge failed
  durationMs: number;            // Agent execution time
}
```

### Report Summary

```typescript
{
  totalRuns: number;
  passRate: number;              // % of runs with score >= 4
  avgScore: number;
  avgBreakdown: {
    dataGrounding: number;
    narrativeQuality: number;
    schemaCompliance: number;
    toneVoice: number;
  };
  byAgent: Record<string, {     // Grouped by agent name
    runs: number;
    passRate: number;
    avgScore: number;
  }>;
  byCategory: Record<string, {  // Grouped by category
    runs: number;
    passRate: number;
    avgScore: number;
  }>;
  byTestCase: Array<{
    testCaseId: string;
    runs: RunResult[];
    avgScore: number;
    minScore: number;
    maxScore: number;
  }>;
}
```

---

## API Design

### GET /api/eval/test-cases

Returns all test cases and fixture names. Requires admin auth (`requireAdmin()`); returns 403 for non-admins.

### POST /api/eval/run

Runs a single test case or all test cases. Requires admin auth (`requireAdmin()`); returns 403 for non-admins.

**Request:**
```json
{ "testCaseId": "tc-01" }
```
or
```json
{ "runAll": true }
```

The runner internally:
1. Builds `AgentContext` from the fixture
2. Dispatches to the appropriate agent executor
3. Unwraps metadata (each agent stores raw output under a named key: `metadata.insights`, `metadata.forecastOutput`, or `metadata.polishOutput`)
4. Strips JSON markdown fences from LLM responses via `stripJsonFences()` before parsing
5. Runs deterministic schema pre-check if `schemaCheck: true`
6. Calls `scoreWithJudge()` internally (no separate judge API route)

### Judge (internal to runner, not a separate route)

The judge is called via `scoreWithJudge()` in `lib/eval/judge.ts`. It uses the Anthropic API with **Sonnet 4.6** (`claude-sonnet-4-6`) as the judge model.

**Judge input:**
```typescript
{
  testCaseDescription: string;
  agent: string;
  expectedRubric: string;
  actualResponse: unknown;
  inputFixtureSummary: string;
}
```

**Judge output:**
```json
{
  "score": 4,
  "reason": "Strong narrative with specific data references...",
  "breakdown": {
    "dataGrounding": 4,
    "narrativeQuality": 5,
    "schemaCompliance": 5,
    "toneVoice": 4
  }
}
```

---

## UI Mockup

### Default State (Eval Dashboard)

```
┌─────────────────────────────────────────────────────────┐
│  Market Intelligence                                     │
│                                                          │
│  │ Insights               (text-xs, color-text-secondary)│
│  │ Pipeline Eval Suite    (text-xl, color-text)          │
│                                                          │
│  ┌─ Summary bar (bg: surface, radius-sm, padding) ─────┐│
│  │  Report Summary                                      ││
│  │  Pass = score 4 or 5                                 ││
│  │  Test Cases: 24   Pass Rate: —   Avg Score: —        ││
│  │  [Run All][Export]                                   ││
│  │  (buttons: primary-cta for Run All, secondary for    ││
│  │   Export)                                            ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ Test cases table ───────────────────────────────────┐│
│  │ Description       │ Agent    │ Category │ Sc │Actions││
│  ├───────────────────┼──────────┼──────────┼────┼───────┤│
│  │ Strong market,    │ insight  │ narr-q   │ —  │[Run]▼ ││
│  │ high confidence   │ -gen     │          │    │       ││
│  │ Low data, 5 props │ insight  │ edge     │ —  │[Run]▼ ││
│  │                   │ -gen     │          │    │       ││
│  │ Base/bull/bear    │ forecast │ narr-q   │ —  │[Run]  ││
│  │ scenario quality  │ -modeler │          │    │       ││
│  │ ...               │          │          │    │       ││
│  │ (~24 rows)        │          │          │    │       ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### After Running (Expanded Row)

```
┌─────────────────────────────────────────────────────────┐
│  ┌─ Test case row (expanded) ──────────────────────────┐│
│  │                                                      ││
│  │  ┌─ Left Column ──────┐ ┌─ Right Column ──────────┐ ││
│  │  │ Expected Rubric     │ │ Judge Evaluation        │ ││
│  │  │ "Reference $3.5M   │ │ Score: 4   (badge)      │ ││
│  │  │  median, identify  │ │                          │ ││
│  │  │  waterfront..."    │ │ Data Grounding    ███░ 4 │ ││
│  │  │                    │ │ Narrative Quality ████ 5 │ ││
│  │  │                    │ │ Schema Compliance ████ 5 │ ││
│  │  │                    │ │ Tone/Voice        ███░ 4 │ ││
│  │  │                    │ │                          │ ││
│  │  │                    │ │ Reason: "Strong..."      │ ││
│  │  │                    │ │ Duration: 2.3s           │ ││
│  │  └────────────────────┘ └──────────────────────────┘ ││
│  │                                                      ││
│  │  Agent Response (full width)                         ││
│  │  { "overview": { "narrative": "The Palm Beach..." }, ││
│  │    "themes": [...], "executiveSummary": {...} }       ││
│  │                                                      ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Running State (Progress)

```
┌─────────────────────────────────────────────────────────┐
│  ┌─ Progress overlay ──────────────────────────────────┐│
│  │  Completed 7 / 24                                    ││
│  │  ██████████░░░░░░░░░░░░░░░░░░░░  29%                ││
│  │  [Cancel]                                            ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Report Summary (After Run)

```
┌─────────────────────────────────────────────────────────┐
│  ┌─ Report summary (bg: surface, radius-sm) ───────────┐│
│  │  Total Runs: 24   Pass Rate: 83%   Avg Score: 4.1   ││
│  │                                                      ││
│  │  By Agent:                                           ││
│  │  ├─ insight-generator:  avg 4.3  (9/10 pass)        ││
│  │  ├─ forecast-modeler:   avg 3.8  (6/8 pass)         ││
│  │  └─ polish-agent:       avg 4.2  (5/6 pass)         ││
│  │                                                      ││
│  │  By Category:                                        ││
│  │  ├─ narrative-quality:  avg 4.4                      ││
│  │  ├─ data-grounding:     avg 4.0                      ││
│  │  ├─ schema-compliance:  avg 4.8                      ││
│  │  ├─ tone-voice:         avg 4.1                      ││
│  │  ├─ edge-case:          avg 3.2                      ││
│  │  └─ cross-section:      avg 4.0                      ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Error State (Single Run Failed)

```
┌─────────────────────────────────────────────────────────┐
│  ┌─ Run error (border: error, bg: error-light) ────────┐│
│  │  Run failed: Anthropic API rate limit exceeded       ││
│  │  [Retry]                                             ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Sample Test Cases (~24 examples)

The eval suite covers all three agents across multiple market conditions and quality dimensions.

### Insight Generator (10 cases)

| # | Description | Category | Expected Rubric (key criteria) | Fixture |
|---|-------------|----------|-------------------------------|---------|
| 1 | Strong market, high confidence | narrative-quality | Narrative weaves segment data into strategic story; references median price, YoY changes; identifies 3-5 themes; buyer/seller timing is actionable | fixture-strong-market |
| 2 | Low data — only 5 properties | edge-case | Honest caveats about insufficient data; does NOT fabricate specific trends; uses 0-1 themes; confidence language appropriate | fixture-low-data |
| 3 | Data grounding — all numbers referenced | data-grounding | Narrative must reference: median price, total properties, YoY median change, at least 2 segment names with their metrics | fixture-strong-market |
| 4 | Schema compliance — valid JSON structure | schema-compliance | Output has overview.narrative, overview.highlights (array), overview.recommendations (array), themes (array of objects), executiveSummary with timing.buyers and timing.sellers | fixture-strong-market |
| 5 | Tone check — no promotional language | tone-voice | No words like "exciting," "amazing," "incredible," "opportunity of a lifetime"; tone is analytical and authoritative; reads like a Goldman Sachs research note, not a Zillow listing | fixture-strong-market |
| 6 | Single-segment market | edge-case | Handles market with only one segment gracefully; still produces themes from limited data; doesn't reference nonexistent segments | fixture-single-segment |
| 7 | Zero YoY data available | edge-case | Handles null YoY fields; doesn't fabricate trend data; notes that historical comparison is unavailable | fixture-no-yoy |
| 8 | Stale data sources flagged | data-grounding | Narrative mentions stale data sources from confidence metadata; doesn't present stale data with same authority as fresh data | fixture-stale-sources |
| 9 | Ultra-luxury tier ($10M+) | narrative-quality | Vocabulary appropriate for ultra-luxury segment; references are scaled correctly (not "$3.5M" for a $15M+ market); segment names match tier | fixture-ultra-luxury |
| 10 | Mixed confidence across segments | narrative-quality | Differentiates confidence levels per segment; high-confidence segments get specific projections, low-confidence segments get caveated language | fixture-mixed-confidence |

### Forecast Modeler (8 cases)

| # | Description | Category | Expected Rubric (key criteria) | Fixture |
|---|-------------|----------|-------------------------------|---------|
| 11 | Base/bull/bear scenario quality | narrative-quality | Three distinct scenarios with different assumptions; base is most likely; bull and bear are plausible not extreme; each has 2-3 specific assumptions | fixture-strong-market |
| 12 | Range widening for 12-month vs 6-month | data-grounding | 12-month priceRange is wider than 6-month priceRange for every segment; 12-month confidence is equal or lower than 6-month | fixture-strong-market |
| 13 | Low confidence — wide ranges | edge-case | All projections use "low" confidence; ranges are very wide (>20% spread); no specific point estimates presented as reliable; explicit caveats | fixture-low-data |
| 14 | Schema compliance — projections structure | schema-compliance | Each projection has segment, sixMonth.medianPrice, sixMonth.priceRange.low/high, sixMonth.confidence, twelveMonth (same structure); scenarios has base/bull/bear each with narrative, assumptions, medianPriceChange, volumeChange | fixture-strong-market |
| 15 | No certainty language | tone-voice | No "will," "guaranteed," "certain," "definitely," "always"; uses "likely," "projected," "estimated," "our base case suggests" | fixture-strong-market |
| 16 | Projections grounded in YoY data | data-grounding | Base case medianPriceChange is within reasonable range of observed YoY (not 3x or 0.1x the trend); assumptions reference actual market conditions from input | fixture-strong-market |
| 17 | Monitoring areas are specific | narrative-quality | 3-5 monitoring areas that reference actual market dynamics (not generic "watch the economy"); at least 2 reference specific segments or metrics from input | fixture-strong-market |
| 18 | Zero properties — graceful degradation | edge-case | Does not produce specific price projections; narrative explains insufficient data; still provides general monitoring framework | fixture-empty-market |

### Polish Agent (6 cases)

| # | Description | Category | Expected Rubric (key criteria) | Fixture |
|---|-------------|----------|-------------------------------|---------|
| 19 | Pull quotes are data-backed, <30 words | tone-voice | 3-5 pull quotes; each under 30 words; each contains at least one specific number or metric; none are generic/promotional | fixture-strong-market + upstream |
| 20 | Contradiction detection — growth vs decline | cross-section | When upstream insight-generator says "strong growth" but forecast-modeler projects negative volume, the contradictions array is non-empty and identifies the specific discrepancy | fixture-contradictory-upstream |
| 21 | Methodology transparency | data-grounding | Methodology narrative mentions data sources by name; includes confidence level and sample size; does not overstate accuracy; mentions that projections are model-generated estimates | fixture-strong-market + upstream |
| 22 | Does not alter upstream data | cross-section | Polished narratives do not change specific numbers from upstream sections; if upstream says "$3.5M median," polished version still says "$3.5M median" (not rounded to "$3.5M" → "$4M") | fixture-strong-market + upstream |
| 23 | Missing forecast-modeler — graceful handling | edge-case | When forecast-modeler results are absent, polish agent works with available sections; missingSections is noted; no references to nonexistent forecast content | fixture-strong-market + partial-upstream |
| 24 | Consistency notes are substantive | cross-section | Consistency notes identify specific terminology alignment or misalignment; not just "everything looks good"; references actual section content | fixture-strong-market + upstream |

---

## What the Eval Suite Checks

The eval suite uses **three mechanisms**:

1. **Deterministic pre-checks** (before judge): When `schemaCheck: true`, the runner validates JSON structure before spending judge tokens. Missing required fields or invalid JSON = immediate score 1.

2. **LLM Judge** (primary): The judge receives the full agent response, the input fixture summary, and the expected rubric — and scores 1–5 with a 4-dimension breakdown. It evaluates:
   - **Data Grounding**: Does the narrative reference specific numbers from the input?
   - **Narrative Quality**: Is it strategic and insightful, or generic and restated?
   - **Schema Compliance**: Does the JSON structure match expectations?
   - **Tone/Voice**: Appropriate for luxury market intelligence audience?

3. **Cross-run comparisons** (report level): The summary report groups scores by agent and category, revealing systematic weaknesses (e.g., "forecast-modeler consistently scores low on tone-voice").

### Judge Edge-Case Guidance

The judge (LLM) receives instructions to handle:

- **Approximate numbers**: If input says median is $3,500,000 and narrative says "$3.5M", that's correct — don't penalize rounding for readability.
- **Segment naming**: Agent may use slightly different segment names than the raw data (e.g., "Waterfront" vs "waterfront_properties") — evaluate semantic match, not string match.
- **Theme interpretation**: Multiple valid thematic interpretations exist for the same data. Judge should evaluate whether themes are data-grounded and strategic, not whether they match a specific list.
- **Low data caveats**: When fixture has low confidence, the judge should reward honest caveats and penalize false confidence.
- **Promotional language**: Any use of words like "exciting," "incredible," "amazing," "premier destination" should reduce the tone-voice score.

---

## Market Data Fixtures

Fixtures are pre-built ComputedAnalytics objects stored in `lib/eval/fixtures.ts`:

| Fixture ID | Description | Key Characteristics |
|---|---|---|
| fixture-strong-market | Palm Beach, FL — healthy luxury market | 847 properties, $3.5M median, 8.2% YoY, high confidence, 5 segments |
| fixture-low-data | Small Town, MT — barely any listings | 5 properties, $1.2M median, null YoY, low confidence, 1 segment |
| fixture-single-segment | Aspen, CO — one dominant segment | 120 properties, $8M median, all waterfront, high confidence |
| fixture-no-yoy | New Market, AZ — no historical data | 200 properties, $2.1M median, all YoY fields null, medium confidence |
| fixture-stale-sources | Miami Beach, FL — some data outdated | 500 properties, high confidence but 2 stale data sources flagged |
| fixture-ultra-luxury | Beverly Hills, CA — ultra tier | 89 properties, $15M median, ultra_luxury tier, high confidence |
| fixture-mixed-confidence | Hamptons, NY — uneven data | 300 properties, some segments high confidence, some low |
| fixture-empty-market | Ghost Town, NV — no properties | 0 properties, all metrics zero, low confidence |
| fixture-contradictory-upstream | Test fixture with deliberately conflicting upstream agent results | Strong growth narrative from insight-gen + negative volume forecast |
| fixture-strong-market-upstream | Full upstream results for polish agent | Complete insight-generator + forecast-modeler results for Palm Beach |
| fixture-partial-upstream | Missing forecast-modeler results | Only insight-generator results provided |

---

## Resolved Questions

- [x] Store test cases in JSON file vs TypeScript module? → **TypeScript module** (`lib/eval/test-cases.ts`) for type safety
- [x] Persist report to localStorage or session only? → **Session only** (React state in EvalDashboard)
- [x] Judge model: Haiku 4.5 (cheaper) or Sonnet 4.6 (same as agents)? → **Sonnet 4.6** (`claude-sonnet-4-6`) for better evaluation quality
- [x] Score threshold for "pass" (4? 3.5?)? → **4** (defined as `PASS_THRESHOLD` in `lib/eval/types.ts`)
- [x] Concurrency limit (3) for Run All to avoid API rate limits → **3** (defined as `MAX_CONCURRENCY` in `lib/eval/types.ts`)
- [x] Should rubrics be strict text or flexible key-facts? → **Flexible natural language rubrics** (string in test case)
- [x] Run fixtures against agent functions directly (unit-style) or through full pipeline API? → **Direct agent function calls** (unit-style via `AGENT_EXECUTORS` map in runner)

---

## Suggested Test Cases

- [x] Eval page renders with test cases list (EVAL-001)
- [x] Run triggers agent and displays result + judge score (EVAL-002)
- [x] Run All runs all cases, shows progress (EVAL-004)
- [x] Run All supports cancel (EVAL-005)
- [x] Report summary shows pass rate, avg score, by-agent breakdown (EVAL-006)
- [x] Export report downloads JSON (EVAL-007)
- [x] Error state: agent API failure shows retry (EVAL-008)
- [x] Error state: judge API failure shows raw response (EVAL-009)
- [x] Expand row shows individual run details with 4 sections (EVAL-010)
- [x] Deterministic pre-check catches invalid JSON before judge (EVAL-011)
- [x] Content fits bounded box, no horizontal scroll (EVAL-012)
- [x] Mobile: Score, Category, and Actions columns do not overlap (EVAL-015)
- [x] Expanded row shows Expected Rubric, Judge Evaluation, Agent Response (EVAL-016)
- [x] Report breakdown by agent and by category (EVAL-017)

---

## Component References

| Component | Status | File |
|---|---|---|
| EvalDashboard | Implemented | `components/eval/eval-dashboard.tsx` |
| EvalTestCaseTable | Implemented | `components/eval/eval-test-case-table.tsx` |
| EvalTestCaseRow | Implemented | `components/eval/eval-test-case-row.tsx` |
| EvalReportSummary | Implemented | `components/eval/eval-report-summary.tsx` |

Note: Progress tracking (completed X/Y with progress bar and cancel) is embedded inline in `EvalDashboard` via `batchProgress` state, not a separate component.

---

## Design Tokens Used

- `color-surface`, `color-surface-elevated` — Summary bar, table, cards
- `color-border`, `color-grid` — Table borders
- `color-text`, `color-text-secondary` — Labels, secondary info
- `color-primary-cta` — Run buttons
- `color-secondary` — Export, secondary actions
- `color-success`, `color-error` — Pass/fail indicators, error states
- `radius-sm`, `radius-md` — Cards, buttons
- `spacing-4`, `spacing-6` — Padding
- `font-mono` — JSON output display, fixture summaries

---

## Learnings

### 2026-03-09
- **Gotcha**: Claude often wraps JSON responses in ` ```json ``` ` markdown fences despite system prompt instructions. Created shared `stripJsonFences()` utility in `lib/utils/json.ts` — applied to all 4 agents and the judge.
- **Decision**: Judge model is Sonnet 4.6 (`claude-sonnet-4-6`), not Haiku 4.5. Chose quality over cost savings since judge accuracy directly affects eval reliability.
- **Pattern**: Agent metadata unwrapping — each agent stores raw output under a named key in `result.metadata` (`insights`, `forecastOutput`, `polishOutput`). The runner must unwrap before schema validation.
- **Decision**: No separate `/api/eval/judge` route. The judge is called internally by the runner via `scoreWithJudge()`. The only API routes are `GET /api/eval/test-cases` and `POST /api/eval/run`.
- **Decision**: Both eval API routes use `requireAdmin()` for access control, returning 403 Forbidden for non-admin users.
