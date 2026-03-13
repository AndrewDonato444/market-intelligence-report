/**
 * Report Eval Test Cases
 *
 * 18 curated test cases across 6 report-level criteria.
 * Each evaluates a complete assembled report (9 sections)
 * against quality rubrics using LLM-as-judge scoring.
 */

import type { ReportEvalTestCase } from "./types";

export const REPORT_EVAL_TEST_CASES: ReportEvalTestCase[] = [
  // ============================================================
  // DATA ACCURACY (3 cases)
  // ============================================================
  {
    id: "rtc-01",
    description: "Data Accuracy — strong market numbers appear in report",
    criterion: "data-accuracy",
    fixtureId: "report-strong-market",
    expectedRubric:
      "Executive briefing headline must show $3.5M median, 847 properties, A- rating, 8.2% YoY. Narrative sections reference at least 2 segment names (Waterfront at $5.1M, Golf Community at $3.2M) with correct prices. Numbers in the report must match the source analytics — no fabricated metrics.",
    requiredSections: [
      "executive_briefing",
      "the_narrative",
      "luxury_market_dashboard",
    ],
  },
  {
    id: "rtc-02",
    description: "Data Accuracy — low-data market does not fabricate trends",
    criterion: "data-accuracy",
    fixtureId: "report-low-data",
    expectedRubric:
      "Report must not fabricate YoY trends when all YoY fields are null. Executive briefing shows 5 properties and $1.2M median. No specific growth percentages should appear. If narrative sections are null (no agent output), that is acceptable — null is better than fabricated.",
    requiredSections: ["executive_briefing"],
  },
  {
    id: "rtc-03",
    description: "Data Accuracy — stale sources flagged in metadata confidence",
    criterion: "data-accuracy",
    fixtureId: "report-stale-sources",
    expectedRubric:
      "Report metadata confidence must include staleDataSources array. Sources flagged as stale (Property Detail, Local Search) should appear in the array. Fresh sources should not appear. This transparency is critical for report credibility and is surfaced in the front-end UI disclaimer.",
    requiredSections: ["executive_briefing"],
  },

  // ============================================================
  // COMPLETENESS (3 cases)
  // ============================================================
  {
    id: "rtc-04",
    description: "Completeness — strong market has all 7 sections populated",
    criterion: "completeness",
    fixtureId: "report-strong-market",
    expectedRubric:
      "All 7 sections must be present. Executive briefing has headline AND narrative. Market insights index has insightsIndex. Dashboard has powerFive metrics. Neighborhood intelligence has neighborhoods array. The narrative has editorial and themes. Forward look has forecast and guidance. Comparative positioning has peer data.",
    requiredSections: [
      "executive_briefing",
      "market_insights_index",
      "luxury_market_dashboard",
      "neighborhood_intelligence",
      "the_narrative",
      "forward_look",
      "comparative_positioning",
    ],
  },
  {
    id: "rtc-05",
    description: "Completeness — empty market still produces 7 sections",
    criterion: "completeness",
    fixtureId: "report-empty-market",
    expectedRubric:
      "Even with 0 properties, all 7 sections must exist. Executive briefing headline should show 0 properties, $0 median. Data-only sections (market insights, dashboard, comparative) may have empty arrays but must be present. Narrative sections may be null (no agent ran) — that is expected, not a failure. Metadata confidence must be 'low'.",
    requiredSections: [
      "executive_briefing",
      "market_insights_index",
      "luxury_market_dashboard",
      "neighborhood_intelligence",
      "the_narrative",
      "forward_look",
      "comparative_positioning",
    ],
  },
  {
    id: "rtc-06",
    description: "Completeness — partial upstream (missing forecast) still valid",
    criterion: "completeness",
    fixtureId: "report-partial-upstream",
    expectedRubric:
      "All 7 sections must exist even when forecast-modeler didn't run. Forward look section should have null forecast/guidance (not crash). Insight-generator narratives should still appear in exec briefing, the narrative, and neighborhood sections.",
    requiredSections: [
      "executive_briefing",
      "forward_look",
      "the_narrative",
    ],
  },

  // ============================================================
  // NARRATIVE QUALITY (3 cases)
  // ============================================================
  {
    id: "rtc-07",
    description: "Narrative Quality — themes flow from briefing to narrative",
    criterion: "narrative-quality",
    fixtureId: "report-strong-market",
    expectedRubric:
      "Executive briefing narrative should introduce key themes. The Narrative section (editorial + themes) should expand on those same themes with deeper analysis. Themes referenced in section 1 should appear or be elaborated in section 5. There should be no contradictions between the executive briefing and the main narrative.",
    requiredSections: ["executive_briefing", "the_narrative"],
  },
  {
    id: "rtc-08",
    description: "Narrative Quality — contradictory upstream preserved",
    criterion: "narrative-quality",
    fixtureId: "report-contradictory",
    expectedRubric:
      "The assembled report must faithfully preserve both the insight-generator's 'robust growth' narrative and the forecast-modeler's negative volume projection. The report assembler does not resolve contradictions — that is the polish agent's job. Both signals must be present in their respective sections (the_narrative and forward_look).",
    requiredSections: ["the_narrative", "forward_look"],
  },
  {
    id: "rtc-09",
    description: "Narrative Quality — single segment, no phantom references",
    criterion: "narrative-quality",
    fixtureId: "report-single-segment",
    expectedRubric:
      "With only one segment (Mountain Estate), the report must not reference nonexistent segments. Market context in the_narrative should show 1 segment. No cross-segment comparisons should appear in the assembled data. If narratives are null (no upstream agents), the section should still render correctly.",
    requiredSections: ["the_narrative"],
  },

  // ============================================================
  // FORMATTING (3 cases)
  // ============================================================
  {
    id: "rtc-10",
    description: "Formatting — sections numbered 1-7 in correct order",
    criterion: "formatting",
    fixtureId: "report-strong-market",
    expectedRubric:
      "Sections must be numbered 1 through 7 in ascending order. Section types must match: 1=executive_briefing, 2=market_insights_index, 3=luxury_market_dashboard, 4=neighborhood_intelligence, 5=the_narrative, 6=forward_look, 7=comparative_positioning. No duplicate section numbers.",
    requiredSections: [
      "executive_briefing",
      "market_insights_index",
      "luxury_market_dashboard",
      "neighborhood_intelligence",
      "the_narrative",
      "forward_look",
      "comparative_positioning",
    ],
  },
  {
    id: "rtc-11",
    description: "Formatting — metadata has all required fields",
    criterion: "formatting",
    fixtureId: "report-strong-market",
    expectedRubric:
      "Report metadata must include: generatedAt (ISO timestamp string), totalDurationMs (positive number), agentDurations (object with agent names as keys), confidence (object with level, sampleSize, detailCoverage, staleDataSources), sectionCount (matches actual sections length). All fields must be present and correctly typed.",
  },
  {
    id: "rtc-12",
    description: "Formatting — empty market report has valid structure",
    criterion: "formatting",
    fixtureId: "report-empty-market",
    expectedRubric:
      "Even with zero data, the report structure must be valid. Sections numbered 1-9 with correct types. Metadata present with confidence.level='low'. Content fields may be empty arrays or null but must not be undefined. sectionCount in metadata matches actual sections.length.",
    requiredSections: [
      "executive_briefing",
      "market_insights_index",
      "luxury_market_dashboard",
    ],
  },

  // ============================================================
  // ACTIONABILITY (3 cases)
  // ============================================================
  {
    id: "rtc-13",
    description: "Actionability — timing references specific market data",
    criterion: "actionability",
    fixtureId: "report-strong-market",
    expectedRubric:
      "Executive briefing and forward look should contain buyer/seller timing guidance. If present, timing must reference specific market conditions — segment names, price levels, or observed trends from the analytics. Generic 'now is a good time' without data backing scores low. Guidance mentioning specific segments (Waterfront, Golf Community) or metrics ($5.1M, 8.2%) scores high.",
    requiredSections: ["executive_briefing", "forward_look"],
  },
  {
    id: "rtc-14",
    description: "Actionability — low-data caveats rather than false specifics",
    criterion: "actionability",
    fixtureId: "report-low-data",
    expectedRubric:
      "With only 5 properties and null YoY, the report should not give specific timing or actionable recommendations. If narrative sections are null (acceptable — no agent output), the data sections should reflect low confidence. Executive briefing headline with 5 properties and $1.2M median provides honest context. Any narrative present should caveat the low sample.",
    requiredSections: ["executive_briefing"],
  },
  {
    id: "rtc-15",
    description: "Actionability — ultra-luxury recommendations appropriately scaled",
    criterion: "actionability",
    fixtureId: "report-ultra-luxury",
    expectedRubric:
      "Executive briefing headline should show $15M median and 89 properties. If narrative timing exists, it should be appropriate for $10M+ market dynamics — not advice calibrated for $500K homes. Peer comparisons should not exist (ultra-luxury fixture has none).",
    requiredSections: ["executive_briefing"],
  },

  // ============================================================
  // PERSONA ALIGNMENT (3 cases)
  // ============================================================
  {
    id: "rtc-16",
    description: "Persona Alignment — no promotional language in narratives",
    criterion: "persona-alignment",
    fixtureId: "report-strong-market",
    expectedRubric:
      'Scan all narrative fields (executive briefing narrative, the_narrative editorial, forward_look forecast). None should contain promotional words: "exciting," "amazing," "incredible," "opportunity of a lifetime," "premier destination," "don\'t miss." The tone should be analytical and measured — like a Goldman Sachs research note, not a marketing brochure.',
    requiredSections: ["executive_briefing", "the_narrative", "forward_look"],
  },
  {
    id: "rtc-17",
    description: "Persona Alignment — calibrated uncertainty in forecasts",
    criterion: "persona-alignment",
    fixtureId: "report-strong-market",
    expectedRubric:
      'Forward look section should not contain certainty language: "will" (as certainty), "guaranteed," "certain," "definitely," "always." Calibrated alternatives are acceptable: "likely," "projected," "estimated," "our base case suggests." This applies to the forecast and guidance fields if present.',
    requiredSections: ["forward_look"],
  },
  {
    id: "rtc-18",
    description: "Persona Alignment — ultra-luxury vocabulary appropriate",
    criterion: "persona-alignment",
    fixtureId: "report-ultra-luxury",
    expectedRubric:
      "Executive briefing headline shows $15M median — vocabulary should match this tier. Scorecard segments (Estate, Modern, Condo/Penthouse) should be preserved exactly. Dashboard metrics should be scaled to ultra-luxury levels ($3,800/sqft median). If narratives exist, language should reflect estate-level transactions, not entry-level market terminology.",
    requiredSections: [
      "executive_briefing",
      "luxury_market_dashboard",
    ],
  },
];

/** Get a report eval test case by ID or throw */
export function getReportTestCase(id: string): ReportEvalTestCase {
  const tc = REPORT_EVAL_TEST_CASES.find((t) => t.id === id);
  if (!tc) throw new Error(`Unknown report eval test case: ${id}`);
  return tc;
}

/** Get test cases by criterion */
export function getReportTestCasesByCriterion(
  criterion: string
): ReportEvalTestCase[] {
  return REPORT_EVAL_TEST_CASES.filter((t) => t.criterion === criterion);
}
