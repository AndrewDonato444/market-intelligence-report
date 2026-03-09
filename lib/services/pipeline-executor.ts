/**
 * Pipeline Executor Service
 *
 * The execution glue that connects report creation to the agent pipeline.
 * Fetches report + market data, runs the agent pipeline, saves sections
 * to the database, and updates report status.
 */

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  createPipelineRunner,
  type MarketData,
  type PipelineOptions,
  type PipelineProgress,
  type PipelineRunner,
} from "@/lib/agents/orchestrator";
import { SECTION_REGISTRY } from "@/lib/agents/schema";

// Agent definitions
import { dataAnalystAgent } from "@/lib/agents/data-analyst";
import { insightGeneratorAgent } from "@/lib/agents/insight-generator";
import { competitiveAnalystAgent } from "@/lib/agents/competitive-analyst";
import { forecastModelerAgent } from "@/lib/agents/forecast-modeler";
import { polishAgent } from "@/lib/agents/polish-agent";

// --- All agents in pipeline order ---

const ALL_AGENTS = [
  dataAnalystAgent,
  insightGeneratorAgent,
  competitiveAnalystAgent,
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
 * Execute the full agent pipeline for a report.
 *
 * This is the main entry point that:
 * 1. Fetches report + market from DB
 * 2. Updates report status to "generating"
 * 3. Runs the pipeline
 * 4. Saves sections to report_sections table
 * 5. Updates report status to "completed" or "failed"
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

  // 4. Build pipeline options
  const marketData = convertMarketToMarketData(market);
  const reportConfig = {
    sections: (report.config as any)?.sections,
    dateRange: (report.config as any)?.dateRange,
    customPrompts: (report.config as any)?.customPrompts,
  };

  const pipelineRunner = getRunner();

  try {
    const result = await pipelineRunner.run(reportId, {
      userId: report.userId,
      market: marketData,
      reportConfig,
    });

    if (result.status === "failed") {
      // Pipeline returned failure
      await db
        .update(schema.reports)
        .set({
          status: "failed",
          errorMessage: result.error ?? "Pipeline failed",
          generationCompletedAt: new Date(),
        })
        .where(eq(schema.reports.id, reportId));
      return;
    }

    // 5. Save sections to report_sections table
    for (const section of result.sections) {
      const registryEntry = SECTION_REGISTRY.find(
        (r) => r.sectionType === section.sectionType
      );
      const sortOrder = registryEntry?.reportOrder ?? 99;

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

    // 6. Update report to completed
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
