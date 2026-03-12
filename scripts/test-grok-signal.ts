/**
 * Grok / xAI Signal Test
 *
 * Tests the xAI Responses API with x_search to see what kind of
 * real-time signal we can extract from X posts for a luxury real
 * estate market query.
 *
 * Usage: npx tsx scripts/test-grok-signal.ts
 * Usage: npx tsx scripts/test-grok-signal.ts --market="Palm Beach, FL"
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local"), override: true });

const XAI_API_KEY = process.env.XAI_API_KEY;
if (!XAI_API_KEY) {
  console.error("Missing XAI_API_KEY in .env.local");
  process.exit(1);
}

// Parse --market arg or use default
const marketArg = process.argv.find((a) => a.startsWith("--market="));
const MARKET = marketArg ? marketArg.replace("--market=", "") : "Palm Beach, FL";

// Date range: last 30 days
const toDate = new Date();
const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - 30);
const fmt = (d: Date) => d.toISOString().split("T")[0];

// Known luxury real estate signal sources on X
const REAL_ESTATE_HANDLES = [
  "NAR_Research",       // National Association of Realtors research
  "RealEstateNation",   // Market commentary
  "LuxuryPortfolio",   // Luxury real estate network
  "SothebysRealty",    // Sotheby's International
  "christiesrealty",   // Christie's Real Estate
];

async function queryGrok(label: string, query: string, handles?: string[]) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Query: ${label}`);
  console.log(`${"─".repeat(60)}`);

  const tool: Record<string, unknown> = {
    type: "x_search",
    from_date: fmt(fromDate),
    to_date: fmt(toDate),
  };
  if (handles && handles.length > 0) {
    tool.allowed_x_handles = handles;
  }

  const payload = {
    model: "grok-4",
    input: [{ role: "user", content: query }],
    tools: [tool],
  };

  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status}: ${text}`);
    return null;
  }

  const data = await res.json();

  // Extract text output
  const output = data.output ?? [];
  const textBlocks = output
    .filter((o: any) => o.type === "message")
    .flatMap((o: any) => o.content ?? [])
    .filter((c: any) => c.type === "output_text")
    .map((c: any) => c.text as string);

  const responseText = textBlocks.join("\n");
  console.log(responseText || "(no text output)");

  return { label, query, responseText, raw: data };
}

async function main() {
  console.log(`\n🔍 Grok Signal Test — ${MARKET}`);
  console.log(`Date range: ${fmt(fromDate)} → ${fmt(toDate)}`);
  console.log(`Model: grok-4`);

  const results: any[] = [];

  // Test 1: Broad market sentiment on X (no handle filter)
  const r1 = await queryGrok(
    "Broad luxury market sentiment",
    `What are people saying on X about the ${MARKET} luxury real estate market right now? ` +
    `Summarize the key themes, sentiment, and any notable signals from posts in the last 30 days. ` +
    `Focus on: price trends, buyer/seller activity, inventory levels, and any surprising takes.`
  );
  if (r1) results.push(r1);

  // Test 2: Targeted handle search — real estate professionals
  const r2 = await queryGrok(
    "Real estate pro signal (filtered handles)",
    `Search for recent posts from luxury real estate professionals about ${MARKET} or the broader ` +
    `South Florida luxury market. What are agents and brokers saying about current conditions, ` +
    `deal flow, and buyer demand? Include any specific price points or market observations mentioned.`,
    REAL_ESTATE_HANDLES
  );
  if (r2) results.push(r2);

  // Test 3: Contrarian / negative signal
  const r3 = await queryGrok(
    "Contrarian / bear signal",
    `Find posts on X in the last 30 days that express concern, skepticism, or bearish views ` +
    `about the ${MARKET} real estate market or South Florida luxury real estate more broadly. ` +
    `What risks or warning signs are people flagging? Be specific about any data or anecdotes cited.`
  );
  if (r3) results.push(r3);

  // Write raw output
  const outPath = path.resolve(__dirname, "output", "grok-signal-test.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ market: MARKET, dateRange: { from: fmt(fromDate), to: fmt(toDate) }, results }, null, 2));

  console.log(`\n\n✅ Done. Full output written to: ${outPath}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
