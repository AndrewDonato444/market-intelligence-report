import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local with your Supabase connection string."
  );
}

const connectionString = process.env.DATABASE_URL;

// Connection for queries — pooled, reusable
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Export schema for use in queries
export { schema };

// Export types derived from schema
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Market = typeof schema.markets.$inferSelect;
export type NewMarket = typeof schema.markets.$inferInsert;
export type Report = typeof schema.reports.$inferSelect;
export type NewReport = typeof schema.reports.$inferInsert;
export type ReportSection = typeof schema.reportSections.$inferSelect;
export type NewReportSection = typeof schema.reportSections.$inferInsert;
export type CacheEntry = typeof schema.cache.$inferSelect;
export type NewCacheEntry = typeof schema.cache.$inferInsert;
export type ApiUsageEntry = typeof schema.apiUsage.$inferSelect;
export type NewApiUsageEntry = typeof schema.apiUsage.$inferInsert;
