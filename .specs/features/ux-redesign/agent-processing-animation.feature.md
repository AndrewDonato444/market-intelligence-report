---
feature: Agent Processing Animation
domain: ux-redesign
source: components/reports/steps/step-generating.tsx
tests:
  - __tests__/reports/step-generating.test.tsx
components:
  - AgentCard
  - AgentProcessingTimeline
personas:
  - rising-star-agent
  - anti-persona-report
design_refs:
  - .specs/design-system/tokens.md
status: implemented
created: 2026-03-17
updated: 2026-03-17
---

# Agent Processing Animation

**Source File**: `components/reports/steps/step-generating.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star Agent (Alex Rivera)

## Overview

After clicking "Generate Report," the user sees a branded animated page that visualizes the report flowing through 6 named AI agents. This replaces the current generic pipeline stage list with a theatrical, confidence-building experience. The real pipeline progress API still drives completion — the agent animations are a branded overlay that maps to actual backend stages.

## Agent Roster

| # | Agent Name | Role | Maps To (backend) | Pro |
|---|-----------|------|-------------------|-----|
| 1 | Chief Architect | Orchestrator — coordinates the entire pipeline | `data-fetch` (virtual stage: Layers 0+1) | |
| 2 | Intelligence Analyst | Insights — strategic narratives, market themes | `insight-generator` | |
| 3 | Market Strategist | Forecaster — projections, scenario analysis | `forecast-modeler` | |
| 4 | Editorial Director | Polish — consistency, pull quotes, methodology | `polish-agent` | |
| 5 | Client Communication Strategist | Full client communication suite — emails, talking points, follow-ups | `null` (virtual — runs post-pipeline) | Yes |
| 6 | Social Media Strategist | Complete social media strategy — content, calendar, positioning | `null` (virtual — runs post-pipeline) | Yes |

**Note**: Agents 5 and 6 don't correspond to current pipeline stages. They animate after the core pipeline completes (or near-completes) as a "finishing touches" phase. Their completion triggers the "View Report" CTA.

## Feature: Agent Processing Animation

The page makes the user feel like a team of specialists is working on their report. This builds perceived value and trust — a rising star agent like Alex sees "Intelligence Analyst" and "Market Strategist" and thinks: *this is the team I'm paying for.*

### Scenario: Happy path — report generates successfully
Given the user has clicked "Generate Report" on the Review step
And the report has been created via POST /api/reports
When the Generating step mounts
Then the heading reads "Your Advisory Team Is On It"
And the subheading reads "Six specialists are building your intelligence report."
And a progress bar shows overall completion percentage
And 6 agent cards are displayed vertically in sequence
And the first agent (Chief Architect) shows status "running" with a pulsing gold accent border
And agents 2-6 show status "pending" with muted borders
And a contextual status line below the progress bar shows the active agent's description

### Scenario: Agents animate in sequence as pipeline progresses
Given the report is generating
When the progress API reports `data-fetch` complete (completedAgents: 0, but agent activity begins)
Then the Chief Architect card transitions to "completed" (green border, checkmark)
And the Intelligence Analyst card transitions to "running" (gold pulse)
And the active description updates to "Crafting strategic narratives and market themes..."

When the progress API reports `insight-generator` complete
Then the Intelligence Analyst transitions to "completed"
And the Market Strategist transitions to "running"

When the progress API reports `forecast-modeler` complete
Then the Market Strategist transitions to "completed"
And the Editorial Director transitions to "running"

When the progress API reports `polish-agent` complete
Then the Editorial Director transitions to "completed"
And the Client Communication Strategist transitions to "running"
And the Social Media Strategist transitions to "running"
(both virtual agents run "simultaneously" as a finishing phase)

When the report status is "completed"
Then all 6 agent cards show "completed"
And the progress bar fills to 100%
And the heading changes to "Your Report Is Ready"
And a "View Report" CTA button appears with gold accent styling

### Scenario: Agent card entrance animation
Given the Generating step has just mounted
When the page renders
Then each agent card staggers in from bottom with 120ms delay between cards
And each card fades in (opacity 0→1) and slides up (translateY 16px→0)
And the first card begins its entrance immediately
And the last card finishes entering ~600ms after mount

### Scenario: Active agent has pulsing indicator and contextual copy
Given agent N is currently "running"
Then its card has a gold left border accent (4px solid color-accent)
And a pulsing gold dot appears next to the agent name
And the card background is color-accent-light
And a brief description of what that agent is doing appears below the agent name
And the description uses the persona's vocabulary (e.g., "Building your executive briefing" not "Generating section 1")

### Scenario: Completed agent shows success state
Given agent N has finished
Then its card border changes to color-success (green)
And a checkmark icon replaces the pulsing dot
And the background returns to color-surface
And the transition takes duration-slow (300ms)

### Scenario: Time estimate updates
Given the report is generating
When the progress is below 100%
Then a time estimate appears below the progress bar (e.g., "~3 min remaining")
And the estimate recalculates on each poll tick

### Scenario: Report generation fails
Given the pipeline encounters an error
When the progress API reports status "failed"
Then the currently-running agent card transitions to "failed" (red border, X icon)
And all pending agent cards remain in "pending" state
And the heading changes to "Generation Hit a Snag"
And a "Try Again" button appears
And the error state uses color-error for accents

### Scenario: Retry after failure
Given the report has failed
When the user clicks "Try Again"
Then all agent cards reset to "pending"
And the first agent (Chief Architect) transitions to "running"
And polling resumes

### Scenario: Pro badge on virtual agents
Given agents 5 (Client Communication Strategist) and 6 (Social Media Strategist) are virtual
Then each virtual agent card displays a "Pro" badge next to the agent name
And the badge uses accent-light background with accent-hover text
And the badge text is uppercase, 10px, semibold with tracking-wider

### Scenario: Responsive layout
Given the user is on a mobile device (< screen-md)
Then agent cards stack vertically with reduced padding
And the agent name and description remain visible

## User Journey

1. User completes Review step, clicks "Generate Report"
2. **→ Agent Processing Animation (this feature)**
3. Report completes → user clicks "View Report" → navigates to `/reports/{id}`

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Your Advisory Team Is On It                                    │
│  (font: serif, text: 2xl, weight: bold, color: primary)        │
│  Six specialists are building your intelligence report.         │
│  (font: sans, text: sm, color: text-secondary)                 │
│  ━━━━━━━━━━ (accent line, w-12)                                │
│                                                                 │
│  ┌─ Progress Bar ──────────────────────────────────────────┐   │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░  38%                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Intelligence Analyst is crafting narratives...  ~2 min left   │
│  (font: sans, text: xs, color: text-secondary)                 │
│                                                                 │
│  ┌─ Agent Card (COMPLETED) ────────────────────────────────┐   │
│  │ ✓  border-left: 4px solid color-success                 │   │
│  │    bg: surface                                           │   │
│  │                                                          │   │
│  │  ●  CHIEF ARCHITECT                                     │   │
│  │     ✓ Transaction data collected and analytical          │   │
│  │     framework established                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Agent Card (RUNNING) ──────────────────────────────────┐   │
│  │ ●  border-left: 4px solid color-accent (pulsing)        │   │
│  │    bg: accent-light                                      │   │
│  │                                                          │   │
│  │  ●  INTELLIGENCE ANALYST                                │   │
│  │     Analyzing transaction patterns to surface            │   │
│  │     strategic narratives and market themes...            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Agent Card (PENDING) ──────────────────────────────────┐   │
│  │ ○  border-left: 4px solid color-border                  │   │
│  │    bg: surface, opacity: 0.7                            │   │
│  │                                                          │   │
│  │  ○  MARKET STRATEGIST                                   │   │
│  │     Builds 90-day projections with explicit confidence   │   │
│  │     ratings, scenario modeling, and supply-demand signals│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Agent Card (PENDING) ──────────────────────────────────┐   │
│  │ ○  EDITORIAL DIRECTOR                                    │   │
│  │    Ensures every section reads like an institutional pub. │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Agent Card (PENDING) ──────────────────────────────────┐   │
│  │ ○  CLIENT COMMUNICATION STRATEGIST  [Pro]                │   │
│  │    Builds a full client communication suite...           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Agent Card (PENDING) ──────────────────────────────────┐   │
│  │ ○  SOCIAL MEDIA STRATEGIST  [Pro]                        │   │
│  │    Designs a complete social media strategy...           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Reports can take up to 10 minutes. You'll be notified         │
│  when it's ready.                                              │
│  (font: sans, text: xs, color: text-tertiary, border-t)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


=== COMPLETED STATE ===

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Your Report Is Ready                                          │
│  "Naples Ultra Luxury Market Intelligence — Q1 2026"           │
│  has been generated successfully.                              │
│  ━━━━━━━━━━                                                    │
│                                                                 │
│  ┌─ Progress Bar ──────────────────────────────────────────┐   │
│  │ ██████████████████████████████████  100%                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ✓ Chief Architect         ✓ Intelligence Analyst              │
│  ✓ Market Strategist       ✓ Editorial Director                │
│  ✓ Communication Strategist ✓ Social Media Strategist          │
│  (collapsed 2-column layout when all complete)                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              [ View Report ]                             │   │
│  │   (bg: accent, color: primary, radius: sm, w-full)      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


=== FAILED STATE ===

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Generation Hit a Snag                                         │
│  We ran into an issue generating your report.                  │
│  ━━━━━━━━━━                                                    │
│                                                                 │
│  ✓ Chief Architect                                             │
│  ✓ Intelligence Analyst                                        │
│  ✗ Market Strategist  ← (red border, failed state)            │
│  ○ Editorial Director  (pending)                               │
│  ○ Communication Strategist (pending)                          │
│  ○ Social Media Strategist (pending)                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              [ Try Again ]                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Card Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ ●  AGENT NAME (font: sans, text-sm, font-semibold,          │
│    color: text)                                              │
│                                                              │
│    Description of what the agent does / is doing /           │
│    has done (font: sans, text-xs, leading-relaxed,           │
│    color varies by state — pending: text-secondary,          │
│    running: text-secondary italic, completed:                │
│    text-tertiary with ✓ prefix)                              │
│                                                              │
│  border-left: 4px solid (varies by state)                   │
│  padding: spacing-4                                          │
│  radius: radius-md                                           │
│  transition: duration-slow, easing-default                   │
└──────────────────────────────────────────────────────────────┘

Each state shows a different description:
- **Pending**: Explains the agent's role (e.g., "Pulls live transaction data...")
- **Running**: What it's actively doing (e.g., "Pulling live transaction records...")
- **Completed**: Short confirmation with ✓ (e.g., "✓ Transaction data collected")
```

---

## Phase 2: Ambient Animation Enhancements

Three additions that make the page feel alive during the 3-10 minute generation wait.

### Scenario: Live activity log shows real-time micro-updates
Given the report is generating
When the page is in a non-terminal state (not completed, not failed)
Then a scrolling activity log appears below the agent cards
And the log container is 120px tall with overflow-y auto and a top fade gradient
And a new log entry appears every 2-3 seconds (randomized interval)
And each entry shows a timestamp (elapsed time, e.g., "0:47") and a contextual message
And log entries are contextual to the currently active agent:
  - Chief Architect: "Pulling 847 transactions from 34102...", "Computing median price per sqft...", "Indexing waterfront vs inland segments...", "Mapping absorption rates by price band..."
  - Intelligence Analyst: "Scoring market health across 4 dimensions...", "Identifying luxury segment outliers...", "Comparing YoY velocity shifts...", "Drafting strategic theme: supply-side compression..."
  - Market Strategist: "Modeling Q2 absorption scenario...", "Calibrating confidence intervals...", "Running bull/bear price projections...", "Stress-testing inventory drawdown rates..."
  - Editorial Director: "Tightening executive briefing narrative...", "Generating pull quote candidates...", "Cross-referencing data citations...", "Ensuring consistent voice across 10 sections..."
  - Client Communication Strategist: "Building advisory email template...", "Extracting key talking points...", "Drafting follow-up sequence..."
  - Social Media Strategist: "Selecting key stats for social...", "Writing platform-specific captions...", "Designing content calendar..."
And the messages are selected randomly (no repeats until all messages for that agent are exhausted)
And log entries fade in with opacity animation (0→1 over 300ms)
And the log auto-scrolls to the latest entry
And the log has a monospace font (font-mono) for the timestamp and sans for the message
And when the report completes or fails, the log stops adding entries

### Scenario: Elapsed time counter ticks live
Given the report is generating
When the page is in a non-terminal state
Then an elapsed time counter appears next to the progress percentage (left side)
And the counter displays in MM:SS format (e.g., "0:00", "1:23", "3:45")
And the counter increments every second
And the counter starts from 0:00 when the component mounts
And on retry (after failure), the counter resets to 0:00
And the counter uses font-mono for tabular number alignment
And when the report completes, the counter stops and shows the final elapsed time
And when the report fails, the counter stops

### Scenario: Progress bar has animated gradient sweep
Given the report is generating
When the progress bar is visible and not in a terminal state
Then the progress bar fill uses an animated gradient instead of a flat color
And the gradient sweeps from left to right continuously (shimmer effect)
And the gradient is: transparent → rgba(255,255,255,0.3) → transparent
And the sweep animation duration is 1.5 seconds, repeating infinitely
And the gradient overlays on top of the accent color fill
And when the report completes, the gradient animation stops and the bar shows solid accent color
And when the report fails, the gradient animation stops and the bar shows solid error color

## UI Mockup — Phase 2 Additions

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Your Advisory Team Is On It                                    │
│  Six specialists are building your intelligence report.         │
│  ━━━━━━━━━━                                                    │
│                                                                 │
│  ┌─ Progress Bar (gradient sweep animation) ───────────────┐   │
│  │ ████▓▓██████████░░░░░░░░░░░░░░░░  38%                  │   │
│  │      ↑ shimmer sweeps L→R continuously                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  1:47 elapsed · 38% complete              ~2 min remaining     │
│  (font-mono)   (font-sans)               (font-sans)           │
│                                                                 │
│  Intelligence Analyst — Analyzing transaction patterns...       │
│                                                                 │
│  [ ... 6 agent cards as before ... ]                           │
│                                                                 │
│  ┌─ Activity Log (120px, overflow-y, top fade) ────────────┐   │
│  │ ░░░░░░░░ (fade gradient at top) ░░░░░░░░░░░░░░░░░░░░░  │   │
│  │ 0:34  Indexing waterfront vs inland segments...          │   │
│  │ 0:37  Mapping absorption rates by price band...          │   │
│  │ 0:39  Computing median price per sqft...                 │   │
│  │ 0:42  Scoring market health across 4 dimensions...       │   │
│  │ 0:45  Identifying luxury segment outliers...  ← latest   │   │
│  │ (font-mono timestamp, font-sans message, text-xs,        │   │
│  │  color: text-tertiary for timestamp, text-secondary msg) │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Reports can take up to 10 minutes.                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Animation Tokens Used — Phase 2 Additions

| Animation | Token / Value | Notes |
|-----------|--------------|-------|
| Gradient sweep | `@keyframes shimmer`, 1.5s linear infinite | CSS keyframe on progress bar |
| Log entry fade-in | `duration-slow` (300ms) | Each new log line fades in |
| Log auto-scroll | `scrollIntoView({ behavior: 'smooth' })` | On new entry |
| Elapsed counter tick | `setInterval` 1000ms | Runs independently of poll interval |
| Log entry interval | 2000-3000ms (randomized) | `Math.random() * 1000 + 2000` |

---

## Animation Tokens Used

| Animation | Token | Value |
|-----------|-------|-------|
| Card entrance stagger | `duration-slow` | 300ms (per card) |
| Status transitions | `duration-slow` | 300ms |
| Pulse on active dot | CSS `animate-pulse` | Tailwind default |
| Card slide-up entrance | `easing-default` | cubic-bezier(0.4, 0, 0.2, 1) |
| Stagger delay between cards | custom | 120ms |

## Implementation Notes

- This is a **UI-only** rebrand of the existing `StepGenerating` component. The polling logic (`/api/reports/{id}/progress`) does not change.
- Agents 5 and 6 (Communication Strategist, Social Media Strategist) are **virtual** — they animate after `polish-agent` completes and before/at the "completed" state. They represent features (email writer, social kit) that run post-report or are coming soon.
- Icons can be simple SVG or emoji initially — no need for a custom icon library in v1.
- The `PIPELINE_STAGES` array in `pipeline-status.tsx` should be extended with branded names but the `agentName` keys must stay aligned with the backend.
- Framer Motion is already in use — leverage `staggerContainer`, `fadeVariant`, and custom variants for the card entrance.

## Component References

- AgentCard: `.specs/design-system/components/agent-card.md` (stub)
- AgentProcessingTimeline: `.specs/design-system/components/agent-processing-timeline.md` (stub)

## Learnings

(to be filled after implementation)
