/**
 * Upload local market images to Supabase Storage.
 *
 * Usage: npx tsx scripts/upload-market-images.ts
 *        npx tsx scripts/upload-market-images.ts --skip-existing
 */

import * as fs from "fs";
import * as path from "path";

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "market-images";
const LOCAL_DIR = path.join(__dirname, "..", "public", "markets");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const CONCURRENCY = 5;

async function uploadFile(
  filePath: string,
  fileName: string,
  skipExisting: boolean,
): Promise<"ok" | "skipped" | "failed"> {
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`;

  if (skipExisting) {
    // Check if file exists
    const headRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`,
      { method: "HEAD" },
    );
    if (headRes.ok) return "skipped";
  }

  const fileBuffer = fs.readFileSync(filePath);

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "true",
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  FAIL ${fileName}: ${res.status} ${text}`);
    return "failed";
  }

  return "ok";
}

async function main() {
  const args = process.argv.slice(2);
  const skipExisting = args.includes("--skip-existing");

  const files = fs
    .readdirSync(LOCAL_DIR)
    .filter((f) => f.endsWith(".jpg"))
    .sort();

  console.log(`\n=== Upload Market Images to Supabase ===`);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Files: ${files.length}`);
  console.log(`Skip existing: ${skipExisting}\n`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (file) => {
        const filePath = path.join(LOCAL_DIR, file);
        const result = await uploadFile(filePath, file, skipExisting);
        const icon = result === "ok" ? "OK  " : result === "skipped" ? "SKIP" : "FAIL";
        console.log(`  ${icon} ${file}`);
        return result;
      }),
    );

    for (const r of results) {
      if (r === "ok") ok++;
      else if (r === "skipped") skipped++;
      else failed++;
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Uploaded: ${ok}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);

  const publicBase = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
  console.log(`\nPublic URL prefix: ${publicBase}/`);
  console.log(`Example: ${publicBase}/${files[0]}`);
}

main().catch(console.error);
