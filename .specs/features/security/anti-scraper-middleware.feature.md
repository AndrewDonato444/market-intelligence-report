---
feature: Anti-Scraper Middleware
domain: security
source: lib/security/anti-scraper.ts, middleware.ts, lib/supabase/middleware.ts, app/api/honeypot/route.ts
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

**Source Files**: `lib/security/anti-scraper.ts`, `middleware.ts`, `lib/supabase/middleware.ts`
**Personas**: `.specs/personas/rising-star-agent.md`

## Feature: Anti-Scraper Middleware

Protect the platform from automated scraping by filtering known bot user-agents, fingerprinting suspicious request patterns, providing honeypot routes that trap scrapers, and automatically blocking IPs that exhibit suspicious behavior.

### Scenario: Legitimate user requests pass through unaffected
Given a real estate agent is browsing with a normal browser user-agent
And their IP has no prior suspicious activity
When they navigate pages or call API endpoints
Then all requests are served normally

### Scenario: Known bot user-agent is blocked
Given an automated scraper sends a request with user-agent "python-requests/2.28.0"
When the middleware inspects the request
Then it returns a 403 status with JSON body { "error": "Forbidden" }

### Scenario: Empty user-agent is blocked
Given a request arrives with no User-Agent header
When the middleware inspects the request
Then it returns a 403 status with JSON body { "error": "Forbidden" }

### Scenario: Headless browser user-agent is blocked
Given a request arrives with user-agent containing "HeadlessChrome"
When the middleware inspects the request
Then it returns a 403 status with JSON body { "error": "Forbidden" }

### Scenario: Honeypot route traps scrapers
Given a hidden link exists at /api/honeypot that is invisible to real users
When the scraper hits /api/honeypot
Then the route returns a 204 No Content response
And the scraper's IP is logged for monitoring

### Scenario: Suspicious request fingerprint detection
Given a request arrives without Accept, Accept-Language, or Accept-Encoding headers
When the middleware computes a suspicion score
Then the score exceeds the threshold (missing 2+ standard headers)
And the request is blocked with 403

### Scenario: Static assets and health routes are exempt
Given any request targets /_next/static, .css, .js, or /api/health
When the middleware runs
Then the anti-scraper checks are skipped entirely

### Scenario: Webhook routes are exempt
Given an external service calls /api/webhooks/stripe
When the middleware runs
Then the anti-scraper checks are skipped

## Technical Design

### Anti-Scraper Module: lib/security/anti-scraper.ts

Exports:
- isBlockedUserAgent(ua: string | null): boolean
- computeSuspicionScore(headers: Headers): number
- SUSPICION_THRESHOLD: number (default: 2)
- BOT_USER_AGENT_PATTERNS: RegExp[]
- isExemptRoute(pathname: string): boolean

### Integration

Runs in lib/supabase/middleware.ts before Supabase session check. Exempt routes skip checks entirely.
