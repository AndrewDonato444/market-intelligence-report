/**
 * Eval Fixtures Tests
 *
 * Validates that all fixtures are well-formed and test cases
 * reference valid fixtures.
 */

import { EVAL_FIXTURES, getFixture, summarizeFixture } from "@/lib/eval/fixtures";
import { EVAL_TEST_CASES, getTestCase, getTestCasesForAgent, getTestCasesForCategory } from "@/lib/eval/test-cases";

describe("Eval Fixtures", () => {
  describe("fixture registry", () => {
    it("should have 11 fixtures", () => {
      expect(Object.keys(EVAL_FIXTURES)).toHaveLength(11);
    });

    it("should have unique fixture IDs", () => {
      const ids = Object.keys(EVAL_FIXTURES);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it.each(Object.entries(EVAL_FIXTURES))(
      "fixture %s should have required fields",
      (_id, fixture) => {
        expect(fixture.id).toBeTruthy();
        expect(fixture.name).toBeTruthy();
        expect(fixture.description).toBeTruthy();
        expect(fixture.market).toBeDefined();
        expect(fixture.market.name).toBeTruthy();
        expect(fixture.market.geography.city).toBeTruthy();
        expect(fixture.market.geography.state).toBeTruthy();
        expect(fixture.market.luxuryTier).toBeTruthy();
        expect(fixture.computedAnalytics).toBeDefined();
        expect(fixture.computedAnalytics.market).toBeDefined();
        expect(fixture.computedAnalytics.confidence).toBeDefined();
      }
    );
  });

  describe("getFixture", () => {
    it("should return fixture by ID", () => {
      const fixture = getFixture("fixture-strong-market");
      expect(fixture.name).toBe("Palm Beach Strong Market");
    });

    it("should throw for unknown ID", () => {
      expect(() => getFixture("nonexistent")).toThrow("Unknown eval fixture");
    });
  });

  describe("summarizeFixture", () => {
    it("should produce readable summary for strong market", () => {
      const summary = summarizeFixture(getFixture("fixture-strong-market"));
      expect(summary).toContain("Palm Beach");
      expect(summary).toContain("847 properties");
      expect(summary).toContain("$3.5M median");
      expect(summary).toContain("price 8.2%");
      expect(summary).toContain("Confidence: high");
    });

    it("should include segment-level detail for judge context", () => {
      const summary = summarizeFixture(getFixture("fixture-strong-market"));
      expect(summary).toContain("Segments (5):");
      expect(summary).toContain("Waterfront: 124 properties");
      expect(summary).toContain("$1450/sqft");
      expect(summary).toContain("Golf Community: 215 properties");
    });

    it("should handle empty market gracefully", () => {
      const summary = summarizeFixture(getFixture("fixture-empty-market"));
      expect(summary).toContain("0 properties");
      expect(summary).toContain("no data");
      expect(summary).toContain("Confidence: low");
    });

    it("should include stale source info", () => {
      const summary = summarizeFixture(getFixture("fixture-stale-sources"));
      expect(summary).toContain("Stale sources:");
    });
  });

  describe("specific fixture shapes", () => {
    it("strong market should have 5 segments", () => {
      const f = getFixture("fixture-strong-market");
      expect(f.computedAnalytics.segments).toHaveLength(5);
    });

    it("low data should have low confidence and 1 segment", () => {
      const f = getFixture("fixture-low-data");
      expect(f.computedAnalytics.confidence.level).toBe("low");
      expect(f.computedAnalytics.segments).toHaveLength(1);
      expect(f.computedAnalytics.market.totalProperties).toBe(5);
    });

    it("empty market should have 0 properties and no segments", () => {
      const f = getFixture("fixture-empty-market");
      expect(f.computedAnalytics.market.totalProperties).toBe(0);
      expect(f.computedAnalytics.segments).toHaveLength(0);
    });

    it("ultra luxury should have ultra_luxury tier and $15M+ median", () => {
      const f = getFixture("fixture-ultra-luxury");
      expect(f.market.luxuryTier).toBe("ultra_luxury");
      expect(f.computedAnalytics.market.medianPrice).toBeGreaterThanOrEqual(10_000_000);
    });

    it("no-yoy fixture should have null YoY fields", () => {
      const f = getFixture("fixture-no-yoy");
      expect(f.computedAnalytics.yoy.medianPriceChange).toBeNull();
      expect(f.computedAnalytics.yoy.volumeChange).toBeNull();
      expect(f.computedAnalytics.yoy.pricePerSqftChange).toBeNull();
    });

    it("stale sources should flag specific sources", () => {
      const f = getFixture("fixture-stale-sources");
      expect(f.computedAnalytics.confidence.staleDataSources.length).toBeGreaterThan(0);
    });

    it("upstream fixtures should include AgentResult objects", () => {
      const f = getFixture("fixture-strong-market-upstream");
      expect(f.upstreamResults).toBeDefined();
      expect(f.upstreamResults!["insight-generator"]).toBeDefined();
      expect(f.upstreamResults!["forecast-modeler"]).toBeDefined();
      expect(f.upstreamResults!["insight-generator"].sections.length).toBeGreaterThan(0);
    });

    it("contradictory upstream should have conflicting narratives", () => {
      const f = getFixture("fixture-contradictory-upstream");
      const insightOverview = f.upstreamResults!["insight-generator"].sections.find(
        (s) => s.sectionType === "market_overview"
      );
      const forecastSection = f.upstreamResults!["forecast-modeler"].sections.find(
        (s) => s.sectionType === "forecasts"
      );
      expect(insightOverview).toBeDefined();
      expect(forecastSection).toBeDefined();

      // Insight says "robust growth"
      const insightNarrative = (insightOverview!.content as { narrative: string }).narrative;
      expect(insightNarrative).toContain("robust growth");

      // Forecast says negative volume
      const scenarios = (forecastSection!.content as { scenarios: { base: { volumeChange: number } } }).scenarios;
      expect(scenarios.base.volumeChange).toBeLessThan(0);
    });

    it("partial upstream should have only insight-generator", () => {
      const f = getFixture("fixture-partial-upstream");
      expect(f.upstreamResults!["insight-generator"]).toBeDefined();
      expect(f.upstreamResults!["forecast-modeler"]).toBeUndefined();
    });
  });
});

describe("Eval Test Cases", () => {
  describe("test case registry", () => {
    it("should have 24 test cases", () => {
      expect(EVAL_TEST_CASES).toHaveLength(24);
    });

    it("should have unique test case IDs", () => {
      const ids = EVAL_TEST_CASES.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every test case should reference a valid fixture", () => {
      for (const tc of EVAL_TEST_CASES) {
        expect(() => getFixture(tc.fixtureId)).not.toThrow();
      }
    });

    it.each(EVAL_TEST_CASES)(
      "test case $id should have required fields",
      (tc) => {
        expect(tc.id).toBeTruthy();
        expect(tc.description).toBeTruthy();
        expect(tc.agent).toBeTruthy();
        expect(tc.category).toBeTruthy();
        expect(tc.fixtureId).toBeTruthy();
        expect(tc.expectedRubric).toBeTruthy();
        expect(tc.expectedRubric.length).toBeGreaterThan(20);
      }
    );
  });

  describe("agent distribution", () => {
    it("should have 10 insight-generator cases", () => {
      expect(getTestCasesForAgent("insight-generator")).toHaveLength(10);
    });

    it("should have 8 forecast-modeler cases", () => {
      expect(getTestCasesForAgent("forecast-modeler")).toHaveLength(8);
    });

    it("should have 6 polish-agent cases", () => {
      expect(getTestCasesForAgent("polish-agent")).toHaveLength(6);
    });
  });

  describe("category distribution", () => {
    it("should cover all 6 categories", () => {
      const categories = new Set(EVAL_TEST_CASES.map((t) => t.category));
      expect(categories).toEqual(
        new Set([
          "narrative-quality",
          "data-grounding",
          "schema-compliance",
          "tone-voice",
          "edge-case",
          "cross-section",
        ])
      );
    });
  });

  describe("getTestCase", () => {
    it("should return test case by ID", () => {
      const tc = getTestCase("tc-01");
      expect(tc.agent).toBe("insight-generator");
    });

    it("should throw for unknown ID", () => {
      expect(() => getTestCase("tc-99")).toThrow("Unknown eval test case");
    });
  });

  describe("polish-agent test cases reference upstream fixtures", () => {
    const polishCases = getTestCasesForAgent("polish-agent");

    it.each(polishCases)(
      "polish case $id should use a fixture with upstream results",
      (tc) => {
        const fixture = getFixture(tc.fixtureId);
        expect(fixture.upstreamResults).toBeDefined();
        expect(fixture.upstreamResults!["insight-generator"]).toBeDefined();
      }
    );
  });

  describe("schema-check test cases have requiredFields", () => {
    const schemaCases = EVAL_TEST_CASES.filter((t) => t.schemaCheck);

    it("should have at least 4 schema-check cases", () => {
      expect(schemaCases.length).toBeGreaterThanOrEqual(4);
    });

    it.each(schemaCases)(
      "schema-check case $id should have requiredFields defined",
      (tc) => {
        expect(tc.requiredFields).toBeDefined();
        expect(tc.requiredFields!.length).toBeGreaterThan(0);
      }
    );
  });
});
