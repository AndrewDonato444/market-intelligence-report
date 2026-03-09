/**
 * Pipeline Executor Service — v2 (4-Layer Architecture)
 *
 * Orchestrates the full report generation pipeline:
 *   Layer 0: Data Fetch   → CompiledMarketData  (all API calls)
 *   Layer 1: Computation  → ComputedAnalytics    (pure math)
 *   Layer 2: Agents (×3)  → narrative sections   (Claude only)
 *   Layer 3: Assembly     → 9-section report     (merge data + narrative)
 *
 * Agents no longer call APIs directly — they receive pre-computed analytics.
 */

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  createPipelineRunner,
  type MarketData,
  type PipelineProgress,
  type PipelineRunner,
} from "@/lib/agents/orchestrator";
import { SECTION_REGISTRY_V2 } from "@/lib/agents/schema";
import { fetchAllMarketData } from "@/lib/services/data-fetcher";
import { computeMarketAnalytics } from "@/lib/services/market-analytics";
import {
  assembleReport as assembleV2Report,
  type AssemblyDurations,
} from "@/lib/agents/report-assembler";

// Agent definitions — v2 pipeline uses only 3 Claude agents
import { insightGeneratorAgent } from "@/lib/agents/insight-generator";
import { forecastModelerAgent } from "@/lib/agents/forecast-modeler";
import { polishAgent } from "@/lib/agents/polish-agent";

// --- All agents in pipeline order (v2: 3 agents, no data-analyst / competitive-analyst) ---

const ALL_AGENTS = [
  insightGeneratorAgent,
  forecastModelerAgent,
  polishAgent,
];

// --- Singleton runner ---

let runner: PipelineRunner | null = null;

function getRunner(): PipelineRunner {
  if (!runner) {
    runner = createPipelineRunner(ALL_AGENTS);
  }
  return runner;
}

// --- Market conversion ---

/**
 * Converts a DB market row to the MarketData interface expected by the pipeline.
 */
export function convertMarketToMarketData(market: {
  name: string;
  geography: { city: string; state: string; county?: string; region?: string; zipCodes?: string[] };
  luxuryTier: "luxury" | "high_luxury" | "ultra_luxury";
  priceFloor: number;
  priceCeiling?: number | null;
  segments?: string[] | null;
  propertyTypes?: string[] | null;
  focusAreas?: string[] | null;
  peerMarkets?: Array<{ name: string; geography: { city: string; state: string } }> | null;
}): MarketData {
  return {
    name: market.name,
    geography: market.geography,
    luxuryTier: market.luxuryTier,
    priceFloor: market.priceFloor,
    priceCeiling: market.priceCeiling ?? null,
    segments: market.segments ?? undefined,
    propertyTypes: market.propertyTypes ?? undefined,
    focusAreas: market.focusAreas ?? undefined,
    peerMarkets: market.peerMarkets ?? undefined,
  };
}

// --- Pipeline execution ---

/**
 * Execute the full 4-layer pipeline for a report.
 *
 * 1. Fetch report + market from DB
 * 2. Update report status to "generating"
 * 3. Layer 0: fetchAllMarketData() — all API calls
 * 4. Layer 1: computeMarketAnalytics() — pure computation
 * 5. Layer 2: pipeline runner with 3 Claude agents + computedAnalytics
 * 6. Layer 3: assembleReport() — merge data + narratives into 9 sections
 * 7. Save 9 sections to report_sections table
 * 8. Update report status to "completed" or "failed"
 */
export async function executePipeline(reportId: string): Promise<void> {
  // 1. Fetch report
  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId))
    .limit(1);

  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }

  // 2. Fetch market
  const [market] = await db
    .select()
    .from(schema.markets)
    .where(eq(schema.markets.id, report.marketId))
    .limit(1);

  if (!market) {
    throw new Error(`Market not found: ${report.marketId}`);
  }

  // 3. Update status to "generating"
  await db
    .update(schema.reports)
    .set({
      status: "generating",
      generationStartedAt: new Date(),
    })
    .where(eq(schema.reports.id, reportId));

  const marketData = convertMarketToMarketData(market);
  const reportConfig = {
    sections: (report.config as any)?.sections,
    dateRange: (report.config as any)?.dateRange,
    customPrompts: (report.config as any)?.customPrompts,
  };

  const abortController = new AbortController();

  try {
    // --- Layer 0: Data Fetch ---
    const fetchStart = Date.now();
    const compiledData = await fetchAllMarketData({
      userId: report.userId,
      reportId,
      market: marketData,
      abortSignal: abortController.signal,
    });
    const fetchMs = Date.now() - fetchStart;

    // --- Layer 1: Computation ---
    const computeStart = Date.now();
    const computedAnalytics = computeMarketAnalytics(compiledData, marketData);
    const computeMs = Date.now() - computeStart;

    // --- Layer 2: Claude Agents (3 agents, all receive computedAnalytics) ---
    const pipelineRunner = getRunner();
    const agentResult = await pipelineRunner.run(reportId, {
      userId: report.userId,
      market: marketData,
      reportConfig,
      computedAnalytics,
    });

    if (agentResult.status === "failed") {
      await db
        .update(schema.reports)
        .set({
          status: "failed",
          errorMessage: agentResult.error ?? "Pipeline failed",
          generationCompletedAt: new Date(),
        })
        .where(eq(schema.reports.id, reportId));
      return;
    }

    // --- Layer 3: Assembly ---
    // Collect all agent results from the pipeline result
    const agentResults: Record<string, import("@/lib/agents/orchestrator").AgentResult> = {};
    for (const section of agentResult.sections) {
      // We need the full AgentResult objects; reconstruct from pipeline timings
      // The pipeline runner already tracked per-agent results internally,
      // but only returns flattened sections. Rebuild from section types.
    }

    // Build agent results map from pipeline output
    // Group sections by their source agent using the v2 registry
    for (const agentName of ["insight-generator", "forecast-modeler", "polish-agent"]) {
      const agentSections = agentResult.sections.filter((s) => {
        const entry = SECTION_REGISTRY_V2.find((r) => r.sectionType === s.sectionType);
        return entry?.sourceAgent === agentName;
      });
      if (agentSections.length > 0 || agentResult.agentTimings[agentName]) {
        agentResults[agentName] = {
          agentName,
          sections: agentSections,
          metadata: {}, // Narratives come from pipeline runner metadata
          durationMs: agentResult.agentTimings[agentName] ?? 0,
        };
      }
    }

    const durations: AssemblyDurations = {
      fetchMs,
      computeMs,
      agentDurations: agentResult.agentTimings,
    };

    const assembled = assembleV2Report(computedAnalytics, agentResults, durations);

    // 7. Save 9 sections to report_sections table
    for (const section of assembled.sections) {
      const registryEntry = SECTION_REGISTRY_V2.find(
        (r) => r.sectionType === section.sectionType
      );
      const sortOrder = registryEntry?.reportOrder ?? section.sectionNumber;

      await db
        .insert(schema.reportSections)
        .values({
          reportId,
          sectionType: section.sectionType as any,
          title: section.title,
          content: section.content,
          agentName: registryEntry?.sourceAgent ?? null,
          sortOrder,
          generatedAt: new Date(),
        })
        .returning();
    }

    // 8. Update report to completed
    await db
      .update(schema.reports)
      .set({
        status: "completed",
        generationCompletedAt: new Date(),
      })
      .where(eq(schema.reports.id, reportId));
  } catch (err) {
    // Pipeline threw an exception
    const errorMessage =
      err instanceof Error ? err.message : String(err);

    await db
      .update(schema.reports)
      .set({
        status: "failed",
        errorMessage,
        generationCompletedAt: new Date(),
      })
      .where(eq(schema.reports.id, reportId));
  }
}

// --- Progress tracking ---

/**
 * Get real-time execution progress for a report pipeline.
 */
export function getExecutionProgress(reportId: string): PipelineProgress {
  const pipelineRunner = getRunner();
  return pipelineRunner.getProgress(reportId);
}

/**
 * Cancel a running pipeline for a report.
 */
export function cancelPipeline(reportId: string): void {
  const pipelineRunner = getRunner();
  pipelineRunner.cancel(reportId);
}
