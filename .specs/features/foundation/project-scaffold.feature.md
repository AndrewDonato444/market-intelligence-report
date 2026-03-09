---
feature: Next.js Project Scaffold + Tailwind + Design Tokens
domain: foundation
source: app/layout.tsx, app/page.tsx, tailwind.config.ts, app/globals.css
tests:
  - __tests__/scaffold.test.tsx
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Next.js Project Scaffold + Tailwind + Design Tokens

**Source Files**: `app/layout.tsx`, `app/page.tsx`, `tailwind.config.ts`, `app/globals.css`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: All 5 personas (foundation applies to everyone)

## Feature: Project Scaffold

The foundation layer that every other feature depends on. Sets up the Next.js App Router project structure, configures Tailwind CSS with our design token system (Navy + Gold + Playfair Display/Inter), and establishes the global styles, CSS variables, and font loading.

### Scenario: Fresh Next.js app loads successfully
Given the project has been scaffolded with Next.js App Router
When a user navigates to the root URL
Then a page renders without errors
And the page uses the correct fonts (Playfair Display and Inter)
And the page uses the correct color palette (navy primary, gold accent)

### Scenario: Tailwind is configured with custom design tokens
Given Tailwind CSS is installed and configured
When a component uses token classes (e.g., `bg-primary`, `text-accent`, `font-serif`)
Then the correct CSS values from the design token system are applied
And the color-primary maps to #0F172A
And the color-accent maps to #CA8A04

### Scenario: CSS variables are available globally
Given the global stylesheet defines CSS custom properties
When any component references `var(--color-primary)`
Then it resolves to the design token value #0F172A
And all token categories are available (colors, typography, spacing, radii, shadows)

### Scenario: Google Fonts load correctly
Given the app imports Playfair Display and Inter from Google Fonts
When the page loads
Then both font families are available for rendering
And Playfair Display loads weights 400, 500, 600, 700
And Inter loads weights 300, 400, 500, 600, 700

### Scenario: TypeScript is configured
Given the project uses TypeScript
When source files use .tsx/.ts extensions
Then the TypeScript compiler validates without errors
And strict mode is enabled

### Scenario: Project structure follows App Router conventions
Given Next.js App Router is configured
When examining the project structure
Then app/ directory contains layout.tsx and page.tsx
Then public/ directory exists for static assets
Then components/ directory exists for shared components

## UI Mockup

This is the foundation — no visible UI beyond a minimal landing page that confirms the scaffold works.

```
┌─────────────────────────────────────────────────────────┐
│  (bg: background #F8FAFC)                               │
│                                                          │
│  ┌─ Card (bg: surface, radius: md, shadow: sm) ───────┐│
│  │                                                      ││
│  │  MODERN SIGNAL ADVISORY                              ││
│  │  (font: serif/Playfair, text: 3xl, weight: bold,    ││
│  │   color: primary #0F172A)                            ││
│  │                                                      ││
│  │  Luxury Market Intelligence                          ││
│  │  (font: sans/Inter, text: lg, color: text-secondary) ││
│  │                                                      ││
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                   ││
│  │  (color: accent #CA8A04, 2px)                        ││
│  │                                                      ││
│  │  Platform initializing...                            ││
│  │  (font: sans/Inter, text: sm, color: text-tertiary)  ││
│  │                                                      ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## User Journey

1. **This feature** — project scaffold exists
2. → Feature #2: Database schema + Supabase setup
3. → Feature #3: Authentication with Clerk
4. → Feature #4: Base app layout (nav, sidebar, page shell)

## Technical Notes

- Next.js 15 with App Router (not Pages Router)
- Tailwind CSS v4 (or latest stable)
- TypeScript strict mode
- ESLint with Next.js config
- Design tokens mapped to both Tailwind config and CSS variables for maximum flexibility
- Google Fonts loaded via next/font (optimal loading, no FOUT)
