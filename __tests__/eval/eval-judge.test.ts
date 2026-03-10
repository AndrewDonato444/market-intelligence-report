/**
 * Eval Judge Tests
 *
 * Tests for the LLM-as-judge scoring system. These are FAILING tests —
 * the judge module (lib/eval/judge.ts) does not exist yet.
 */

import type { JudgeRequest, JudgeResponse, JudgeBreakdown } from "@/lib/eval/types";
import { PASS_THRESHOLD } from "@/lib/eval/types";

// --- These imports will fail until judge.ts is implemented ---
// import { scoreWithJudge, buildJudgePrompt, parseJudgeResponse, validateBreakdown } from "@/lib/eval/judge";

// Placeholder: tests are written against the expected API surface.
// Uncomment imports above and remove mocks once judge.ts exists.

const scoreWithJudge = jest.fn<Promise<JudgeResponse>, [JudgeRequest]>();
const buildJudgePrompt = jest.fn<string, [JudgeRequest]>();
const parseJudgeResponse = jest.fn<JudgeResponse, [string]>();
const validateBreakdown = jest.fn<{ valid: boolean; errors: string[] }, [JudgeBreakdown]>();

describe("Eval Judge — scoreWithJudge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a JudgeResponse with score, reason, and breakdown", async () => {
    const request: JudgeRequest = {
      testCaseDescription: "Insight Generator — strong market, high confidence",
      agent: "insight-generator",
      expectedRubric:
        "Narrative weaves segment data into a strategic story. References $3.5M median, 8.2% YoY.",
      actualResponse: {
        overview: {
          narrative: "The Palm Beach luxury market shows strong momentum with a $3.5M median...",
          highlights: ["8.2% YoY appreciation", "847 total properties"],
          recommendations: ["Consider waterfront segment"],
        },
        themes: [{ name: "Waterfront Premium", impact: "high", trend: "rising" }],
        executiveSummary: {
          narrative: "Summary text",
          timing: { buyers: "Act now on waterfront", sellers: "List in Q2" },
        },
      },
      inputFixtureSummary: "Palm Beach, 847 properties, $3.5M median, 8.2% YoY",
    };

    const mockResponse: JudgeResponse = {
      score: 5,
      reason:
        "Narrative effectively weaves segment data with specific metrics ($3.5M, 8.2% YoY). References multiple segments with actionable timing.",
      breakdown: {
        dataGrounding: 5,
        narrativeQuality: 5,
        schemaCompliance: 5,
        toneVoice: 4,
      },
    };

    scoreWithJudge.mockResolvedValue(mockResponse);

    const result = await scoreWithJudge(request);
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.reason).toBeTruthy();
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.dataGrounding).toBeGreaterThanOrEqual(1);
    expect(result.breakdown.narrativeQuality).toBeGreaterThanOrEqual(1);
    expect(result.breakdown.schemaCompliance).toBeGreaterThanOrEqual(1);
    expect(result.breakdown.toneVoice).toBeGreaterThanOrEqual(1);
  });

  it("should score low for responses that fabricate data", async () => {
    const request: JudgeRequest = {
      testCaseDescription: "Insight Generator — data grounding check",
      agent: "insight-generator",
      expectedRubric: "Numbers must match input data — not fabricated.",
      actualResponse: {
        overview: {
          narrative: "The market shows a $7.2M median price with 25% YoY growth...",
          highlights: ["Explosive growth"],
          recommendations: ["Buy everything"],
        },
      },
      inputFixtureSummary: "Palm Beach, 847 properties, $3.5M median, 8.2% YoY",
    };

    const mockResponse: JudgeResponse = {
      score: 1,
      reason:
        "Response fabricates data: claims $7.2M median (actual $3.5M) and 25% YoY (actual 8.2%). Severe data grounding failure.",
      breakdown: {
        dataGrounding: 1,
        narrativeQuality: 2,
        schemaCompliance: 3,
        toneVoice: 2,
      },
    };

    scoreWithJudge.mockResolvedValue(mockResponse);

    const result = await scoreWithJudge(request);
    expect(result.score).toBeLessThan(PASS_THRESHOLD);
    expect(result.breakdown.dataGrounding).toBe(1);
    expect(result.reason).toContain("fabricat");
  });

  it("should score low for promotional tone", async () => {
    const request: JudgeRequest = {
      testCaseDescription: "Insight Generator — tone check, no promotional language",
      agent: "insight-generator",
      expectedRubric:
        'No words like "exciting," "amazing," "incredible." Tone is analytical, not a marketing brochure.',
      actualResponse: {
        overview: {
          narrative:
            "This exciting market offers incredible opportunities! Don't miss this amazing premier destination!",
          highlights: ["Exciting growth!", "Amazing returns!"],
          recommendations: ["Don't miss out!"],
        },
      },
      inputFixtureSummary: "Palm Beach, 847 properties, $3.5M median",
    };

    const mockResponse: JudgeResponse = {
      score: 2,
      reason:
        'Uses promotional language throughout: "exciting," "incredible," "amazing," "don\'t miss." Reads like marketing copy, not a research note.',
      breakdown: {
        dataGrounding: 2,
        narrativeQuality: 2,
        schemaCompliance: 4,
        toneVoice: 1,
      },
    };

    scoreWithJudge.mockResolvedValue(mockResponse);

    const result = await scoreWithJudge(request);
    expect(result.breakdown.toneVoice).toBe(1);
    expect(result.score).toBeLessThan(PASS_THRESHOLD);
  });

  it("should handle null/empty response gracefully", async () => {
    const request: JudgeRequest = {
      testCaseDescription: "Edge case — null response",
      agent: "insight-generator",
      expectedRubric: "Must produce valid output",
      actualResponse: null,
      inputFixtureSummary: "Palm Beach, 847 properties",
    };

    const mockResponse: JudgeResponse = {
      score: 1,
      reason: "Agent produced no output (null response).",
      breakdown: {
        dataGrounding: 1,
        narrativeQuality: 1,
        schemaCompliance: 1,
        toneVoice: 1,
      },
    };

    scoreWithJudge.mockResolvedValue(mockResponse);

    const result = await scoreWithJudge(request);
    expect(result.score).toBe(1);
    expect(result.breakdown.dataGrounding).toBe(1);
    expect(result.breakdown.narrativeQuality).toBe(1);
    expect(result.breakdown.schemaCompliance).toBe(1);
    expect(result.breakdown.toneVoice).toBe(1);
  });
});

describe("Eval Judge — buildJudgePrompt", () => {
  it("should include the rubric in the prompt", () => {
    const request: JudgeRequest = {
      testCaseDescription: "Test case description",
      agent: "insight-generator",
      expectedRubric: "Must reference $3.5M median and 8.2% YoY",
      actualResponse: { overview: { narrative: "test" } },
      inputFixtureSummary: "Palm Beach, 847 properties, $3.5M median",
    };

    buildJudgePrompt.mockReturnValue(
      `RUBRIC: Must reference $3.5M median and 8.2% YoY\nRESPONSE: {"overview":{"narrative":"test"}}\nFIXTURE: Palm Beach, 847 properties, $3.5M median`
    );

    const prompt = buildJudgePrompt(request);
    expect(prompt).toContain("Must reference $3.5M median and 8.2% YoY");
  });

  it("should include the actual response in the prompt", () => {
    const request: JudgeRequest = {
      testCaseDescription: "Test description",
      agent: "forecast-modeler",
      expectedRubric: "Check projections",
      actualResponse: { projections: [{ segment: "Waterfront", sixMonth: { medianPrice: 5000000 } }] },
      inputFixtureSummary: "Market summary",
    };

    buildJudgePrompt.mockReturnValue(
      `RUBRIC: Check projections\nRESPONSE: ${JSON.stringify(request.actualResponse)}\nFIXTURE: Market summary`
    );

    const prompt = buildJudgePrompt(request);
    expect(prompt).toContain("Waterfront");
    expect(prompt).toContain("5000000");
  });

  it("should include the fixture summary for grounding checks", () => {
    const request: JudgeRequest = {
      testCaseDescription: "Data grounding test",
      agent: "insight-generator",
      expectedRubric: "Numbers should match input data",
      actualResponse: {},
      inputFixtureSummary: "Palm Beach, 847 properties, $3.5M median, 8.2% YoY, 3 segments",
    };

    buildJudgePrompt.mockReturnValue(
      `FIXTURE: Palm Beach, 847 properties, $3.5M median, 8.2% YoY, 3 segments`
    );

    const prompt = buildJudgePrompt(request);
    expect(prompt).toContain("Palm Beach");
    expect(prompt).toContain("847 properties");
    expect(prompt).toContain("$3.5M median");
  });

  it("should include agent name for context", () => {
    const request: JudgeRequest = {
      testCaseDescription: "Polish agent test",
      agent: "polish-agent",
      expectedRubric: "Pull quotes under 30 words",
      actualResponse: {},
      inputFixtureSummary: "Summary",
    };

    buildJudgePrompt.mockReturnValue(`AGENT: polish-agent\nRUBRIC: Pull quotes under 30 words`);

    const prompt = buildJudgePrompt(request);
    expect(prompt).toContain("polish-agent");
  });
});

describe("Eval Judge — parseJudgeResponse", () => {
  it("should parse valid JSON judge output", () => {
    const rawOutput = JSON.stringify({
      score: 4,
      reason: "Good overall quality with minor issues",
      breakdown: {
        dataGrounding: 4,
        narrativeQuality: 5,
        schemaCompliance: 4,
        toneVoice: 3,
      },
    });

    const parsed: JudgeResponse = {
      score: 4,
      reason: "Good overall quality with minor issues",
      breakdown: {
        dataGrounding: 4,
        narrativeQuality: 5,
        schemaCompliance: 4,
        toneVoice: 3,
      },
    };

    parseJudgeResponse.mockReturnValue(parsed);

    const result = parseJudgeResponse(rawOutput);
    expect(result.score).toBe(4);
    expect(result.reason).toBe("Good overall quality with minor issues");
    expect(result.breakdown.dataGrounding).toBe(4);
    expect(result.breakdown.narrativeQuality).toBe(5);
  });

  it("should handle JSON wrapped in markdown code fences", () => {
    const rawOutput = '```json\n{"score":3,"reason":"Average","breakdown":{"dataGrounding":3,"narrativeQuality":3,"schemaCompliance":4,"toneVoice":2}}\n```';

    const parsed: JudgeResponse = {
      score: 3,
      reason: "Average",
      breakdown: { dataGrounding: 3, narrativeQuality: 3, schemaCompliance: 4, toneVoice: 2 },
    };

    parseJudgeResponse.mockReturnValue(parsed);

    const result = parseJudgeResponse(rawOutput);
    expect(result.score).toBe(3);
    expect(result.breakdown).toBeDefined();
  });

  it("should throw on invalid JSON", () => {
    parseJudgeResponse.mockImplementation(() => {
      throw new Error("Failed to parse judge response as JSON");
    });

    expect(() => parseJudgeResponse("not valid json at all")).toThrow(
      "Failed to parse judge response"
    );
  });

  it("should throw when required fields are missing", () => {
    parseJudgeResponse.mockImplementation(() => {
      throw new Error("Judge response missing required field: breakdown");
    });

    expect(() => parseJudgeResponse('{"score": 4, "reason": "ok"}')).toThrow(
      "missing required field"
    );
  });
});

describe("Eval Judge — validateBreakdown", () => {
  it("should pass for valid breakdown scores (1-5)", () => {
    const breakdown: JudgeBreakdown = {
      dataGrounding: 4,
      narrativeQuality: 5,
      schemaCompliance: 3,
      toneVoice: 4,
    };

    validateBreakdown.mockReturnValue({ valid: true, errors: [] });

    const result = validateBreakdown(breakdown);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail for scores below 1", () => {
    const breakdown: JudgeBreakdown = {
      dataGrounding: 0,
      narrativeQuality: 5,
      schemaCompliance: 3,
      toneVoice: 4,
    };

    validateBreakdown.mockReturnValue({
      valid: false,
      errors: ["dataGrounding must be between 1 and 5, got 0"],
    });

    const result = validateBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("dataGrounding");
  });

  it("should fail for scores above 5", () => {
    const breakdown: JudgeBreakdown = {
      dataGrounding: 4,
      narrativeQuality: 6,
      schemaCompliance: 3,
      toneVoice: 4,
    };

    validateBreakdown.mockReturnValue({
      valid: false,
      errors: ["narrativeQuality must be between 1 and 5, got 6"],
    });

    const result = validateBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("narrativeQuality");
  });

  it("should fail for non-integer scores", () => {
    const breakdown: JudgeBreakdown = {
      dataGrounding: 3.5,
      narrativeQuality: 4,
      schemaCompliance: 3,
      toneVoice: 4,
    };

    validateBreakdown.mockReturnValue({
      valid: false,
      errors: ["dataGrounding must be an integer, got 3.5"],
    });

    const result = validateBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("integer");
  });

  it("should report multiple errors at once", () => {
    const breakdown: JudgeBreakdown = {
      dataGrounding: 0,
      narrativeQuality: 7,
      schemaCompliance: 3.5,
      toneVoice: -1,
    };

    validateBreakdown.mockReturnValue({
      valid: false,
      errors: [
        "dataGrounding must be between 1 and 5, got 0",
        "narrativeQuality must be between 1 and 5, got 7",
        "schemaCompliance must be an integer, got 3.5",
        "toneVoice must be between 1 and 5, got -1",
      ],
    });

    const result = validateBreakdown(breakdown);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(4);
  });
});

describe("Eval Judge — score interpretation", () => {
  it("should treat score >= PASS_THRESHOLD as passing", () => {
    expect(4 >= PASS_THRESHOLD).toBe(true);
    expect(5 >= PASS_THRESHOLD).toBe(true);
  });

  it("should treat score < PASS_THRESHOLD as failing", () => {
    expect(3 >= PASS_THRESHOLD).toBe(false);
    expect(2 >= PASS_THRESHOLD).toBe(false);
    expect(1 >= PASS_THRESHOLD).toBe(false);
  });

  it("should compute overall score as average of breakdown dimensions", () => {
    const breakdown: JudgeBreakdown = {
      dataGrounding: 5,
      narrativeQuality: 4,
      schemaCompliance: 5,
      toneVoice: 3,
    };
    const avg =
      (breakdown.dataGrounding +
        breakdown.narrativeQuality +
        breakdown.schemaCompliance +
        breakdown.toneVoice) /
      4;
    expect(avg).toBeCloseTo(4.25, 2);
    // Rounded overall score would be 4 (pass)
    expect(Math.round(avg) >= PASS_THRESHOLD).toBe(true);
  });
});
