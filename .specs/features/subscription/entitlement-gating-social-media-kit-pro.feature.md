---
feature: Entitlement Gating for Social Media Kit as Pro Feature
domain: subscription
source: components/reports/generate-kit-button.tsx
tests:
  - __tests__/lib/subscription/entitlement-gating-social-media-kit-pro.test.tsx
components:
  - GenerateKitButton
  - KitUpgradePrompt
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Entitlement Gating for Social Media Kit as Pro Feature

**Source Files**: `components/reports/generate-kit-button.tsx`, `app/(protected)/reports/[id]/kit/page.tsx`
**Design System**: .specs/design-system/tokens.md
**Depends On**: #173 (Entitlement Check Utility), #176 (Entitlement Gating in Social Media Kit)

## Feature: Social Media Kit restricted to Professional+ tiers with upgrade prompt

Social media kit generation is a Professional+ feature. Starter tier users should see an upgrade prompt with a preview of what the kit includes (posts, captions, polls, stat callouts, content calendar) instead of the generate button. This is a **UI-side gate** that complements the existing server-side enforcement (#176).

### Scenario: Starter user sees upgrade prompt instead of generate button
Given an agent on the Starter plan (social_media_kits cap = 0)
When the agent views a completed report
Then the "Generate Social Media Kit" button is replaced by an upgrade prompt
And the prompt shows what the social media kit includes
And the prompt has a "View Plans" link to the account/billing page

### Scenario: Professional user sees the normal generate button
Given an agent on the Professional plan (social_media_kits cap > 0)
When the agent views a completed report
Then the standard "Generate Social Media Kit" button is shown

### Scenario: Enterprise user sees the normal generate button
Given an agent on the Enterprise plan (unlimited kits)
When the agent views a completed report
Then the standard "Generate Social Media Kit" button is shown

### Scenario: Starter user visits kit page directly and sees upgrade prompt
Given an agent on the Starter plan
When the agent navigates to /reports/[id]/kit
Then the kit page shows the upgrade prompt instead of "No Social Media Kit Found"

### Scenario: Upgrade prompt previews kit value
Given an agent on the Starter plan viewing the upgrade prompt
Then the prompt includes a list of what the kit generates:
  - Platform-optimized social posts
  - LinkedIn, Instagram, X, and Facebook captions
  - Persona-targeted content
  - Poll ideas with data-backed context
  - Stat callouts for sharing
  - Content calendar suggestions

### Scenario: Professional user at cap sees limit-reached message, not upgrade prompt
Given an agent on the Professional plan who has used all their monthly kits
When the agent views a completed report
Then the generate button shows "Monthly limit reached" with usage count
And does NOT show the Starter-tier upgrade prompt

### Scenario: Entitlement check uses preflight API
Given a completed report page is loading
When the GenerateKitButton mounts
Then it calls GET /api/entitlements/check?type=social_media_kits
And uses the response to determine which UI to show

### Scenario: Compact mode shows condensed upgrade prompt
Given an agent on the Starter plan viewing the reports dashboard (compact mode)
Then a compact "Pro Feature" badge is shown instead of the generate button
And the badge links to the account/billing page

---

## Technical Design

### GenerateKitButton changes

1. Add entitlementStatus state, fetched on mount via GET /api/entitlements/check?type=social_media_kits
2. If limit === 0 -> render KitUpgradePrompt (Starter gate)
3. If !allowed && limit > 0 -> render at-cap message with usage info
4. If allowed -> render existing generate button
5. Compact mode: render "Pro Feature" badge linking to /account

### KitUpgradePrompt component

Inline in generate-kit-button.tsx (no separate file needed). Shows:
- Feature name + "Professional Feature" label
- Value preview list
- "View Plans to Upgrade" link -> /account

### Kit page changes

app/(protected)/reports/[id]/kit/page.tsx:
- Server-side check entitlement before rendering
- If limit === 0 -> show full upgrade prompt page instead of "No kit found"

---

## Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| Entitlement check fails | Fall back to showing generate button (fail-open) |
| Admin override grants kits to Starter user | Override respected - show generate button |
| User upgrades mid-session | Next page load fetches fresh entitlement |

---

## Learnings

