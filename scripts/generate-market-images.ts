/**
 * One-time script to generate city hero images for market tiles.
 * Uses xAI's grok-imagine-image model.
 *
 * Usage: npx tsx scripts/generate-market-images.ts
 *        npx tsx scripts/generate-market-images.ts --dry-run   (show what would be generated)
 *        npx tsx scripts/generate-market-images.ts --skip-existing (skip cities that already have images)
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// Load env
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const XAI_API_KEY = process.env.XAI_API_KEY;
if (!XAI_API_KEY) {
  console.error("Missing XAI_API_KEY in .env.local");
  process.exit(1);
}

// Import the city list
const LUXURY_CITIES: Array<{ city: string; state: string; abbr: string }> = [
  { city: "Naples", state: "Florida", abbr: "FL" },
  { city: "Miami", state: "Florida", abbr: "FL" },
  { city: "Miami Beach", state: "Florida", abbr: "FL" },
  { city: "Palm Beach", state: "Florida", abbr: "FL" },
  { city: "Boca Raton", state: "Florida", abbr: "FL" },
  { city: "Fort Lauderdale", state: "Florida", abbr: "FL" },
  { city: "Sarasota", state: "Florida", abbr: "FL" },
  { city: "Tampa", state: "Florida", abbr: "FL" },
  { city: "Orlando", state: "Florida", abbr: "FL" },
  { city: "Jacksonville", state: "Florida", abbr: "FL" },
  { city: "Key West", state: "Florida", abbr: "FL" },
  { city: "Jupiter", state: "Florida", abbr: "FL" },
  { city: "Delray Beach", state: "Florida", abbr: "FL" },
  { city: "Coral Gables", state: "Florida", abbr: "FL" },
  { city: "Marco Island", state: "Florida", abbr: "FL" },
  { city: "Fisher Island", state: "Florida", abbr: "FL" },
  { city: "Bal Harbour", state: "Florida", abbr: "FL" },
  { city: "New York", state: "New York", abbr: "NY" },
  { city: "Manhattan", state: "New York", abbr: "NY" },
  { city: "Brooklyn", state: "New York", abbr: "NY" },
  { city: "Hamptons", state: "New York", abbr: "NY" },
  { city: "Sag Harbor", state: "New York", abbr: "NY" },
  { city: "Montauk", state: "New York", abbr: "NY" },
  { city: "Greenwich", state: "Connecticut", abbr: "CT" },
  { city: "Westport", state: "Connecticut", abbr: "CT" },
  { city: "Darien", state: "Connecticut", abbr: "CT" },
  { city: "New Canaan", state: "Connecticut", abbr: "CT" },
  { city: "Los Angeles", state: "California", abbr: "CA" },
  { city: "Beverly Hills", state: "California", abbr: "CA" },
  { city: "Malibu", state: "California", abbr: "CA" },
  { city: "Bel Air", state: "California", abbr: "CA" },
  { city: "Santa Monica", state: "California", abbr: "CA" },
  { city: "Pacific Palisades", state: "California", abbr: "CA" },
  { city: "San Francisco", state: "California", abbr: "CA" },
  { city: "Palo Alto", state: "California", abbr: "CA" },
  { city: "Atherton", state: "California", abbr: "CA" },
  { city: "Hillsborough", state: "California", abbr: "CA" },
  { city: "San Diego", state: "California", abbr: "CA" },
  { city: "La Jolla", state: "California", abbr: "CA" },
  { city: "Newport Beach", state: "California", abbr: "CA" },
  { city: "Laguna Beach", state: "California", abbr: "CA" },
  { city: "Coronado", state: "California", abbr: "CA" },
  { city: "Montecito", state: "California", abbr: "CA" },
  { city: "Santa Barbara", state: "California", abbr: "CA" },
  { city: "Carmel", state: "California", abbr: "CA" },
  { city: "Napa", state: "California", abbr: "CA" },
  { city: "Tiburon", state: "California", abbr: "CA" },
  { city: "Ross", state: "California", abbr: "CA" },
  { city: "Rancho Santa Fe", state: "California", abbr: "CA" },
  { city: "Aspen", state: "Colorado", abbr: "CO" },
  { city: "Vail", state: "Colorado", abbr: "CO" },
  { city: "Telluride", state: "Colorado", abbr: "CO" },
  { city: "Steamboat Springs", state: "Colorado", abbr: "CO" },
  { city: "Denver", state: "Colorado", abbr: "CO" },
  { city: "Boulder", state: "Colorado", abbr: "CO" },
  { city: "Cherry Hills Village", state: "Colorado", abbr: "CO" },
  { city: "Chicago", state: "Illinois", abbr: "IL" },
  { city: "Winnetka", state: "Illinois", abbr: "IL" },
  { city: "Lake Forest", state: "Illinois", abbr: "IL" },
  { city: "Highland Park", state: "Illinois", abbr: "IL" },
  { city: "Naperville", state: "Illinois", abbr: "IL" },
  { city: "Hinsdale", state: "Illinois", abbr: "IL" },
  { city: "Boston", state: "Massachusetts", abbr: "MA" },
  { city: "Nantucket", state: "Massachusetts", abbr: "MA" },
  { city: "Martha's Vineyard", state: "Massachusetts", abbr: "MA" },
  { city: "Brookline", state: "Massachusetts", abbr: "MA" },
  { city: "Wellesley", state: "Massachusetts", abbr: "MA" },
  { city: "Concord", state: "Massachusetts", abbr: "MA" },
  { city: "Houston", state: "Texas", abbr: "TX" },
  { city: "Dallas", state: "Texas", abbr: "TX" },
  { city: "Austin", state: "Texas", abbr: "TX" },
  { city: "San Antonio", state: "Texas", abbr: "TX" },
  { city: "Highland Park", state: "Texas", abbr: "TX" },
  { city: "River Oaks", state: "Texas", abbr: "TX" },
  { city: "Seattle", state: "Washington", abbr: "WA" },
  { city: "Bellevue", state: "Washington", abbr: "WA" },
  { city: "Mercer Island", state: "Washington", abbr: "WA" },
  { city: "Medina", state: "Washington", abbr: "WA" },
  { city: "Scottsdale", state: "Arizona", abbr: "AZ" },
  { city: "Paradise Valley", state: "Arizona", abbr: "AZ" },
  { city: "Sedona", state: "Arizona", abbr: "AZ" },
  { city: "Phoenix", state: "Arizona", abbr: "AZ" },
  { city: "Tucson", state: "Arizona", abbr: "AZ" },
  { city: "Las Vegas", state: "Nevada", abbr: "NV" },
  { city: "Henderson", state: "Nevada", abbr: "NV" },
  { city: "Incline Village", state: "Nevada", abbr: "NV" },
  { city: "Reno", state: "Nevada", abbr: "NV" },
  { city: "Park City", state: "Utah", abbr: "UT" },
  { city: "Salt Lake City", state: "Utah", abbr: "UT" },
  { city: "Deer Valley", state: "Utah", abbr: "UT" },
  { city: "Honolulu", state: "Hawaii", abbr: "HI" },
  { city: "Maui", state: "Hawaii", abbr: "HI" },
  { city: "Kailua", state: "Hawaii", abbr: "HI" },
  { city: "Wailea", state: "Hawaii", abbr: "HI" },
  { city: "Washington", state: "District of Columbia", abbr: "DC" },
  { city: "Georgetown", state: "District of Columbia", abbr: "DC" },
  { city: "McLean", state: "Virginia", abbr: "VA" },
  { city: "Great Falls", state: "Virginia", abbr: "VA" },
  { city: "Charlottesville", state: "Virginia", abbr: "VA" },
  { city: "Virginia Beach", state: "Virginia", abbr: "VA" },
  { city: "Atlanta", state: "Georgia", abbr: "GA" },
  { city: "Buckhead", state: "Georgia", abbr: "GA" },
  { city: "Savannah", state: "Georgia", abbr: "GA" },
  { city: "Sea Island", state: "Georgia", abbr: "GA" },
  { city: "Nashville", state: "Tennessee", abbr: "TN" },
  { city: "Memphis", state: "Tennessee", abbr: "TN" },
  { city: "Charlotte", state: "North Carolina", abbr: "NC" },
  { city: "Asheville", state: "North Carolina", abbr: "NC" },
  { city: "Raleigh", state: "North Carolina", abbr: "NC" },
  { city: "Wilmington", state: "North Carolina", abbr: "NC" },
  { city: "Charleston", state: "South Carolina", abbr: "SC" },
  { city: "Hilton Head", state: "South Carolina", abbr: "SC" },
  { city: "Kiawah Island", state: "South Carolina", abbr: "SC" },
  { city: "Portland", state: "Oregon", abbr: "OR" },
  { city: "Bend", state: "Oregon", abbr: "OR" },
  { city: "Lake Oswego", state: "Oregon", abbr: "OR" },
  { city: "Minneapolis", state: "Minnesota", abbr: "MN" },
  { city: "Edina", state: "Minnesota", abbr: "MN" },
  { city: "Wayzata", state: "Minnesota", abbr: "MN" },
  { city: "Philadelphia", state: "Pennsylvania", abbr: "PA" },
  { city: "Gladwyne", state: "Pennsylvania", abbr: "PA" },
  { city: "Bryn Mawr", state: "Pennsylvania", abbr: "PA" },
  { city: "New Hope", state: "Pennsylvania", abbr: "PA" },
  { city: "Detroit", state: "Michigan", abbr: "MI" },
  { city: "Grosse Pointe", state: "Michigan", abbr: "MI" },
  { city: "Traverse City", state: "Michigan", abbr: "MI" },
  { city: "Harbor Springs", state: "Michigan", abbr: "MI" },
  { city: "New Orleans", state: "Louisiana", abbr: "LA" },
  { city: "Baton Rouge", state: "Louisiana", abbr: "LA" },
  { city: "Jackson Hole", state: "Wyoming", abbr: "WY" },
  { city: "Teton Village", state: "Wyoming", abbr: "WY" },
  { city: "Sun Valley", state: "Idaho", abbr: "ID" },
  { city: "Coeur d'Alene", state: "Idaho", abbr: "ID" },
  { city: "Boise", state: "Idaho", abbr: "ID" },
  { city: "Big Sky", state: "Montana", abbr: "MT" },
  { city: "Whitefish", state: "Montana", abbr: "MT" },
  { city: "Bozeman", state: "Montana", abbr: "MT" },
  { city: "Newport", state: "Rhode Island", abbr: "RI" },
  { city: "Providence", state: "Rhode Island", abbr: "RI" },
  { city: "Kennebunkport", state: "Maine", abbr: "ME" },
  { city: "Bar Harbor", state: "Maine", abbr: "ME" },
  { city: "Camden", state: "Maine", abbr: "ME" },
  { city: "Cape Cod", state: "Massachusetts", abbr: "MA" },
  { city: "Princeton", state: "New Jersey", abbr: "NJ" },
  { city: "Alpine", state: "New Jersey", abbr: "NJ" },
  { city: "Short Hills", state: "New Jersey", abbr: "NJ" },
  { city: "Rumson", state: "New Jersey", abbr: "NJ" },
  { city: "Cape May", state: "New Jersey", abbr: "NJ" },
  { city: "Bethesda", state: "Maryland", abbr: "MD" },
  { city: "Chevy Chase", state: "Maryland", abbr: "MD" },
  { city: "Annapolis", state: "Maryland", abbr: "MD" },
  { city: "Kansas City", state: "Missouri", abbr: "MO" },
  { city: "St. Louis", state: "Missouri", abbr: "MO" },
  { city: "Milwaukee", state: "Wisconsin", abbr: "WI" },
  { city: "Lake Geneva", state: "Wisconsin", abbr: "WI" },
  { city: "Door County", state: "Wisconsin", abbr: "WI" },
  { city: "Indianapolis", state: "Indiana", abbr: "IN" },
  { city: "Carmel", state: "Indiana", abbr: "IN" },
  { city: "Columbus", state: "Ohio", abbr: "OH" },
  { city: "Cleveland", state: "Ohio", abbr: "OH" },
  { city: "Cincinnati", state: "Ohio", abbr: "OH" },
  { city: "Oklahoma City", state: "Oklahoma", abbr: "OK" },
  { city: "Tulsa", state: "Oklahoma", abbr: "OK" },
  { city: "Birmingham", state: "Alabama", abbr: "AL" },
  { city: "Mountain Brook", state: "Alabama", abbr: "AL" },
  { city: "Santa Fe", state: "New Mexico", abbr: "NM" },
  { city: "Albuquerque", state: "New Mexico", abbr: "NM" },
  { city: "Anchorage", state: "Alaska", abbr: "AK" },
];

const OUT_DIR = path.join(__dirname, "..", "public", "markets");
const CONCURRENCY = 3; // parallel requests
const DELAY_MS = 500; // delay between batches to avoid rate limits

function toSlug(city: string, abbr: string): string {
  return `${city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}-${abbr.toLowerCase()}`;
}

function buildPrompt(city: string, state: string): string {
  return `Wide exterior photograph of ${city}, ${state} at golden hour. Aerial or elevated perspective showing the cityscape, architecture, or natural landscape. Luxury real estate editorial photography style. No people, no text, no watermarks.`;
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    mod.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadFile(response.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {}); // cleanup partial file
      reject(err);
    });
  });
}

async function generateImage(city: string, state: string, slug: string): Promise<string> {
  const prompt = buildPrompt(city, state);
  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const json = await response.json();
  return json.data[0].url;
}

async function processBatch(
  batch: Array<{ city: string; state: string; abbr: string }>,
  skipExisting: boolean,
  dryRun: boolean,
): Promise<{ success: number; skipped: number; failed: number }> {
  let success = 0;
  let skipped = 0;
  let failed = 0;

  const tasks = batch.map(async (entry) => {
    const slug = toSlug(entry.city, entry.abbr);
    const destPath = path.join(OUT_DIR, `${slug}.jpg`);

    if (skipExisting && fs.existsSync(destPath)) {
      console.log(`  SKIP ${slug} (exists)`);
      skipped++;
      return;
    }

    if (dryRun) {
      console.log(`  DRY  ${slug} — "${buildPrompt(entry.city, entry.state).substring(0, 80)}..."`);
      skipped++;
      return;
    }

    try {
      console.log(`  GEN  ${slug}...`);
      const imageUrl = await generateImage(entry.city, entry.state, slug);
      await downloadFile(imageUrl, destPath);
      const size = fs.statSync(destPath).size;
      console.log(`  OK   ${slug} (${(size / 1024).toFixed(0)}KB)`);
      success++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAIL ${slug}: ${msg}`);
      failed++;
    }
  });

  await Promise.all(tasks);
  return { success, skipped, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipExisting = args.includes("--skip-existing");

  console.log(`\n=== Market Image Generator ===`);
  console.log(`Cities: ${LUXURY_CITIES.length}`);
  console.log(`Output: ${OUT_DIR}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Skip existing: ${skipExisting}\n`);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process in batches
  for (let i = 0; i < LUXURY_CITIES.length; i += CONCURRENCY) {
    const batch = LUXURY_CITIES.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(LUXURY_CITIES.length / CONCURRENCY);
    console.log(`Batch ${batchNum}/${totalBatches}:`);

    const result = await processBatch(batch, skipExisting, dryRun);
    totalSuccess += result.success;
    totalSkipped += result.skipped;
    totalFailed += result.failed;

    // Small delay between batches
    if (i + CONCURRENCY < LUXURY_CITIES.length && !dryRun) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Success: ${totalSuccess}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`Failed:  ${totalFailed}`);
  console.log(`Total:   ${LUXURY_CITIES.length}`);

  if (totalSuccess > 0) {
    console.log(`\nImages saved to: ${OUT_DIR}`);
    console.log(`Next: update MarketCard to use /markets/{slug}.jpg`);
  }
}

main().catch(console.error);
