/**
 * Pipeline Test Runner — runs Layers 1→2→3 from a frozen CompiledMarketData snapshot.
 *
 * Unlike the production pipeline-executor:
 *   - Skips Layer 0 (no API calls)
 *   - Does NOT write to `reports` or `report_sections` tables
 *   - Returns all intermediate results for inspection
 *   - Stores results in `pipeline_test_runs` table
 */

import {
  createPipelineRunner,
  type MarketData,
  type PipelineRunner,
} from "@/lib/agents/orchestrator";
import { computeMarketAnalytics, type ComputedAnalytics } from "@/lib/services/market-analytics";
import {
  assembleReport,
  type AssemblyDurations,
} from "@/lib/agents/report-assembler";
import type { CompiledMarketData } from "@/lib/services/data-fetcher";

// Agent definitions — same as production pipeline
import { insightGeneratorAgent } from "@/lib/agents/insight-generator";
import { forecastModelerAgent } from "@/lib/agents/forecast-modeler";
import { polishAgent } from "@/lib/agents/polish-agent";
import { personaIntelligenceAgent } from "@/lib/agents/persona-intelligence";

const ALL_AGENTS = [
  insightGeneratorAgent,
  forecastModelerAgent,
  polishAgent,
  personaIntelligenceAgent,
];

let runner: PipelineRunner | null = null;

function getRunner(): PipelineRunner {
  if (!runner) {
    runner = createPipelineRunner(ALL_AGENTS);
  }
  return runner;
}

// --- Types ---

export interface TestRunInput {
  snapshotId: string;
  compiledData: CompiledMarketData;
  marketName: string;
  geography: { city: string; state: string; county?: string };
  useDraftPrompts?: boolean;
  /** Real report ID for DB lookups (e.g., persona agent queries report_personas). Falls back to snapshotId if not provided. */
  sourceReportId?: string | null;
}

export interface TestRunResult {
  runId: string;
  status: "completed" | "failed";
  computedAnalytics: ComputedAnalytics | null;
  agentResults: Record<string, unknown> | null;
  reportSections: Array<{ sectionType: string; title: string; content: unknown }>;
  layerDurations: { layer1Ms: number; layer2Ms: number; layer3Ms: number };
  error?: { layer: number; message: string; agent?: string };
}

// --- Runner ---

export async function runPipelineTest(input: TestRunInput): Promise<TestRunResult> {
  const { snapshotId, compiledData, marketName, geography, useDraftPrompts, sourceReportId } = input;

  const marketData: MarketData = {
    name: marketName,
    geography,
    luxuryTier: "luxury",
    priceFloor: 1_000_000,
  };

  let computedAnalytics: ComputedAnalytics | null = null;
  let agentResults: Record<string, unknown> | null = null;
  const reportSections: Array<{ sectionType: string; title: string; content: unknown }> = [];
  const layerDurations = { layer1Ms: 0, layer2Ms: 0, layer3Ms: 0 };

  // --- Layer 1: Computation ---
  const l1Start = Date.now();
  try {
    computedAnalytics = computeMarketAnalytics(compiledData, marketData);
    layerDurations.layer1Ms = Date.now() - l1Start;
  } catch (err) {
    layerDurations.layer1Ms = Date.now() - l1Start;
    return {
      runId: snapshotId,
      status: "failed",
      computedAnalytics: null,
      agentResults: null,
      reportSections: [],
      layerDurations,
      error: {
        layer: 1,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  // --- Layer 2: Claude Agents ---
  const l2Start = Date.now();
  try {
    const pipelineRunner = getRunner();
    // Use source report ID if available so DB lookups (e.g., report_personas) work
    const reportId = sourceReportId ?? snapshotId;
    const result = await pipelineRunner.run(reportId, {
      userId: "test-suite",
      market: marketData,
      reportConfig: {
        customPrompts: useDraftPrompts ? { draft: true } : undefined,
      },
      computedAnalytics,
    });
    layerDurations.layer2Ms = Date.now() - l2Start;

    if (result.status === "failed") {
      const failedAgent = Object.keys(result.agentTimings).pop() ?? "unknown";
      return {
        runId: snapshotId,
        status: "failed",
        computedAnalytics,
        agentResults: result.agentResults ?? null,
        reportSections: [],
        layerDurations,
        error: {
          layer: 2,
          message: result.error ?? "Agent pipeline failed",
          agent: failedAgent,
        },
      };
    }

    agentResults = result.agentResults ?? {};
  } catch (err) {
    layerDurations.layer2Ms = Date.now() - l2Start;
    return {
      runId: snapshotId,
      status: "failed",
      computedAnalytics,
      agentResults: null,
      reportSections: [],
      layerDurations,
      error: {
        layer: 2,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  // --- Layer 3: Assembly ---
  const l3Start = Date.now();
  try {
    const durations: AssemblyDurations = {
      fetchMs: 0, // No fetch in test mode
      computeMs: layerDurations.layer1Ms,
      agentDurations: {},
    };

    const assembled = assembleReport(
      computedAnalytics,
      agentResults as Record<string, import("@/lib/agents/orchestrator").AgentResult>,
      durations
    );
    layerDurations.layer3Ms = Date.now() - l3Start;

    reportSections.push(...assembled.sections.map((s) => ({
      sectionType: s.sectionType,
      title: s.title,
      content: s.content,
    })));
  } catch (err) {
    layerDurations.layer3Ms = Date.now() - l3Start;
    return {
      runId: snapshotId,
      status: "failed",
      computedAnalytics,
      agentResults,
      reportSections: [],
      layerDurations,
      error: {
        layer: 3,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  return {
    runId: snapshotId,
    status: "completed",
    computedAnalytics,
    agentResults,
    reportSections,
    layerDurations,
  };
}
