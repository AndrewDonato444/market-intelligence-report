# Design Tokens

**Status**: ✅ Defined
**Personality**: Professional (with editorial luxury inflection)
**Last Updated**: 2026-03-09

> Derived from vision (Modern Signal Advisory / Luxury Market Intelligence Report),
> 5 personas (rising star through legacy agent), and ui-ux-pro-max skill research.

---

## Personality

**Chosen**: Professional
**Why**: Every persona — from 32 to 60 — uses words like "institutional," "conviction," "advisory," and "intelligence brief." This is a financial intelligence product that happens to be beautiful, not a luxury brand that happens to have data. Professional personality gives us the density and authority the personas demand, with editorial luxury touches in typography.

**Design Reference**: Think Bloomberg Terminal meets Architectural Digest. The app is Swiss Minimalism (clean, grid-based, functional). The report output layers Trust & Authority on top (gold accents, confidence badges, editorial photography).

---

## Colors

### Primary

| Token | Value | Usage |
|-------|-------|-------|
| `color-primary` | `#0F172A` | Deep navy — primary backgrounds, header bars, nav |
| `color-primary-hover` | `#1E293B` | Hover state for primary elements |
| `color-primary-light` | `#F1F5F9` | Subtle backgrounds, selected states, highlights |

### Accent

| Token | Value | Usage |
|-------|-------|-------|
| `color-accent` | `#CA8A04` | Gold — CTA buttons, confidence ratings, key metrics, report highlights |
| `color-accent-hover` | `#A16207` | Hover state for gold elements |
| `color-accent-light` | `#FEF9C3` | Gold-tinted backgrounds, badge fills |

### Neutrals

Navy-tinted grays (cool undertone, derived from primary `#0F172A`).

| Token | Value | Usage |
|-------|-------|-------|
| `color-background` | `#F8FAFC` | Page background (app) |
| `color-surface` | `#FFFFFF` | Card/panel backgrounds |
| `color-surface-elevated` | `#FFFFFF` | Modals, dropdowns, popovers |
| `color-border` | `#E2E8F0` | Default borders, dividers |
| `color-border-strong` | `#CBD5E1` | Emphasized borders, active input rings |
| `color-text` | `#020617` | Primary text — near-black with navy undertone (≥7:1 on background) |
| `color-text-secondary` | `#475569` | Muted text, labels, metadata (≥4.5:1 on background) |
| `color-text-tertiary` | `#94A3B8` | Placeholders, disabled text (≥3:1 on surface) |
| `color-text-inverse` | `#F8FAFC` | Text on navy/dark backgrounds |

### Semantic

Muted to match the professional palette — not neon.

| Token | Value | Usage |
|-------|-------|-------|
| `color-success` | `#15803D` | Positive indicators, growth metrics, "Strong Buy" |
| `color-warning` | `#B45309` | Caution states, "Monitor" ratings |
| `color-error` | `#B91C1C` | Errors, decline indicators, "High Risk" |

### Report-Specific

These tokens are used in the generated PDF report, not the app UI.

| Token | Value | Usage |
|-------|-------|-------|
| `color-report-bg` | `#FAFAF9` | Report page background (warm white) |
| `color-report-accent-line` | `#CA8A04` | Gold accent lines, section dividers |
| `color-report-pullquote-bg` | `#0F172A` | Dark background for pull quote blocks |
| `color-report-metric-highlight` | `#CA8A04` | Key numbers, percentage callouts |
| `color-report-rating-a` | `#15803D` | A+ / A intelligence ratings |
| `color-report-rating-b` | `#B45309` | B+ / B intelligence ratings |
| `color-report-rating-c` | `#B91C1C` | C+ / C intelligence ratings |
| `color-confidence-fill` | `#0F172A` | Filled confidence dots (●) |
| `color-confidence-empty` | `#E2E8F0` | Empty confidence dots (◯) |
| `color-confidence-half` | `#94A3B8` | Half-filled confidence dots (◐) |

---

## Typography

### Font Families

Two families: an editorial serif for headings + a data-optimized sans for body.

| Token | Value | Usage |
|-------|-------|-------|
| `font-serif` | `'Playfair Display', Georgia, 'Times New Roman', serif` | Headings, report titles, pull quotes |
| `font-sans` | `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | Body text, UI labels, data tables, form inputs |
| `font-mono` | `'JetBrains Mono', 'Fira Code', 'Consolas', monospace` | Code blocks, API references (internal only) |

**Google Fonts Import**:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
```

**Tailwind Config**:
```js
fontFamily: {
  serif: ['Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
}
```

### Font Sizes

| Token | Value | Line Height | Usage |
|-------|-------|-------------|-------|
| `text-xs` | `0.75rem` (12px) | `1rem` | Badges, fine print, report footnotes |
| `text-sm` | `0.875rem` (14px) | `1.25rem` | Labels, metadata, table headers |
| `text-base` | `1rem` (16px) | `1.5rem` | Body text, form inputs |
| `text-lg` | `1.125rem` (18px) | `1.75rem` | Card titles, section subtitles |
| `text-xl` | `1.25rem` (20px) | `1.75rem` | Section headings |
| `text-2xl` | `1.5rem` (24px) | `2rem` | Page headings |
| `text-3xl` | `1.875rem` (30px) | `2.25rem` | Report section titles (Playfair Display) |
| `text-4xl` | `2.25rem` (36px) | `2.5rem` | Report cover title (Playfair Display) |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-light` | `300` | Large display text (report cover, hero numbers) |
| `font-normal` | `400` | Body text |
| `font-medium` | `500` | Labels, emphasis, table headers |
| `font-semibold` | `600` | Headings, buttons, navigation |
| `font-bold` | `700` | Report titles, strong emphasis, key metrics |

### Report Typography Scale

For the PDF report output specifically (print-optimized):

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Report title | Playfair Display | 36px | 700 | `color-primary` |
| Section heading | Playfair Display | 24px | 600 | `color-primary` |
| Subsection heading | Inter | 18px | 600 | `color-text` |
| Body text | Inter | 14px | 400 | `color-text` |
| Metric callout | Inter | 36px | 300 | `color-accent` |
| Pull quote | Playfair Display | 20px | 500 | `color-text-inverse` on `color-report-pullquote-bg` |
| Table header | Inter | 12px | 600 | `color-text-secondary`, uppercase, tracked |
| Table body | Inter | 13px | 400 | `color-text` |
| Footnote/disclaimer | Inter | 10px | 400 | `color-text-tertiary` |

---

## Spacing

**Base unit**: 4px (data-dense professional UI)

| Token | Value | Usage |
|-------|-------|-------|
| `spacing-1` | `4px` | Tight inner gaps (icon-to-text, badge padding) |
| `spacing-2` | `8px` | Small gaps, compact padding, input inner padding |
| `spacing-3` | `12px` | Default inner padding, list item gaps |
| `spacing-4` | `16px` | Card padding, form field gaps |
| `spacing-6` | `24px` | Section padding, card-to-card gaps |
| `spacing-8` | `32px` | Large section gaps |
| `spacing-10` | `40px` | Page section separators |
| `spacing-12` | `48px` | Page margins, major layout gaps |
| `spacing-16` | `64px` | Report page margins (print) |

---

## Border Radius

Professional personality — subtle, not rounded.

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | `4px` | Buttons, inputs, badges, tags |
| `radius-md` | `6px` | Cards, panels, dropdowns |
| `radius-lg` | `8px` | Modals, large containers |
| `radius-full` | `9999px` | Avatars, status indicators, pills |

---

## Shadows

Subtle, cool-toned shadows matching the navy palette.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px 0 rgba(15, 23, 42, 0.05)` | Cards, subtle elevation |
| `shadow-md` | `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)` | Hovered cards, active elements |
| `shadow-lg` | `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)` | Modals, dropdowns, popovers |

---

## Animation

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | `100ms` | Button press, toggle |
| `duration-default` | `200ms` | Hover states, color transitions |
| `duration-slow` | `300ms` | Panel open/close, content transitions |
| `easing-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing (ease-out) |
| `easing-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions (sparingly) |

---

## Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `screen-sm` | `640px` | Mobile → tablet |
| `screen-md` | `768px` | Tablet → desktop |
| `screen-lg` | `1024px` | Desktop → wide |
| `screen-xl` | `1280px` | Wide → ultrawide |

---

## Chart & Data Visualization

Colors for market data visualizations in both the app and the report.

| Token | Value | Usage |
|-------|-------|-------|
| `chart-primary` | `#0F172A` | Primary data series |
| `chart-secondary` | `#334155` | Secondary data series |
| `chart-tertiary` | `#64748B` | Third data series |
| `chart-accent` | `#CA8A04` | Highlighted data, current period |
| `chart-positive` | `#15803D` | Growth, increase, positive trends |
| `chart-negative` | `#B91C1C` | Decline, decrease, negative trends |
| `chart-neutral` | `#94A3B8` | Baseline, historical, inactive |
| `chart-grid` | `#E2E8F0` | Chart gridlines |
| `chart-label` | `#475569` | Axis labels, legend text |

---

## What's Intentionally Missing

| Omitted | Why | Add When |
|---------|-----|----------|
| Dark mode | Report is print-first; app ships light-only for v1 | User demand or v2 |
| Secondary accent color | Gold is sufficient — adding more dilutes the luxury signal | If a feature requires categorical differentiation beyond charts |
| Illustration style tokens | No illustrations in v1; photography and data viz only | If onboarding illustrations are added |
| Motion tokens for report | PDFs are static; animations only matter in app UI | If interactive web-based report viewer is built |

---

## Why These Choices

**Navy + Gold** was chosen because every persona seeks institutional authority, not luxury branding. Navy (`#0F172A`) signals trust and intelligence (Bloomberg, McKinsey) while gold (`#CA8A04`) adds the premium differentiation that separates this from generic analytics tools. The reference report (Naples Intelligence Report) uses a similar dark + gold palette.

**Playfair Display + Inter** bridges two worlds: Playfair gives the editorial luxury feel that makes the report feel like Architectural Digest or Robb Report — the kind of publication agents are proud to hand clients. Inter is the best available sans-serif for data density at small sizes — critical for the market analysis matrices, confidence tables, and segment breakdowns that are the report's substance.

**4px base spacing** reflects the data-dense nature of the product. The report has segment matrices, multi-column comparisons, and monitoring timelines that demand compact layout. The app UI mirrors this density — these are power users, not casual consumers.

---

## How to Use

### In ASCII Mockups (Feature Specs)
```
┌─ Card (bg: surface, radius: md, shadow: sm) ──────────────────┐
│  MARKET INSIGHTS INDEX (font: serif, text: 2xl, weight: bold)  │
│  Four forces shaped 2025... (font: sans, text: base, color:    │
│  text-secondary)                                                │
│                                                                 │
│  ┌─ Metric Card (bg: primary, radius: sm) ─────────────────┐  │
│  │  9.3 (font: sans, text: 4xl, weight: light, color:      │  │
│  │  accent)                                                  │  │
│  │  Liquidity Strength (font: sans, text: sm, color:        │  │
│  │  text-inverse)                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Generate Report (bg: accent, color: primary, radius: sm)]    │
└────────────────────────────────────────────────────────────────┘
```

### In Implementation (Tailwind)
```jsx
<div className="bg-white rounded-md shadow-sm p-4">
  <h2 className="font-serif text-2xl font-bold text-slate-950">
    Market Insights Index
  </h2>
  <p className="font-sans text-base text-slate-600 mt-2">
    Four forces shaped 2025...
  </p>
  <div className="bg-slate-950 rounded-sm p-4 mt-4">
    <span className="font-sans text-4xl font-light text-yellow-600">9.3</span>
    <span className="font-sans text-sm text-slate-100 block">
      Liquidity Strength
    </span>
  </div>
  <button className="bg-yellow-600 hover:bg-yellow-700 text-slate-950
                      font-sans font-semibold rounded-sm px-4 py-2 mt-4">
    Generate Report
  </button>
</div>
```

### In Implementation (CSS Variables)
```css
:root {
  /* Colors */
  --color-primary: #0F172A;
  --color-primary-hover: #1E293B;
  --color-primary-light: #F1F5F9;
  --color-accent: #CA8A04;
  --color-accent-hover: #A16207;
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text: #020617;
  --color-text-secondary: #475569;
  --color-text-inverse: #F8FAFC;
  --color-success: #15803D;
  --color-warning: #B45309;
  --color-error: #B91C1C;

  /* Typography */
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', -apple-system, sans-serif;

  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08);
}
```
