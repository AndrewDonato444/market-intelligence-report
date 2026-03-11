---
feature: Dashboard Redesign
domain: ux-redesign
source: app/(protected)/dashboard/page.tsx
tests:
  - __tests__/dashboard/dashboard-redesign.test.tsx
components:
  - DashboardPage
  - MarketCard
  - RecentReportsList
  - DashboardEmptyState
  - DashboardStats
personas:
  - rising-star-agent
  - established-practitioner
  - legacy-agent
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Dashboard Redesign

**Source File**: app/(protected)/dashboard/page.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md, .specs/personas/legacy-agent.md

## Feature: Dashboard Redesign (#159)

Transform the placeholder dashboard into a command center where agents see their markets, recent intelligence reports, and can start a new report in one click. The dashboard is the agent's home base — it should feel authoritative, not empty.

### Persona Context

- **Alex (Rising Star)**: Patience is medium. Wants to jump straight to generating a new report. The dashboard must surface the "New Report" action immediately — no hunting. Quick stats reinforce credibility ("you've generated 4 intelligence briefs this month").
- **Jordan (Established Practitioner)**: Patience is high. Values seeing the full picture — markets defined, reports generated, editorial quality. Wants to review recent reports and pick up where they left off.
- **Pat (Legacy Agent)**: Patience is high but comfort with complex UI is lower. Dashboard must be clean and scannable. Big, clear actions — not dense grids. Narrative context over raw numbers.

---

### Scenario: Agent lands on dashboard with no markets defined
Given a new agent with no markets and no reports
When they view the dashboard
Then they see a welcoming empty state with a compelling illustration placeholder and the headline "Define Your First Market"
And the subtext reads "Your intelligence platform is ready. Start by telling us about the market you advise in."
And a prominent "Get Started" button links to the report creation flow at Step 1
And no market cards or report lists are visible

### Scenario: Agent lands on dashboard with markets but no reports
Given an agent with one or more markets defined but no reports generated
When they view the dashboard
Then they see their market cards with a "New Report" quick-start action on each
And below the market cards, the recent reports area shows an empty state reading "No intelligence briefs yet"
And the empty state includes a "Generate Your First Report" call to action

### Scenario: Agent lands on dashboard with markets and reports
Given an agent with markets defined and reports generated
When they view the dashboard
Then they see a stats summary row showing total reports generated, most recent report date, and active markets count
And they see their market cards, each with the market name, tier badge, and a "New Report" action
And below the market cards, they see their most recent reports (up to 5) with title, market name, status badge, and date
And a "View All Reports" link navigates to the full reports page

### Scenario: Agent clicks "New Report" on a market card
Given an agent is viewing the dashboard with at least one market card
When they click the "New Report" action on a market card
Then they are navigated to the report creation flow
And the creation flow pre-fills that market (skipping Steps 1-3, landing on Step 4: Your Audience)

### Scenario: Agent clicks a recent report
Given an agent is viewing the dashboard with recent reports listed
When they click on a report in the recent reports list
Then they are navigated to the report detail view at `/reports/{reportId}`

### Scenario: Dashboard shows report status badges
Given an agent has reports in various states (generating, completed, failed)
When they view the recent reports list on the dashboard
Then each report shows a status badge — "Generating" in gold, "Completed" in green, "Failed" in red
And generating reports show a subtle pulsing indicator

### Scenario: Dashboard entrance animations
Given an agent navigates to the dashboard
When the page loads
Then the stats row fades in first
Then the market cards stagger in with a slide-up animation
Then the recent reports list fades in last
And all animations use the existing Framer Motion infrastructure (fadeVariant, staggerContainer, slideVariant)

### Scenario: Dashboard empty state for returning agent with no active markets
Given an agent previously had markets but they were all removed
When they view the dashboard
Then they see the same welcoming empty state as a new agent
And the headline says "Define Your First Market"

---

## User Journey

1. Agent signs in
2. **Dashboard (this feature)** — sees markets, recent reports, quick stats
3. Clicks "New Report" on a market card → enters creation flow at Step 4
4. Or clicks a recent report → views/edits the report
5. Or clicks "Get Started" (empty state) → enters creation flow at Step 1

---

## UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  (App shell: nav + sidebar already exist)                                   │
│                                                                             │
│  ┌─ Stats Row (bg: surface, radius: md, shadow: sm, stagger entrance) ──┐  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │  │
│  │  │ 12              │  │ Mar 8, 2026     │  │ 2               │      │  │
│  │  │ Reports         │  │ Last Report     │  │ Active Markets  │      │  │
│  │  │ Generated       │  │                 │  │                 │      │  │
│  │  │ (text: accent,  │  │ (text: accent,  │  │ (text: accent,  │      │  │
│  │  │  text-3xl,      │  │  text-lg,       │  │  text-3xl,      │      │  │
│  │  │  font: sans,    │  │  font: sans,    │  │  font: sans,    │      │  │
│  │  │  weight: bold)  │  │  weight: bold)  │  │  weight: bold)  │      │  │
│  │  │ (label: text-sm │  │ (label: text-sm │  │ (label: text-sm │      │  │
│  │  │  text-secondary)│  │  text-secondary)│  │  text-secondary)│      │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  YOUR MARKETS (font: serif, text-xl, font-semibold, color: primary)        │
│                                                                             │
│  ┌─ Market Card (bg: surface, radius: md, shadow: sm, hover: shadow-md) ┐  │
│  │                                                                       │  │
│  │  Naples, FL                    ┌──────────────────────────────┐       │  │
│  │  (font: sans, text-lg,        │ New Report                   │       │  │
│  │   font-semibold, color: text)  │ (bg: accent, color: primary,│       │  │
│  │                                │  radius: sm, font: sans,    │       │  │
│  │  ┌────────────────────────┐   │  font-semibold, text-sm)     │       │  │
│  │  │ ULTRA LUXURY           │   └──────────────────────────────┘       │  │
│  │  │ (bg: accent-light,     │                                          │  │
│  │  │  color: accent-hover,  │   Waterfront · Golf Course              │  │
│  │  │  text-xs, font-medium, │   (text-sm, color: text-secondary)      │  │
│  │  │  radius-full, px-2)    │                                          │  │
│  │  └────────────────────────┘   $10M+ floor                           │  │
│  │                                (text-xs, color: text-tertiary)       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Market Card 2 ──────────────────────────────────────────────────────┐  │
│  │  (same pattern)                                                      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  + Define New Market                                                        │
│  (text-sm, color: accent, hover: underline, font-medium)                   │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  RECENT INTELLIGENCE BRIEFS (font: serif, text-xl, font-semibold)          │
│  (heading uses persona vocabulary: "briefs" not "reports")                  │
│                                                                             │
│  ┌─ Report Row (bg: surface, radius: md, shadow: sm, hover: shadow-md) ─┐ │
│  │                                                                        │ │
│  │  Naples Ultra-Luxury Q1 2026          Completed ●                     │ │
│  │  (font: sans, text-sm, font-medium)   (color: success, text-xs)       │ │
│  │  Naples, FL · Mar 8, 2026             [Download PDF]                  │ │
│  │  (text-xs, color: text-secondary)     (text-xs, color: accent)        │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ Report Row 2 ────────────────────────────────────────────────────────┐ │
│  │  Aspen Mountain Estates Market Brief   Generating ◉                   │ │
│  │  (font: sans, text-sm, font-medium)    (color: accent, pulse anim)    │ │
│  │  Aspen, CO · Mar 11, 2026                                             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  View All Reports →                                                        │
│  (text-sm, color: accent, hover: underline, font-medium)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State (No Markets)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                         ┌─────────────────────┐                            │
│                         │                     │                            │
│                         │   [ illustration    │                            │
│                         │     placeholder:    │                            │
│                         │     gold accent     │                            │
│                         │     line drawing    │                            │
│                         │     of a chart +    │                            │
│                         │     document ]      │                            │
│                         │                     │                            │
│                         └─────────────────────┘                            │
│                                                                             │
│                   Define Your First Market                                  │
│                   (font: serif, text-2xl, font-bold, color: primary)       │
│                                                                             │
│            Your intelligence platform is ready. Start by                    │
│            telling us about the market you advise in.                       │
│            (font: sans, text-base, color: text-secondary,                  │
│             max-w-md, text-center)                                         │
│                                                                             │
│                      ┌──────────────────┐                                  │
│                      │   Get Started    │                                  │
│                      │  (bg: accent,    │                                  │
│                      │   color: primary,│                                  │
│                      │   radius: sm,    │                                  │
│                      │   px-6, py-3,    │                                  │
│                      │   font-semibold) │                                  │
│                      └──────────────────┘                                  │
│                                                                             │
│                    w-48 gold accent line                                    │
│                    (bg: accent, h-0.5)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State (Markets Exist, No Reports)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  (Stats row hidden — no stats to show yet)                                 │
│                                                                             │
│  YOUR MARKETS                                                              │
│  ┌─ Market Card(s) shown as above ──────────────────────────────────────┐  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                             │
│  RECENT INTELLIGENCE BRIEFS                                                │
│                                                                             │
│  ┌─ Empty State Card (bg: surface, radius: md, shadow: sm, p-8) ────────┐ │
│  │                                                                        │ │
│  │              No intelligence briefs yet.                               │ │
│  │              (text-sm, color: text-secondary, text-center)             │ │
│  │                                                                        │ │
│  │              Generate your first report to see it here.                │ │
│  │              (text-xs, color: text-tertiary, text-center)              │ │
│  │                                                                        │ │
│  │              [Generate Your First Report]                              │ │
│  │              (bg: accent, text-sm, font-semibold, radius-sm)          │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component References

- AnimatedContainer: components/ui/animated-container.tsx (existing — fadeVariant, staggerContainer)
- Tooltip: components/ui/tooltip.tsx (existing)
- DownloadPdfButton: components/reports/download-pdf-button.tsx (existing — reuse in recent reports)
- MarketCard: .specs/design-system/components/market-card.md (new stub)
- DashboardStats: .specs/design-system/components/dashboard-stats.md (new stub)
- DashboardEmptyState: .specs/design-system/components/dashboard-empty-state.md (new stub)
- RecentReportsList: .specs/design-system/components/recent-reports-list.md (new stub)

## Design Token Usage

| Element | Tokens |
|---------|--------|
| Stats numbers | `color-accent`, `font-sans`, `text-3xl`, `font-bold` |
| Stats labels | `color-text-secondary`, `font-sans`, `text-sm` |
| Section headings | `color-primary`, `font-serif`, `text-xl`, `font-semibold` |
| Market card bg | `color-surface`, `radius-md`, `shadow-sm` → `shadow-md` on hover |
| Market name | `color-text`, `font-sans`, `text-lg`, `font-semibold` |
| Tier badge | `color-accent-light` bg, `color-accent-hover` text, `text-xs`, `radius-full` |
| "New Report" CTA | `color-accent` bg, `color-primary` text, `radius-sm`, `font-semibold` |
| Segment tags | `color-text-secondary`, `text-sm` |
| Report row | `color-surface`, `radius-md`, `shadow-sm` |
| Report title | `color-text`, `font-sans`, `text-sm`, `font-medium` |
| Report meta | `color-text-secondary`, `text-xs` |
| Status: Completed | `color-success` |
| Status: Generating | `color-accent` + pulse animation |
| Status: Failed | `color-error` |
| Empty state headline | `color-primary`, `font-serif`, `text-2xl`, `font-bold` |
| Empty state subtext | `color-text-secondary`, `font-sans`, `text-base` |
| Gold accent line | `color-accent`, `h-0.5` |
| Entrance animations | `fadeVariant`, `staggerContainer`, `slideVariant("up")` via `duration-slow` (300ms) |

## Technical Notes

- Dashboard is a server component (`app/(protected)/dashboard/page.tsx`) that fetches markets and reports server-side
- Market cards and recent reports should be client components wrapped in `AnimatedContainer` for entrance animations
- "New Report" on a market card links to `/reports/create?marketId={id}` — the creation flow shell already supports Quick Start pre-fill via the `markets` prop
- Stats row is hidden when the agent has zero reports (nothing meaningful to show)
- Recent reports limited to 5 most recent, ordered by `createdAt` desc
- Reuse the existing `getMarkets()` and `getReports()` service functions
- Reuse existing `DownloadPdfButton` component for completed reports
- Market card segments display is a comma-joined string of segment names (e.g., "Waterfront · Golf Course")
- Tier badge text: "LUXURY", "HIGH LUXURY", "ULTRA LUXURY" — uppercase, derived from `market.luxuryTier`

## Persona Revision Notes

- **Vocabulary**: Section heading uses "Intelligence Briefs" instead of "Reports" — matches Jordan's "the brief" and Pat's "intelligence brief" vocabulary. Alex's "executive briefing" framing also aligns.
- **Patience**: Stats row gives Alex immediate credibility numbers. Jordan gets the full picture without clicking. Pat sees clean, scannable layout.
- **Frustrations addressed**: Empty state doesn't feel like a blank form — it has warmth and invitation. Market cards with "New Report" eliminate the multi-step navigation that would frustrate Alex.

## Learnings

- Dashboard is a server component that fetches markets and reports via `getMarkets()`/`getReports()`, then passes data to a client `DashboardContent` component for animations and interactivity.
- Date formatting in tests is timezone-sensitive: `new Date("2026-03-08")` parses as UTC midnight, which renders as Mar 7 in US timezones. Use `new Date(2026, 2, 8)` for local-timezone dates in test assertions.
- The stagger animation pattern works well: `AnimatedContainer variant="stagger"` wraps a grid, with `StaggerItem variant="slide" direction="up"` on each card.
- `DownloadPdfButton` can be reused inside report rows — it stops click propagation internally.
- Status badges use CSS variable classes (`text-[var(--color-success)]`) which pass regex tests matching `/color-success|success|green/`.
