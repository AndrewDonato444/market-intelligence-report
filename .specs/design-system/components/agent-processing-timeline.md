# AgentProcessingTimeline

**Status**: Stub (pending implementation)

## Purpose

Container component that orchestrates the vertical timeline of 6 AgentCard components during report generation. Manages stagger entrance animations and maps backend pipeline progress to branded agent statuses.

## Responsibilities

- Renders 6 AgentCard components in sequence
- Maps real pipeline stages to branded agent identities
- Handles virtual agents (Communication Strategist, Social Media Strategist) that don't correspond to backend stages
- Stagger entrance animation (120ms between cards)
- Collapses to a 2-column summary grid when all agents complete

## Props

(to be filled after implementation)

## Design Tokens

- `staggerContainer` from `@/lib/animations`
- Stagger delay: 120ms custom
