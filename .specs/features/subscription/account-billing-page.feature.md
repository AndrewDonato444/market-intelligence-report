---
feature: Account & Billing Page
domain: subscription
source: app/(protected)/settings/account/page.tsx
tests:
  - __tests__/account/account-billing.test.tsx
components:
  - AccountSettings
  - SubscriptionTierCard
  - UsageEntitlementBar
  - UpgradePrompt
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Account & Billing Page

**Source File**: app/(protected)/settings/account/page.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: Account & Billing Page

Extends the existing Account Settings page (`/settings/account`) with subscription tier display, usage vs. caps for each entitlement, and upgrade prompts. Agents see their current plan, how much of each entitlement they've used this period, and clear messaging when they're approaching or at their cap. No payment processing — upgrade prompts show display-only pricing and a "Contact us" or placeholder CTA until Stripe is connected.

**Who it's for**: All agent personas. Alex (Rising Star) needs to understand what their plan includes as they ramp up. Jordan (Established Practitioner) tracks usage to ensure capacity for client advisory work. Taylor (Team Leader) monitors whether the current tier supports the team's throughput.

### Scenario: Agent views current subscription tier
Given an agent has a subscription with a linked tier
When they navigate to /settings/account
Then they see a "Your Plan" card showing the tier name (e.g., "Professional")
And they see the tier's display price (e.g., "$199/mo")
And they see a brief description of the tier

### Scenario: Agent with no subscription sees Starter defaults
Given an agent has no subscription record
When they navigate to /settings/account
Then they see "Your Plan" showing "Starter"
And they see the display price as "Free"
And they see Starter-level entitlement caps

### Scenario: Agent views usage vs. caps for reports
Given an agent is on the account page
And their tier allows 10 reports per month
And they have generated 7 reports this month
When the page loads
Then they see a "Reports This Month" usage bar showing "7 of 10 used"
And the bar is filled to 70%
And the remaining count shows "3 remaining"

### Scenario: Agent views usage vs. caps for markets
Given an agent is on the account page
And their tier allows 3 markets
And they have defined 2 markets
When the page loads
Then they see a "Markets" usage bar showing "2 of 3 used"
And the remaining count shows "1 remaining"

### Scenario: Agent views social media kit entitlement — included
Given an agent is on the Professional tier
And their tier includes 1 social media kit per report
When the page loads
Then they see "Social Media Kits" showing "Included (1 per report)"

### Scenario: Agent views social media kit entitlement — not included
Given an agent is on the Starter tier
And their tier does not include social media kits
When the page loads
Then they see "Social Media Kits" showing "Not included in your plan"
And an upgrade prompt appears inline: "Upgrade to Professional to generate social media content from your reports"

### Scenario: Agent views personas per report entitlement
Given an agent is on the Starter tier
And their tier allows 1 persona per report
When the page loads
Then they see "Buyer Personas" showing "1 per report"

### Scenario: Agent at cap sees upgrade prompt for reports
Given an agent has used all their monthly reports (e.g., 2 of 2)
When the page loads
Then the reports usage bar shows "2 of 2 used" at 100% fill
And the bar color changes to the warning state
And an upgrade prompt appears: "You've used all your reports this month. Upgrade to Professional for 10 reports per month."

### Scenario: Agent nearing cap sees warning state
Given an agent has used 80% or more of a capped entitlement (e.g., 9 of 10 reports)
When the page loads
Then the usage bar shows a warning color (amber)
And a subtle note appears: "1 report remaining this month"

### Scenario: Unlimited entitlement shows no cap
Given an agent is on the Enterprise tier
And their tier has unlimited reports (-1)
When the page loads
Then the reports entitlement shows "Unlimited"
And no usage bar is shown — just the current count (e.g., "42 reports generated this month")

### Scenario: Usage period resets monthly for reports
Given an agent is on the account page
When the page loads
Then the reports usage reflects only the current calendar month (UTC)
And a label shows the billing period (e.g., "Mar 1 – Mar 31, 2026")

### Scenario: Markets usage is cumulative (not monthly)
Given an agent has created 2 markets total (not monthly)
When the page loads
Then the markets usage bar shows the total count vs. the cap
And no billing period label is shown for markets

### Scenario: Upgrade prompt displays tier comparison
Given an agent is on the Starter tier
When they see the upgrade prompt section
Then they see a comparison showing what they'd get on Professional
And the comparison includes: reports per month, markets, social media kits, personas per report
And display-only pricing is shown (no checkout button)
And a CTA reads "Contact us to upgrade" (placeholder until Stripe is connected)

### Scenario: Agent with entitlement override sees adjusted cap
Given an agent's tier allows 2 reports per month
And an admin has granted an override of 5 additional reports
When the page loads
Then the effective cap shown is the higher of tier cap vs. override (e.g., 5)
And the usage bar reflects the effective cap, not the tier cap

### Scenario: Page loads gracefully when entitlement check fails
Given the database is temporarily unavailable
When the agent navigates to /settings/account
Then the existing account info (email, member since, stats) still loads
And the subscription section shows a graceful fallback: "Unable to load subscription details. Please try again."
And no error page is shown

## User Journey

1. Agent clicks "Settings" in sidebar
2. Redirected to /settings/profile (existing)
3. Agent clicks "Account" tab in settings sub-nav
4. **Agent sees account info + subscription tier + usage vs. caps + upgrade prompts** (this feature)
5. Agent clicks "Contact us to upgrade" (placeholder CTA) or continues using the app
6. Future: Stripe checkout replaces placeholder CTA

## UI Mockup

```
Settings

[Profile]  [Account]                          <- settings nav
---------------------------------------------------------------

+------------------------------------------------------------+
|  Account Information                                       |
|  --- gold accent line ---                                  |
|                                                            |
|  Email          alex@example.com                           |
|  Member Since   March 2026                                 |
|  Reports        12           Markets     3                 |
+------------------------------------------------------------+

+------------------------------------------------------------+
|  Your Plan                                                 |
|  --- gold accent line ---                                  |
|                                                            |
|  +------------------------------------------------------+  |
|  |  PROFESSIONAL                        $199/mo         |  |
|  |  (font: serif, text: xl, weight: bold)               |  |
|  |  Full access to market intelligence with expanded    |  |
|  |  capacity and social media content generation.       |  |
|  +------------------------------------------------------+  |
|                                                            |
|  Usage This Period                                         |
|  Mar 1 - Mar 31, 2026                                     |
|                                                            |
|  Reports This Month                      7 of 10 used     |
|  [========================----------]   3 remaining        |
|                                                            |
|  Markets                                 2 of 3 used      |
|  [====================______________]   1 remaining        |
|                                                            |
|  Social Media Kits          Included (1 per report)        |
|  Buyer Personas             3 per report                   |
+------------------------------------------------------------+

+------------------------------------------------------------+
|  Session Management                                        |
|  --- gold accent line ---                                  |
|                                                            |
|  Sign out from all active sessions.                        |
|  [Sign Out Everywhere]                                     |
+------------------------------------------------------------+
```

### At-cap / upgrade prompt state (Starter tier, reports exhausted):

```
+------------------------------------------------------------+
|  Your Plan                                                 |
|  --- gold accent line ---                                  |
|                                                            |
|  +------------------------------------------------------+  |
|  |  STARTER                                    Free     |  |
|  |  Get started with market intelligence.               |  |
|  +------------------------------------------------------+  |
|                                                            |
|  Usage This Period                                         |
|  Mar 1 - Mar 31, 2026                                     |
|                                                            |
|  Reports This Month                     2 of 2 used       |
|  [======================================]  Cap reached     |
|  (bar: color-warning fill)                                 |
|                                                            |
|  Markets                                1 of 1 used       |
|  [======================================]  Cap reached     |
|                                                            |
|  Social Media Kits         Not included in your plan       |
|  Buyer Personas            1 per report                    |
|                                                            |
|  -------------------------------------------------------   |
|                                                            |
|  +------------------------------------------------------+  |
|  |  Unlock more with Professional       $199/mo         |  |
|  |                                                      |  |
|  |  Reports per month    10      (you have 2)           |  |
|  |  Markets              3       (you have 1)           |  |
|  |  Social media kits    Included (not in your plan)    |  |
|  |  Buyer personas       3       (you have 1)           |  |
|  |                                                      |  |
|  |  [Contact Us to Upgrade]                             |  |
|  |  (bg: accent, color: primary, radius: sm)            |  |
|  +------------------------------------------------------+  |
+------------------------------------------------------------+
```

### Enterprise / unlimited state:

```
|  Reports This Month                                        |
|  42 reports generated          Unlimited                   |
|  (no bar -- just the count + "Unlimited" badge)            |
```

## Data Flow

1. **Server-side** (page.tsx): Fetch user's subscription + tier in SSR. Query `subscriptions` joined to `subscription_tiers` for tier name, description, displayPrice, entitlements JSONB.
2. **Server-side**: For each entitlement type, call `checkEntitlement(userId, type)` to get `{ allowed, limit, used, remaining }`. Pass results as props to client component.
3. **Client-side**: Render tier card, usage bars, and upgrade prompts based on the entitlement data. No client-side API calls needed — all data fetched in SSR.
4. **Upgrade prompt logic**: If user is NOT on the highest active tier, fetch the next tier up and display comparison. If already on the highest tier, no upgrade prompt.

## API Dependencies

- `checkEntitlement(userId, entitlementType)` from `lib/services/entitlement-check.ts` — already implemented (#173)
- `subscription_tiers` table — already implemented (#170)
- `subscriptions` table — already implemented (#171)
- `usage_records` table — already implemented (#172)
- Existing account page SSR pattern — already implemented (#70)

## Component References

- Card: existing pattern from account-settings.tsx (surface bg, shadow-sm, radius-md, gold accent line)
- UsageEntitlementBar: new component — horizontal progress bar with fill percentage, label, remaining count
- SubscriptionTierCard: new component — tier name (serif heading), display price, description
- UpgradePrompt: new component — comparison card showing current vs. next tier entitlements with CTA

## Design Token Usage

- Card: `color-surface`, `radius-md`, `shadow-sm`
- Heading: `font-serif`, `text-xl`, `font-bold`, `color-primary`
- Accent line: `color-accent`, 2px height
- Usage bar track: `color-border` (empty state)
- Usage bar fill (normal): `color-primary`
- Usage bar fill (warning, >= 80%): `color-warning`
- Usage bar fill (at cap, 100%): `color-warning`
- Remaining text: `color-text-secondary`, `text-sm`
- Tier name: `font-serif`, `text-xl`, `font-bold`, `color-primary`
- Price: `font-sans`, `text-lg`, `font-semibold`, `color-accent`
- Upgrade CTA: `color-accent` bg, `color-primary` text, `radius-sm`
- "Not included" text: `color-text-tertiary`, `text-sm`
- "Unlimited" badge: `color-accent-light` bg, `color-accent` text, `radius-full`

## Implementation Notes

- **Extend existing page**: The current `app/(protected)/settings/account/page.tsx` and `components/account/account-settings.tsx` remain — add the subscription section between Account Information and Session Management cards.
- **No Stripe checkout**: The existing `subscription-management.tsx` component has Stripe checkout/portal logic. Do NOT use it for this feature. The upgrade CTA is a placeholder ("Contact us to upgrade") until Stripe is connected.
- **Entitlement check reuse**: Use the same `checkEntitlement()` utility that gates report/market/kit creation. Call it once per entitlement type in the SSR page component.
- **Next tier lookup**: To show upgrade prompt, query `subscription_tiers` ordered by `sortOrder` and find the tier after the user's current tier. If on the highest tier, skip the prompt.
- **Fail gracefully**: Wrap entitlement/subscription fetching in try/catch. If it fails, show account info (which is separate) and a graceful fallback for the subscription section.
