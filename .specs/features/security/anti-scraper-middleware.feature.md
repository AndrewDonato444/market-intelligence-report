---
feature: Anti-Scraper Middleware
domain: security
source: lib/security/anti-scraper.ts, lib/supabase/middleware.ts, lib/security/index.ts, app/api/honeypot/route.ts
tests:
  - __tests__/security/anti-scraper-middleware.test.ts
components: []
personas:
  - rising-star-agent
  - anti-persona-report
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# Anti-Scraper Middleware

**Source Files**: `lib/security/anti-scraper.ts`, `lib/supabase/middleware.ts`, `lib/security/index.ts`, `app/api/honeypot/route.ts`
**Personas**: `.specs/personas/rising-star-agent.md`

## Feature: Anti-Scraper Middleware

Protect the platform from automated scraping by filtering known bot user-agents, whitelisting legitimate search engine bots, fingerprinting suspicious request patterns, providing honeypot routes that trap scrapers, and automatically blocking IPs that exhibit suspicious behavior.

### Scenario: Legitimate user requests pass through unaffected
Given a real estate agent is browsing with a normal browser user-agent (Chrome, Firefox, Safari)
And their IP has no prior suspicious activity
When they navigate pages or call API endpoints
Then all requests are served normally

### Scenario: Known bot user-agent is blocked
Given an automated scraper sends a request with user-agent "python-requests/2.28.0"
When the middleware inspects the request
Then it returns a 403 status with JSON body { "error": "Forbidden" }

### Scenario: Empty user-agent is blocked
Given a request arrives with no User-Agent header (null or empty/whitespace-only)
When the middleware inspects the request
Then it returns a 403 status with JSON body { "error": "Forbidden" }

### Scenario: Headless browser user-agent is blocked
Given a request arrives with user-agent containing "HeadlessChrome"
When the middleware inspects the request
Then it returns a 403 status with JSON body { "error": "Forbidden" }

### Scenario: Legitimate search engine bots are allowed
Given a request arrives from Googlebot, Bingbot, Slurp (Yahoo), DuckDuckBot, or social media crawlers (facebookexternalhit, Twitterbot, LinkedInBot)
Or a monitoring service (UptimeRobot, Pingdom)
When the middleware inspects the user-agent
Then the request is allowed through (not blocked)
And the allowed-bot check runs before the blocked-bot check

### Scenario: Honeypot route traps scrapers
Given a hidden link exists at /api/honeypot that is invisible to real users
When a scraper sends a GET or POST request to /api/honeypot
Then the route returns a 204 No Content response
And the scraper's IP and user-agent are logged via console.warn with "[honeypot]" prefix

### Scenario: Suspicious request fingerprint detection
Given a request arrives missing standard browser headers
When the middleware computes a suspicion score by checking for:
  - Accept header (missing = +1)
  - Accept-Language header (missing = +1)
  - Accept-Encoding header (missing = +1)
  - Sec-Fetch-Mode header (missing = +1)
Then a score of 0 (all present) to 4 (all missing) is computed
And if the score >= SUSPICION_THRESHOLD (2), the request is blocked with 403

### Scenario: Static assets and health routes are exempt
Given any request targets /_next/* paths, files with extensions (e.g. .css, .js, .png, .svg), or /api/health
When the middleware runs
Then the anti-scraper checks are skipped entirely

### Scenario: Webhook routes are exempt
Given an external service calls /api/webhooks/*
When the middleware runs
Then the anti-scraper checks are skipped (webhooks have their own auth)

## Technical Design

### Anti-Scraper Module: lib/security/anti-scraper.ts

Exports:
- `isBlockedUserAgent(ua: string | null): boolean` — checks allowed bots first, then blocked patterns
- `computeSuspicionScore(headers: Headers): number` — scores 0-4 based on 4 missing headers
- `SUSPICION_THRESHOLD: number` (default: 2)
- `BOT_USER_AGENT_PATTERNS: RegExp[]` — 17 patterns (python-requests, curl, wget, scrapy, HeadlessChrome, PhantomJS, Puppeteer, etc.)
- `isExemptRoute(pathname: string): boolean` — checks /_next, /api/health, /api/webhooks, file extensions

Internal (not exported):
- `ALLOWED_BOT_PATTERNS: RegExp[]` — 9 patterns (Googlebot, Bingbot, Slurp, DuckDuckBot, facebookexternalhit, Twitterbot, LinkedInBot, UptimeRobot, Pingdom)

### Barrel Export: lib/security/index.ts

Re-exports all public symbols from anti-scraper.ts alongside verifyTurnstileToken.

### Honeypot Route: app/api/honeypot/route.ts

- Handles both GET and POST (POST delegates to GET)
- Extracts IP from x-forwarded-for or x-real-ip headers
- Logs IP and user-agent with `[honeypot]` prefix via console.warn
- Returns 204 No Content

### Integration

Runs in `lib/supabase/middleware.ts` before Supabase session check (`createServerClient`). Exempt routes skip checks entirely. Order: exempt check → UA block → suspicion score → (if passed) proceed to Supabase auth.
