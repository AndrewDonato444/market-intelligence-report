---
feature: Unified Creation Flow Shell
domain: ux-redesign
source: app/(protected)/reports/create/page.tsx
tests:
  - __tests__/reports/creation-flow-shell.test.tsx
components:
  - CreationFlowShell
  - CreationStepIndicator
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Unified Creation Flow Shell

**Source File**: `app/(protected)/reports/create/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/legacy-agent.md`

## Feature: Unified Report Creation Flow

Merges the separate market wizard and report wizard into a single guided experience at `/reports/create`. A 6-step state machine with animated transitions, a refined progress indicator, and back/next navigation.

### Scenario: Agent lands on the creation flow
Given the agent is authenticated
When they navigate to `/reports/create`
Then they see the unified creation flow shell with the step indicator showing 6 steps
And the first step "Your Market" is active
And they see a next button

### Scenario: Agent sees step names in the progress indicator
Given the creation flow is loaded
Then the progress indicator shows: Your Market, Your Tier, Your Focus, Your Audience, Review, Generate
And completed steps show a checkmark
And the current step is highlighted with the accent color
And future steps are dimmed

### Scenario: Agent navigates forward through steps
Given the agent is on step 1
When they click "Next"
Then step 2 content slides in from the right
And the progress indicator advances to step 2

### Scenario: Agent navigates backward
Given the agent is on step 3
When they click "Back"
Then step 2 content slides in from the left
And the progress indicator returns to step 2

### Scenario: Step content is placeholder until individual steps are built
Given the creation flow is loaded
Then each step shows a placeholder with the step name and description
And the flow is fully navigable end-to-end

### Scenario: Step 6 shows generate button instead of next
Given the agent is on step 6
Then the "Next" button is replaced with a "Generate Report" CTA

## UI Mockup

```
+-----------------------------------------------------------+
|   Create Your Intelligence Report                         |
|   ------- (accent underline)                              |
|                                                           |
|   * --- o --- o --- o --- o --- o                          |
|   Your   Your  Your  Your  Review Generate                |
|   Market Tier  Focus Audience                             |
|                                                           |
| +---------------------------------------------------------+
| |  [Step content - AnimatePresence for transitions]       |
| |  Step 1: Your Market                                    |
| |  Select the market for your intelligence report.        |
| +---------------------------------------------------------+
|                                                           |
|   [Back]                                       [Next]     |
+-----------------------------------------------------------+
```

## Technical Notes

- Uses AnimatePresence from framer-motion for step transitions
- Uses pageTransition() from lib/animations.ts for directional slides
- Step state managed with useState (numeric index 0-5)
- Route: app/(protected)/reports/create/page.tsx
- Shell component: components/reports/creation-flow-shell.tsx
- Step indicator: components/reports/creation-step-indicator.tsx

## Component References

- AnimatedContainer: .specs/design-system/components/animated-container.md
- Tooltip: .specs/design-system/components/tooltip.md
