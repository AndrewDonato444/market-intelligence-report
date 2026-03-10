/**
 * Eval Suite — Test Cases
 *
 * 24 curated test cases across 3 agents covering narrative quality,
 * data grounding, schema compliance, tone/voice, edge cases, and
 * cross-section consistency.
 */

import type { EvalTestCase } from "./types";

export const EVAL_TEST_CASES: EvalTestCase[] = [
  // ============================================================
  // INSIGHT GENERATOR (10 cases)
  // ============================================================
  {
    id: "tc-01",
    description: "Insight Generator — strong market, high confidence",
    agent: "insight-generator",
    category: "narrative-quality",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "Narrative weaves segment data into a strategic story. References $3.5M median, 8.2% YoY, and at least 2 segment names with metrics. Identifies 3-5 themes with trend/impact. Buyer/seller timing is actionable and specific to segments.",
    schemaCheck: true,
    requiredFields: [
      "overview.narrative",
      "overview.highlights",
      "overview.recommendations",
      "themes",
      "executiveSummary.narrative",
      "executiveSummary.timing.buyers",
      "executiveSummary.timing.sellers",
    ],
  },
  {
    id: "tc-02",
    description: "Insight Generator — low data, only 5 properties",
    agent: "insight-generator",
    category: "edge-case",
    fixtureId: "fixture-low-data",
    expectedRubric:
      "Honest caveats about insufficient data (only 5 properties). Does NOT fabricate specific trends or confident statements. Uses 0-1 themes. Confidence language reflects low sample. Does not present null YoY data as if it exists.",
    schemaCheck: true,
    requiredFields: [
      "overview.narrative",
      "overview.highlights",
      "themes",
      "executiveSummary.narrative",
    ],
  },
  {
    id: "tc-03",
    description: "Insight Generator — data grounding, all numbers referenced",
    agent: "insight-generator",
    category: "data-grounding",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "Narrative must reference: $3.5M median price, 847 total properties, 8.2% YoY median change, at least 2 segment names (e.g. Waterfront at $5.1M, Golf Community at $3.2M) with their specific metrics. Numbers should match input data — not fabricated.",
  },
  {
    id: "tc-04",
    description: "Insight Generator — schema compliance, valid JSON structure",
    agent: "insight-generator",
    category: "schema-compliance",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "Output is valid JSON with: overview.narrative (string), overview.highlights (string array, 3-5 items), overview.recommendations (string array, 2-3 items), themes (array of objects each with name/impact/trend/narrative), executiveSummary with timing.buyers and timing.sellers (both strings).",
    schemaCheck: true,
    requiredFields: [
      "overview.narrative",
      "overview.highlights",
      "overview.recommendations",
      "themes",
      "executiveSummary.narrative",
      "executiveSummary.highlights",
      "executiveSummary.timing.buyers",
      "executiveSummary.timing.sellers",
    ],
  },
  {
    id: "tc-05",
    description: "Insight Generator — tone check, no promotional language",
    agent: "insight-generator",
    category: "tone-voice",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      'No words like "exciting," "amazing," "incredible," "opportunity of a lifetime," "premier destination," "don\'t miss." Tone is analytical and authoritative — reads like a Goldman Sachs research note, not a Zillow listing or marketing brochure. Professional financial language throughout.',
  },
  {
    id: "tc-06",
    description: "Insight Generator — single-segment market",
    agent: "insight-generator",
    category: "edge-case",
    fixtureId: "fixture-single-segment",
    expectedRubric:
      "Handles market with only one segment (Mountain Estate) gracefully. Still produces meaningful themes from limited segment diversity. Does not reference nonexistent segments. Themes focus on the single segment's dynamics rather than cross-segment comparisons.",
  },
  {
    id: "tc-07",
    description: "Insight Generator — zero YoY data available",
    agent: "insight-generator",
    category: "edge-case",
    fixtureId: "fixture-no-yoy",
    expectedRubric:
      "Handles null YoY fields without fabricating trend data. Notes that historical comparison is unavailable. Focuses on current snapshot metrics. Does not say 'prices increased X%' when YoY data is null.",
  },
  {
    id: "tc-08",
    description: "Insight Generator — stale data sources flagged",
    agent: "insight-generator",
    category: "data-grounding",
    fixtureId: "fixture-stale-sources",
    expectedRubric:
      "Narrative acknowledges or caveats that some data sources are stale (Property Detail and Local Search). Does not present stale-sourced data with the same authority as fresh data. Confidence caveats appear in the analysis.",
  },
  {
    id: "tc-09",
    description: "Insight Generator — ultra-luxury tier ($10M+)",
    agent: "insight-generator",
    category: "narrative-quality",
    fixtureId: "fixture-ultra-luxury",
    expectedRubric:
      "Vocabulary appropriate for ultra-luxury ($10M+) segment. References are scaled correctly ($15M median, $3,800/sqft — not $3.5M for a different market). Segment names match (Estate, Modern, Condo/Penthouse). Themes reflect ultra-luxury dynamics (trophy assets, off-market deals, discretion).",
  },
  {
    id: "tc-10",
    description: "Insight Generator — mixed confidence across segments",
    agent: "insight-generator",
    category: "narrative-quality",
    fixtureId: "fixture-mixed-confidence",
    expectedRubric:
      "Differentiates confidence per segment. High-confidence segments (Oceanfront: 45, Village Estate: 120) get specific projections. Low-sample segments (Farm/Vineyard: 15 properties, lowSample=true) get caveated language. Does not treat all segments with equal confidence.",
  },

  // ============================================================
  // FORECAST MODELER (8 cases)
  // ============================================================
  {
    id: "tc-11",
    description: "Forecast Modeler — base/bull/bear scenario quality",
    agent: "forecast-modeler",
    category: "narrative-quality",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "Three distinct scenarios with different narratives and assumptions. Base case is most likely (closest to observed 8.2% YoY). Bull and bear are plausible, not extreme. Each has 2-3 specific, market-relevant assumptions (not generic 'economy improves').",
    schemaCheck: true,
    requiredFields: [
      "projections",
      "scenarios.base.narrative",
      "scenarios.base.assumptions",
      "scenarios.bull.narrative",
      "scenarios.bear.narrative",
      "timing.buyers",
      "timing.sellers",
      "outlook.narrative",
      "outlook.monitoringAreas",
    ],
  },
  {
    id: "tc-12",
    description: "Forecast Modeler — range widening for 12-month vs 6-month",
    agent: "forecast-modeler",
    category: "data-grounding",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "For every segment projection: 12-month priceRange is wider than 6-month priceRange (high-low spread is larger). 12-month confidence is equal to or lower than 6-month confidence. This reflects appropriate uncertainty modeling.",
  },
  {
    id: "tc-13",
    description: "Forecast Modeler — low confidence, wide ranges",
    agent: "forecast-modeler",
    category: "edge-case",
    fixtureId: "fixture-low-data",
    expectedRubric:
      "All projections use 'low' confidence. Ranges are very wide (>20% spread between low and high). No specific point estimates presented as reliable. Explicit caveats about insufficient historical data. Does not fabricate trend-based projections when YoY is null.",
  },
  {
    id: "tc-14",
    description: "Forecast Modeler — schema compliance, projections structure",
    agent: "forecast-modeler",
    category: "schema-compliance",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "Each projection has: segment (string), sixMonth with medianPrice/priceRange.low/priceRange.high/confidence, twelveMonth (same structure). Scenarios has base/bull/bear each with narrative (string), assumptions (string array), medianPriceChange (number), volumeChange (number). timing.buyers and timing.sellers are strings. outlook.monitoringAreas is string array.",
    schemaCheck: true,
    requiredFields: [
      "projections",
      "scenarios.base",
      "scenarios.bull",
      "scenarios.bear",
      "timing.buyers",
      "timing.sellers",
      "outlook.narrative",
      "outlook.monitoringAreas",
    ],
  },
  {
    id: "tc-15",
    description: "Forecast Modeler — no certainty language",
    agent: "forecast-modeler",
    category: "tone-voice",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      'No "will" (as certainty), "guaranteed," "certain," "definitely," "always" in projections or scenarios. Uses calibrated language: "likely," "projected," "estimated," "our base case suggests," "we anticipate." Communicates uncertainty honestly.',
  },
  {
    id: "tc-16",
    description: "Forecast Modeler — projections grounded in YoY data",
    agent: "forecast-modeler",
    category: "data-grounding",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "Base case medianPriceChange is within reasonable range of observed 8.2% YoY (between 0.04 and 0.15 — not 0.5 or 0.001). Assumptions reference actual market conditions from input data (e.g., mention specific segments, price levels, or observed trends).",
  },
  {
    id: "tc-17",
    description: "Forecast Modeler — monitoring areas are specific",
    agent: "forecast-modeler",
    category: "narrative-quality",
    fixtureId: "fixture-strong-market",
    expectedRubric:
      "3-5 monitoring areas that reference actual market dynamics (not generic 'watch the economy' or 'monitor interest rates' alone). At least 2 reference specific segments, metrics, or conditions from input data. E.g., 'waterfront inventory levels' or 'cash buyer percentage trends.'",
  },
  {
    id: "tc-18",
    description: "Forecast Modeler — zero properties, graceful degradation",
    agent: "forecast-modeler",
    category: "edge-case",
    fixtureId: "fixture-empty-market",
    expectedRubric:
      "Does not produce specific price projections for zero-property market. Narrative explains insufficient data clearly. Still provides a general monitoring framework. Does not crash or return nonsensical numbers. Confidence should be 'low' across the board.",
  },

  // ============================================================
  // POLISH AGENT (6 cases)
  // ============================================================
  {
    id: "tc-19",
    description: "Polish Agent — pull quotes are data-backed, <30 words",
    agent: "polish-agent",
    category: "tone-voice",
    fixtureId: "fixture-strong-market-upstream",
    expectedRubric:
      "3-5 pull quotes. Each under 30 words. Each contains at least one specific number or metric from the upstream sections (e.g., '$3.5M,' '8.2%,' '847'). None are generic or promotional ('the market shows promise').",
    schemaCheck: true,
    requiredFields: [
      "polishedSections",
      "pullQuotes",
      "methodology.narrative",
      "methodology.sources",
      "methodology.confidenceLevels",
      "consistency.contradictions",
      "consistency.notes",
    ],
  },
  {
    id: "tc-20",
    description: "Polish Agent — contradiction detection, growth vs decline",
    agent: "polish-agent",
    category: "cross-section",
    fixtureId: "fixture-contradictory-upstream",
    expectedRubric:
      "The contradictions array is non-empty. It identifies the specific discrepancy: insight-generator says 'robust growth' / 'strong buyer demand' while forecast-modeler projects negative volume change (-6%). The contradiction note should be specific and actionable, not vague.",
  },
  {
    id: "tc-21",
    description: "Polish Agent — methodology transparency",
    agent: "polish-agent",
    category: "data-grounding",
    fixtureId: "fixture-strong-market-upstream",
    expectedRubric:
      "Methodology narrative mentions data sources by name (RealEstateAPI, ScrapingDog or equivalent). Includes confidence level ('high') and sample size (847). Does not overstate accuracy. Mentions that projections are model-generated estimates, not guarantees.",
  },
  {
    id: "tc-22",
    description: "Polish Agent — does not alter upstream data",
    agent: "polish-agent",
    category: "cross-section",
    fixtureId: "fixture-strong-market-upstream",
    expectedRubric:
      "Polished narratives preserve specific numbers from upstream sections. If upstream says '$3.5M median,' polished version still says '$3.5M' (not rounded to '$4M'). If upstream says '8.2% YoY,' polished version preserves that figure. Data integrity is maintained through editorial pass.",
  },
  {
    id: "tc-23",
    description: "Polish Agent — missing forecast-modeler, graceful handling",
    agent: "polish-agent",
    category: "edge-case",
    fixtureId: "fixture-partial-upstream",
    expectedRubric:
      "When forecast-modeler results are absent, polish agent works with available sections (insight-generator only). Does not reference nonexistent forecast content. Missing sections noted in consistency or methodology. No crashes or empty output.",
  },
  {
    id: "tc-24",
    description: "Polish Agent — consistency notes are substantive",
    agent: "polish-agent",
    category: "cross-section",
    fixtureId: "fixture-strong-market-upstream",
    expectedRubric:
      "Consistency notes identify specific terminology alignment or misalignment across sections. Not just 'everything looks good' or 'report reads well.' References actual section content, tone patterns, or vocabulary choices.",
  },
];

/** Get a test case by ID or throw */
export function getTestCase(id: string): EvalTestCase {
  const tc = EVAL_TEST_CASES.find((t) => t.id === id);
  if (!tc) throw new Error(`Unknown eval test case: ${id}`);
  return tc;
}

/** Get all test cases for a specific agent */
export function getTestCasesForAgent(agent: string): EvalTestCase[] {
  return EVAL_TEST_CASES.filter((t) => t.agent === agent);
}

/** Get all test cases for a specific category */
export function getTestCasesForCategory(category: string): EvalTestCase[] {
  return EVAL_TEST_CASES.filter((t) => t.category === category);
}
