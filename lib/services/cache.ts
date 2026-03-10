import { db, schema } from "@/lib/db";
import { eq, lt } from "drizzle-orm";

/**
 * TTL defaults by data source (in seconds).
 * Each external API has a different data freshness profile.
 */
export const SOURCE_TTLS: Record<string, number> = {
  realestateapi: 86400, // 24h — transaction data is stable within a day
  scrapingdog: 604800, // 7d — neighborhood context changes slowly
  anthropic: 0, // never cache — AI outputs should always be fresh
};

/**
 * Get cached data by key. Returns null if not found or expired.
 */
export async function get(key: string): Promise<unknown | null> {
  try {
    const [entry] = await db
      .select()
      .from(schema.cache)
      .where(eq(schema.cache.key, key))
      .limit(1);

    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt <= new Date()) return null;

    return entry.data;
  } catch {
    // DB unavailable — treat as cache miss
    return null;
  }
}

/**
 * Store data in cache with TTL. Upserts on duplicate key.
 * If ttlSeconds is not provided, uses the default for the source.
 */
export async function set(
  key: string,
  source: string,
  data: unknown,
  ttlSeconds?: number
): Promise<void> {
  const ttl = ttlSeconds ?? SOURCE_TTLS[source] ?? 3600; // fallback 1h
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000);

  try {
    await db
      .insert(schema.cache)
      .values({
        key,
        source,
        data,
        ttlSeconds: ttl,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: schema.cache.key,
        set: {
          data,
          source,
          ttlSeconds: ttl,
          expiresAt,
          updatedAt: now,
        },
      });
  } catch {
    // DB unavailable — skip cache write
  }
}

/**
 * Delete a single cache entry by key.
 */
export async function del(key: string): Promise<void> {
  await db.delete(schema.cache).where(eq(schema.cache.key, key));
}

/**
 * Delete all cache entries for a given source.
 */
export async function deleteBySource(source: string): Promise<void> {
  await db.delete(schema.cache).where(eq(schema.cache.source, source));
}

/**
 * Remove all expired cache entries.
 */
export async function cleanup(): Promise<void> {
  await db.delete(schema.cache).where(lt(schema.cache.expiresAt, new Date()));
}

/**
 * Build a deterministic, human-readable cache key.
 * Format: {source}:{endpoint}:{sorted-params-hash}
 */
export function buildKey(
  source: string,
  endpoint: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${String(params[k])}`)
    .join("&");
  return `${source}:${endpoint}:${sortedParams}`;
}
