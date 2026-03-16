---
feature: Rate Limiting on Exposed API Routes
domain: security
source: lib/security/rate-limiter.ts, lib/security/index.ts, lib/supabase/middleware.ts
tests:
  - __tests__/security/rate-limiting.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
  - anti-persona-report
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# Rate Limiting on Exposed API Routes

**Source Files**: `lib/security/rate-limiter.ts`, `lib/security/index.ts`, `lib/supabase/middleware.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/established-practitioner.md`

## Feature: Rate Limiting on Exposed API Routes

Protect API endpoints from abuse by enforcing per-route rate limits using a token bucket algorithm. Each endpoint has configurable request limits and time windows. When an agent (or attacker) exceeds the limit, the platform responds with a 429 Too Many Requests status and standard backoff headers so the agent's browser or integration knows exactly when to retry.

This is invisible to normal usage — an agent generating reports, browsing their dashboard, or reviewing market data will never hit these limits. The limits exist to block automated abuse, credential stuffing, and API hammering.

### Scenario: Normal agent usage is unaffected
Given Alex (rising-star-agent) is generating a market intelligence report
And making typical API calls — report creation, market lookup, persona selection
When they use the platform at a normal pace (a few requests per second across endpoints)
Then all requests are served normally with no rate limit headers or delays
And the experience feels instant and premium

### Scenario: Rapid-fire requests to a single endpoint are throttled
Given an automated script is hammering POST `/api/reports/generate` at 50 requests per second
When the request count exceeds the configured limit for that route (e.g., 10 requests per 60 seconds)
Then the rate limiter returns HTTP 429 Too Many Requests
And the response includes a JSON body: `{ "error": "Too many requests. Please try again later." }`
And the response includes headers:
  - `Retry-After: {seconds until bucket refills}`
  - `X-RateLimit-Limit: {max requests in window}`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: {unix timestamp when limit resets}`

### Scenario: Rate limit state is per-IP
Given two agents are using the platform simultaneously from different IP addresses
When one agent's IP exceeds the rate limit on an endpoint
Then only that IP is throttled
And the other agent's requests continue unaffected

### Scenario: Different endpoints have different limits
Given the platform has route-specific rate limit configurations:
  - Auth routes (`/api/auth/*`): 5 requests per 60 seconds (tight — credential stuffing protection)
  - Report generation (`/api/reports/*/generate`): 10 requests per 60 seconds (expensive pipeline)
  - Read-only endpoints (`/api/markets/*`, `/api/reports/[id]`): 60 requests per 60 seconds (generous — browsing)
  - Admin endpoints (`/api/admin/*`): 30 requests per 60 seconds (moderate — internal tools)
  - Default (unconfigured routes): 30 requests per 60 seconds
When requests arrive at each endpoint
Then the appropriate per-route limit is enforced

### Scenario: Rate limit headers are present on all API responses
Given any authenticated API request is made
When the response is returned (whether 200, 400, or any status)
Then the response includes rate limit headers:
  - `X-RateLimit-Limit: {max requests in window}`
  - `X-RateLimit-Remaining: {requests remaining}`
  - `X-RateLimit-Reset: {unix timestamp when limit resets}`
So that well-behaved clients can self-regulate

### Scenario: Rate limit resets after the window expires
Given an IP has been rate-limited on an endpoint
When the configured time window passes (e.g., 60 seconds)
Then the token bucket refills
And subsequent requests from that IP are allowed again

### Scenario: Rate limiter uses in-memory store
Given the platform runs on Vercel serverless
When the rate limiter initializes
Then it uses an in-memory Map for token bucket state
And entries are lazily cleaned up on each check (remove expired entries)
And the rate limiter accepts this limitation: serverless cold starts reset state (this is acceptable — it errs on the side of leniency, not over-blocking)

### Scenario: Exempt routes skip rate limiting
Given a request targets a route exempt from security checks:
  - `/_next/*` (static assets)
  - `/api/health` (monitoring)
  - `/api/webhooks/*` (external integrations)
  - `/api/honeypot` (scraper trap)
When the middleware runs
Then rate limiting is skipped entirely (reuses the existing `isExemptRoute` check from anti-scraper)

### Scenario: Rate limiting runs after anti-scraper but before auth
Given a request passes the anti-scraper checks (valid user-agent, low suspicion score)
When the middleware pipeline continues
Then the rate limiter check runs next
And if the request is rate-limited, it returns 429 before any Supabase auth overhead
And if the request passes rate limiting, it proceeds to Supabase session management

### Scenario: IP extraction handles proxy headers
Given the platform runs behind Vercel's edge network
When a request arrives
Then the rate limiter extracts the client IP from headers in this priority:
  1. `x-forwarded-for` (first IP in the chain)
  2. `x-real-ip`
  3. Falls back to `"unknown"` (all unknowns share a bucket — conservative)

## User Journey

1. Agent logs in and browses their dashboard → **no rate limiting friction**
2. Agent creates a market and generates a report → **well within limits**
3. **[If abused]** Automated script hammers endpoints → **429 + backoff headers**
4. Script respects `Retry-After` and slows down → requests resume
5. Admin monitors platform health → sees rate limiting in action via logs

## Technical Design

### Rate Limiter Module: `lib/security/rate-limiter.ts`

Exports:
- `checkRateLimit(ip: string, pathname: string): RateLimitResult`
  - Returns `{ allowed: boolean, limit: number, remaining: number, resetAt: number, retryAfter: number }`
- `RATE_LIMIT_CONFIGS: Record<string, { maxRequests: number, windowMs: number }>`
  - Route pattern → config mapping
- `DEFAULT_RATE_LIMIT: { maxRequests: 30, windowMs: 60_000 }`

Internal:
- `TokenBucket` — in-memory Map keyed by `${ip}:${routePattern}`
  - Each entry: `{ tokens: number, lastRefill: number }`
- `matchRoutePattern(pathname: string): string` — matches pathname to closest config key
- `cleanupExpired()` — removes entries older than 2x window (called lazily on each check)

### Route Configuration

```typescript
const RATE_LIMIT_CONFIGS = {
  '/api/auth':              { maxRequests: 5,  windowMs: 60_000 },
  '/api/reports/generate':  { maxRequests: 10, windowMs: 60_000 },
  '/api/markets':           { maxRequests: 60, windowMs: 60_000 },
  '/api/reports':           { maxRequests: 60, windowMs: 60_000 },
  '/api/admin':             { maxRequests: 30, windowMs: 60_000 },
  '/api/stripe/webhooks':   { maxRequests: 60, windowMs: 60_000 },
};
```

### Barrel Export Update: `lib/security/index.ts`

Re-exports `checkRateLimit`, `RATE_LIMIT_CONFIGS`, and `DEFAULT_RATE_LIMIT` alongside existing anti-scraper and Turnstile exports.

### Middleware Integration

In `lib/supabase/middleware.ts`, after anti-scraper checks pass:

```
exempt check → UA block → suspicion score → RATE LIMIT → Supabase auth
```

If rate-limited, return `NextResponse.json({ error: "Too many requests..." }, { status: 429 })` with rate limit and `Retry-After` headers. If allowed, attach `X-RateLimit-*` headers to the eventual response.

### 429 Response Format

```json
{
  "error": "Too many requests. Please try again later."
}
```

Headers:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 42
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1710600042
Content-Type: application/json
```

## UI Mockup

No UI component — this is invisible middleware. The only user-facing artifact is the 429 response, which well-behaved browsers and API clients handle automatically via `Retry-After`.

If a rate limit is ever surfaced to a real agent (extremely unlikely in normal use), the error handling middleware should display:

```
┌─ Error Toast (bg: surface, border: color-warning, radius: md, shadow: md) ────┐
│                                                                                 │
│  ⚠ Slow down                                          (font: sans, text: sm)   │
│  You're making requests too quickly.                                            │
│  Please wait a moment and try again.    (font: sans, text: sm, color:           │
│                                          text-secondary)                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component References

None — this is backend middleware only.

## Learnings

- Token bucket is preferred over fixed window because it handles burst traffic more gracefully — a fixed window can allow 2x the limit at the boundary between windows
- In-memory rate limiting on serverless has known limitations (cold starts reset state) but is acceptable for v1 — Redis-backed rate limiting can be added later if abuse patterns require it
- Rate limit headers on ALL responses (not just 429s) is best practice — it lets well-behaved clients self-regulate before hitting limits
