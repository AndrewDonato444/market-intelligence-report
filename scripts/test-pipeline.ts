/**
 * Pipeline Test Script — Layers 0 → 1 → 2
 *
 * Runs the market intelligence pipeline against live APIs and dumps
 * raw JSON output at each layer for inspection.
 *
 * Usage:
 *   npm run test:pipeline                      # All layers (0+1+2)
 *   npm run test:pipeline -- --layer=0         # Data fetch only
 *   npm run test:pipeline -- --layer=1         # Compute only (needs Layer 0 file)
 *   npm run test:pipeline -- --layer=2         # Agents only (needs Layer 1 file)
 *   npm run test:pipeline -- --use-cached      # Skip Layer 0 if cached
 *   npm run test:pipeline -- --help
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Load .env.local BEFORE any app imports (they read env vars at module scope)
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local"), override: true });

// ── Types (import type is fine — no runtime side effects) ──

import type { MarketData, AgentContext, AgentResult } from "@/lib/agents/orchestrator";
import type { CompiledMarketData } from "@/lib/services/data-fetcher";
import type { ComputedAnalytics } from "@/lib/services/market-analytics";

// ── Test Market (conservative — 1 peer market, low price ceiling) ──

const TEST_MARKET: MarketData = {
  name: "Palm Beach",
  geography: {
    city: "Palm Beach",
    state: "FL",
    county: "Palm Beach County",
  },
  luxuryTier: "luxury",
  priceFloor: 1_000_000,
  priceCeiling: 5_000_000,
  peerMarkets: [
    { name: "Naples", geography: { city: "Naples", state: "FL" } },
  ],
};

// ── CLI Arg Parsing ──

interface CliArgs {
  layer: number | null;
  useCached: boolean;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let layer: number | null = null;
  let useCached = false;
  let help = false;

  for (const arg of args) {
    if (arg.startsWith("--layer=")) {
      layer = parseInt(arg.split("=")[1], 10);
      if (isNaN(layer) || layer < 0 || layer > 2) {
        console.error("Error: --layer must be 0, 1, or 2");
        process.exit(1);
      }
    } else if (arg === "--use-cached") {
      useCached = true;
    } else if (arg === "--help" || arg === "-h") {
      help = true;
    }
  }

  return { layer, useCached, help };
}

function printUsage(): void {
  console.log(`
Usage: npm run test:pipeline [-- options]

Options:
  --layer=N       Run only layer N (0, 1, or 2). Without this, runs all.
  --use-cached    Skip Layer 0 if cached output file exists.
  --help          Show this help message.

Layers:
  0 = Data Fetch   (live API calls to RealEstateAPI + ScrapingDog)
  1 = Computation  (pure math from Layer 0 output)
  2 = Agents       (3 Claude calls from Layer 1 output)

Output:  scripts/output/layer-{N}-*.json
  `);
}

// ── File Helpers ──

const OUTPUT_DIR = path.resolve(__dirname, "output");

const FILES = {
  layer0: "layer-0-compiled-market-data.json",
  layer1: "layer-1-computed-analytics.json",
  layer2: "layer-2-agent-results.json",
};

function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function writeOutput(filename: string, data: unknown): string {
  ensureOutputDir();
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

function readOutput<T>(filename: string): T {
  const filePath = path.join(OUTPUT_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Required input file not found: ${filePath}\n` +
        `Run the preceding layer first, or omit --layer to run all.`
    );
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

// ── Layer 0: Data Fetch ──

async function runLayer0(useCached: boolean): Promise<CompiledMarketData> {
  if (useCached) {
    const cachedPath = path.join(OUTPUT_DIR, FILES.layer0);
    if (fs.existsSync(cachedPath)) {
      console.log("[Layer 0] Using cached data from", cachedPath);
      return readOutput<CompiledMarketData>(FILES.layer0);
    }
    console.log("[Layer 0] No cache found, fetching live data...");
  }

  console.log(`[Layer 0] Fetching market data for ${TEST_MARKET.name}...`);

  const { fetchAllMarketData } = await import("@/lib/services/data-fetcher");

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 5 * 60 * 1000);

  try {
    const start = Date.now();
    const data = await fetchAllMarketData({
      userId: "cli-test",
      reportId: `cli-test-${Date.now()}`,
      market: TEST_MARKET,
      abortSignal: abortController.signal,
      topNDetails: 3,
      representativeComps: 2,
    });
    const elapsed = Date.now() - start;

    const filePath = writeOutput(FILES.layer0, data);
    console.log(`[Layer 0] Done in ${elapsed}ms`);
    console.log(`  API calls: ${data.fetchMetadata.totalApiCalls}`);
    console.log(`  Properties: ${data.targetMarket.properties.length}`);
    console.log(`  Details: ${data.targetMarket.details.length}`);
    console.log(`  Comps: ${data.targetMarket.comps.length}`);
    console.log(`  Peer markets: ${data.peerMarkets.length}`);
    console.log(`  Amenity categories: ${Object.keys(data.neighborhood.amenities).length}`);
    console.log(`  News articles (target): ${data.news?.targetMarket?.length ?? 0}`);
    console.log(`  News articles (peers): ${Object.values(data.news?.peerMarkets ?? {}).reduce((sum, arr) => sum + arr.length, 0)}`);
    console.log(`  Stale sources: ${data.fetchMetadata.staleDataSources.length}`);
    console.log(`  Errors: ${data.fetchMetadata.errors.length}`);
    if (data.fetchMetadata.errors.length > 0) {
      for (const err of data.fetchMetadata.errors) {
        console.log(`    - [${err.source}] ${err.endpoint}: ${err.error}`);
      }
    }
    console.log(`  Written to: ${filePath}`);
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Layer 1: Computation ──

async function runLayer1(compiledData: CompiledMarketData): Promise<ComputedAnalytics> {
  console.log("[Layer 1] Computing market analytics...");

  const { computeMarketAnalytics } = await import("@/lib/services/market-analytics");

  const start = Date.now();
  const analytics = computeMarketAnalytics(compiledData, TEST_MARKET);
  const elapsed = Date.now() - start;

  const filePath = writeOutput(FILES.layer1, analytics);
  console.log(`[Layer 1] Done in ${elapsed}ms`);
  console.log(`  Total properties: ${analytics.market.totalProperties}`);
  console.log(`  Median price: $${analytics.market.medianPrice.toLocaleString()}`);
  console.log(`  Average price: $${analytics.market.averagePrice.toLocaleString()}`);
  console.log(`  Total volume: $${analytics.market.totalVolume.toLocaleString()}`);
  console.log(`  Rating: ${analytics.market.rating}`);
  console.log(`  Segments: ${analytics.segments.length}`);
  console.log(`  YoY median price change: ${analytics.yoy.medianPriceChange != null ? (analytics.yoy.medianPriceChange * 100).toFixed(1) + '%' : 'N/A'}`);
  console.log(`  Confidence: ${analytics.confidence.level} (sample: ${analytics.confidence.sampleSize})`);
  console.log(`  Written to: ${filePath}`);
  return analytics;
}

// ── Layer 2: Agents (direct execution) ──

async function runLayer2(
  analytics: ComputedAnalytics
): Promise<Record<string, AgentResult>> {
  console.log("[Layer 2] Running 3 Claude agents...\n");

  const { executeInsightGenerator } = await import("@/lib/agents/insight-generator");
  const { executeForecastModeler } = await import("@/lib/agents/forecast-modeler");
  const { executePolishAgent } = await import("@/lib/agents/polish-agent");

  const baseContext: AgentContext = {
    reportId: `cli-test-${Date.now()}`,
    userId: "cli-test",
    market: TEST_MARKET,
    reportConfig: {},
    upstreamResults: {},
    abortSignal: new AbortController().signal,
    computedAnalytics: analytics,
  };

  // Run insight-generator and forecast-modeler in parallel
  console.log("  [insight-generator] Starting...");
  console.log("  [forecast-modeler] Starting...");

  const [insightResult, forecastResult] = await Promise.all([
    executeInsightGenerator(baseContext),
    executeForecastModeler(baseContext),
  ]);

  console.log(`  [insight-generator] Done in ${insightResult.durationMs}ms`);
  console.log(`    Sections: ${insightResult.sections.length}`);
  console.log(`  [forecast-modeler] Done in ${forecastResult.durationMs}ms`);
  console.log(`    Sections: ${forecastResult.sections.length}`);

  // Run polish-agent with upstream results
  console.log("  [polish-agent] Starting...");
  const polishContext: AgentContext = {
    ...baseContext,
    upstreamResults: {
      "insight-generator": insightResult,
      "forecast-modeler": forecastResult,
    },
  };
  const polishResult = await executePolishAgent(polishContext);
  console.log(`  [polish-agent] Done in ${polishResult.durationMs}ms`);
  console.log(`    Sections: ${polishResult.sections.length}`);

  const agentResults: Record<string, AgentResult> = {
    "insight-generator": insightResult,
    "forecast-modeler": forecastResult,
    "polish-agent": polishResult,
  };

  const totalMs =
    insightResult.durationMs + forecastResult.durationMs + polishResult.durationMs;

  const filePath = writeOutput(FILES.layer2, {
    agentResults,
    totalDurationMs: totalMs,
  });

  console.log(`\n[Layer 2] All agents done (${totalMs}ms total)`);
  console.log(`  Written to: ${filePath}`);
  return agentResults;
}

// ── Main ──

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  console.log("=== Market Intelligence Pipeline Test ===");
  console.log(`Market: ${TEST_MARKET.name} (${TEST_MARKET.geography.city}, ${TEST_MARKET.geography.state})`);
  console.log(`Tier: ${TEST_MARKET.luxuryTier} | Floor: $${TEST_MARKET.priceFloor.toLocaleString()} | Ceiling: $${TEST_MARKET.priceCeiling?.toLocaleString()}`);
  if (args.layer !== null) {
    console.log(`Running: Layer ${args.layer} only`);
  } else {
    console.log("Running: Layers 0 → 1 → 2");
  }
  if (args.useCached) {
    console.log("Cache: --use-cached enabled");
  }
  console.log("");

  const overallStart = Date.now();
  const runAll = args.layer === null;

  // Layer 0
  let compiledData: CompiledMarketData | undefined;
  if (runAll || args.layer === 0) {
    compiledData = await runLayer0(args.useCached);
    console.log("");
  }

  // Layer 1
  let analytics: ComputedAnalytics | undefined;
  if (runAll || args.layer === 1) {
    if (!compiledData) {
      compiledData = readOutput<CompiledMarketData>(FILES.layer0);
    }
    analytics = await runLayer1(compiledData);
    console.log("");
  }

  // Layer 2
  if (runAll || args.layer === 2) {
    if (!analytics) {
      analytics = readOutput<ComputedAnalytics>(FILES.layer1);
    }
    await runLayer2(analytics);
    console.log("");
  }

  const totalMs = Date.now() - overallStart;
  console.log(`=== Complete in ${totalMs}ms ===`);
}

main().catch((err) => {
  console.error("Pipeline test failed:", err);
  process.exit(1);
});
