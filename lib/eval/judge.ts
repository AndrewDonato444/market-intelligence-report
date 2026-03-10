/**
 * Eval Suite — LLM-as-Judge
 *
 * Uses Claude to score agent outputs against rubrics with a 4-dimension
 * breakdown: dataGrounding, narrativeQuality, schemaCompliance, toneVoice.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { JudgeRequest, JudgeResponse, JudgeBreakdown } from "./types";
import { env } from "@/lib/config/env";
import { stripJsonFences } from "@/lib/utils/json";

const JUDGE_MODEL = "claude-sonnet-4-6";

// --- Public API ---

export function buildJudgePrompt(request: JudgeRequest): string {
  return `AGENT: ${request.agent}
TEST CASE: ${request.testCaseDescription}

RUBRIC (what the agent output should satisfy):
${request.expectedRubric}

INPUT DATA (the fixture the agent was given):
${request.inputFixtureSummary}

AGENT RESPONSE (the output to evaluate):
${JSON.stringify(request.actualResponse, null, 2)}`;
}

export function parseJudgeResponse(raw: string): JudgeResponse {
  const cleaned = stripJsonFences(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse judge response as JSON: ${cleaned.slice(0, 200)}`);
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.score !== "number") {
    throw new Error("Judge response missing required field: score");
  }
  if (typeof obj.reason !== "string") {
    throw new Error("Judge response missing required field: reason");
  }
  if (!obj.breakdown || typeof obj.breakdown !== "object") {
    throw new Error("Judge response missing required field: breakdown");
  }

  const breakdown = obj.breakdown as JudgeBreakdown;
  const validation = validateBreakdown(breakdown);
  if (!validation.valid) {
    throw new Error(`Invalid judge breakdown: ${validation.errors.join(", ")}`);
  }

  return {
    score: obj.score,
    reason: obj.reason,
    breakdown,
  };
}

export function validateBreakdown(
  breakdown: JudgeBreakdown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const dimensions: (keyof JudgeBreakdown)[] = [
    "dataGrounding",
    "narrativeQuality",
    "schemaCompliance",
    "toneVoice",
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

const JUDGE_SYSTEM_PROMPT = `You are an expert evaluator for a luxury real estate market intelligence pipeline. Your job is to score an AI agent's output against a specific rubric and input data.

SCORING DIMENSIONS (each 1-5):

1. dataGrounding (1-5): Does the output reference specific numbers from the input data? Are metrics accurate and not fabricated? Approximate rounding is acceptable (e.g., "$3.5M" for $3,500,000). Segment names can be semantically matched (e.g., "Waterfront" matches "waterfront").

2. narrativeQuality (1-5): Is the narrative strategic and insightful, or generic and surface-level? Does it weave data into a story rather than just listing metrics? Are themes and recommendations specific to this market?

3. schemaCompliance (1-5): Does the output have the correct JSON structure? Are all required fields present and correctly typed? Is the output valid JSON (not markdown or plain text)?

4. toneVoice (1-5): Is the tone analytical and professional (like a Goldman Sachs research note)? Penalize promotional language ("exciting," "amazing," "don't miss"), certainty language ("will," "guaranteed"), and marketing copy. Reward calibrated, measured language.

SCORING SCALE:
5 = Excellent — fully satisfies the rubric with no issues
4 = Good — satisfies the rubric with minor issues
3 = Acceptable — partially satisfies but has notable gaps
2 = Poor — significant issues, does not satisfy key rubric criteria
1 = Failing — fundamentally wrong, fabricated data, or missing output

RULES:
- Score based ONLY on the rubric provided. Different test cases test different things.
- For data grounding checks, compare agent output numbers against the INPUT DATA provided.
- For low-data or edge-case scenarios, honest caveats and wide ranges should score HIGH, not low.
- A null or empty response always scores 1 across all dimensions.

Respond with a JSON object matching this exact schema:
{
  "score": <number 1-5, the overall score>,
  "reason": "<string explaining the score, referencing specific evidence>",
  "breakdown": {
    "dataGrounding": <number 1-5>,
    "narrativeQuality": <number 1-5>,
    "schemaCompliance": <number 1-5>,
    "toneVoice": <number 1-5>
  }
}

The overall score should reflect the weighted importance implied by the rubric. For example, a data-grounding test case should weight dataGrounding heavily in the overall score.`;

export async function scoreWithJudge(
  request: JudgeRequest
): Promise<JudgeResponse> {
  const userPrompt = buildJudgePrompt(request);

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: JUDGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return parseJudgeResponse(text);
  } catch (err: unknown) {
    // If it's already a parse error, re-throw
    if (err instanceof Error && err.message.startsWith("Failed to parse")) {
      throw err;
    }
    if (err instanceof Error && err.message.startsWith("Judge response")) {
      throw err;
    }

    // API errors → return a score-1 result with the error
    return {
      score: 1,
      reason: `Judge API error: ${(err as Error).message || "Unknown error"}`,
      breakdown: {
        dataGrounding: 1,
        narrativeQuality: 1,
        schemaCompliance: 1,
        toneVoice: 1,
      },
    };
  }
}
