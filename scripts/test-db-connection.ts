/**
 * Diagnostic script to test DATABASE_URL connection directly.
 * Usage: DATABASE_URL='postgresql://...' npx tsx scripts/test-db-connection.ts
 * Or:    npx tsx scripts/test-db-connection.ts  (uses .env.local)
 */

import dotenv from "dotenv";
import path from "path";

// Load .env.local for local testing
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }

  // Mask password for display
  const masked = url.replace(/:([^@]+)@/, ":****@");
  console.log(`\n🔍 Testing connection to: ${masked}`);
  console.log(`   Host: ${new URL(url).hostname}`);
  console.log(`   Port: ${new URL(url).port}`);
  console.log(`   User: ${new URL(url).username}`);
  console.log(`   SSL:  required\n`);

  const isPooler = url.includes("pooler.supabase.com");
  const isTransactionMode = url.includes(":6543/");
  const isSupabase = url.includes("supabase.com") || url.includes("supabase.co");

  if (isPooler) {
    console.log(`   Mode: ${isTransactionMode ? "Transaction" : "Session"} pooler`);
  } else if (isSupabase) {
    console.log(`   Mode: Direct Supabase connection`);
  } else {
    console.log(`   Mode: Direct connection (local)`);
  }

  // Dynamic import to avoid module-level DATABASE_URL check
  const postgres = (await import("postgres")).default;

  const sql = postgres(url, {
    max: 1,
    connect_timeout: 15,
    idle_timeout: 5,
    ssl: isSupabase ? "require" : undefined,
    prepare: isTransactionMode ? false : true,
  });

  try {
    console.log("\n⏳ Attempting connection...");
    const start = Date.now();

    // Test 1: Basic connectivity
    const [result] = await sql`SELECT 1 as ok, now() as server_time`;
    const elapsed = Date.now() - start;
    console.log(`✅ Connected in ${elapsed}ms`);
    console.log(`   Server time: ${result.server_time}`);

    // Test 2: Check tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log(`\n📊 Tables found: ${tables.length}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tables.forEach((t: any) => console.log(`   - ${t.table_name}`));

    // Test 3: Row counts for key tables
    console.log("\n📈 Row counts:");
    const counts = await sql`
      SELECT 'users' as tbl, COUNT(*)::int as cnt FROM users
      UNION ALL SELECT 'markets', COUNT(*)::int FROM markets
      UNION ALL SELECT 'reports', COUNT(*)::int FROM reports
      UNION ALL SELECT 'report_sections', COUNT(*)::int FROM report_sections
      UNION ALL SELECT 'subscriptions', COUNT(*)::int FROM subscriptions
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    counts.forEach((r: any) =>
      console.log(`   ${r.tbl}: ${r.cnt} rows`)
    );

    console.log("\n🎉 All checks passed!\n");
  } catch (error: unknown) {
    const err = error as Error & { code?: string; severity?: string };
    console.error("\n❌ Connection failed!");
    console.error(`   Error: ${err.message}`);
    if (err.code) console.error(`   Code: ${err.code}`);
    if (err.severity) console.error(`   Severity: ${err.severity}`);

    if (err.message.includes("Circuit breaker")) {
      console.error("\n💡 Circuit breaker = Supabase pooler can't reach your database.");
      console.error("   Likely causes:");
      console.error("   1. Project is PAUSED (free tier pauses after inactivity)");
      console.error("      → Go to supabase.com/dashboard → Click 'Restore'");
      console.error("   2. Password mismatch between pooler and database");
      console.error("      → Reset password in Supabase Dashboard → Database → Settings");
      console.error("   3. Try the DIRECT connection URL instead of pooler:");
      console.error("      → postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres");
    }

    if (err.message.includes("CONNECT_TIMEOUT")) {
      console.error("\n💡 Connection timeout. Try:");
      console.error("   1. Use session pooler (port 5432) not transaction pooler (port 6543)");
      console.error("   2. Check if Supabase project is active");
    }

    if (err.message.includes("password")) {
      console.error("\n💡 Authentication failed. Verify your database password.");
    }

    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
