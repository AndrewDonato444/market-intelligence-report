---
feature: Entitlement Gating in Market Creation
domain: subscription
source: app/api/markets/route.ts
tests:
  - __tests__/lib/subscription/entitlement-gating-market-creation.test.ts
  - __tests__/markets/market-creation-shell-entitlement.test.tsx
components:
  - MarketCreationShell
  - EntitlementGateBanner
personas:
  - rising-star-agent
  - team-leader
  - established-practitioner
status: implemented
created: 2026-03-12
updated: 2026-03-16
---

# Entitlement Gating in Market Creation

**Source Files**: `app/api/markets/route.ts`, `components/markets/market-creation-shell.tsx`, `components/reports/steps/step-your-review.tsx`
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/team-leader.md, .specs/personas/established-practitioner.md
**Depends On**: #173 (Entitlement Check Utility), #11 (Market Definition Wizard), #172 (Usage Tracking)

## Feature: Entitlement Gating in Market Creation

Before a market is created, the system checks the `markets_created` entitlement via `checkEntitlement(userId, "markets_created")`. Unlike `reports_per_month`, this is a **lifetime count** (not monthly) — markets accumulate and are not reset. If the user has remaining quota, creation proceeds normally with a usage indicator. If the cap is hit, a soft gate with upgrade messaging replaces the save action.

Market creation happens in **two places**:
1. **Standalone market creation** — `MarketCreationShell` on `/markets/create`, where the "Save Market" button is on the final step (Step 2: Your Tier)
2. **Inline during report creation** — `StepYourReview` in the report creation flow creates a market via `POST /api/markets` when `isNewMarket` is true, before creating the report

Both paths hit the same `POST /api/markets` endpoint, so the server-side check covers both. The client-side UX is different for each path.

This is a **soft gate**: the agent sees what they'd get by upgrading, not just "you can't do this." The tone is helpful and premium — "You've reached your market limit" not "LIMIT EXCEEDED."

**Who it's for**: All agents, but especially impacts:
- **Alex (Rising Star)** on Starter tier — limited to 1 market, will hit the cap immediately if they want to expand to a second geography
- **Taylor (Team Leader)** on Professional — managing 3 markets across team members, needs to see how many remain
- **Jordan (Established Practitioner)** on Professional — deliberate about market selection, appreciates knowing the limit before committing

### Scenario: Agent creates a market with remaining quota
Given an agent on the Professional plan with 3 markets allowed
And the agent has defined 1 market
When the agent reaches the final step (Your Tier) of the market creation flow
Then the "Save Market" button is enabled
And a usage indicator shows "1 of 3 markets defined"
And clicking "Save Market" creates the market and the count becomes 2

### Scenario: Agent creates a market with unlimited quota
Given an agent on the Enterprise plan with unlimited markets
When the agent reaches the final step of the market creation flow
Then the "Save Market" button is enabled
And no usage indicator is shown (unlimited users don't need to count)
And clicking "Save Market" creates the market normally

### Scenario: Agent hits their market cap (soft gate)
Given an agent on the Starter plan with 1 market allowed
And the agent has already defined 1 market
When the agent reaches the final step of the market creation flow
Then the "Save Market" button is replaced with a disabled state
And a soft-gate banner appears explaining:
  - "You've reached your market limit on the Starter plan."
  - "Your current market is still fully active — upgrade to Professional to define up to 3 markets."
And a "View Plans" call-to-action is shown
And a "Maybe Later" dismiss option is available

### Scenario: Agent on their last market slot sees a heads-up
Given an agent on the Professional plan with 3 markets allowed
And the agent has defined 2 markets
When the agent reaches the final step of the market creation flow
Then the usage indicator shows "2 of 3 markets defined"
And a subtle note reads: "This is your last available market on the Professional plan"
And the "Save Market" button is enabled

### Scenario: API enforces entitlement check server-side
Given an agent on the Starter plan who has defined 1 of 1 markets
When a POST request is sent to `/api/markets` (bypassing UI)
Then the API returns 403 with body `{ error: "Market limit reached", entitlement: { allowed: false, limit: 1, used: 1, remaining: 0 } }`
And no market is created

### Scenario: Inline market creation in report flow is also gated
Given an agent on the Starter plan who has defined 1 of 1 markets
And the agent has started a new report with a new market (isNewMarket: true)
When the agent clicks "Generate Report" on Step 4 (Review)
Then `POST /api/markets` returns 403
And the report creation is halted with a helpful error: "You've reached your market limit. Use an existing market or upgrade your plan."
And no report is created

### Scenario: Editing an existing market is NOT gated
Given an agent on the Starter plan who has defined 1 of 1 markets
When the agent edits their existing market (PUT `/api/markets/:id`)
Then the edit proceeds normally — no entitlement check
And no usage increment occurs (editing doesn't consume quota)

### Scenario: Usage is incremented after successful market creation
Given an agent on the Professional plan with 1 market defined
When the agent creates a new market successfully
Then `incrementUsage(userId, "markets_created")` is called
And the usage count becomes 2

### Scenario: Usage is NOT incremented if market creation fails
Given an agent on the Professional plan with 1 market defined
When the agent attempts to create a market but validation fails
Then the usage count remains at 1

### Scenario: Entitlement check loads on final step entry
Given an agent navigates to the final step (Your Tier) of the market creation flow
When the step mounts
Then `checkEntitlement` is called via `GET /api/entitlements/check?type=markets_created`
And the result determines whether the save button is enabled or the soft gate is shown
And a loading skeleton is shown while the check is in progress

### Scenario: Entitlement check fails gracefully (fail-open)
Given an agent navigates to the final step of the market creation flow
When the entitlement check API call fails (network error, server error)
Then the "Save Market" button remains enabled
And no usage indicator is shown
And the server-side check in `POST /api/markets` also fails open per #173's fail-open policy

### Scenario: Admin override grants extra markets
Given an agent on the Starter plan (1 market cap)
And an admin has granted an override boosting markets_created to 5
And the agent has defined 2 markets
When the agent reaches the final step of the market creation flow
Then the usage indicator shows "2 of 5 markets defined"
And the "Save Market" button is enabled

### Scenario: Dashboard "Define New Market" link is gated
Given an agent on the Starter plan who has defined 1 of 1 markets
When the agent views the dashboard or markets list page
Then the "Define New Market" link is still visible but shows a subtle indicator: "(limit reached)"
And clicking it still navigates to the creation flow (the gate is on the final save step, not the entry point)

---

## User Journey

1. Agent clicks "Define New Market" from dashboard or markets page
2. Agent completes Step 1 (Your Market — geography)
3. Agent arrives at **Step 2: Your Tier** (final step of market creation)
4. **This feature**: system checks `markets_created` entitlement on step mount
5. If quota remains: usage indicator shown, "Save Market" enabled
6. If cap hit: soft gate banner shown, "View Plans" CTA, button disabled
7. Agent clicks "Save Market": API validates entitlement server-side, market created, usage incremented
8. Future: Agent checks their usage on Account & Billing page (#177)

**Alternate path (inline report creation)**:
1. Agent starts report creation flow with a new market
2. Agent configures market in Steps 1-2, audience in Step 3
3. Agent reaches Step 4 (Review)
4. Agent clicks "Generate Report"
5. `POST /api/markets` checks entitlement: if denied, report creation halts with a clear message
6. If allowed: market created, then report created (report entitlement checked separately by #174)

---

## UI Mockup

### When quota remains (happy path — final step of market creation)

```
┌─ Step 2: Your Tier ─────────────────────────────────────────────────────┐
│                                                                          │
│  YOUR TIER                                                               │
│  (font: serif, text: 2xl, weight: bold, color: primary)                 │
│                                                                          │
│  Choose the luxury tier and price range.                                 │
│  (font: sans, text: sm, color: text-secondary)                          │
│  ─── (accent line) ───                                                   │
│                                                                          │
│  ┌─ Tier Cards (existing) ────────────────────────────────────────┐     │
│  │  Luxury · High Luxury · Ultra Luxury                            │     │
│  └──────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  ┌─ Usage Indicator (bg: primary-light, radius: sm, p: spacing-2) ─┐   │
│  │  1 of 3 markets defined                                          │   │
│  │  (font: sans, text: xs, color: text-secondary)                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  [ Back ]                        [ ████  Save Market  ████ ]            │
│                                  (bg: accent, color: primary,           │
│                                   font: sans, weight: semibold,         │
│                                   radius: sm)                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### When on last market slot

```
┌─ Usage Indicator (bg: accent-light, radius: sm, p: spacing-2) ──────────┐
│  2 of 3 markets defined                                                   │
│  This is your last available market on the Professional plan              │
│  (font: sans, text: xs, color: warning)                                  │
└───────────────────────────────────────────────────────────────────────────┘
```

### When cap is hit (soft gate)

```
┌─ Step 2: Your Tier ─────────────────────────────────────────────────────┐
│                                                                          │
│  YOUR TIER                                                               │
│  ...                                                                     │
│  (Tier cards still visible — agent can see what they configured,        │
│  but cannot save)                                                        │
│                                                                          │
│  ┌─ Soft Gate Banner ─────────────────────────────────────────────────┐ │
│  │  (bg: surface, border: border-strong, radius: md, shadow: sm,     │ │
│  │   p: spacing-6, role: alert)                                      │ │
│  │                                                                    │ │
│  │  YOU'VE REACHED YOUR MARKET LIMIT                                  │ │
│  │  (font: serif, text: lg, weight: bold, color: text)               │ │
│  │                                                                    │ │
│  │  Your current market is still fully active. Upgrade to             │ │
│  │  Professional to define up to 3 markets — track multiple          │ │
│  │  geographies and give your clients broader intelligence.          │ │
│  │  (font: sans, text: sm, color: text-secondary)                    │ │
│  │                                                                    │ │
│  │  [ ████  View Plans  ████ ]   [ Maybe Later ]                     │ │
│  │  (bg: accent, color: primary,  (color: text-secondary,            │ │
│  │   radius: sm, weight: semibold) text: sm, underline)              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [ Back ]                        [ ████  Save Market  ████ ]            │
│                                  (disabled: opacity-50,                 │
│                                   cursor-not-allowed)                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Inline report flow — market cap error

```
┌─ Step 4: Review ───────────────────────────────────────────────────────┐
│                                                                          │
│  ...                                                                     │
│                                                                          │
│  ┌─ Error Banner (bg: surface, border: error, radius: md) ───────────┐ │
│  │  MARKET LIMIT REACHED                                              │ │
│  │  (font: serif, text: lg, weight: bold, color: error)              │ │
│  │                                                                    │ │
│  │  You've reached your market limit on the Starter plan. To          │ │
│  │  generate this report, select an existing market in Step 1 or     │ │
│  │  upgrade your plan.                                               │ │
│  │  (font: sans, text: sm, color: text-secondary)                    │ │
│  │                                                                    │ │
│  │  [ Edit Market (Step 1) ]   [ View Plans ]                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Loading state (entitlement check in progress)

```
┌─ Usage Indicator (bg: primary-light, radius: sm, p: spacing-2) ──────────┐
│  ████████  (skeleton pulse, w: 160px, h: 14px)                            │
└───────────────────────────────────────────────────────────────────────────┘

[ ████████████  Save Market  ████████████ ]
(disabled while loading — re-enabled when check completes)
```

---

## Component References

- MarketCreationShell: `components/markets/market-creation-shell.tsx` (existing — add entitlement check on final step + usage indicator + soft gate)
- StepYourReview: `components/reports/steps/step-your-review.tsx` (existing — handle 403 from `POST /api/markets` when inline market creation is denied)
- EntitlementGateBanner: inline component matching the pattern from #174 (soft gate messaging when cap hit)

---

## Technical Design

### Server-side enforcement in `POST /api/markets`

Before `createMarket()`, add:

```
1. Call checkEntitlement(userId, "markets_created")
2. If !allowed → return 403 { error: "Market limit reached", entitlement: result }
3. If allowed → proceed with createMarket()
4. After successful createMarket() → call incrementUsage(userId, "markets_created")
```

The server-side check is authoritative. Client-side checks are for UX only.

**Important**: `PUT /api/markets/:id` (edit) must NOT check entitlements or increment usage. Only creation is gated.

### Client-side flow in `MarketCreationShell`

```
On final step (Step 2: Your Tier) mount:
1. If mode === "edit" → skip entitlement check entirely
2. If mode === "create":
   a. Fetch GET /api/entitlements/check?type=markets_created
   b. While loading: show skeleton below step content, disable Save button
   c. On success:
      - If allowed && remaining > 0 && limit != -1: show usage indicator + enabled Save
      - If allowed && limit == -1 (unlimited): show enabled Save, no usage indicator
      - If allowed && remaining == 1: show "last market" warning variant
      - If !allowed: show soft gate banner, disable Save button
   d. On error (fetch fails): enable Save, hide usage indicator (fail-open)
```

### Client-side flow in `StepYourReview` (inline market creation)

No preemptive check needed here — the report entitlement check (#174) already runs on this step. If the inline market creation fails with 403:

```
1. Catch 403 from POST /api/markets
2. Parse the entitlement response
3. Show error banner with: "Market limit reached — select an existing market or upgrade"
4. Offer "Edit Market (Step 1)" link to navigate back
5. Do NOT proceed to report creation
```

### Usage increment location

Usage is incremented in `POST /api/markets` **after** `createMarket()` returns successfully, not before. Fire-and-forget (non-blocking).

### Lifetime vs. monthly counting

`markets_created` is a **lifetime** entitlement, not monthly. The `usage_records` table stores usage with `periodStart`/`periodEnd` — for lifetime counts, use a far-future `periodEnd` (or null). The `checkEntitlement` utility (#173) already handles this based on the entitlement type configuration.

### "View Plans" navigation

"View Plans" links to `/account/billing` (#177). If #177 isn't built yet, link to `/account` as a fallback. Same constant as #174.

---

## Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| User has no subscription record | Default Starter caps apply (1 market) per #173 |
| Entitlement check API is slow (>3s) | Show loading state, don't block indefinitely. After 5s timeout, fail open (enable button) |
| User deletes a market — does quota free up? | **No** — `markets_created` tracks lifetime creations, not active count. This prevents gaming. Future: consider a `markets_active` entitlement if needed |
| Inline market creation fails in report flow | Report creation halts. Error shown in Step 4 (Review). No report created, no report usage consumed |
| User opens two tabs and creates simultaneously | Server-side check is authoritative. Second request may fail — show error gracefully |
| Mid-session tier upgrade | Next entitlement check reflects new tier immediately |
| Admin override expires mid-session | Next entitlement check reflects updated state. Server-side check catches it |
| Edit mode bypasses gate | Correct — editing an existing market never checks or increments usage |

---

## Accessibility

- Soft gate banner uses `role="alert"` so screen readers announce it
- Usage indicator has `aria-label="Market usage: 1 of 3 markets defined"`
- Disabled Save button has `aria-disabled="true"` with descriptive `aria-describedby` pointing to the gate banner
- "View Plans" is a link (`<a>`) not a button — it navigates
- Loading skeleton has `aria-busy="true"` and `aria-label="Checking market availability"`
- Error banner in report flow uses `role="alert"` for screen reader announcement

---

## Dependencies

| Dep | Feature | What it provides |
|-----|---------|-----------------|
| #173 | Entitlement Check Utility | `checkEntitlement()` function, `EntitlementCheckResult` type |
| #172 | Usage Tracking | `incrementUsage()` function |
| #11 | Market Definition Wizard | Market creation flow and `POST /api/markets` endpoint |
| #174 | Entitlement Gating in Report Creation | Pattern for soft gate banner, "View Plans" link target, `GET /api/entitlements/check` endpoint (reused) |

---

## What This Feature Does NOT Do

- No account/billing page updates (that's #177)
- No report creation gating (that's #174 — already implemented)
- No social media kit gating (that's #176)
- No self-service tier upgrade/checkout (out of scope — Stripe not connected)
- No deletion quota recovery (markets_created is lifetime, not active count)
- No market creation gating on the dashboard "Define New Market" link itself — the gate is on the save action, not the entry point

---

## Implementation Notes

- **Two layers of enforcement**: Client-side (UX — preemptive gate on final step of market creation) and server-side (authoritative — 403 in POST /api/markets). Never trust the client alone.
- **Usage increment is post-success only**: Call `incrementUsage` after `createMarket()` returns successfully. If creation fails, quota is not consumed.
- **Fail-open everywhere**: If the entitlement check fails (DB down, network error), the user can still create markets. Availability > correctness for entitlement checks (per #173 design).
- **No modal**: The soft gate is an inline banner, not a popup. Same pattern as #174.
- **Persona vocabulary**: Use "markets" not "geographies" or "configurations." Use "defined" not "created" (agents define markets, they don't create databases). Use "plan" not "tier" in user-facing copy. Use "intelligence reports" when describing the upgrade benefit.
- **Animation**: Soft gate banner enters with `fadeVariant` from existing animation library. Usage indicator fades in on load. Same pattern as #174.
- **Edit bypass**: `MarketCreationShell` has `mode` prop — when `mode === "edit"`, skip all entitlement logic entirely. Edits are free.
- **Reuse #174 pattern**: The `EntitlementGateBanner` inline component, usage indicator styling, loading skeleton, and "View Plans" link should match #174 exactly for consistency.
- **Focus step removed** (2026-03-16): The Focus step was dead code — segments/propertyTypes data was collected but never consumed by the pipeline. Market creation is now 2 steps (Your Market → Your Tier). The entitlement check triggers on Step 2 (the final step) instead of the former Step 3.
