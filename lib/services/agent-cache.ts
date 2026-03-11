/**
 * Agent Output Cache — hash-based dedup of Claude calls.
 *
 * When re-running a report for the same market with unchanged source data,
 * Claude agents will produce identical output. This module caches agent
 * results keyed by a SHA-256 hash of their input data, so re-runs skip
 * Claude entirely when the source data hasn't changed.
 *
 * Uses the existing cache service (DB-backed) with a 7-day TTL.
 */

import { createHash } from "crypto";
import * as cache from "@/lib/services/cache";
import type { AgentResult, MarketData } from "@/lib/agents/orchestrator";
import type { ComputedAnalytics } from "@/lib/services/market-analytics";

/** Agent output cache TTL: 7 days (same as stale fallback window). */
export const AGENT_OUTPUT_TTL = 604800; // 7 days in seconds

const CACHE_SOURCE = "agent-output";

/**
 * Sort object keys recursively for deterministic JSON serialization.
 * This ensures { a: 1, b: 2 } and { b: 2, a: 1 } produce the same hash.
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Compute a deterministic SHA-256 hash of an agent's input data.
 *
 * The hash includes:
 * - Agent name (so different agents with same input get different keys)
 * - Market definition
 * - ComputedAnalytics (Layer 1 output)
 * - Upstream agent results (for agents with dependencies)
 *
 * Keys are sorted recursively so property ordering doesn't affect the hash.
 */
export function computeInputHash(
  agentName: string,
  market: MarketData,
  computedAnalytics: ComputedAnalytics | undefined,
  upstreamResults: Record<string, AgentResult>
): string {
  const payload = sortKeys({
    agent: agentName,
    market,
    analytics: computedAnalytics ?? null,
    upstream: upstreamResults,
  });

  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Check cache for a previously computed agent result.
 * Returns null on miss or any error (DB unavailable, etc).
 */
export async function getCachedAgentResult(
  agentName: string,
  inputHash: string
): Promise<AgentResult | null> {
  const cacheKey = `${CACHE_SOURCE}:${agentName}:${inputHash}`;
  try {
    const cached = await cache.get(cacheKey);
    return cached as AgentResult | null;
  } catch {
    // DB unavailable — treat as cache miss
    return null;
  }
}

/**
 * Store an agent result in the cache.
 * Fails silently if the DB is unavailable.
 */
export async function cacheAgentResult(
  agentName: string,
  inputHash: string,
  result: AgentResult,
  ttlSeconds: number = AGENT_OUTPUT_TTL
): Promise<void> {
  const cacheKey = `${CACHE_SOURCE}:${agentName}:${inputHash}`;
  try {
    await cache.set(cacheKey, CACHE_SOURCE, result, ttlSeconds);
  } catch {
    // DB unavailable — skip cache write
  }
}
