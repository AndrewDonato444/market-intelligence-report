---
feature: PDF Report Formatting & Flow Rules
domain: report-template
source: lib/pdf/templates/section-page.tsx
tests:
  - __tests__/pdf/pdf-formatting-flow.test.tsx
components:
  - SectionPage
  - renderers
design_refs:
  - lib/pdf/styles.ts
  - lib/pdf/document.tsx
  - lib/pdf/templates/renderers.tsx
personas:
  - report-reader
  - anti-persona-report
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# PDF Report Formatting & Flow Rules

**Source Files**: `lib/pdf/templates/section-page.tsx`, `lib/pdf/templates/renderers.tsx`, `lib/pdf/document.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/report-reader.md`

## Context

The report PDF is the flagship deliverable — the thing the agent opens in a listing presentation. When sections cut off mid-sentence, cards leave half-pages blank, or empty sections render as orphaned titles, the report instantly loses the "institutional research" feel that the Report Reader persona demands. As the persona spec says: *"Thin sections with padding"* and *"Blank/N/A fields"* kill credibility.

This spec defines formatting rules that make the PDF flow like an editorial publication, not a concatenation of database dumps.

---

## Problem Analysis

### Root Cause 1: Blank Sections
The `document.tsx` renders ALL sections from `reportData.sections` without checking if content is substantive. If a section has an empty narrative, zero themes, or null arrays, the renderer still outputs a page with a title + accent line and nothing below it. This is the most visible credibility killer.

### Root Cause 2: Content Cut-off & Orphaned Headers
- `wrap={false}` on cards means if a card is taller than remaining page space, it jumps to the next page — leaving a large blank gap on the previous page.
- `minPresenceAhead={120}` only exists on the section title in `section-page.tsx`. Subheadings inside renderers (e.g., "Projections", "Scenarios", "Talking Points") have NO orphan protection — they can appear at the very bottom of a page with zero content below.
- No `break` prop strategy for logical content groups (heading + first item should stay together).

### Root Cause 3: No Content-Aware Page Distribution
Long sections (e.g., Persona Intelligence with 2+ persona cards) can produce 4-5 pages of content after a section title, but short sections (e.g., Forward Look with one paragraph) produce a page that's 80% whitespace. There's no mechanism to balance this.

---

## Feature: PDF Formatting & Flow Rules

### Scenario: Empty sections are omitted from the PDF
Given a report with sections where some have no substantive content
When the PDF is generated
Then sections with empty or null content are excluded entirely
And no page is rendered with just a title and accent line
And the Table of Contents reflects only included sections

### Scenario: Section content emptiness is checked per type
Given a section of type "the_narrative"
When the content has a null or empty-string narrative AND zero themes
Then the section is considered empty and omitted
Given a section of type "executive_briefing"
When the content has valid headline metrics (medianPrice > 0, totalProperties > 0)
Then the section is considered substantive and included

### Scenario: Subheadings stay with their first content item
Given a renderer outputs a subheading (e.g., "Projections", "Scenarios", "Peer Markets")
When the subheading would render at the bottom of a page with less than 80pt remaining
Then the subheading moves to the next page along with its first content item
And no subheading appears orphaned at the bottom of a page

### Scenario: Cards that jump pages don't leave excessive blank space
Given a card with `wrap={false}` that is 200pt tall
When only 100pt of space remains on the current page
Then the card moves to the next page
And the previous page's remaining space is acceptable (less than 30% of usable height)

### Scenario: Long narrative text wraps across pages cleanly
Given a narrative paragraph that is 800pt tall (exceeding one page)
When the paragraph renders
Then the text wraps naturally across pages with consistent line height
And no line of text is clipped at a page boundary
And the paragraph is NOT set to `wrap={false}`

### Scenario: Table rows stay with their header
Given a table with a header row and data rows
When the table header would render at the bottom of a page
Then the header moves to the next page with at least 2 data rows
And no table header appears orphaned without data below it

### Scenario: Section title pages have minimum content density
Given a section page renders with a title, accent line, and content
When the content below the title is less than 120pt tall
Then the section is either:
  - Combined with the next section on the same page (if both fit), OR
  - The short content is rendered normally (no blank padding added)
And no section page is more than 70% whitespace

### Scenario: Persona Intelligence cards use page breaks effectively
Given a PersonaIntelligencePdf section with 3 persona cards
When each card is approximately 350pt tall
Then each card starts on a fresh page if it won't fit on the current page
And the blended intelligence section follows the last persona card naturally
And no card is split across pages

### Scenario: Footer renders consistently on all pages
Given any page in the report (cover excluded)
When the page renders
Then the footer appears at the same vertical position (bottom: 32pt)
And the footer shows the report title and page number
And footer content does not overlap with section content

---

## Emptiness Rules Per Section Type

These define when a section is "empty" and should be omitted:

| Section Type | Empty When |
|---|---|
| `executive_briefing` | `headline.totalProperties === 0` |
| `market_insights_index` | No metrics or all metrics are null/zero |
| `luxury_market_dashboard` | `segments` array is empty or null |
| `neighborhood_intelligence` | `neighborhoods` array is empty or null |
| `the_narrative` | `narrative` is null/empty AND `themes` is empty/null |
| `forward_look` | `scenarios` is null AND `projections` is empty |
| `comparative_positioning` | `peerMarkets` is empty or null |
| `disclaimer_methodology` | NEVER empty — always include |
| `persona_intelligence` | `personas` array is empty |
| `market_overview` (v1) | `narrative` is null/empty AND `highlights` is empty |
| `key_drivers` (v1) | `themes` is empty or null |
| `forecasts` (v1) | `projections` is empty AND `scenarios` is null |

---

## Flow Rules (react-pdf implementation)

### Rule 1: Orphan Protection
Every `<Text style={styles.subheading}>` inside a renderer MUST be wrapped in a `<View minPresenceAhead={80}>` to guarantee at least one content item follows on the same page.

### Rule 2: Logical Grouping
Content that forms a logical unit (subheading + first card, table header + first 2 rows) should be wrapped in `<View wrap={false}>` IF the group is ≤ 250pt tall. Groups taller than 250pt should use `wrap={true}` to avoid pushing to the next page and leaving gaps.

### Rule 3: Card Height Discipline
Cards using `wrap={false}` should be designed to fit within 300pt (roughly 45% of usable page height). If a card's content is variable-length (e.g., talking points, long narratives), it should use `wrap={true}` instead with `minPresenceAhead` on its header.

### Rule 4: Section Filtering
`document.tsx` must run an emptiness check on each section BEFORE rendering. The check function uses the per-type rules above. Filtered sections must also be excluded from `TableOfContents`.

### Rule 5: No JSON Dump
The `GenericSectionPdf` fallback currently renders `JSON.stringify(content)`. For a customer-facing report, unknown section types should be omitted entirely rather than showing raw JSON.

---

## UI Mockup

### Current (broken) page flow:
```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ Section 3: Narrative │   │ Section 4: Forward   │   │ Section 5: Comps    │
│ ────────            │   │ ────────             │   │ ────────            │
│                     │   │                      │   │                     │
│ [paragraph text     │   │ [one short paragraph]│   │                     │
│  that fills 60%     │   │                      │   │ [card jumped here   │
│  of the page]       │   │                      │   │  from prev page]    │
│                     │   │                      │   │                     │
│ ┌─────────────────┐ │   │                      │   │                     │
│ │ Theme card that  │ │   │   ~70% blank space   │   │                     │
│ │ doesn't fit here │ │   │                      │   │                     │
│ │ JUMPS TO NEXT → │ │   │                      │   │                     │
│ └─────────────────┘ │   │                      │   │                     │
│                     │   │                      │   │                     │
│  ~35% blank gap     │   │                      │   │                     │
│                     │   │                      │   │                     │
│ ─── footer ───────  │   │ ─── footer ───────   │   │ ─── footer ───────  │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

### Target (fixed) page flow:
```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ Section 3: Narrative │   │                      │   │ Section 5: Comps    │
│ ────────            │   │ Theme 2 (cont'd)     │   │ ────────            │
│                     │   │ [fits naturally]      │   │                     │
│ [paragraph text     │   │                      │   │ Peer Markets        │
│  that fills 60%     │   │ Theme 3              │   │ ┌─────────────────┐ │
│  of the page]       │   │ ┌─────────────────┐  │   │ │ Market A        │ │
│                     │   │ │ [card content]   │  │   │ │ [content]       │ │
│ Theme 1             │   │ └─────────────────┘  │   │ └─────────────────┘ │
│ ┌─────────────────┐ │   │                      │   │ ┌─────────────────┐ │
│ │ [card content   │ │   │ Section 4: Forward   │   │ │ Market B        │ │
│ │  fits here]     │ │   │ ────────             │   │ │ [content]       │ │
│ └─────────────────┘ │   │ [paragraph — dense,  │   │ └─────────────────┘ │
│                     │   │  no wasted space]    │   │                     │
│ Theme 2             │   │                      │   │                     │
│ ┌───────────────    │   │                      │   │                     │
│ │ [starts here,    │   │                      │   │                     │
│ ─── footer ───────  │   │ ─── footer ───────   │   │ ─── footer ───────  │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘

Section 4 (Forward Look) no longer gets its own mostly-blank page.
Empty sections are gone. Cards flow naturally.
```

---

## Component References

- SectionPage: `lib/pdf/templates/section-page.tsx`
- Renderers: `lib/pdf/templates/renderers.tsx`
- Document: `lib/pdf/document.tsx`
- Styles: `lib/pdf/styles.ts`
- TableOfContents: `lib/pdf/templates/table-of-contents.tsx`
- InsightsIndex: `lib/pdf/templates/insights-index.tsx`

---

## User Journey

1. Agent generates a market intelligence report (pipeline completes)
2. Agent clicks "Download PDF" or PDF is auto-generated
3. **This feature** — PDF renders with clean flow, no blank sections, no cutoffs
4. Agent opens PDF in a listing presentation — every page earns its place

---

## Implementation Notes

### Priority Order
1. **Section filtering** (Rule 4) — biggest impact, removes blank sections
2. **Kill GenericSectionPdf JSON dump** (Rule 5) — prevents customer-facing JSON
3. **Orphan protection on subheadings** (Rule 1) — fixes most cutoff issues
4. **Card height discipline** (Rule 3) — fixes persona cards and long content
5. **Logical grouping** (Rule 2) — polish pass for remaining edge cases

### Key Decision: Section Page Breaks
Currently each section gets its own `<Page>`. This means short sections always start a new page, creating whitespace. Two options:

**Option A: Keep per-section pages** — simpler, each section starts fresh. Accept some whitespace on short sections. Focus on filtering empties.

**Option B: Continuous flow** — remove per-section `<Page>` breaks, let content flow continuously with section titles using `break` prop only when needed. Denser but harder to implement and test.

Recommendation: **Option A** for v1 of this feature. Per-section pages are easier to reason about and match the "editorial" feel (like chapters in a book). Filter empties and fix orphans within that model.

---

## Learnings

(To be filled after implementation)
