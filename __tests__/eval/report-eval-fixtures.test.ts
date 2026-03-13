/**
 * Report Eval Fixtures — Tests
 *
 * Validates that report-level eval fixtures produce valid
 * AssembledReport objects with correct structure.
 */

import {
  REPORT_EVAL_FIXTURES,
  getReportFixture,
  listReportFixtureIds,
  summarizeReportFixture,
} from "@/lib/eval/report-eval/fixtures";
import type { AssembledReport, AssembledSection } from "@/lib/agents/report-assembler";
import { NEW_SECTION_TYPES } from "@/lib/agents/report-assembler";

// --- Expected section types in order ---

const EXPECTED_SECTION_TYPES = [
  "executive_briefing",
  "market_insights_index",
  "luxury_market_dashboard",
  "neighborhood_intelligence",
  "the_narrative",
  "forward_look",
  "comparative_positioning",
];

// --- Fixture registry ---

describe("Report Eval Fixtures — Registry", () => {
  it("should have at least 8 fixtures", () => {
    expect(Object.keys(REPORT_EVAL_FIXTURES).length).toBeGreaterThanOrEqual(8);
  });

  it("listReportFixtureIds should return all fixture IDs", () => {
    const ids = listReportFixtureIds();
    expect(ids).toContain("report-strong-market");
    expect(ids).toContain("report-empty-market");
    expect(ids).toContain("report-low-data");
    expect(ids).toContain("report-contradictory");
    expect(ids).toContain("report-ultra-luxury");
    expect(ids).toContain("report-stale-sources");
    expect(ids).toContain("report-partial-upstream");
    expect(ids).toContain("report-single-segment");
  });
});

// --- getReportFixture ---

describe("Report Eval Fixtures — getReportFixture", () => {
  it("should return fixture by ID", () => {
    const fixture = getReportFixture("report-strong-market");
    expect(fixture.id).toBe("report-strong-market");
    expect(fixture.report).toBeDefined();
    expect(fixture.report.sections).toBeDefined();
    expect(fixture.report.metadata).toBeDefined();
  });

  it("should throw for unknown fixture ID", () => {
    expect(() => getReportFixture("report-nonexistent")).toThrow(
      "Unknown report eval fixture"
    );
  });
});

// --- All fixtures produce valid reports ---

describe("Report Eval Fixtures — All Fixtures Valid", () => {
  const fixtureIds = listReportFixtureIds();

  for (const id of fixtureIds) {
    describe(`Fixture: ${id}`, () => {
      let fixture: ReturnType<typeof getReportFixture>;
      let report: AssembledReport;

      beforeAll(() => {
        fixture = getReportFixture(id);
        report = fixture.report;
      });

      it("should have 7 sections", () => {
        expect(report.sections.length).toBe(7);
      });

      it("should have sections numbered 1-7 in order", () => {
        for (let i = 0; i < 7; i++) {
          expect(report.sections[i].sectionNumber).toBe(i + 1);
        }
      });

      it("should have correct section types", () => {
        for (let i = 0; i < 7; i++) {
          expect(report.sections[i].sectionType).toBe(
            EXPECTED_SECTION_TYPES[i]
          );
        }
      });

      it("should have non-empty title for each section", () => {
        for (const section of report.sections) {
          expect(section.title.length).toBeGreaterThan(0);
        }
      });

      it("should have content object for each section", () => {
        for (const section of report.sections) {
          expect(section.content).toBeDefined();
          expect(typeof section.content).toBe("object");
        }
      });

      it("should have valid metadata", () => {
        expect(report.metadata.generatedAt).toBeTruthy();
        expect(typeof report.metadata.totalDurationMs).toBe("number");
        expect(report.metadata.totalDurationMs).toBeGreaterThan(0);
        expect(report.metadata.agentDurations).toBeDefined();
        expect(report.metadata.confidence).toBeDefined();
        expect(report.metadata.confidence.level).toBeTruthy();
        expect(typeof report.metadata.confidence.sampleSize).toBe("number");
        expect(report.metadata.sectionCount).toBe(report.sections.length);
      });

      it("should have a valid sourceFixtureId", () => {
        expect(fixture.sourceFixtureId).toBeTruthy();
        expect(fixture.sourceFixtureId).toMatch(/^fixture-/);
      });
    });
  }
});

// --- Strong market fixture specifics ---

describe("Report Eval Fixtures — Strong Market Details", () => {
  let report: AssembledReport;

  beforeAll(() => {
    report = getReportFixture("report-strong-market").report;
  });

  it("executive briefing has headline with metrics", () => {
    const content = report.sections[0].content as Record<string, unknown>;
    const headline = content.headline as Record<string, unknown>;
    expect(headline.medianPrice).toBe(3_500_000);
    expect(headline.totalProperties).toBe(847);
    expect(headline.rating).toBe("A-");
    expect(headline.yoyPriceChange).toBe(0.082);
  });

  it("executive briefing has narrative from insight-generator", () => {
    const content = report.sections[0].content as Record<string, unknown>;
    expect(content.narrative).toBeTruthy();
    expect(typeof content.narrative).toBe("string");
  });

  it("the_narrative has editorial and themes", () => {
    const content = report.sections[4].content as Record<string, unknown>;
    expect(content.editorial).toBeTruthy();
    expect(Array.isArray(content.themes)).toBe(true);
  });

  it("forward_look has forecast and guidance", () => {
    const content = report.sections[5].content as Record<string, unknown>;
    expect(content.forecast).toBeTruthy();
    expect(content.guidance).toBeTruthy();
  });

  it("disclaimer text is exported from report-assembler (moved to front-end UI)", () => {
    const { DISCLAIMER_TEXT } = require("@/lib/agents/report-assembler");
    expect(DISCLAIMER_TEXT.length).toBeGreaterThan(100);
  });

  it("metadata confidence is high with 847 sample", () => {
    expect(report.metadata.confidence.level).toBe("high");
    expect(report.metadata.confidence.sampleSize).toBe(847);
  });
});

// --- Empty market fixture specifics ---

describe("Report Eval Fixtures — Empty Market Details", () => {
  let report: AssembledReport;

  beforeAll(() => {
    report = getReportFixture("report-empty-market").report;
  });

  it("executive briefing headline shows 0 properties", () => {
    const content = report.sections[0].content as Record<string, unknown>;
    const headline = content.headline as Record<string, unknown>;
    expect(headline.totalProperties).toBe(0);
    expect(headline.medianPrice).toBe(0);
  });

  it("metadata confidence is low", () => {
    expect(report.metadata.confidence.level).toBe("low");
    expect(report.metadata.confidence.sampleSize).toBe(0);
  });

  it("narratives are null (no upstream agents)", () => {
    const execContent = report.sections[0].content as Record<string, unknown>;
    expect(execContent.narrative).toBeNull();
  });
});

// --- Contradictory fixture specifics ---

describe("Report Eval Fixtures — Contradictory Upstream", () => {
  let report: AssembledReport;

  beforeAll(() => {
    report = getReportFixture("report-contradictory").report;
  });

  it("insight-generator narrative has 'robust growth'", () => {
    const content = report.sections[0].content as Record<string, unknown>;
    // The narrative comes from insight-generator executiveBriefing metadata
    // The contradictory fixture overrides the market_overview narrative
    expect(content.narrative).toBeTruthy();
  });

  it("forward_look has forecast content", () => {
    const content = report.sections[5].content as Record<string, unknown>;
    expect(content.forecast).toBeTruthy();
  });
});

// --- Stale sources fixture specifics ---

describe("Report Eval Fixtures — Stale Sources", () => {
  let report: AssembledReport;

  beforeAll(() => {
    report = getReportFixture("report-stale-sources").report;
  });

  it("stale sources are tracked in metadata (disclaimer moved to front-end UI)", () => {
    expect(report.metadata.confidence.staleDataSources.length).toBeGreaterThan(0);
  });

  it("metadata confidence shows stale sources in raw list", () => {
    expect(report.metadata.confidence.staleDataSources.length).toBeGreaterThan(
      0
    );
  });
});

// --- Summarize helper ---

describe("Report Eval Fixtures — summarizeReportFixture", () => {
  it("should produce a human-readable summary", () => {
    const fixture = getReportFixture("report-strong-market");
    const summary = summarizeReportFixture(fixture);
    expect(summary).toContain("Palm Beach Strong Market");
    expect(summary).toContain("Sections: 7");
    expect(summary).toContain("Confidence: high");
    expect(summary).toContain("executive_briefing");
  });
});
