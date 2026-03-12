---
feature: Admin Entitlement Overrides
domain: subscription
source: app/admin/users/[id]/overrides/page.tsx
tests:
  - __tests__/admin/entitlement-overrides-api.test.ts (18 tests)
  - __tests__/admin/entitlement-overrides-panel.test.tsx (12 tests)
components:
  - EntitlementOverridesPanel
personas:
  - team-leader
  - rising-star-agent
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Admin: Entitlement Overrides

**Source Files**: app/admin/users/[id]/overrides/page.tsx, components/admin/entitlement-overrides-panel.tsx
**API Routes**: app/api/admin/users/[id]/overrides/route.ts, app/api/admin/users/[id]/overrides/[overrideId]/route.ts
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/team-leader.md, .specs/personas/rising-star-agent.md

## Feature: Admin Entitlement Overrides

Admins can grant individual users entitlement overrides — extra reports per month, additional markets, social media kit access, or feature unlocks — without changing their subscription tier. Every override has an expiry (or is permanent), a reason, and a full audit trail showing who granted it and when.

This is the admin-facing UI for the `entitlement_overrides` table created in #171. The check utility (#173) already resolves overrides when evaluating entitlements — this feature gives admins a way to create, view, and revoke them.

**Who it's for**: The MSA operations team. When a beta tester needs comped access, a partner agent needs a temporary boost, or a power user earns extra capacity, admins handle it here — no code changes, no tier gymnastics.

### Scenario: Admin views a user's active overrides
Given the admin navigates to a user's detail page
When they click "Overrides" or scroll to the overrides section
Then they see a list of all entitlement overrides for that user
And each override shows: entitlement type, granted value, expiry status, reason, who granted it, and when
And expired overrides are visually dimmed but still visible (audit trail)
And active overrides show "Expires {date}" if they have an expiry

### Scenario: Admin grants a new entitlement override
Given the admin is viewing a user's overrides
When they click "Grant Override"
Then a form appears with fields: entitlement type (dropdown), value (number input), expiry (date picker or "permanent" toggle), and reason (text input)
And the entitlement type dropdown shows: "Reports per month", "Markets created", "Social media kits", "Personas per report"
And the value input accepts positive integers or an "Unlimited" toggle (stores -1)
And the reason field placeholder reads "Why is this override being granted? (e.g., Beta tester comp, Partner agreement, Support escalation)"
When the admin submits the form
Then the override is saved with the admin's identity as grantedBy
And the override appears in the list immediately
And a success message confirms "Override granted — {entitlement type} set to {value} for {user name}"

### Scenario: Admin grants a time-limited override
Given the admin is granting an override
When they set an expiry date (e.g., 3 months from now)
Then the override shows "Expires {date}" in the list
And the override is automatically ignored by the entitlement check utility after that date
And no cleanup job is needed — the check utility filters by expiresAt on read

### Scenario: Admin grants a permanent override
Given the admin is granting an override
When they toggle "Permanent" (no expiry)
Then the override has expiresAt = null
And it shows "Permanent" in the list instead of an expiry date

### Scenario: Admin revokes an active override
Given the admin is viewing a user's overrides
When they click "Revoke" on an active override
Then inline confirmation buttons appear (Cancel / Confirm) replacing the Revoke button
When the admin clicks Confirm
Then the override is deleted from the database
And the list updates immediately
And a success message confirms "Override revoked"

### Scenario: Admin sees the audit trail
Given the admin is viewing a user's overrides
Then each override shows: who granted it (grantedBy), when (createdAt), and why (reason)
And the list is sorted newest-first
And expired overrides remain visible with a "Expired" badge (not deleted — audit persistence)

### Scenario: Admin views effective entitlements summary
Given the admin is viewing a user's overrides
Then a summary card at the top shows the user's effective entitlements:
- Current tier name and its base entitlements
- Any active overrides that boost above tier defaults
- Final effective values for each entitlement type
And this helps the admin understand the user's actual access before granting more

### Scenario: Entitlement type labels use user vocabulary
Given the override form or list displays entitlement types
Then "reports_per_month" displays as "Reports per month"
And "markets_created" displays as "Markets"
And "social_media_kits" displays as "Social media kits"
And "personas_per_report" displays as "Personas per report"
And values display as: positive number = "{n}", -1 = "Unlimited", 0 = "Not included"

### Scenario: Validation prevents invalid overrides
Given the admin is granting an override
When they submit without selecting an entitlement type
Then the form shows "Select an entitlement type"
When they submit with value 0 and entitlement type "reports_per_month"
Then the form shows "Value must be at least 1, or use Unlimited"
When they set an expiry date in the past
Then the form shows "Expiry must be a future date"

### Scenario: API requires admin authentication
Given a non-admin user
When they call GET /api/admin/users/{id}/overrides
Then they receive a 401 response
When they call POST /api/admin/users/{id}/overrides
Then they receive a 401 response

### Scenario: API returns overrides for a user
Given the admin calls GET /api/admin/users/{id}/overrides
Then the response includes all overrides for that user (active and expired)
And each override includes: id, entitlementType, value, expiresAt, grantedBy, reason, createdAt
And overrides are sorted by createdAt descending

### Scenario: API creates an override
Given the admin calls POST /api/admin/users/{id}/overrides with valid data
Then the override is inserted into entitlement_overrides
And grantedBy is set from the authenticated admin's identity
And the response returns the created override with 201 status

### Scenario: API deletes an override
Given the admin calls DELETE /api/admin/users/{id}/overrides/{overrideId}
Then the override is removed from entitlement_overrides
And the response returns 200 with success confirmation

### Scenario: Override panel is accessible from user detail page
Given the admin is on the user detail page (/admin/users/{id})
Then there is a link or tab to view/manage that user's overrides
And the overrides section loads without navigating away from the user context

## User Journey

1. Admin navigates to User Management (/admin/users)
2. Admin clicks on a user to view their detail page (/admin/users/{id})
3. **Admin clicks "Overrides" to view/manage entitlement overrides**
4. Admin sees effective entitlements summary (tier + active overrides)
5. Admin grants a new override (e.g., "5 extra reports for 3 months — partner agreement")
6. User's next entitlement check (#173) picks up the override automatically
7. User experiences the boosted entitlement in their next gated action (#174-#176)

## UI Mockup

```
┌─ Admin User Detail: Alex Rivera ─────────────────────────────────────────────┐
│                                                                               │
│  [Profile]  [Activity]  [Overrides]                                          │
│                                                                               │
│  ┌─ Effective Entitlements (bg: surface, radius: md, shadow: sm) ──────────┐ │
│  │                                                                          │ │
│  │  Tier: Professional                                                      │ │
│  │                                                                          │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │ │
│  │  │ Reports/mo      │  │ Markets         │  │ Social kits     │         │ │
│  │  │ 10 → 20         │  │ 3              │  │ 1/report        │         │ │
│  │  │ (color: accent)  │  │ (color: text)   │  │ (color: text)   │         │ │
│  │  │ ↑ Override       │  │ Tier default    │  │ Tier default    │         │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─ Overrides (bg: surface, radius: md, shadow: sm) ───────────────────────┐ │
│  │                                                                          │ │
│  │  [Grant Override (bg: accent, color: primary, radius: sm)]               │ │
│  │                                                                          │ │
│  │  ┌─ Override Card (bg: surface, border: border, radius: sm) ──────────┐ │ │
│  │  │  Reports per month: 20          Expires Mar 15, 2026               │ │ │
│  │  │  (text: base, font: semibold)   (text: sm, color: text-secondary)  │ │ │
│  │  │                                                                     │ │ │
│  │  │  "Partner agreement — 3 months of boosted capacity"                │ │ │
│  │  │  (text: sm, color: text-secondary, italic)                         │ │ │
│  │  │                                                                     │ │ │
│  │  │  Granted by admin@msa.com on Dec 15, 2025                         │ │ │
│  │  │  (text: xs, color: text-tertiary)                                  │ │ │
│  │  │                                                                     │ │ │
│  │  │                                           [Revoke (color: error)]  │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  │  ┌─ Override Card (bg: surface, border: border, radius: sm, dim) ─────┐ │ │
│  │  │  Social media kits: Unlimited   EXPIRED (badge: error, text: xs)   │ │ │
│  │  │  (text: base, font: semibold)                                      │ │ │
│  │  │                                                                     │ │ │
│  │  │  "Beta tester comp"                                                │ │ │
│  │  │  (text: sm, color: text-tertiary, italic)                          │ │ │
│  │  │                                                                     │ │ │
│  │  │  Granted by ops@msa.com on Sep 1, 2025 · Expired Nov 30, 2025    │ │ │
│  │  │  (text: xs, color: text-tertiary)                                  │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Grant Override Modal (bg: surface-elevated, radius: lg, shadow: lg) ────────┐
│                                                                               │
│  Grant Entitlement Override                                                  │
│  (font: serif, text: xl, font: semibold)                                     │
│                                                                               │
│  For: Alex Rivera (Professional tier)                                        │
│  (text: sm, color: text-secondary)                                           │
│                                                                               │
│  Entitlement Type                                                            │
│  ┌─ Select (border: border-strong, radius: sm) ──────────────────────────┐  │
│  │  Reports per month                                              ▾     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  Value                                                                       │
│  ┌─ Input (border: border-strong, radius: sm) ───────────────────────────┐  │
│  │  20                                                                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  [ ] Unlimited (checkbox — sets value to -1)                                │
│                                                                               │
│  Expiry                                                                      │
│  ( ) Permanent   (•) Expires on:                                            │
│  ┌─ Date Picker (border: border-strong, radius: sm) ────────────────────┐  │
│  │  2026-06-15                                                           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  Reason                                                                      │
│  ┌─ Textarea (border: border-strong, radius: sm) ────────────────────────┐  │
│  │  Partner agreement — 3 months of boosted capacity                     │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  (text: xs, color: text-tertiary) Why is this override being granted?       │
│                                                                               │
│  [Cancel (border: border, radius: sm)]  [Grant Override (bg: accent, ...)]  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Component References

- AdminSidebar: components/layout/admin-sidebar.tsx (no changes — Subscription Tiers nav already exists, overrides are accessed from user detail)
- UserDetailPanel: components/admin/user-detail-panel.tsx (add "Overrides" tab/link)
- EntitlementOverridesPanel: components/admin/entitlement-overrides-panel.tsx (new)
- EntitlementCheckUtility: lib/services/entitlement-check.ts (no changes — already reads overrides)

## Implementation Notes

- The overrides panel can be integrated as a section within the user detail page or as a sub-route (/admin/users/{id}/overrides). Follow the pattern from user-detail-panel.tsx — a client component fetching from REST endpoints.
- grantedBy should be automatically set from the authenticated admin context (not user input). Use the same admin identity pattern from requireAdmin().
- Expired overrides are never auto-deleted — they remain for audit purposes. The entitlement check utility already filters by expiresAt > now().
- The effective entitlements summary calls the same resolution logic as checkEntitlement() but displays it in a human-readable format.
- API routes follow the same pattern as /api/admin/tiers: requireAdmin() guard, JSON body parsing, error responses with appropriate status codes.
- No changes to the entitlement_overrides schema (#171) or the check utility (#173) — both already support everything this feature needs.
