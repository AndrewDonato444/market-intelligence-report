import fs from "fs";
import path from "path";

describe("Rate Limiting on Exposed API Routes", () => {
  describe("SVC: Rate limiter module (lib/security/rate-limiter.ts)", () => {
    let moduleContent: string;

    beforeAll(() => {
      moduleContent = fs.readFileSync(
        path.join(process.cwd(), "lib/security/rate-limiter.ts"),
        "utf8"
      );
    });

    it("SVC-RATELIMIT-001: exports checkRateLimit function", () => {
      expect(moduleContent).toContain("export function checkRateLimit");
    });

    it("SVC-RATELIMIT-002: exports RATE_LIMIT_CONFIGS constant", () => {
      expect(moduleContent).toContain("export const RATE_LIMIT_CONFIGS");
    });

    it("SVC-RATELIMIT-003: exports DEFAULT_RATE_LIMIT constant", () => {
      expect(moduleContent).toContain("export const DEFAULT_RATE_LIMIT");
    });

    it("SVC-RATELIMIT-004: exports matchRoutePattern function", () => {
      expect(moduleContent).toContain("export function matchRoutePattern");
    });

    it("SVC-RATELIMIT-005: exports extractClientIp function", () => {
      expect(moduleContent).toContain("export function extractClientIp");
    });

    it("SVC-RATELIMIT-006: exports resetRateLimitState function", () => {
      expect(moduleContent).toContain("export function resetRateLimitState");
    });

    it("SVC-RATELIMIT-007: configures /api/auth with 5 requests per 60s", () => {
      expect(moduleContent).toContain('"/api/auth"');
      expect(moduleContent).toContain("maxRequests: 5");
    });

    it("SVC-RATELIMIT-008: configures /api/reports/generate with 10 requests per 60s", () => {
      expect(moduleContent).toContain('"/api/reports/generate"');
      expect(moduleContent).toContain("maxRequests: 10");
    });

    it("SVC-RATELIMIT-009: configures /api/markets with 60 requests per 60s", () => {
      expect(moduleContent).toContain('"/api/markets"');
      expect(moduleContent).toContain("maxRequests: 60");
    });

    it("SVC-RATELIMIT-010: configures /api/admin with 30 requests per 60s", () => {
      expect(moduleContent).toContain('"/api/admin"');
      expect(moduleContent).toContain("maxRequests: 30");
    });

    it("SVC-RATELIMIT-011: default rate limit is 30 requests per 60s", () => {
      expect(moduleContent).toMatch(
        /DEFAULT_RATE_LIMIT[\s\S]*maxRequests:\s*30/
      );
    });

    it("SVC-RATELIMIT-012: uses token bucket algorithm with in-memory Map", () => {
      expect(moduleContent).toContain("new Map<string, BucketEntry>");
    });

    it("SVC-RATELIMIT-013: implements lazy cleanup of expired entries", () => {
      expect(moduleContent).toContain("cleanupExpired");
      expect(moduleContent).toContain("windowMs * 2");
    });

    it("SVC-RATELIMIT-014: extracts IP from x-forwarded-for header", () => {
      expect(moduleContent).toContain("x-forwarded-for");
    });

    it("SVC-RATELIMIT-015: extracts IP from x-real-ip header as fallback", () => {
      expect(moduleContent).toContain("x-real-ip");
    });

    it("SVC-RATELIMIT-016: falls back to 'unknown' for missing IP", () => {
      expect(moduleContent).toContain('"unknown"');
    });
  });

  describe("SVC: Rate limiter logic (unit tests)", () => {
    let checkRateLimit: (ip: string, pathname: string) => { allowed: boolean; limit: number; remaining: number; resetAt: number; retryAfter: number };
    let matchRoutePattern: (pathname: string) => string | null;
    let extractClientIp: (headers: Headers) => string;
    let resetRateLimitState: () => void;
    let RATE_LIMIT_CONFIGS: Record<string, { maxRequests: number; windowMs: number }>;
    let DEFAULT_RATE_LIMIT: { maxRequests: number; windowMs: number };

    beforeAll(async () => {
      const mod = await import("@/lib/security/rate-limiter");
      checkRateLimit = mod.checkRateLimit;
      matchRoutePattern = mod.matchRoutePattern;
      extractClientIp = mod.extractClientIp;
      resetRateLimitState = mod.resetRateLimitState;
      RATE_LIMIT_CONFIGS = mod.RATE_LIMIT_CONFIGS;
      DEFAULT_RATE_LIMIT = mod.DEFAULT_RATE_LIMIT;
    });

    beforeEach(() => {
      resetRateLimitState();
    });

    it("SVC-RATELIMIT-020: matches /api/auth/signin to /api/auth", () => {
      expect(matchRoutePattern("/api/auth/signin")).toBe("/api/auth");
    });

    it("SVC-RATELIMIT-021: matches /api/auth/signup to /api/auth", () => {
      expect(matchRoutePattern("/api/auth/signup")).toBe("/api/auth");
    });

    it("SVC-RATELIMIT-022: matches /api/reports/generate to most specific pattern", () => {
      expect(matchRoutePattern("/api/reports/generate")).toBe("/api/reports/generate");
    });

    it("SVC-RATELIMIT-023: matches /api/reports/123 to /api/reports", () => {
      expect(matchRoutePattern("/api/reports/123")).toBe("/api/reports");
    });

    it("SVC-RATELIMIT-024: matches /api/markets/search to /api/markets", () => {
      expect(matchRoutePattern("/api/markets/search")).toBe("/api/markets");
    });

    it("SVC-RATELIMIT-025: returns null for unconfigured routes", () => {
      expect(matchRoutePattern("/api/some/other/route")).toBeNull();
    });

    it("SVC-RATELIMIT-026: matches /api/admin/users to /api/admin", () => {
      expect(matchRoutePattern("/api/admin/users")).toBe("/api/admin");
    });

    it("SVC-RATELIMIT-030: extracts first IP from x-forwarded-for", () => {
      const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 172.16.0.1" });
      expect(extractClientIp(headers)).toBe("1.2.3.4");
    });

    it("SVC-RATELIMIT-031: uses x-real-ip when x-forwarded-for missing", () => {
      const headers = new Headers({ "x-real-ip": "5.6.7.8" });
      expect(extractClientIp(headers)).toBe("5.6.7.8");
    });

    it("SVC-RATELIMIT-032: falls back to 'unknown' when no IP headers", () => {
      const headers = new Headers();
      expect(extractClientIp(headers)).toBe("unknown");
    });

    it("SVC-RATELIMIT-033: prefers x-forwarded-for over x-real-ip", () => {
      const headers = new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" });
      expect(extractClientIp(headers)).toBe("1.2.3.4");
    });

    it("SVC-RATELIMIT-040: allows first request", () => {
      const result = checkRateLimit("1.2.3.4", "/api/auth/signin");
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
    });

    it("SVC-RATELIMIT-041: allows requests up to the limit", () => {
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit("1.2.3.4", "/api/auth/signin");
        expect(result.allowed).toBe(true);
      }
    });

    it("SVC-RATELIMIT-042: blocks request after limit exceeded", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("1.2.3.4", "/api/auth/signin");
      }
      const result = checkRateLimit("1.2.3.4", "/api/auth/signin");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("SVC-RATELIMIT-043: returns proper rate limit headers on 429", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("1.2.3.4", "/api/auth/signin");
      }
      const result = checkRateLimit("1.2.3.4", "/api/auth/signin");
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeGreaterThan(0);
      expect(result.retryAfter).toBeGreaterThanOrEqual(1);
    });

    it("SVC-RATELIMIT-044: rate limit is per-IP", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("1.1.1.1", "/api/auth/signin");
      }
      expect(checkRateLimit("1.1.1.1", "/api/auth/signin").allowed).toBe(false);
      expect(checkRateLimit("2.2.2.2", "/api/auth/signin").allowed).toBe(true);
    });

    it("SVC-RATELIMIT-045: different endpoints have independent limits", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("1.2.3.4", "/api/auth/signin");
      }
      expect(checkRateLimit("1.2.3.4", "/api/auth/signin").allowed).toBe(false);
      expect(checkRateLimit("1.2.3.4", "/api/markets/search").allowed).toBe(true);
    });

    it("SVC-RATELIMIT-046: uses default limit for unconfigured routes", () => {
      const result = checkRateLimit("1.2.3.4", "/api/some/random/endpoint");
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(30);
    });

    it("SVC-RATELIMIT-047: remaining count decreases with each request", () => {
      const r1 = checkRateLimit("1.2.3.4", "/api/auth/signin");
      expect(r1.remaining).toBe(4);
      const r2 = checkRateLimit("1.2.3.4", "/api/auth/signin");
      expect(r2.remaining).toBe(3);
      const r3 = checkRateLimit("1.2.3.4", "/api/auth/signin");
      expect(r3.remaining).toBe(2);
    });

    it("SVC-RATELIMIT-048: retryAfter is 0 for allowed requests", () => {
      const result = checkRateLimit("1.2.3.4", "/api/auth/signin");
      expect(result.retryAfter).toBe(0);
    });

    it("SVC-RATELIMIT-049: DEFAULT_RATE_LIMIT has correct values", () => {
      expect(DEFAULT_RATE_LIMIT.maxRequests).toBe(30);
      expect(DEFAULT_RATE_LIMIT.windowMs).toBe(60_000);
    });

    it("SVC-RATELIMIT-050: RATE_LIMIT_CONFIGS has expected routes", () => {
      expect(RATE_LIMIT_CONFIGS).toHaveProperty("/api/auth");
      expect(RATE_LIMIT_CONFIGS).toHaveProperty("/api/reports/generate");
      expect(RATE_LIMIT_CONFIGS).toHaveProperty("/api/markets");
      expect(RATE_LIMIT_CONFIGS).toHaveProperty("/api/reports");
      expect(RATE_LIMIT_CONFIGS).toHaveProperty("/api/admin");
      expect(RATE_LIMIT_CONFIGS).toHaveProperty("/api/stripe/webhooks");
    });
  });

  describe("Integration: Middleware imports rate limiter", () => {
    let middlewareContent: string;

    beforeAll(() => {
      middlewareContent = fs.readFileSync(
        path.join(process.cwd(), "lib/supabase/middleware.ts"),
        "utf8"
      );
    });

    it("MW-RATELIMIT-001: imports checkRateLimit", () => {
      expect(middlewareContent).toContain("checkRateLimit");
    });

    it("MW-RATELIMIT-002: imports extractClientIp", () => {
      expect(middlewareContent).toContain("extractClientIp");
    });

    it("MW-RATELIMIT-003: returns 429 for rate-limited requests", () => {
      expect(middlewareContent).toContain("429");
      expect(middlewareContent).toContain("Too many requests. Please try again later.");
    });

    it("MW-RATELIMIT-004: includes Retry-After header in 429 response", () => {
      expect(middlewareContent).toContain("Retry-After");
    });

    it("MW-RATELIMIT-005: includes X-RateLimit-Limit header", () => {
      expect(middlewareContent).toContain("X-RateLimit-Limit");
    });

    it("MW-RATELIMIT-006: includes X-RateLimit-Remaining header", () => {
      expect(middlewareContent).toContain("X-RateLimit-Remaining");
    });

    it("MW-RATELIMIT-007: includes X-RateLimit-Reset header", () => {
      expect(middlewareContent).toContain("X-RateLimit-Reset");
    });

    it("MW-RATELIMIT-008: rate limiting runs after anti-scraper checks", () => {
      const scraperIndex = middlewareContent.indexOf("isBlockedUserAgent(");
      const rateLimitIndex = middlewareContent.indexOf("checkRateLimit(");
      expect(scraperIndex).toBeGreaterThan(-1);
      expect(rateLimitIndex).toBeGreaterThan(-1);
      expect(rateLimitIndex).toBeGreaterThan(scraperIndex);
    });

    it("MW-RATELIMIT-009: rate limiting runs before Supabase auth", () => {
      const rateLimitIndex = middlewareContent.indexOf("checkRateLimit(");
      const supabaseIndex = middlewareContent.indexOf("createServerClient(");
      expect(rateLimitIndex).toBeGreaterThan(-1);
      expect(supabaseIndex).toBeGreaterThan(-1);
      expect(rateLimitIndex).toBeLessThan(supabaseIndex);
    });

    it("MW-RATELIMIT-010: skips rate limiting for exempt routes", () => {
      const exemptIndex = middlewareContent.indexOf("isExemptRoute(");
      const rateLimitIndex = middlewareContent.indexOf("checkRateLimit(");
      expect(exemptIndex).toBeLessThan(rateLimitIndex);
    });

    it("MW-RATELIMIT-011: attaches rate limit headers to successful responses", () => {
      expect(middlewareContent).toContain('supabaseResponse.headers.set("X-RateLimit-Limit"');
      expect(middlewareContent).toContain('supabaseResponse.headers.set("X-RateLimit-Remaining"');
      expect(middlewareContent).toContain('supabaseResponse.headers.set("X-RateLimit-Reset"');
    });
  });

  describe("Security: barrel export includes rate limiter", () => {
    it("lib/security/index.ts exports rate limiter functions", () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), "lib/security/index.ts"),
        "utf8"
      );
      expect(content).toContain("checkRateLimit");
      expect(content).toContain("extractClientIp");
      expect(content).toContain("RATE_LIMIT_CONFIGS");
      expect(content).toContain("DEFAULT_RATE_LIMIT");
      expect(content).toContain("matchRoutePattern");
      expect(content).toContain("resetRateLimitState");
    });
  });
});
