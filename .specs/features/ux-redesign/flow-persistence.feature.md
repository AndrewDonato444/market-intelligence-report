---
feature: Flow Persistence & Returning User Shortcuts
domain: ux-redesign
source: components/reports/creation-flow-shell.tsx
tests:
  - __tests__/reports/flow-persistence.test.tsx
components:
  - CreationFlowShell
personas:
  - established-practitioner
  - rising-star-agent
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Flow Persistence & Returning User Shortcuts

**Source File**: components/reports/creation-flow-shell.tsx

## Feature: Flow Persistence & Returning User Shortcuts (#158)

Save and restore the creation flow state so agents don't lose progress on page refresh. Returning users with existing markets skip ahead.

### Scenario: Flow state persists across page refresh
Given an agent is on Step 3 with Steps 1-2 completed
When the agent refreshes the browser
Then the flow restores to Step 3 with all previous step data intact

### Scenario: Flow state is saved on every step transition
Given an agent completes Step 1
When the agent advances to Step 2
Then the Step 1 data is persisted to localStorage

### Scenario: Flow state is cleared after report generation starts
Given an agent reaches Step 6 (Generating)
When the pipeline starts
Then the persisted flow state is cleared from localStorage

### Scenario: Returning user with existing market skips to Step 4
Given an agent has at least one existing market
When the agent opens the creation flow
Then they see a Quick Start option to use an existing market
And selecting it pre-fills Steps 1-3 and jumps to Step 4

### Scenario: Returning user can still create a new market
Given an agent has existing markets
When the agent opens the creation flow
Then they can choose Start Fresh to start from Step 1

### Scenario: Inline editing from Review step
Given an agent is on Step 5 (Review)
When they click an edit link
Then the flow navigates back to the relevant step
And existing data from other steps is preserved

### Scenario: Draft flow is abandoned after 7 days
Given an agent has a persisted flow state older than 7 days
When they open the creation flow
Then the stale state is discarded and a fresh flow begins

## Technical Design

- Storage: localStorage with key `mir-creation-flow-draft`
- Hook: `useFlowPersistence` in `lib/hooks/use-flow-persistence.ts`
- Quick Start: Show existing market cards when markets.length > 0
- Step `initialData` props for restoring state
