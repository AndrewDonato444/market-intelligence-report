---
feature: Default Tier Assignment on Signup
domain: subscription
source: lib/services/profile.ts
tests:
  - __tests__/lib/subscription/default-tier-assignment.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Default Tier Assignment on Signup

**Source File**: lib/services/profile.ts
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/legacy-agent.md

## Feature: Default Tier Assignment on Signup

When an agent signs up and first accesses the platform, they should automatically receive a subscription record with the Starter tier assigned. Today, `ensureUserProfile()` creates a user row but no subscription — the entitlement check falls back to hardcoded DEFAULT_ENTITLEMENTS. This works, but means:

- The user has no subscription row in the database (makes admin queries, analytics, and billing pages unreliable)
- There's no `tierId` FK linking the user to the actual Starter tier in `subscription_tiers`
- If admin changes Starter tier caps, users without a subscription row won't see the change (they get stale hardcoded defaults)

This feature ensures every new user gets a real subscription row with `tierId` pointing to the Starter tier, so the entitlement system works end-to-end from day one.

### Scenario: new user gets a subscription with Starter tier on first login
Given a user has just signed up via Supabase auth
And the Starter tier exists in the subscription_tiers table (slug: "starter")
When they access any protected page for the first time
Then a subscription row is created for their userId
And the subscription's tierId points to the Starter tier
And the subscription's plan is "free"
And the subscription's status is "active"
And stripeCustomerId is null (no Stripe yet)
And stripeSubscriptionId is null (no Stripe yet)

### Scenario: existing user with subscription is not affected
Given a user already has a subscription row (e.g., from a prior Stripe checkout)
When they access a protected page
Then their existing subscription is not overwritten
And their existing tierId is preserved

### Scenario: ensureUserProfile remains idempotent
Given a user has already been created with a subscription
When ensureUserProfile is called again (e.g., on next page load)
Then no duplicate subscription row is created
And the existing subscription is unchanged

### Scenario: Starter tier not found in database
Given the subscription_tiers table has no tier with slug "starter"
When a new user signs up
Then the user row is still created successfully
And no subscription row is created (graceful degradation)
And the entitlement check falls back to DEFAULT_ENTITLEMENTS as before
And a warning is logged: "Starter tier not found — subscription not created for user {userId}"

### Scenario: subscription has correct period dates
Given a new user signs up today (2026-03-12)
When their subscription is created
Then currentPeriodStart is set to today
And currentPeriodEnd is set to 30 days from today
And these dates are used by usage tracking (#172) for monthly cap resets

### Scenario: entitlement check resolves via real tier after signup
Given a new user just signed up and got the Starter tier assigned
When checkEntitlement is called for reports_per_month
Then it reads the Starter tier's entitlements from subscription_tiers (not hardcoded defaults)
And it returns allowed: true with remaining: 2 (assuming 0 usage)

### Scenario: admin changes to Starter tier propagate to new-signup users
Given the admin changes Starter tier's reports_per_month from 2 to 5
And a user signed up last week with tierId pointing to Starter
When checkEntitlement is called for that user
Then it returns remaining: 5 (reading the live tier, not a snapshot)

### Scenario: onboarding shows the user's plan
Given a new user just signed up and landed on the dashboard
When they see the dashboard for the first time
Then their current plan is displayed as "Starter" (from their subscription's tier)
And no "upgrade" nag is shown on first visit (let them explore first)

## User Journey

1. Agent visits sign-up page, enters email + password
2. Supabase creates auth record, redirects to `/dashboard`
3. Protected layout calls `ensureUserProfile(authId, email)`
4. **This feature: `ensureUserProfile` also creates a subscription row with Starter tierId**
5. Agent lands on dashboard — plan shows "Starter (Free)"
6. Agent creates their first market (#175 checks entitlement — allowed, 1 of 1)
7. Agent generates their first report (#174 checks entitlement — allowed, 1 of 2)
8. Account & billing page (#177) shows real usage vs. real tier caps

## UI Mockup

The dashboard welcome state for a new agent (Starter tier):

```
┌─ Dashboard (bg: background) ──────────────────────────────────────────────┐
│                                                                            │
│  ┌─ Welcome Banner (bg: surface, radius: md, shadow: sm) ──────────────┐  │
│  │                                                                      │  │
│  │  Welcome to Modern Signal Advisory (font: serif, text: 2xl,         │  │
│  │  weight: bold, color: text)                                          │  │
│  │                                                                      │  │
│  │  Your plan: Starter (Free) (font: sans, text: sm, color:            │  │
│  │  text-secondary)                                                     │  │
│  │                                                                      │  │
│  │  You're ready to create your first market intelligence report.       │  │
│  │  Start by defining your market. (font: sans, text: base, color:     │  │
│  │  text-secondary)                                                     │  │
│  │                                                                      │  │
│  │  [Create Your First Report (bg: accent, color: primary,             │  │
│  │   radius: sm, font: semibold)]                                      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─ Plan Summary (bg: surface, radius: md, shadow: sm, p: spacing-4) ──┐  │
│  │                                                                      │  │
│  │  Your Starter Plan Includes:                                         │  │
│  │  (font: sans, text: sm, weight: semibold, color: text)              │  │
│  │                                                                      │  │
│  │  ● 2 reports per month    ● 1 market                                │  │
│  │  ● 1 persona per report   ● Social media kits: not included         │  │
│  │  (font: sans, text: sm, color: text-secondary)                      │  │
│  │                                                                      │  │
│  │  Want more? [View Plans] (color: accent, font: medium)              │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Implementation Notes

- Modify `ensureUserProfile()` in `lib/services/profile.ts` to also create a subscription row when a new user is created
- Look up the Starter tier by slug ("starter") from `subscription_tiers` table
- Use the same INSERT ... ON CONFLICT DO NOTHING pattern for the subscription (keyed on userId, which has a unique constraint)
- If Starter tier doesn't exist (e.g., dev environment without seed data), log a warning and skip — don't block user creation
- Set `currentPeriodStart` to now and `currentPeriodEnd` to 30 days from now
- The dashboard welcome state is a UI concern for the existing dashboard (#159) — this spec focuses on the backend assignment. The mockup above is aspirational for when the dashboard reads the tier.
- Consider wrapping user + subscription creation in a transaction for atomicity

## Component References

- Dashboard: existing dashboard page (app/(protected)/dashboard/page.tsx)
- Account & Billing: .specs/features/subscription/account-billing-page.feature.md

## Persona Revision Notes

**Rising Star (Alex)**: Alex signs up expecting a professional tool. Seeing "Starter (Free)" immediately sets expectations — Alex knows there's a path to Professional. The plan summary uses Alex's vocabulary: "reports per month" (not "credits"), "markets" (not "workspaces"). No aggressive upgrade nag on first visit — let Alex experience the value before selling more.

**Legacy Agent (Pat)**: Pat may be less comfortable with tiered pricing concepts. Showing the plan as simple, clear bullet points ("2 reports per month, 1 market") is more approachable than a feature matrix. The "View Plans" link is soft, not pushy — Pat won't feel pressured.
