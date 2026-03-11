/**
 * Re-run Report Pipeline
 *
 * Re-generates an existing report through the full 4-layer pipeline.
 * Deletes old sections and replaces them with fresh output (including narratives).
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/rerun-report.ts --report=<report-id>
 */

import * as path from "node:path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "..", ".env.local"),
  override: true,
});

async function main() {
  // Parse args
  const reportId = process.argv
    .find((a) => a.startsWith("--report="))
    ?.split("=")[1];

  if (!reportId) {
    console.error("Usage: npx tsx scripts/rerun-report.ts --report=<report-id>");
    process.exit(1);
  }

  console.log(`\n=== Re-running report: ${reportId} ===\n`);

  // Dynamic imports (env must be loaded first)
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  const { fetchAllMarketData } = await import("@/lib/services/data-fetcher");
  const { computeMarketAnalytics } = await import(
    "@/lib/services/market-analytics"
  );
  const { createPipelineRunner } = await import("@/lib/agents/orchestrator");
  const { assembleReport: assembleV2Report } = await import(
    "@/lib/agents/report-assembler"
  );
  const { SECTION_REGISTRY_V2 } = await import("@/lib/agents/schema");
  const { convertMarketToMarketData } = await import(
    "@/lib/services/pipeline-executor"
  );
  const { insightGeneratorAgent } = await import(
    "@/lib/agents/insight-generator"
  );
  const { forecastModelerAgent } = await import(
    "@/lib/agents/forecast-modeler"
  );
  const { polishAgent } = await import("@/lib/agents/polish-agent");
  const { personaIntelligenceAgent } = await import(
    "@/lib/agents/persona-intelligence"
  );

  // 1. Fetch report
  const [report] = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, reportId))
    .limit(1);

  if (!report) {
    console.error(`Report not found: ${reportId}`);
    process.exit(1);
  }

  console.log(`Report: ${report.title}`);
  console.log(`Status: ${report.status}`);

  // 2. Fetch market
  const [market] = await db
    .select()
    .from(schema.markets)
    .where(eq(schema.markets.id, report.marketId))
    .limit(1);

  if (!market) {
    console.error(`Market not found: ${report.marketId}`);
    process.exit(1);
  }

  console.log(`Market: ${market.name}`);

  const marketData = convertMarketToMarketData(market);
  const reportConfig = {
    sections: (report.config as Record<string, unknown>)?.sections as string[] | undefined,
  };

  // 3. Delete old sections
  const deleted = await db
    .delete(schema.reportSections)
    .where(eq(schema.reportSections.reportId, reportId))
    .returning({ id: schema.reportSections.id });

  console.log(`\nDeleted ${deleted.length} old sections`);

  // 4. Update status
  await db
    .update(schema.reports)
    .set({ status: "generating", generationStartedAt: new Date() })
    .where(eq(schema.reports.id, reportId));

  const abortController = new AbortController();

  try {
    // --- Layer 0: Data Fetch ---
    console.log("\n[Layer 0] Fetching market data...");
    const fetchStart = Date.now();
    const compiledData = await fetchAllMarketData({
      userId: report.userId,
      reportId,
      market: marketData,
      abortSignal: abortController.signal,
    });
    const fetchMs = Date.now() - fetchStart;
    console.log(`[Layer 0] Done in ${fetchMs}ms — ${compiledData.targetMarket.properties.length} properties`);

    // --- Layer 1: Computation ---
    console.log("\n[Layer 1] Computing analytics...");
    const computeStart = Date.now();
    const computedAnalytics = computeMarketAnalytics(compiledData, marketData);
    const computeMs = Date.now() - computeStart;
    console.log(`[Layer 1] Done in ${computeMs}ms — rating: ${computedAnalytics.market.rating}`);

    // --- Layer 2: Claude Agents ---
    console.log("\n[Layer 2] Running Claude agents...");
    const runner = createPipelineRunner([
      insightGeneratorAgent,
      forecastModelerAgent,
      polishAgent,
      personaIntelligenceAgent,
    ]);

    const agentResult = await runner.run(reportId, {
      userId: report.userId,
      market: marketData,
      reportConfig,
      computedAnalytics,
    });

    if (agentResult.status === "failed") {
      throw new Error(`Pipeline failed: ${agentResult.error}`);
    }

    console.log(`[Layer 2] Done — ${Object.keys(agentResult.agentTimings).length} agents ran`);
    for (const [name, ms] of Object.entries(agentResult.agentTimings)) {
      const meta = agentResult.agentResults?.[name]?.metadata;
      const metaKeys = meta ? Object.keys(meta).filter((k) => meta[k] != null) : [];
      console.log(`  ${name}: ${ms}ms — metadata keys: [${metaKeys.join(", ")}]`);
    }

    // --- Layer 3: Assembly ---
    console.log("\n[Layer 3] Assembling report...");
    const agentResults = agentResult.agentResults ?? {};
    const durations = {
      fetchMs,
      computeMs,
      agentDurations: agentResult.agentTimings,
    };

    const assembled = assembleV2Report(computedAnalytics, agentResults, durations);
    console.log(`[Layer 3] Done — ${assembled.sections.length} sections`);

    // --- Save sections ---
    console.log("\n[Saving] Inserting sections...");
    for (const section of assembled.sections) {
      const registryEntry = SECTION_REGISTRY_V2.find(
        (r) => r.sectionType === section.sectionType
      );
      const sortOrder = registryEntry?.reportOrder ?? section.sectionNumber;

      try {
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
          });

        // Check narrative content
        const c = section.content as Record<string, unknown>;
        const narrativeFields = ["narrative", "editorial", "forecast", "guidance", "methodology"];
        const filled = narrativeFields.filter((f) => c[f] != null && c[f] !== "");
        console.log(
          `  ${section.sectionType}: ${filled.length > 0 ? `narratives=[${filled.join(", ")}]` : "(data only)"}`
        );
      } catch (err) {
        console.error(
          `  FAILED: ${section.sectionType} — ${err instanceof Error ? err.message : err}`
        );
      }
    }

    // --- Update report status ---
    await db
      .update(schema.reports)
      .set({ status: "completed", generationCompletedAt: new Date() })
      .where(eq(schema.reports.id, reportId));

    const totalMs = Date.now() - fetchStart;
    console.log(`\n=== Complete in ${(totalMs / 1000).toFixed(1)}s ===`);
  } catch (err) {
    console.error("\nPipeline failed:", err);
    await db
      .update(schema.reports)
      .set({
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
        generationCompletedAt: new Date(),
      })
      .where(eq(schema.reports.id, reportId));
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
