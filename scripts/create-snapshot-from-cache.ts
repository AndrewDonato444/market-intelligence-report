/**
 * Create a pipeline test snapshot by re-running Layer 0 (data-fetcher)
 * against cached API responses. No new API calls should be made if
 * cache entries exist for the target market.
 *
 * Usage: npx tsx scripts/create-snapshot-from-cache.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  // Dynamic imports to ensure env vars are loaded first
  const { fetchAllMarketData } = await import("@/lib/services/data-fetcher");
  const pg = (await import("postgres")).default;
  const sql = pg(process.env.DATABASE_URL!);

  const market = {
    name: "Newport Luxury",
    geography: { city: "Newport", state: "Rhode Island" },
    luxuryTier: "luxury" as const,
    priceFloor: 1000000,
    priceCeiling: null,
    segments: [
      "gated community",
      "waterfront",
      "trophy home",
      "arts district",
      "townhouse",
      "beachfront",
    ],
    propertyTypes: [
      "single_family",
      "estate",
      "townhouse",
      "co-op",
    ],
  };

  console.log("[snapshot] Fetching compiled data for Newport (should hit cache)...");

  const controller = new AbortController();
  const compiledData = await fetchAllMarketData({
    userId: "e12665f3-1dce-4a2b-a095-8a085c673d2d",
    reportId: "snapshot-creation", // dummy ID, not a real report
    market,
    abortSignal: controller.signal,
  });

  const propertyCount =
    (compiledData.targetMarket?.properties?.length ?? 0);
  const hasXSentiment = Boolean(compiledData.xSentiment);
  const peerMarketCount = compiledData.peerMarkets?.length ?? 0;

  console.log(`[snapshot] Got ${propertyCount} properties, ${peerMarketCount} peer markets, X sentiment: ${hasXSentiment}`);
  console.log(`[snapshot] Compiled data size: ${JSON.stringify(compiledData).length} bytes`);

  // Insert snapshot directly into the DB
  const [snapshot] = await sql`
    INSERT INTO pipeline_snapshots (name, market_name, geography, compiled_data, property_count, has_x_sentiment, peer_market_count, is_golden, source_report_id)
    VALUES (
      ${"Newport Luxury — Cache Replay"},
      ${market.name},
      ${sql.json(market.geography)},
      ${sql.json(compiledData as any)},
      ${propertyCount},
      ${hasXSentiment},
      ${peerMarketCount},
      ${true},
      ${"b8d6039f-7eed-42fb-a705-7f2df5714091"}
    )
    RETURNING id, name, property_count, has_x_sentiment, peer_market_count
  `;

  console.log(`[snapshot] Created snapshot: ${snapshot.id}`);
  console.log(`[snapshot] Name: ${snapshot.name}`);
  console.log(`[snapshot] Properties: ${snapshot.property_count}, X Sentiment: ${snapshot.has_x_sentiment}, Peers: ${snapshot.peer_market_count}`);

  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("[snapshot] Failed:", err);
  process.exit(1);
});
