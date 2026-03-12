# QuickStartChecklist

**Status**: Stub (pending implementation)

## Purpose
Shows a progress checklist of onboarding milestones. Checks are driven by actual user data (has markets, has reports, etc.).

## Props
- `items` — Array of `{ label: string, complete: boolean }`

## Design Tokens
- Card: bg-surface, shadow-sm, radius-lg, spacing-4 padding
- Title: font-sans, text-sm, font-semibold, uppercase, color-text-secondary
- Complete icon: color-accent (gold checkmark)
- Incomplete icon: color-text-secondary, opacity 40%
- Label: font-sans, text-base, color-text
