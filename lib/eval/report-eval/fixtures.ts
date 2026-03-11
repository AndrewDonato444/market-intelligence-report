/**
 * Report Eval Fixtures
 *
 * Pre-built AssembledReport objects for report-level evaluation.
 * Each fixture is produced by calling assembleReport() with data from
 * the existing agent-level eval fixtures, ensuring realistic report structure.
 */

import type { ReportEvalFixture } from "./types";
import { assembleReport } from "@/lib/agents/report-assembler";
import type { AssemblyDurations } from "@/lib/agents/report-assembler";
import {
  EVAL_FIXTURES,
  getFixture,
} from "@/lib/eval/fixtures";

// --- Default durations for fixtures ---

const defaultDurations: AssemblyDurations = {
  fetchMs: 3200,
  computeMs: 450,
  agentDurations: {
    "insight-generator": 12000,
    "forecast-modeler": 10000,
    "polish-agent": 8000,
  },
};

// --- Build assembled reports from existing eval fixtures ---

function buildReportFromFixture(
  fixtureId: string,
  durations: AssemblyDurations = defaultDurations
) {
  const fixture = getFixture(fixtureId);
  const agentResults = fixture.upstreamResults ?? {};
  return assembleReport(fixture.computedAnalytics, agentResults, durations);
}

// --- Fixture registry ---

export const REPORT_EVAL_FIXTURES: Record<string, ReportEvalFixture> = {
  "report-strong-market": {
    id: "report-strong-market",
    name: "Palm Beach Strong Market (Full Report)",
    description:
      "Complete 9-section report from strong market with full upstream agent results",
    report: buildReportFromFixture("fixture-strong-market-upstream"),
    sourceFixtureId: "fixture-strong-market-upstream",
  },
  "report-empty-market": {
    id: "report-empty-market",
    name: "Eureka Empty Market (Full Report)",
    description:
      "9-section report from zero-property market — tests graceful degradation",
    report: buildReportFromFixture("fixture-empty-market"),
    sourceFixtureId: "fixture-empty-market",
  },
  "report-low-data": {
    id: "report-low-data",
    name: "Big Sky Low Data (Full Report)",
    description:
      "9-section report from 5-property market — tests low-confidence handling",
    report: buildReportFromFixture("fixture-low-data"),
    sourceFixtureId: "fixture-low-data",
  },
  "report-contradictory": {
    id: "report-contradictory",
    name: "Contradictory Upstream (Full Report)",
    description:
      "Report where insight-generator and forecast-modeler contradict each other",
    report: buildReportFromFixture("fixture-contradictory-upstream"),
    sourceFixtureId: "fixture-contradictory-upstream",
  },
  "report-single-segment": {
    id: "report-single-segment",
    name: "Aspen Single Segment (Full Report)",
    description:
      "Report from single-segment market — tests handling of limited segment diversity",
    report: buildReportFromFixture("fixture-single-segment"),
    sourceFixtureId: "fixture-single-segment",
  },
  "report-ultra-luxury": {
    id: "report-ultra-luxury",
    name: "Beverly Hills Ultra Luxury (Full Report)",
    description:
      "Report from $10M+ market — tests ultra-luxury vocabulary and scaling",
    report: buildReportFromFixture("fixture-ultra-luxury"),
    sourceFixtureId: "fixture-ultra-luxury",
  },
  "report-stale-sources": {
    id: "report-stale-sources",
    name: "Miami Beach Stale Sources (Full Report)",
    description:
      "Report with stale data sources — tests methodology transparency",
    report: buildReportFromFixture("fixture-stale-sources"),
    sourceFixtureId: "fixture-stale-sources",
  },
  "report-partial-upstream": {
    id: "report-partial-upstream",
    name: "Partial Upstream — No Forecast (Full Report)",
    description:
      "Report where forecast-modeler is missing — tests graceful section handling",
    report: buildReportFromFixture("fixture-partial-upstream"),
    sourceFixtureId: "fixture-partial-upstream",
  },
};

/** Get a report fixture by ID or throw */
export function getReportFixture(id: string): ReportEvalFixture {
  const fixture = REPORT_EVAL_FIXTURES[id];
  if (!fixture) throw new Error(`Unknown report eval fixture: ${id}`);
  return fixture;
}

/** List all fixture IDs */
export function listReportFixtureIds(): string[] {
  return Object.keys(REPORT_EVAL_FIXTURES);
}

/** Summarize a report fixture for the judge prompt */
export function summarizeReportFixture(fixture: ReportEvalFixture): string {
  const { report } = fixture;
  const lines: string[] = [
    `Report: ${fixture.name}`,
    `Sections: ${report.sections.length}`,
    `Confidence: ${report.metadata.confidence.level} (sample: ${report.metadata.confidence.sampleSize})`,
    "",
    "Section breakdown:",
  ];

  for (const section of report.sections) {
    const content = section.content as Record<string, unknown>;
    const hasNarrative = content.narrative != null || content.editorial != null || content.forecast != null;
    lines.push(
      `  ${section.sectionNumber}. ${section.title} (${section.sectionType}) — ${hasNarrative ? "has narrative" : "data only"}`
    );
  }

  if (report.metadata.confidence.staleDataSources.length > 0) {
    lines.push(
      `\nStale sources: ${report.metadata.confidence.staleDataSources.join(", ")}`
    );
  }

  return lines.join("\n");
}
