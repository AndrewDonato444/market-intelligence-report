---
feature: Entitlement Gating in Social Media Kit
domain: subscription
source: app/api/reports/[id]/kit/generate/route.ts
tests:
  - __tests__/lib/subscription/entitlement-gating-social-media-kit.test.ts
components: []
personas:
  - rising-star-agent
  - team-leader
  - established-practitioner
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Entitlement Gating in Social Media Kit

**Source Files**: `app/api/reports/[id]/kit/generate/route.ts`, `app/api/reports/[id]/kit/regenerate/route.ts`
**Depends On**: #173 (Entitlement Check Utility), #162 (Social Media Kit Generation Trigger), #172 (Usage Tracking)

## Feature: Entitlement Gating in Social Media Kit

Before a social media kit is generated, the system checks the `social_media_kits` entitlement via `checkEntitlement(userId, "social_media_kits")`. This is a **monthly** entitlement (resets each month). On the Starter tier, the default cap is 0 — social media kits are not included. Professional and Enterprise tiers include kit generation.

### Scenario: Agent generates a kit with remaining quota
Given an agent on the Professional plan with 5 social media kits per month
And the agent has generated 2 kits this month
When the agent clicks "Generate Social Media Kit" on a completed report
Then the kit generation starts (202 response)
And usage is incremented to 3

### Scenario: Agent on Starter plan sees "not included" messaging
Given an agent on the Starter plan where social media kits are not included (cap is 0)
When the agent clicks "Generate Social Media Kit"
Then the API returns 403 with `{ error: "Social media kit not included in your plan", entitlement: { allowed: false, limit: 0, used: 0, remaining: 0 } }`

### Scenario: Agent hits their monthly kit cap
Given an agent on the Professional plan with 5 kits per month who has used all 5
When the agent clicks "Generate Social Media Kit"
Then the API returns 403 with `{ error: "Social media kit limit reached", entitlement: { allowed: false, limit: 5, used: 5, remaining: 0 } }`

### Scenario: Agent with unlimited kits generates freely
Given an agent on the Enterprise plan with unlimited social media kits
When the agent clicks "Generate Social Media Kit"
Then the kit generation starts normally (202 response)

### Scenario: Usage is incremented after successful kit generation start
Given an agent with remaining quota
When the agent generates a kit successfully
Then `incrementUsage(userId, "social_media_kits")` is called

### Scenario: Usage is NOT incremented when kit generation is blocked
Given an agent whose entitlement check returns denied
When the agent attempts to generate a kit
Then no usage increment occurs

### Scenario: Entitlement check fails gracefully (fail-open)
Given the entitlement check service has a DB error
When the agent attempts to generate a kit
Then the kit generation proceeds (fail-open per #173 policy)

### Scenario: checkEntitlement is called with correct type
Given an authenticated agent
When the agent triggers kit generation
Then `checkEntitlement(userId, "social_media_kits")` is called

### Scenario: Unauthenticated user is rejected
Given an unauthenticated request
When a POST is sent to `/api/reports/[id]/kit/generate`
Then the API returns 401

### Scenario: Kit regeneration is also gated
Given an agent on the Starter plan (cap 0)
When the agent attempts to regenerate a kit section
Then the API returns 403 with entitlement details
And regeneration does NOT increment usage

### Scenario: Error message distinguishes "not included" from "limit reached"
Given a cap of 0 → error is "Social media kit not included in your plan"
Given a cap > 0 but fully used → error is "Social media kit limit reached"

---

## Technical Design

### Server-side enforcement in POST /api/reports/[id]/kit/generate

Before generateSocialMediaKit(), add:
1. Call checkEntitlement(userId, "social_media_kits")
2. If !allowed && limit === 0 → return 403 { error: "Social media kit not included in your plan", entitlement }
3. If !allowed && limit > 0 → return 403 { error: "Social media kit limit reached", entitlement }
4. If allowed → proceed with existing kit generation logic
5. After fire-and-forget generation starts → call incrementUsage(userId, "social_media_kits")

### Server-side enforcement in POST /api/reports/[id]/kit/regenerate

Same entitlement check. Regeneration does NOT increment usage.

---

## Edge Cases

| Edge Case | Behavior |
|-----------|----------|
| No subscription record | Default Starter caps apply (0 kits) per #173 |
| Kit generation fails after usage increment | Usage is still consumed |
| Regeneration of existing kit | Does NOT consume quota |
| Admin override grants kits to Starter user | Override respected per #173 |

---

## Learnings

