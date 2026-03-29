# ActivityLog

**Status**: Stub (pending implementation)

## Purpose

A scrolling feed of contextual micro-updates that appear during report generation. Shows fabricated but realistic messages about what the active agent is doing, giving the user the feeling of watching a terminal process data in real time.

## Behavior

- New entries appear every 2-3 seconds (randomized)
- Messages are contextual to the currently active agent
- Container is 120px tall with overflow-y scroll
- Top fade gradient masks the oldest entries
- Auto-scrolls to latest entry
- Stops when report reaches terminal state (completed/failed)

## Design Tokens

- `font-mono` — timestamp
- `font-sans` — message text
- `text-xs` — all text
- `color-text-tertiary` — timestamp
- `color-text-secondary` — message
- `duration-slow` (300ms) — entry fade-in
- `color-border` — container border
