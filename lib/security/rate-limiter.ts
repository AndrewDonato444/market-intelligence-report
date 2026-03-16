/**
 * Per-route rate limiter with dual-mode storage:
 *   - Upstash Redis (shared across serverless instances) when configured
 *   - In-memory fallback for development / when Upstash is not set up
 *
 * Upstash mode uses @upstash/ratelimit's sliding window algorithm.
 * In-memory mode uses a token bucket algorithm (resets on cold start).
 *
 * Upstash imports are dynamic to avoid ESM/CJS issues in test environments.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

interface BucketEntry {
  tokens: number;
  lastRefill: number;
  windowMs: number;
}

/**
 * Route-specific rate limit configurations.
 * More restrictive for auth (credential stuffing) and report generation (expensive).
 * More generous for read-only endpoints.
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  "/api/auth": { maxRequests: 5, windowMs: 60_000 },
  "/api/reports/generate": { maxRequests: 10, windowMs: 60_000 },
  "/api/deal-analyzer": { maxRequests: 10, windowMs: 60_000 },
  "/api/advisor": { maxRequests: 20, windowMs: 60_000 },
  "/api/social-media": { maxRequests: 15, windowMs: 60_000 },
  "/api/email-campaigns": { maxRequests: 15, windowMs: 60_000 },
  "/api/markets": { maxRequests: 60, windowMs: 60_000 },
  "/api/reports": { maxRequests: 60, windowMs: 60_000 },
  "/api/admin": { maxRequests: 30, windowMs: 60_000 },
  "/api/stripe/webhooks": { maxRequests: 60, windowMs: 60_000 },
};

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

// --- Upstash Redis rate limiters (created lazily via dynamic import) ---

let upstashAvailable: boolean | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const upstashLimiters = new Map<string, any>();

function isUpstashConfigured(): boolean {
  if (upstashAvailable !== null) return upstashAvailable;
  upstashAvailable = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
  return upstashAvailable;
}

/**
 * Create or retrieve an Upstash rate limiter for a route pattern.
 * Uses dynamic imports to avoid ESM/CJS issues in test environments.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUpstashLimiter(routeKey: string, config: RateLimitConfig): Promise<any> {
  let limiter = upstashLimiters.get(routeKey);
  if (limiter) return limiter;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      config.maxRequests,
      `${config.windowMs} ms`
    ),
    prefix: `ratelimit:${routeKey}`,
  });

  upstashLimiters.set(routeKey, limiter);
  return limiter;
}

// --- In-memory fallback (development / no Upstash) ---

// In-memory token bucket store: key = `${ip}:${routePattern}`
const buckets = new Map<string, BucketEntry>();

/**
 * Match a pathname to the closest rate limit config key.
 * Checks if the pathname starts with any configured route prefix.
 * Returns the most specific (longest) match.
 */
export function matchRoutePattern(pathname: string): string | null {
  let bestMatch: string | null = null;
  let bestLength = 0;

  for (const pattern of Object.keys(RATE_LIMIT_CONFIGS)) {
    if (pathname === pattern || pathname.startsWith(pattern + "/")) {
      if (pattern.length > bestLength) {
        bestMatch = pattern;
        bestLength = pattern.length;
      }
    }
  }

  return bestMatch;
}

/**
 * Remove expired bucket entries. Called lazily on each check.
 * Removes entries older than 2x their window to avoid unbounded memory growth.
 */
function cleanupExpired(now: number): void {
  for (const [key, entry] of buckets) {
    if (now - entry.lastRefill > entry.windowMs * 2) {
      buckets.delete(key);
    }
  }
}

/**
 * Extract client IP from request headers.
 * Priority: x-forwarded-for (first IP) → x-real-ip → "unknown"
 */
export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/**
 * In-memory token bucket check (fallback when Upstash not configured).
 */
function checkRateLimitInMemory(ip: string, pathname: string): RateLimitResult {
  const now = Date.now();

  // Lazy cleanup of expired entries
  cleanupExpired(now);

  // Determine which config applies
  const routePattern = matchRoutePattern(pathname);
  const config = routePattern
    ? RATE_LIMIT_CONFIGS[routePattern]
    : DEFAULT_RATE_LIMIT;

  const bucketKey = `${ip}:${routePattern ?? "default"}`;
  let entry = buckets.get(bucketKey);

  if (!entry) {
    // First request — create a full bucket
    entry = {
      tokens: config.maxRequests - 1, // consume one token for this request
      lastRefill: now,
      windowMs: config.windowMs,
    };
    buckets.set(bucketKey, entry);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: entry.tokens,
      resetAt: Math.ceil((now + config.windowMs) / 1000),
      retryAfter: 0,
    };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  if (elapsed >= config.windowMs) {
    // Full window has passed — refill completely
    entry.tokens = config.maxRequests;
    entry.lastRefill = now;
  }

  if (entry.tokens > 0) {
    // Consume a token
    entry.tokens -= 1;
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: entry.tokens,
      resetAt: Math.ceil((entry.lastRefill + config.windowMs) / 1000),
      retryAfter: 0,
    };
  }

  // No tokens left — rate limited
  const resetAt = Math.ceil((entry.lastRefill + config.windowMs) / 1000);
  const retryAfter = Math.max(1, Math.ceil((entry.lastRefill + config.windowMs - now) / 1000));

  return {
    allowed: false,
    limit: config.maxRequests,
    remaining: 0,
    resetAt,
    retryAfter,
  };
}

/**
 * Check rate limit for a given IP and pathname.
 * Uses Upstash Redis when configured (shared across all serverless instances).
 * Falls back to in-memory token bucket when Upstash is not set up.
 */
export async function checkRateLimit(
  ip: string,
  pathname: string
): Promise<RateLimitResult> {
  // --- Upstash mode: shared state across all serverless instances ---
  if (isUpstashConfigured()) {
    const routePattern = matchRoutePattern(pathname);
    const config = routePattern
      ? RATE_LIMIT_CONFIGS[routePattern]
      : DEFAULT_RATE_LIMIT;

    try {
      const limiter = await getUpstashLimiter(routePattern ?? "default", config);
      const result = await limiter.limit(ip);

      return {
        allowed: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetAt: Math.ceil(result.reset / 1000),
        retryAfter: result.success
          ? 0
          : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      };
    } catch (err) {
      // Upstash failure — fail open with in-memory fallback
      console.error("[rate-limiter] Upstash error, falling back to in-memory:", err);
      return checkRateLimitInMemory(ip, pathname);
    }
  }

  // --- In-memory mode: development fallback ---
  return checkRateLimitInMemory(ip, pathname);
}

/**
 * Synchronous in-memory-only rate limit check.
 * Used by tests and code that can't await. Does NOT use Upstash.
 */
export function checkRateLimitSync(ip: string, pathname: string): RateLimitResult {
  return checkRateLimitInMemory(ip, pathname);
}

/**
 * Reset all rate limit state. Used for testing.
 */
export function resetRateLimitState(): void {
  buckets.clear();
  upstashLimiters.clear();
  upstashAvailable = null;
}
