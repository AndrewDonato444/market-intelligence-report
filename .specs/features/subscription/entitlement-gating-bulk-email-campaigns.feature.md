---
feature: Entitlement Gating for Bulk Email Campaigns
domain: subscription
source: components/reports/generate-email-button.tsx
tests:
  - __tests__/lib/subscription/entitlement-gating-email-campaigns.test.tsx
components:
  - GenerateEmailButton
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Entitlement Gating for Bulk Email Campaigns

**Source Files**: `components/reports/generate-email-button.tsx`, `app/(protected)/reports/[id]/emails/page.tsx`
**Design System**: .specs/design-system/tokens.md
**Depends On**: #173 (Entitlement Check Utility), #166 (Bulk Email Campaign Agent)

## Feature: Bulk email campaign generation restricted to Professional+ tiers

Email campaign generation is a Professional+ feature, gated the same way as social media kits (#181). Starter tier users see an upgrade prompt with a preview of what email campaigns include. This is both a **UI-side gate** (button + page) and a **server-side gate** (API route already enforces).

### Scenario: Starter user sees upgrade prompt instead of generate button
Given an agent on the Starter plan (email_campaigns cap = 0)
When the agent views a completed report
Then the "Generate Email Campaign" button is replaced by an upgrade prompt
And the prompt shows what email campaigns include
And the prompt has a "View Plans" link to the account/billing page

### Scenario: Professional user sees the normal generate button
Given an agent on the Professional plan (email_campaigns cap > 0)
When the agent views a completed report
Then the standard "Generate Email Campaign" button is shown

### Scenario: Enterprise user sees the normal generate button
Given an agent on the Enterprise plan (unlimited email campaigns)
When the agent views a completed report
Then the standard "Generate Email Campaign" button is shown

### Scenario: Starter user visits emails page directly and sees upgrade prompt
Given an agent on the Starter plan
When the agent navigates to /reports/[id]/emails
Then the emails page shows the upgrade prompt instead of "No email campaign has been generated yet"

### Scenario: Upgrade prompt previews email campaign value
Given an agent on the Starter plan viewing the upgrade prompt
Then the prompt includes a list of what email campaigns generate:
  - Drip sequences for nurturing leads
  - Market update newsletters
  - Persona-targeted email copy
  - Subject lines and CTAs
  - Campaign scheduling suggestions

### Scenario: Professional user at cap sees limit-reached message, not upgrade prompt
Given an agent on the Professional plan who has used all their monthly email campaigns
When the agent views a completed report
Then the generate button shows "Monthly limit reached" with usage count
And does NOT show the Starter-tier upgrade prompt

### Scenario: Entitlement check uses preflight API
Given a completed report page is loading
When the GenerateEmailButton mounts
Then it calls GET /api/entitlements/check?type=email_campaigns
And uses the response to determine which UI to show

### Scenario: Compact mode shows condensed upgrade prompt
Given an agent on the Starter plan viewing the reports dashboard (compact mode)
Then a compact "Pro Feature" badge is shown instead of the generate button
And the badge links to the account/billing page

---

## Technical Design

### Schema changes

1. Add `email_campaigns: number` to `TierEntitlements` type in `lib/db/schema.ts`
2. Add `email_campaigns: 0` to `DEFAULT_ENTITLEMENTS` in `lib/services/entitlement-check.ts`
3. Add `email_campaigns` to seed data in `lib/db/seed-subscription-tiers.ts`:
   - Starter: 0 (not included)
   - Professional: 1 (per-report)
   - Enterprise: -1 (unlimited)

### GenerateEmailButton changes

1. Add EntitlementState type and entitlement state, fetched on mount via GET /api/entitlements/check?type=email_campaigns
2. If limit === 0 -> render EmailUpgradePrompt (Starter gate)
3. If !allowed && limit > 0 -> render at-cap message with usage info
4. If allowed -> render existing generate button
5. Compact mode: render "Pro Feature" badge linking to /account

### Emails page changes

`app/(protected)/reports/[id]/emails/page.tsx`:
- Server-side checkEntitlement() call before rendering "no campaign" state
- If limit === 0 -> show full upgrade prompt page instead of "No email campaign"

### API routes (already done)

`app/api/reports/[id]/email-campaign/generate/route.ts` already calls `checkEntitlement(userId, "email_campaigns")` and `incrementUsage(userId, "email_campaigns")`.

---

## Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| Entitlement check fails | Fall back to showing generate button (fail-open) |
| Admin override grants campaigns to Starter user | Override respected - show generate button |
| User upgrades mid-session | Next page load fetches fresh entitlement |

---

## Learnings

