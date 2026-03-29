---
feature: Design Refresh — Markets Page (Phase 5)
domain: design-refresh
source: app/(protected)/markets/page.tsx, components/markets/market-creation-shell.tsx, components/markets/delete-market-button.tsx, components/markets/peer-market-form.tsx, app/(protected)/markets/[id]/peers/page.tsx
tests:
  - __tests__/markets/markets-design-refresh.test.tsx
components:
  - MarketsPage
  - MarketCreationShell
  - DeleteMarketButton
  - PeerMarketForm
design_refs:
  - .specs/design-system/tokens.md
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-28
updated: 2026-03-28
---

# Design Refresh — Markets Page (Phase 5)

**Parent Spec**: `.specs/features/design-refresh/backend-design-refresh.feature.md`
**Design System**: `.specs/design-system/tokens.md`

## Overview

Phase 5 migrates all Markets domain components from cold tokens to warm `--color-app-*` tokens and `--font-display`/`--font-body` typography.

## Hard Constraints

1. Do NOT touch PDFs
2. Additive only — never rename/delete existing tokens
3. Preserve all functionality
4. Keep semantic colors (success, error, warning)

## Token Migration Map

| Old Token | New Token |
|-----------|-----------|
| `--color-primary` (text) | `--color-app-text` |
| `--color-surface` | `--color-app-surface` |
| `--color-border` | `--color-app-border` |
| `--color-text` | `--color-app-text` |
| `--color-text-secondary` | `--color-app-text-secondary` |
| `--color-text-tertiary` | `--color-app-text-tertiary` |
| `--color-accent` | `--color-app-accent` |
| `--color-accent-hover` | `--color-app-accent-hover` |
| `--color-accent-light` | `--color-app-accent-light` |
| `--font-serif` | `--font-display` |
| `--font-sans` | `--font-body` |
| `--color-primary-light` | `--color-app-surface` |
| `--color-border-strong` | `--color-app-border` |

## Feature: Markets Page Warm Refresh

### Scenario: Markets list page heading uses warm palette
Given the user views /markets
Then heading uses --font-display and --color-app-text
And subtitle uses --font-body and --color-app-text-secondary

### Scenario: Market cards use warm tokens
Given markets exist
Then card bg uses --color-app-surface
And name uses --color-app-text
And Default badge uses --color-app-accent-light bg

### Scenario: Creation shell uses warm palette
Given user is on /markets/new
Then heading uses --font-display and --color-app-text
And card bg uses --color-app-surface
And navigation border uses --color-app-border

### Scenario: Delete button uses warm palette
Then idle state uses --color-app-text-tertiary and --color-app-border
And semantic --color-error is preserved

### Scenario: Peer market form uses warm palette
Then heading uses --font-display and --color-app-text
And inputs use --color-app-border and --color-app-surface

## Component References

- MarketsPage: app/(protected)/markets/page.tsx
- MarketCreationShell: components/markets/market-creation-shell.tsx
- DeleteMarketButton: components/markets/delete-market-button.tsx
- PeerMarketForm: components/markets/peer-market-form.tsx
- PeerMarketsPage: app/(protected)/markets/[id]/peers/page.tsx
