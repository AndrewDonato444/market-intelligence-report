/**
 * Report Eval — LLM-as-Judge (Report-Level)
 *
 * Uses Claude to score complete assembled reports against rubrics with a 6-dimension
 * breakdown: dataAccuracy, completeness, narrativeQuality, formatting, actionability, personaAlignment.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  ReportEvalJudgeResponse,
  ReportEvalJudgeBreakdown,
  ReportEvalTestCase,
} from "./types";
import type { AssembledReport } from "@/lib/agents/report-assembler";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

const JUDGE_MODEL = "claude-sonnet-4-6";

const REPORT_JUDGE_SYSTEM_PROMPT = `You are an expert evaluator for complete luxury real estate market intelligence reports. Your job is to score a fully assembled report (9 sections) against a specific quality rubric.

SCORING DIMENSIONS (each 1-5):

1. dataAccuracy (1-5): Do numbers in narrative sections match the source analytics? Are metrics accurate and not fabricated? Headline figures (median price, property count, YoY change) should be consistent across sections. Approximate rounding is acceptable (e.g., "$3.5M" for $3,500,000).

2. completeness (1-5): Are all 9 sections present? Do data sections have populated arrays? Do narrative sections have content where upstream agent data exists? Null narratives are acceptable ONLY when no upstream agent produced output for that section.

3. narrativeQuality (1-5): Do narratives flow cohesively across sections? Do themes introduced in the executive briefing carry through to later sections? Are there contradictions between sections? Is the narrative strategic rather than generic?

4. formatting (1-5): Are sections numbered 1-9 in correct order with correct types? Is metadata complete (generatedAt, totalDurationMs, agentDurations, confidence, sectionCount)? Is the JSON structure valid?

5. actionability (1-5): Are recommendations backed by specific data? Is timing guidance tied to market conditions? Do forecasts reference observed trends? Generic advice without data backing scores low. Low-data reports that caveat appropriately score higher than those that give false specifics.

6. personaAlignment (1-5): Is the tone analytical and professional (like a Goldman Sachs research note)? No promotional language ("exciting," "amazing," "don't miss"). No unhedged certainty ("will," "guaranteed"). Calibrated language preferred ("likely," "projected," "estimated"). Vocabulary appropriate for the market tier.

SCORING SCALE:
5 = Excellent — fully satisfies the rubric with no issues
4 = Good — satisfies the rubric with minor issues
3 = Acceptable — partially satisfies but has notable gaps
2 = Poor — significant issues, does not satisfy key rubric criteria
1 = Failing — fundamentally wrong, fabricated data, or missing output

RULES:
- Score based ONLY on the rubric provided. Different test cases test different things.
- The overall score should weight the criterion being tested most heavily.
- For low-data or edge-case scenarios, honest representation should score HIGH.
- Null narrative sections when no upstream agent ran are acceptable — score based on what IS present.
- A completely empty report always scores 1 across all dimensions.

Respond with a JSON object matching this exact schema:
{
  "score": <number 1-5, the overall score>,
  "reason": "<string explaining the score, referencing specific evidence>",
  "breakdown": {
    "dataAccuracy": <number 1-5>,
    "completeness": <number 1-5>,
    "narrativeQuality": <number 1-5>,
    "formatting": <number 1-5>,
    "actionability": <number 1-5>,
    "personaAlignment": <number 1-5>
  }
}`;

export function buildReportJudgePrompt(
  testCase: ReportEvalTestCase,
  report: AssembledReport,
  fixtureSummary: string
): string {
  return `TEST CASE: ${testCase.description}
CRITERION BEING TESTED: ${testCase.criterion}

RUBRIC (what the report should satisfy):
${testCase.expectedRubric}

REPORT FIXTURE SUMMARY:
${fixtureSummary}

FULL ASSEMBLED REPORT (JSON):
${JSON.stringify(report, null, 2)}`;
}

export function parseReportJudgeResponse(raw: string): ReportEvalJudgeResponse {
  const cleaned = stripJsonFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Failed to parse report judge response as JSON: ${cleaned.slice(0, 200)}`
    );
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.score !== "number") {
    throw new Error("Report judge response missing required field: score");
  }
  if (typeof obj.reason !== "string") {
    throw new Error("Report judge response missing required field: reason");
  }
  if (!obj.breakdown || typeof obj.breakdown !== "object") {
    throw new Error("Report judge response missing required field: breakdown");
  }

  const breakdown = obj.breakdown as ReportEvalJudgeBreakdown;
  const validation = validateReportBreakdown(breakdown);
  if (!validation.valid) {
    throw new Error(
      `Invalid report judge breakdown: ${validation.errors.join(", ")}`
    );
  }

  return {
    score: obj.score,
    reason: obj.reason,
    breakdown,
  };
}

export function validateReportBreakdown(
  breakdown: ReportEvalJudgeBreakdown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const dimensions: (keyof ReportEvalJudgeBreakdown)[] = [
    "dataAccuracy",
    "completeness",
    "narrativeQuality",
    "formatting",
    "actionability",
    "personaAlignment",
  ];

  for (const dim of dimensions) {
    const val = breakdown[dim];
    if (!Number.isInteger(val)) {
      errors.push(`${dim} must be an integer, got ${val}`);
    } else if (val < 1 || val > 5) {
      errors.push(`${dim} must be between 1 and 5, got ${val}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function scoreReportWithJudge(
  testCase: ReportEvalTestCase,
  report: AssembledReport,
  fixtureSummary: string
): Promise<ReportEvalJudgeResponse> {
  const userPrompt = buildReportJudgePrompt(testCase, report, fixtureSummary);

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: REPORT_JUDGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return parseReportJudgeResponse(text);
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message.startsWith("Failed to parse") ||
        err.message.startsWith("Report judge") ||
        err.message.startsWith("Invalid report"))
    ) {
      throw err;
    }

    return {
      score: 1,
      reason: `Report judge API error: ${(err as Error).message || "Unknown error"}`,
      breakdown: {
        dataAccuracy: 1,
        completeness: 1,
        narrativeQuality: 1,
        formatting: 1,
        actionability: 1,
        personaAlignment: 1,
      },
    };
  }
}
