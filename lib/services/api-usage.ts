import { db, schema } from "@/lib/db";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export interface ApiCallEntry {
  userId: string;
  reportId?: string;
  provider: string;
  endpoint: string;
  cost?: number;
  tokensUsed?: number;
  responseTimeMs?: number;
  statusCode?: number;
  cached: boolean;
}

export interface ProviderSummary {
  provider: string;
  totalCost: number;
  callCount: number;
  cacheHits: number;
}

export interface UsageSummary {
  byProvider: ProviderSummary[];
  totalCost: number;
  totalCalls: number;
  cacheHitRate: number;
}

/**
 * Log an API call (external or cache hit) to the api_usage table.
 */
export async function logApiCall(entry: ApiCallEntry): Promise<void> {
  await db.insert(schema.apiUsage).values({
    userId: entry.userId,
    reportId: entry.reportId,
    provider: entry.provider,
    endpoint: entry.endpoint,
    cost: entry.cached ? "0" : String(entry.cost ?? 0),
    tokensUsed: entry.tokensUsed,
    responseTimeMs: entry.responseTimeMs,
    statusCode: entry.statusCode,
    cached: entry.cached ? 1 : 0,
  });
}

/**
 * Get aggregated usage summary by provider for a user.
 * Optionally filter by date range.
 */
export async function getUsageSummary(
  userId: string,
  since?: Date
): Promise<UsageSummary> {
  const conditions = [eq(schema.apiUsage.userId, userId)];
  if (since) {
    conditions.push(gte(schema.apiUsage.createdAt, since));
  }

  const rows = await db
    .select({
      provider: schema.apiUsage.provider,
      totalCost: sql<string>`sum(${schema.apiUsage.cost})`.as("totalCost"),
      callCount: sql<number>`count(*)::int`.as("callCount"),
      cacheHits: sql<number>`sum(${schema.apiUsage.cached})::int`.as("cacheHits"),
    })
    .from(schema.apiUsage)
    .where(and(...conditions))
    .groupBy(schema.apiUsage.provider);

  const byProvider: ProviderSummary[] = rows.map((row) => ({
    provider: row.provider,
    totalCost: parseFloat(row.totalCost) || 0,
    callCount: row.callCount,
    cacheHits: row.cacheHits,
  }));

  const totalCost = byProvider.reduce((sum, p) => sum + p.totalCost, 0);
  const totalCalls = byProvider.reduce((sum, p) => sum + p.callCount, 0);
  const totalCacheHits = byProvider.reduce((sum, p) => sum + p.cacheHits, 0);
  const cacheHitRate = totalCalls > 0 ? (totalCacheHits / totalCalls) * 100 : 0;

  return { byProvider, totalCost, totalCalls, cacheHitRate };
}

export interface UsageLogEntry {
  id: string;
  provider: string;
  endpoint: string;
  cost: string;
  responseTimeMs: number | null;
  statusCode: number | null;
  cached: number;
  createdAt: Date;
}

export interface UsageLogResult {
  entries: UsageLogEntry[];
  total: number;
}

/**
 * Get paginated usage log entries for a user.
 * Optionally filter by provider.
 */
export async function getUsageLog(
  userId: string,
  options: { provider?: string; limit?: number; offset?: number; since?: Date } = {}
): Promise<UsageLogResult> {
  const { provider, limit = 50, offset = 0, since } = options;

  const conditions = [eq(schema.apiUsage.userId, userId)];
  if (provider) {
    conditions.push(eq(schema.apiUsage.provider, provider));
  }
  if (since) {
    conditions.push(gte(schema.apiUsage.createdAt, since));
  }

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.apiUsage)
    .where(and(...conditions));

  const entries = await db
    .select({
      id: schema.apiUsage.id,
      provider: schema.apiUsage.provider,
      endpoint: schema.apiUsage.endpoint,
      cost: schema.apiUsage.cost,
      responseTimeMs: schema.apiUsage.responseTimeMs,
      statusCode: schema.apiUsage.statusCode,
      cached: schema.apiUsage.cached,
      createdAt: schema.apiUsage.createdAt,
    })
    .from(schema.apiUsage)
    .where(and(...conditions))
    .orderBy(desc(schema.apiUsage.createdAt))
    .limit(limit)
    .offset(offset);

  return { entries, total: countResult.count };
}
