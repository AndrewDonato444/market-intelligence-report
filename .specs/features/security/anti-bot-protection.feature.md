---
feature: Anti-Bot Protection
domain: security
source: app/(auth)/sign-up/[[...sign-up]]/page.tsx, app/(auth)/sign-in/[[...sign-in]]/page.tsx, app/terms/page.tsx
tests:
  - __tests__/security/anti-bot-protection.test.ts
components:
  - TurnstileWidget
personas:
  - rising-star-agent
  - anti-persona-report
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# Anti-Bot Protection

**Source Files**: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`, `app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `lib/supabase/auth.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md` (medium patience — verification must be invisible or near-instant)

## Feature: Anti-Bot Protection via Cloudflare Turnstile

Protect signup, login, and public-facing forms from automated bot submissions using Cloudflare Turnstile — a privacy-preserving, CAPTCHA-free verification widget. Server-side token verification ensures the challenge result is authentic before processing any form submission.

**Why Turnstile over reCAPTCHA**: Turnstile is free, privacy-first (no tracking cookies), and most challenges are invisible — the agent never sees a puzzle. This matters because our users (luxury real estate professionals) have **medium-to-high patience** but zero tolerance for anything that makes the platform feel unpolished or consumer-grade. A visible CAPTCHA would undermine the premium experience.

---

### Scenario: Successful signup with Turnstile verification
Given a new agent is on the signup page
And the Turnstile widget has loaded and completed its invisible challenge
When the agent fills in their email and password
And accepts the Terms of Service
And clicks "Create Account"
Then the client sends the Turnstile token alongside the signup request
And the server verifies the token with Cloudflare's siteverify endpoint
And the verification succeeds
And the account is created normally

### Scenario: Successful login with Turnstile verification
Given an existing agent is on the sign-in page
And the Turnstile widget has loaded and completed its invisible challenge
When the agent enters their email and password
And clicks "Sign In"
Then the client sends the Turnstile token alongside the login request
And the server verifies the token with Cloudflare's siteverify endpoint
And the verification succeeds
And the agent is authenticated normally

### Scenario: Bot submits signup without Turnstile token
Given an automated script submits a signup request directly to the API
And no Turnstile token is included in the request
When the server receives the request
Then the server rejects the request with a 403 status
And the response body contains { "error": "Verification required" }
And no account is created

### Scenario: Bot submits invalid or expired Turnstile token
Given an automated script submits a signup request
And the Turnstile token is forged or expired
When the server verifies the token with Cloudflare's siteverify endpoint
And Cloudflare returns { "success": false }
Then the server rejects the request with a 403 status
And the response body contains { "error": "Verification failed" }
And no account is created

### Scenario: Turnstile widget fails to load (network issue)
Given an agent is on the signup page
And Turnstile's JavaScript fails to load (CDN blocked or network error)
When the agent fills in the form and clicks "Create Account"
Then the form shows a message: "Security verification unavailable. Please refresh the page and try again."
And the submit button remains disabled until Turnstile loads
And the form does NOT submit without a valid token

### Scenario: Turnstile challenge expires before form submission
Given an agent is on the signup page
And the Turnstile challenge completed but has since expired (agent took too long)
When the agent clicks "Create Account"
Then the Turnstile widget automatically refreshes
And the agent sees a brief "Verifying..." indicator
And the form submits once a fresh token is obtained

### Scenario: Turnstile in managed mode (interactive challenge)
Given a visitor triggers Turnstile's risk signals (VPN, datacenter IP, unusual behavior)
And Turnstile escalates to a managed interactive challenge
When the visitor completes the challenge (checkbox or simple interaction)
Then the form becomes submittable with the verified token
And the experience remains inline — no popup, no redirect

### Scenario: Server-side verification timeout
Given an agent submits the signup form with a valid Turnstile token
And the Cloudflare siteverify endpoint is unreachable or times out (>5 seconds)
When the server cannot verify the token
Then the server logs the verification failure
And the server rejects the request with a 503 status
And the response body contains { "error": "Verification service temporarily unavailable. Please try again." }
And no account is created

### Scenario: Turnstile does not block authenticated API routes
Given an agent is already authenticated with a valid session
When the agent makes requests to authenticated API endpoints (report generation, market creation, etc.)
Then no Turnstile verification is required
And requests proceed with normal session-based auth

---

## User Journey

1. Agent lands on **signup page** (/sign-up)
2. **Turnstile widget loads invisibly** — no visible UI in most cases
3. Agent fills in email, password, checks ToS → **"Create Account"**
4. Client includes Turnstile token in the signup request
5. Server verifies token with Cloudflare → proceeds with Supabase signup
6. Agent receives confirmation email → verifies → signs in
7. **Sign-in page** also has Turnstile — same invisible flow
8. Once authenticated, **no further Turnstile checks** on app routes

---

## Technical Design

### Client-Side: Turnstile Widget

**Integration approach**: Explicit rendering via @marsidev/react-turnstile (lightweight React wrapper) or direct Turnstile script with callback.

```
TurnstileWidget Component

Props:
  siteKey: string (from NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  onSuccess: (token: string) => void
  onError: () => void
  onExpire: () => void
  theme: 'light' (matches our surface token)
  size: 'invisible' | 'compact'

Behavior:
  - Renders Turnstile in "managed" mode (auto or widget)
  - On success: stores token in parent form state
  - On expire: triggers re-render for fresh challenge
  - On error: sets error state, disables form submit
```

**Placement**: Below the ToS checkbox on signup, below the password field on login. Invisible in most cases — only shows a compact widget if Turnstile escalates to managed mode.

### Server-Side: Token Verification

**New API utility**: lib/security/verify-turnstile.ts

```
verifyTurnstileToken(token: string, remoteIp?: string)
  POST https://challenges.cloudflare.com/turnstile/v0/siteverify
  Body: { secret: TURNSTILE_SECRET_KEY, response: token, remoteip }
  Returns: { success: boolean, error_codes?: string[] }
  Timeout: 5 seconds
```

**Integration points**:
- Signup form handler: verify before calling supabase.auth.signUp()
- Login form handler: verify before calling supabase.auth.signInWithPassword()
- Any future public-facing form (contact, waitlist, etc.)

### Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Client | Widget rendering |
| TURNSTILE_SECRET_KEY | Server only | Token verification |

### Turnstile Mode Selection

Use **managed** mode (Turnstile decides whether to show widget or run invisibly). This gives Cloudflare flexibility to escalate suspicious visitors without us hardcoding the challenge type.

---

## UI Mockup

### Signup Page (Turnstile invisible — default state)

```
+-----------------------------------------------------+
|  (bg: surface, radius: md, shadow: sm)              |
|                                                      |
|  Create Your Account                                 |
|  (font: serif, text: 2xl, weight: bold,              |
|   color: text)                                       |
|                                                      |
|  +------------------------------------------------+  |
|  |  Email                                          |  |
|  |  +------------------------------------------+  |  |
|  |  |  alex@luxuryrealty.com                    |  |  |
|  |  +------------------------------------------+  |  |
|  |                                                 |  |
|  |  Password                                       |  |
|  |  +------------------------------------------+  |  |
|  |  |  **********                          eye  |  |  |
|  |  +------------------------------------------+  |  |
|  |                                                 |  |
|  |  [x] I accept the Terms of Service             |  |
|  |                                                 |  |
|  |  <- Turnstile widget: invisible, no UI shown -> |  |
|  |                                                 |  |
|  |  +------------------------------------------+  |  |
|  |  |        Create Account                     |  |  |
|  |  |  (bg: accent, color: primary,             |  |  |
|  |  |   radius: sm, font: semibold)             |  |  |
|  |  +------------------------------------------+  |  |
|  +------------------------------------------------+  |
|                                                      |
|  Already have an account? Sign in                    |
|  (color: text-secondary)                             |
+-----------------------------------------------------+
```

### Signup Page (Turnstile escalated — managed challenge visible)

```
+-----------------------------------------------------+
|                                                      |
|  ... (email, password, ToS same as above) ...        |
|                                                      |
|  |  +-- Turnstile Widget (compact) -----------+   |  |
|  |  |  [x] Verify you are human               |   |  |
|  |  |  (bg: surface, border: border,          |   |  |
|  |  |   radius: sm)                           |   |  |
|  |  +-----------------------------------------+   |  |
|  |                                                 |  |
|  |  +------------------------------------------+  |  |
|  |  |        Create Account                     |  |  |
|  |  +------------------------------------------+  |  |
|                                                      |
+-----------------------------------------------------+
```

### Error State: Turnstile failed to load

```
+-----------------------------------------------------+
|                                                      |
|  ... (email, password, ToS same as above) ...        |
|                                                      |
|  |  +-- Alert (bg: error/10, border: error) ---+  |  |
|  |  |  ! Security verification unavailable.    |  |  |
|  |  |  Please refresh the page and try again.  |  |  |
|  |  |  (font: sans, text: sm, color: error)    |  |  |
|  |  +-----------------------------------------+  |  |
|  |                                                |  |
|  |  +------------------------------------------+  |  |
|  |  |        Create Account                     |  |  |
|  |  |  (opacity: 50%, cursor: not-allowed)      |  |  |
|  |  +------------------------------------------+  |  |
|                                                      |
+-----------------------------------------------------+
```

---

## Component References

- TurnstileWidget: .specs/design-system/components/turnstile-widget.md (stub — new component)
- Existing: Signup form (app/(auth)/sign-up/)
- Existing: Login form (app/(auth)/sign-in/)

---

## Implementation Notes

### What Changes

| File | Change |
|------|--------|
| app/(auth)/sign-up/[[...sign-up]]/page.tsx | Add TurnstileWidget, include token in signup flow |
| app/(auth)/sign-in/[[...sign-in]]/page.tsx | Add TurnstileWidget, include token in login flow |
| lib/security/verify-turnstile.ts | New: server-side token verification utility |
| lib/security/index.ts | New: barrel export for security utilities |
| .env.local | Add NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY |
| package.json | Add @marsidev/react-turnstile (or use raw script) |

### What Does NOT Change

- Supabase Auth flow — Turnstile verification happens **before** calling Supabase
- Authenticated API routes — no Turnstile checks on session-protected endpoints
- Existing ToS checkbox — Turnstile is additive, placed after ToS
- Report generation, market creation, or any in-app flows

### Cloudflare Turnstile Setup Required

1. Create Cloudflare account (free)
2. Add Turnstile widget in Cloudflare dashboard → get site key + secret key
3. Set widget mode to "Managed" (Cloudflare decides invisible vs. interactive)
4. Add allowed domains: localhost, production domain

### Testing Strategy

- **Unit tests**: Mock Turnstile responses for verification utility
- **Component tests**: Mock TurnstileWidget to always return a test token
- **E2E consideration**: Cloudflare provides test keys for development:
  - Site key 1x00000000000000000000AA = always passes
  - Site key 2x00000000000000000000AB = always blocks
  - Secret key 1x0000000000000000000000000000000AA = always passes verification

---

## Persona Revision Notes

**Rising Star Agent (Alex)**: Medium patience. The signup flow must not add friction — Alex is evaluating whether this tool is worth their time. An invisible challenge is essential. If Turnstile escalates to a visible widget, it must look intentional and professional (compact, not a full-screen puzzle). The error state must be helpful, not alarming — Alex should feel "the platform is protecting my account" not "this site is broken."

**Anti-persona check**: The Academic Analyst would want to see verification details or methodology. We show nothing — the security is invisible by design. The Casual Browser would be frustrated by any visible challenge. In managed mode, most visitors never see it.

---

## Learnings

- **Auth moved to server API routes**: Moving Supabase auth calls from client-side to server API routes (`/api/auth/signup`, `/api/auth/signin`) ensures Turnstile verification cannot be bypassed. The token is verified server-side before any auth operation.
- **Graceful degradation**: When `TURNSTILE_SECRET_KEY` is not set, verification is skipped entirely — safe for local dev. When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set, the widget returns null and the form works normally.
- **Test impact**: Moving auth to API routes breaks tests that mock `@/lib/supabase/client` directly in auth pages. Tests need to mock `fetch` instead. The email-confirmation tests needed updating to check the API route for `emailRedirectTo` instead of the client page.
