import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type FreshnessStatus = "fresh" | "stale" | "missing";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface FreshnessInfo {
  key: string;
  source: string;
  status: FreshnessStatus;
  ageSeconds: number | null;
  ttlRemainingSeconds: number | null;
  cachedAt: Date | null;
  expiresAt: Date | null;
}

export interface FreshnessSummary {
  entries: FreshnessInfo[];
  confidence: ConfidenceLevel;
  freshCount: number;
  staleCount: number;
  missingCount: number;
}

/**
 * Check freshness of a single cache entry by key.
 */
export async function checkFreshness(key: string): Promise<FreshnessInfo> {
  const [entry] = await db
    .select({
      key: schema.cache.key,
      source: schema.cache.source,
      ttlSeconds: schema.cache.ttlSeconds,
      createdAt: schema.cache.createdAt,
      expiresAt: schema.cache.expiresAt,
    })
    .from(schema.cache)
    .where(eq(schema.cache.key, key))
    .limit(1);

  if (!entry) {
    return {
      key,
      source: "",
      status: "missing",
      ageSeconds: null,
      ttlRemainingSeconds: null,
      cachedAt: null,
      expiresAt: null,
    };
  }

  const now = new Date();
  const ageSeconds = Math.floor((now.getTime() - entry.createdAt.getTime()) / 1000);
  const ttlRemainingSeconds = Math.floor((entry.expiresAt.getTime() - now.getTime()) / 1000);
  const status: FreshnessStatus = ttlRemainingSeconds > 0 ? "fresh" : "stale";

  return {
    key: entry.key,
    source: entry.source,
    status,
    ageSeconds,
    ttlRemainingSeconds,
    cachedAt: entry.createdAt,
    expiresAt: entry.expiresAt,
  };
}

/**
 * Check freshness of multiple cache keys and return a summary with confidence level.
 */
export async function checkMultiple(keys: string[]): Promise<FreshnessSummary> {
  const entries = await Promise.all(keys.map(checkFreshness));

  const freshCount = entries.filter((e) => e.status === "fresh").length;
  const staleCount = entries.filter((e) => e.status === "stale").length;
  const missingCount = entries.filter((e) => e.status === "missing").length;

  let confidence: ConfidenceLevel;
  if (missingCount > 0) {
    confidence = "low";
  } else if (staleCount > 0) {
    confidence = "medium";
  } else {
    confidence = "high";
  }

  return { entries, confidence, freshCount, staleCount, missingCount };
}

/**
 * Check freshness of all cache entries for a given source.
 */
export async function checkSourceFreshness(source: string): Promise<FreshnessSummary> {
  const rows = await db
    .select({
      key: schema.cache.key,
      source: schema.cache.source,
      ttlSeconds: schema.cache.ttlSeconds,
      createdAt: schema.cache.createdAt,
      expiresAt: schema.cache.expiresAt,
    })
    .from(schema.cache)
    .where(eq(schema.cache.source, source));

  const now = new Date();
  const entries: FreshnessInfo[] = rows.map((entry) => {
    const ageSeconds = Math.floor((now.getTime() - entry.createdAt.getTime()) / 1000);
    const ttlRemainingSeconds = Math.floor((entry.expiresAt.getTime() - now.getTime()) / 1000);
    const status: FreshnessStatus = ttlRemainingSeconds > 0 ? "fresh" : "stale";
    return {
      key: entry.key,
      source: entry.source,
      status,
      ageSeconds,
      ttlRemainingSeconds,
      cachedAt: entry.createdAt,
      expiresAt: entry.expiresAt,
    };
  });

  const freshCount = entries.filter((e) => e.status === "fresh").length;
  const staleCount = entries.filter((e) => e.status === "stale").length;
  const missingCount = 0; // source query only returns existing entries

  let confidence: ConfidenceLevel;
  if (entries.length === 0) {
    confidence = "low";
  } else if (staleCount > 0) {
    confidence = "medium";
  } else {
    confidence = "high";
  }

  return { entries, confidence, freshCount, staleCount, missingCount };
}
