---
feature: Entitlement Gating in Report Creation
domain: subscription
source: app/api/reports/route.ts
tests:
  - __tests__/lib/subscription/entitlement-gating-report-creation.test.ts
  - __tests__/reports/step-your-review-entitlement.test.tsx
components:
  - StepYourReview
  - EntitlementGateBanner
  - UpgradePromptModal
personas:
  - rising-star-agent
  - team-leader
  - established-practitioner
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Entitlement Gating in Report Creation

**Source Files**: `app/api/reports/route.ts`, `components/reports/steps/step-your-review.tsx`
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/team-leader.md, .specs/personas/established-practitioner.md
**Depends On**: #173 (Entitlement Check Utility), #40 (Report Builder Wizard), #172 (Usage Tracking)

## Feature: Entitlement Gating in Report Creation

Before a report is generated, the system checks `reports_per_month` entitlement via `checkEntitlement(userId, "reports_per_month")`. If the user has remaining quota, generation proceeds normally with a subtle usage indicator. If the cap is hit, a soft gate with upgrade messaging is shown — no hard wall, no dead end.

This is a **soft gate**: the agent sees what they'd get by upgrading, not just "you can't do this." The tone is helpful and premium — "You've used your monthly reports" not "LIMIT EXCEEDED."

**Who it's for**: All agents, but especially impacts:
- **Alex (Rising Star)** on Starter tier — most likely to hit the 2-report cap early and need to understand the upgrade path
- **Taylor (Team Leader)** on Professional — managing report volume across a team, needs to see remaining quota before committing
- **Jordan (Established Practitioner)** on Professional — deliberate about report quality, appreciates knowing remaining quota for planning

### Scenario: Agent generates a report with remaining quota
Given an agent on the Professional plan with 10 reports per month
And the agent has generated 6 reports this month
When the agent reaches Step 5 (Review & Generate) of the creation flow
Then the "Generate Report" button is enabled
And a usage indicator shows "6 of 10 reports used this month"
And clicking "Generate Report" creates the report and increments usage to 7

### Scenario: Agent generates a report with unlimited quota
Given an agent on the Enterprise plan with unlimited reports
When the agent reaches Step 5 (Review & Generate) of the creation flow
Then the "Generate Report" button is enabled
And no usage indicator is shown (unlimited users don't need to count)
And clicking "Generate Report" creates the report normally

### Scenario: Agent hits their monthly report cap (soft gate)
Given an agent on the Starter plan with 2 reports per month
And the agent has already generated 2 reports this month
When the agent reaches Step 5 (Review & Generate) of the creation flow
Then the "Generate Report" button is replaced with a disabled state
And a soft-gate banner appears above the button explaining:
  - "You've used 2 of 2 reports this month on the Starter plan."
  - "Upgrade to Professional for 10 reports per month."
And a "View Plans" call-to-action is shown
And a "Maybe Later" dismiss option is available

### Scenario: Agent on last report of their quota sees a heads-up
Given an agent on the Starter plan with 2 reports per month
And the agent has generated 1 report this month
When the agent reaches Step 5 (Review & Generate)
Then the usage indicator shows "1 of 2 reports used this month"
And the "Generate Report" button is enabled
And a subtle note reads: "This is your last report this month on the Starter plan"

### Scenario: API enforces entitlement check server-side
Given an agent on the Starter plan who has used 2 of 2 reports this month
When a POST request is sent to `/api/reports` (bypassing UI)
Then the API returns 403 with body `{ error: "Report limit reached", entitlement: { allowed: false, limit: 2, used: 2, remaining: 0 } }`
And no report is created
And no pipeline is triggered

### Scenario: Usage is incremented after successful report creation
Given an agent on the Professional plan with 3 reports used this month
When the agent generates a new report successfully
Then `incrementUsage(userId, "reports_per_month")` is called
And the usage count becomes 4

### Scenario: Usage is NOT incremented if report creation fails
Given an agent on the Professional plan with 3 reports used this month
When the agent attempts to generate a report but the API call fails
Then the usage count remains at 3

### Scenario: Entitlement check loads on step entry (not just on click)
Given an agent navigates to Step 5 of the creation flow
When the step mounts
Then `checkEntitlement` is called via an API endpoint
And the result determines whether the generate button is enabled or the soft gate is shown
And a loading skeleton is shown while the check is in progress

### Scenario: Entitlement check fails gracefully (fail-open)
Given an agent navigates to Step 5
When the entitlement check API call fails (network error, server error)
Then the "Generate Report" button remains enabled
And no usage indicator is shown
And the server-side check in `/api/reports` also fails open per #173's fail-open policy

### Scenario: Admin override grants extra reports
Given an agent on the Starter plan (2 reports/month cap)
And an admin has granted an override boosting reports_per_month to 10
And the agent has generated 3 reports this month
When the agent reaches Step 5
Then the usage indicator shows "3 of 10 reports used this month"
And the "Generate Report" button is enabled

---

## User Journey

1. Agent progresses through creation flow Steps 1-4 (market, tier, focus, audience)
2. Agent arrives at **Step 5: Review & Generate**
3. **This feature**: system checks `reports_per_month` entitlement on step mount
4. If quota remains → usage indicator shown, "Generate Report" enabled
5. If cap hit → soft gate banner shown, "View Plans" CTA, button disabled
6. Agent clicks "Generate Report" → API validates entitlement server-side → report created → usage incremented → Step 6 (Generating) begins
7. Future: Agent checks their usage on Account & Billing page (#177)

---

## UI Mockup

### When quota remains (happy path)

```
┌─ Step 5: Review & Generate ─────────────────────────────────────────────┐
│                                                                          │
│  REVIEW YOUR REPORT                                                      │
│  (font: serif, text: 2xl, weight: bold, color: primary)                 │
│                                                                          │
│  Everything look right? Edit any section or generate your intelligence   │
│  report.                                                                 │
│  (font: sans, text: sm, color: text-secondary)                          │
│  ─── (accent line) ───                                                   │
│                                                                          │
│  ┌─ Summary Cards (existing) ─────────────────────────────────────────┐ │
│  │  Your Market · Your Tier · Your Focus · Your Audience              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Report Title: [ Naples Intelligence Report — Q1 2026     ]             │
│                                                                          │
│  Estimated generation time: 2-4 minutes                                  │
│  (font: sans, text: xs, color: text-tertiary)                           │
│                                                                          │
│  ┌─ Usage Indicator (bg: primary-light, radius: sm, p: spacing-2) ───┐ │
│  │  6 of 10 reports used this month                                   │ │
│  │  (font: sans, text: xs, color: text-secondary)                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [ ████████████████  Generate Report  ████████████████ ]                │
│  (bg: accent, color: primary, font: sans, weight: semibold,            │
│   radius: sm, shadow: sm, full-width)                                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### When on last report of quota

```
┌─ Usage Indicator (bg: accent-light, radius: sm, p: spacing-2) ──────────┐
│  1 of 2 reports used this month                                           │
│  This is your last report this month on the Starter plan                  │
│  (font: sans, text: xs, color: warning)                                  │
└───────────────────────────────────────────────────────────────────────────┘
```

### When cap is hit (soft gate)

```
┌─ Step 5: Review & Generate ─────────────────────────────────────────────┐
│                                                                          │
│  REVIEW YOUR REPORT                                                      │
│  ...                                                                     │
│  (Summary cards still visible — agent can see what they configured)      │
│                                                                          │
│  ┌─ Soft Gate Banner ─────────────────────────────────────────────────┐ │
│  │  (bg: surface, border: border-strong, radius: md, shadow: sm,     │ │
│  │   p: spacing-6)                                                    │ │
│  │                                                                    │ │
│  │  YOU'VE REACHED YOUR MONTHLY LIMIT                                 │ │
│  │  (font: serif, text: lg, weight: bold, color: text)               │ │
│  │                                                                    │ │
│  │  You've used 2 of 2 reports this month on the Starter plan.       │ │
│  │  Upgrade to Professional for 10 reports per month —                │ │
│  │  plus peer market analysis and expanded audience targeting.        │ │
│  │  (font: sans, text: sm, color: text-secondary)                    │ │
│  │                                                                    │ │
│  │  [ ████  View Plans  ████ ]   [ Maybe Later ]                     │ │
│  │  (bg: accent, color: primary,  (color: text-secondary,            │ │
│  │   radius: sm, weight: semibold) text: sm, underline)              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [ ████████████  Generate Report  ████████████ ]                        │
│  (disabled: opacity-50, cursor-not-allowed)                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Loading state (entitlement check in progress)

```
┌─ Usage Indicator (bg: primary-light, radius: sm, p: spacing-2) ──────────┐
│  ████████  (skeleton pulse, w: 180px, h: 14px)                            │
└───────────────────────────────────────────────────────────────────────────┘

[ ████████████  Generate Report  ████████████ ]
(disabled while loading — re-enabled when check completes)
```

---

## Component References

- StepYourReview: `components/reports/steps/step-your-review.tsx` (existing — add entitlement check + usage indicator + soft gate)
- EntitlementGateBanner: new inline component within step-your-review (soft gate messaging when cap hit)
- UpgradePromptModal: **not a modal** — inline banner in the review step. No popups, no interruption. The agent sees it in context.

---

## Technical Design

### New API Endpoint: `GET /api/entitlements/check`

```
GET /api/entitlements/check?type=reports_per_month

Response 200:
{
  "allowed": true,
  "limit": 10,
  "used": 6,
  "remaining": 4
}
```

This thin wrapper calls `checkEntitlement(userId, type)` from `lib/services/entitlement-check.ts`. Needed because the creation flow is client-side and can't call the server function directly.

### Server-side enforcement in `POST /api/reports`

Before `createReport()`, add:

```
1. Call checkEntitlement(userId, "reports_per_month")
2. If !allowed → return 403 { error: "Report limit reached", entitlement: result }
3. If allowed → proceed with createReport()
4. After successful createReport() → call incrementUsage(userId, "reports_per_month")
```

This is the authoritative check — the client-side check in Step 5 is for UX only (preemptive soft gate). The server never trusts the client.

### Client-side flow in `StepYourReview`

```
On mount:
1. Fetch GET /api/entitlements/check?type=reports_per_month
2. While loading: show skeleton, disable Generate button
3. On success:
   - If allowed && remaining > 0 && limit != -1: show usage indicator + enabled button
   - If allowed && limit == -1 (unlimited): show enabled button, no usage indicator
   - If allowed && remaining == 1: show "last report" warning variant
   - If !allowed: show soft gate banner, disable Generate button
4. On error (fetch fails): enable button, hide usage indicator (fail-open)
```

### Usage increment location

Usage is incremented in `POST /api/reports` **after** `createReport()` returns successfully, not before. This ensures we never charge for a failed creation. The increment is fire-and-forget (non-blocking) to avoid slowing down the response.

### "View Plans" navigation

"View Plans" links to `/account/billing` (#177). If #177 isn't built yet, link to `/account` as a fallback. The link target should be a constant so it's easy to update.

---

## Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| User has no subscription record | Default Starter caps apply (2 reports/month) per #173 |
| Entitlement check API is slow (>3s) | Show loading state, don't block indefinitely. After 5s timeout, fail open (enable button) |
| User opens two tabs and generates simultaneously | Server-side check is authoritative. Second request may fail if it pushes past the cap — show error gracefully |
| Mid-month tier upgrade | Next entitlement check reflects new tier immediately. No cache to invalidate |
| Mid-month tier downgrade | Existing reports are kept. New cap applies to new creations only |
| Admin override expires mid-session | Next entitlement check reflects updated state. If agent already had Step 5 open, server-side check catches it |

---

## Accessibility

- Soft gate banner uses `role="alert"` so screen readers announce it
- Usage indicator has `aria-label="Report usage: 6 of 10 reports used this month"`
- Disabled Generate button has `aria-disabled="true"` with descriptive `aria-describedby` pointing to the gate banner
- "View Plans" is a link (`<a>`) not a button — it navigates
- Loading skeleton has `aria-busy="true"` and `aria-label="Checking report availability"`

---

## Dependencies

| Dep | Feature | What it provides |
|-----|---------|-----------------|
| #173 | Entitlement Check Utility | `checkEntitlement()` function, `EntitlementCheckResult` type |
| #172 | Usage Tracking | `incrementUsage()` function |
| #40 | Report Builder Wizard | Creation flow Step 5 (StepYourReview component) |
| #156 | Review & Generate Step | Current Step 5 UI with Generate button |

---

## What This Feature Does NOT Do

- No account/billing page updates (that's #177)
- No market creation gating (that's #175)
- No social media kit gating (that's #176)
- No self-service tier upgrade/checkout (out of scope — Stripe not connected)
- No "View Plans" page — links to existing account page as a placeholder until #177

---

## Implementation Notes

- **Two layers of enforcement**: Client-side (UX — preemptive gate in Step 5) and server-side (authoritative — 403 in POST /api/reports). Never trust the client alone.
- **Usage increment is post-success only**: Call `incrementUsage` after `createReport()` returns successfully, not before. If creation fails, quota is not consumed.
- **Fail-open everywhere**: If the entitlement check fails (DB down, network error), the user can still generate. Availability > correctness for entitlement checks (per #173 design).
- **No modal**: The soft gate is an inline banner, not a popup. It respects the flow — the agent can still see their configuration and edit it. Nothing feels like a paywall wall.
- **Persona vocabulary**: Use "reports" not "generations" or "credits." Use "monthly" not "billing cycle." Use "plan" not "tier" in user-facing copy. These are advisory publications, not API calls.
- **Animation**: Soft gate banner enters with `fadeVariant` from existing animation library. Usage indicator fades in on load. No jarring transitions.

---

## Learnings

### 2026-03-12
- **Gotcha**: Adding a `fetch` call on component mount (entitlement check) broke 4 existing tests in `step-your-review.test.tsx` and 3 in `creation-flow-shell.test.tsx`. All existing fetch mocks needed the new `/api/entitlements/check` endpoint added. Tests that click the Generate button also needed `await waitFor(() => expect(btn).not.toBeDisabled())` to wait for the async entitlement check to resolve before clicking.
- **Pattern**: `MockNextResponse` class + `MinimalRequest` polyfill avoids the jsdom/next-server incompatibility without switching test environments. This approach is lighter than `@jest-environment node` which breaks React Testing Library.
- **Decision**: `gateDismissed` state allows the "Maybe Later" button to hide the banner without changing the disabled state of the Generate button. The button stays disabled even after dismissing — only the banner messaging disappears.
- **Decision**: Entitlement state is `null` on fail-open (fetch error or timeout), not a synthetic "allowed" result. This lets the UI distinguish "we don't know" (hide everything) from "unlimited" (hide usage indicator, enable button).
