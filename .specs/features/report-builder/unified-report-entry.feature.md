---
feature: Unified Report Generation Entry Point
domain: report-builder
source: app/(protected)/reports/page.tsx
tests:
  - __tests__/reports/unified-report-entry.test.tsx
components:
  - CreationFlowShell
personas:
  - rising-star-agent
  - established-solo-practitioner
  - legacy-agent-in-transition
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Unified Report Generation Entry Point

**Source Files**: `app/(protected)/reports/page.tsx`, `app/(protected)/reports/new/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/established-solo-practitioner.md`

## Feature: Unified Report Generation Entry Point

Consolidates two separate "Generate Report" entry points into one. Currently the Reports tab sends agents to a legacy 3-step wizard (`/reports/new` via `ReportWizard`), while the Dashboard sends them to the full 6-step creation flow (`/reports/create` via `CreationFlowShell`). Agents should reach the same flow regardless of where they click "Generate."

The creation flow already supports both new market creation and existing market selection (via Quick Start), making the legacy wizard redundant. This feature retires the legacy path and makes `/reports/create` the single entry point.

### Scenario: Generate report from Reports tab
Given the agent is on the Reports list page
When they click "Generate New Report"
Then they are navigated to `/reports/create`
And they see the full creation flow (Your Market -> Your Tier -> Your Focus -> Your Audience -> Review -> Generate)

### Scenario: Generate report from Dashboard
Given the agent is on the Dashboard
When they click any "Generate" action
Then they are navigated to `/reports/create`
And they see the same creation flow as from the Reports tab

### Scenario: Returning agent with existing markets sees Quick Start
Given the agent has at least one configured market
When they arrive at `/reports/create` from either entry point
Then they see Quick Start cards for their existing markets
And they can click "Use This" to jump to the Audience step (step 3)
Or they can click "Start Fresh" to begin from step 0

### Scenario: Legacy URL redirects to creation flow
Given the agent has bookmarked or navigated to `/reports/new`
When the page loads
Then they are redirected to `/reports/create`
And the creation flow loads normally

### Scenario: Empty state from Reports tab
Given the agent has no reports yet
When they see the empty state on the Reports list
And they click the "Generate New Report" call-to-action
Then they are navigated to `/reports/create`

### Scenario: Legacy wizard code is removed
Given the codebase after this feature is implemented
Then `components/reports/report-wizard.tsx` no longer exists
And no production code imports `ReportWizard`
And the `/reports/new` route serves only a redirect

## User Journey

1. Agent clicks "Generate New Report" from Reports tab **OR** "Generate a Report" from Dashboard
2. **Both land on `/reports/create`** — the unified creation flow
3. Quick Start (if markets exist) or full 6-step flow
4. Report generates, agent views result at `/reports/{id}`

## UI Mockup

No new UI — this feature consolidates entry points to the existing `CreationFlowShell`.

**Reports list page (only change):**
```
┌──────────────────────────────────────────────┐
│  Reports                  [Generate New Report]──→ /reports/create
│  Your generated market intelligence reports   │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ Chicago Ultra Luxury Intelligence Report│  │
│  │ Chicago, IL · Created Mar 10, 2026      │  │
│  │                          [Completed] [↓] │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ── empty state ──                            │
│  No reports yet.                              │
│  [Generate New Report]──→ /reports/create     │
│                                               │
└──────────────────────────────────────────────┘
```

## Files Changed

| File | Change |
|------|--------|
| `app/(protected)/reports/page.tsx` | Change `href="/reports/new"` → `href="/reports/create"` (2 locations) |
| `app/(protected)/reports/new/page.tsx` | Replace with server-side `redirect("/reports/create")` |
| `components/reports/report-wizard.tsx` | Delete (dead code) |
| `__tests__/reports/report-wizard.test.tsx` | Delete (tests removed component) |
| `__tests__/buyer-personas/persona-selection-ui.test.tsx` | Delete (imports removed component) |

## Spec References

- Creation flow spec: `.specs/features/ux-redesign/unified-creation-flow-shell.feature.md`
- Step specs: `.specs/features/ux-redesign/step-{1..6}-*.feature.md`
- Legacy wizard spec (to archive): `.specs/features/report-builder/report-builder-wizard.feature.md`

## Learnings
