# AgentCard

**Status**: Stub (pending implementation)

## Purpose

Displays a single AI agent's identity and processing status within the Agent Processing Animation. Shows the agent's name, role subtitle, icon, and a state-dependent visual treatment (pending/running/completed/failed).

## States

- **Pending** — muted border, reduced opacity, no description
- **Running** — gold accent left border, pulsing dot, accent-light background, active description
- **Completed** — green left border, checkmark, surface background
- **Failed** — red left border, X icon, surface background

## Props

(to be filled after implementation)

## Design Tokens

- `color-accent`, `color-accent-light` — running state
- `color-success` — completed state
- `color-error` — failed state
- `color-border` — pending state
- `radius-md`, `spacing-4`, `duration-slow`
