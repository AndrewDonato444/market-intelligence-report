---
feature: Persona Content in PDF Template
domain: buyer-personas
source: lib/pdf/templates/renderers.tsx
tests:
  - __tests__/pdf/persona-intelligence-pdf.test.tsx
components:
  - PersonaIntelligencePdf
  - PersonaCardPdf
  - TalkingPointPdf
  - BlendedInsightsPdf
  - PersonaFramingCallout
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Persona Content in PDF Template

**Source Files**: `lib/pdf/templates/renderers.tsx`, `lib/pdf/styles.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/established-practitioner.md`, `.specs/personas/team-leader.md`
**Depends On**: Feature #50 (Report Template Engine), Feature #92 (Persona Intelligence Agent), Feature #93 (Multi-Persona Output Strategy — hybrid approach)

## Feature: Persona Content in PDF Template

Renders the Persona Intelligence Agent's output in the PDF report. Based on the hybrid strategy decided in feature #93, this involves two rendering surfaces:

1. **Section 10: "Persona Intelligence Briefing"** — a dedicated section that renders the full per-persona playbook (talking points, narrative overlays, metric emphasis, vocabulary guides) and blended content when 2+ personas are selected. This is the agent's persona playbook — the content they use in client conversations.

2. **PersonaFraming callouts** — subtle callout boxes injected into narrative sections (1, 5, 6, 8) when personaFraming data is present. These show the primary persona's perspective and emphasis without disrupting the section's core content.

**Why this matters to our users**: Alex (Rising Star) uses the talking points verbatim in listing presentations to sound fluent in HNWI vocabulary. Jordan (Established Practitioner) uses the narrative overlays to frame advisory conversations with conviction. Taylor (Team Leader) uses the per-persona playbooks to train team members on how to present to different buyer types.

### Scenario: PersonaIntelligencePdf renderer is registered in RENDERER_MAP
Given the persona_intelligence section type
When getSectionRenderer("persona_intelligence") is called
Then it returns PersonaIntelligencePdf (not GenericSectionPdf)

### Scenario: Section 10 renders persona cards for each selected persona
Given a persona_intelligence section with 2 personas (Business Mogul, Coastal Escape Seeker)
When rendered in PDF
Then it shows a persona card for each persona, ordered by selectionOrder
And each card displays the persona name as a subheading
And the primary persona (selectionOrder=1) card has a gold accent line to distinguish it
And secondary persona cards have a standard border

### Scenario: Persona card renders talking points with headline and detail
Given a PersonaContent with 5 talking points
When the persona card is rendered
Then each talking point shows a bold headline (font: sans, text-sm, weight: semibold)
And each talking point shows detail text below (font: sans, text: body)
And each talking point shows a data source tag in small text (font: sans, text-xs, color: text-secondary)
And talking points are separated by spacing-3

### Scenario: Persona card renders narrative overlay
Given a PersonaContent with narrativeOverlay { perspective, emphasis, deEmphasis, toneGuidance }
When the persona card is rendered
Then it shows a "Narrative Lens" subsection
And the perspective statement is displayed as body text
And emphasis items are listed as bullet points with a green dot indicator
And de-emphasis items are listed as bullet points with a gray dot indicator
And tone guidance is displayed in italic body text

### Scenario: Persona card renders metric emphasis table
Given a PersonaContent with 4 metricEmphasis entries
When the persona card is rendered
Then it shows a "Key Metrics" subsection with a compact table
And each row shows metricName, currentValue, and interpretation
And primary-priority metrics have bold text
And secondary-priority metrics have standard text

### Scenario: Persona card renders vocabulary guide
Given a PersonaContent with vocabulary { preferred: [...], avoid: [...] }
When the persona card is rendered
Then it shows a "Vocabulary Guide" subsection
And preferred terms are displayed as tags in a row (bg: primary-light, radius: sm)
And avoid terms are displayed as tags in a row with strikethrough styling (bg: surface, border: error)

### Scenario: Blended insights render when 2+ personas selected
Given a persona_intelligence section with blended content (2+ personas)
When rendered in PDF
Then a "Blended Intelligence" subsection appears after the persona cards
And it shows blended talking points (max 7) in the same format as per-persona talking points
And it shows the metric union list
And it shows the filter intersection summary (price range, property types, community types)

### Scenario: Blended conflicts are displayed as secondary context
Given blended content with 2 conflicts (metric emphasized by one persona, de-emphasized by another)
When the blended section is rendered
Then each conflict shows the metric name, which persona emphasizes it, and which de-emphasizes it
And the resolution text is shown in italic
And conflicts use a warning-tinted background (color-accent-light)

### Scenario: Section 10 is omitted when no persona content exists
Given a report with no persona_intelligence section (legacy report, no personas selected)
When the PDF is rendered
Then the Table of Contents does not list Section 10
And no persona intelligence page is generated
And all other sections render normally

### Scenario: PersonaFraming callout renders in narrative sections
Given Section 1 (executive_briefing) has personaFraming with personaName and perspective
When the section is rendered in PDF
Then a callout box appears at the bottom of the section content
And the callout has a subtle background (color: primary-light)
And it shows "Persona Lens: {personaName}" as a label (font: sans, text-xs, weight: semibold, color: accent)
And it shows the perspective text (font: sans, text: body-small)
And it shows emphasis items as comma-separated tags

### Scenario: PersonaFraming callout is absent when personaFraming is null
Given Section 5 (the_narrative) has personaFraming: null
When the section is rendered
Then no persona callout box appears
And the section renders identically to a report without persona intelligence

### Scenario: PersonaFraming callout appears in all four eligible sections
Given sections 1, 5, 6, and 8 all have personaFraming data
When the full PDF is rendered
Then each of the four sections shows a persona callout box
And all callouts reference the same primary persona name

### Scenario: Single persona report shows no blended section
Given a persona_intelligence section with exactly 1 persona and blended: null
When rendered
Then it shows one persona card with full content
And no "Blended Intelligence" subsection appears

### Scenario: Section 10 page title uses Playfair Display heading
Given a persona_intelligence section
When rendered via SectionPage
Then the page heading reads "Persona Intelligence Briefing" (font: serif, text: 2xl, weight: bold, color: primary)
And a gold accent line appears below the heading (2pt, color: accent)

### Scenario: Talking point data source links to computed analytics
Given a talking point with dataSource "yoy.volumeChange"
When rendered
Then the data source tag shows "Source: YoY Volume Change" (humanized from the key)
And it is styled as a subtle label (font: sans, text-xs, color: text-tertiary)

## User Journey

1. Agent selects 1-3 buyer personas in report builder wizard (feature #91)
2. Pipeline generates report with persona intelligence (features #92, #93)
3. Agent clicks "Export PDF" or "Preview"
4. **PDF renderer processes Section 10 with PersonaIntelligencePdf (this feature)**
5. **Narrative sections 1, 5, 6, 8 render PersonaFraming callouts (this feature)**
6. Agent receives a PDF with persona-tailored playbook content
7. Agent uses talking points in client conversations, references metric emphasis in presentations

## UI Mockup

### Section 10: Persona Intelligence Briefing (full page)

```
┌─ Page (bg: report-bg, padding: spacing-16) ──────────────────────────────┐
│                                                                           │
│  Persona Intelligence Briefing                                            │
│  (font: serif, text: 2xl, weight: bold, color: primary)                  │
│  ─────────────── (accent line: 2pt, color: accent, width: 48px)          │
│                                                                           │
│  ┌─ Persona Card (bg: surface, border-left: 3pt accent, radius: sm) ──┐ │
│  │  THE BUSINESS MOGUL (font: serif, text: lg, color: primary)         │ │
│  │  PRIMARY PERSONA (font: sans, text-xs, color: accent, weight: bold) │ │
│  │                                                                      │ │
│  │  TALKING POINTS                                                      │ │
│  │  (font: sans, text-xs, weight: semibold, color: text-secondary,     │ │
│  │   uppercase, tracked)                                                │ │
│  │                                                                      │ │
│  │  Ultra-luxury volume surged 23% YoY                                  │ │
│  │  (font: sans, text-sm, weight: semibold)                             │ │
│  │  The $10M+ segment saw 47 transactions in 2025, up from 38          │ │
│  │  in 2024. Cash buyers drove 87% of closings, signaling strong       │ │
│  │  institutional confidence in waterfront assets.                      │ │
│  │  (font: sans, text: body)                                            │ │
│  │  Source: YoY Volume Change                                           │ │
│  │  (font: sans, text-xs, color: text-tertiary)                        │ │
│  │                                                                      │ │
│  │  Waterfront premium commands 34% over non-waterfront                 │ │
│  │  (font: sans, text-sm, weight: semibold)                             │ │
│  │  ...detail text...                                                   │ │
│  │  Source: Waterfront Premium Index                                    │ │
│  │                                                                      │ │
│  │  ──────── (divider: border, 1pt)                                    │ │
│  │                                                                      │ │
│  │  NARRATIVE LENS                                                      │ │
│  │  (font: sans, text-xs, weight: semibold, color: text-secondary)     │ │
│  │  Frame all insights through capital allocation and total return.     │ │
│  │  (font: sans, text: body)                                            │ │
│  │                                                                      │ │
│  │  Emphasize:   ● CAGR  ● Price/SqFt  ● Cash %  ● DOM vs Price      │ │
│  │  (● = color: success)                                                │ │
│  │  De-emphasize: ○ Lifestyle  ○ Design                                │ │
│  │  (○ = color: text-tertiary)                                          │ │
│  │                                                                      │ │
│  │  Tone: Direct, data-forward, institutional language                  │ │
│  │  (font: sans, text: body-small, style: italic)                      │ │
│  │                                                                      │ │
│  │  ──────── (divider: border, 1pt)                                    │ │
│  │                                                                      │ │
│  │  KEY METRICS                                                         │ │
│  │  ┌────────────────────┬────────────┬──────────────────────────────┐ │ │
│  │  │ Metric             │ Value      │ Interpretation               │ │ │
│  │  │ (text-xs, semibold)│ (text-xs)  │ (text-xs)                    │ │ │
│  │  ├────────────────────┼────────────┼──────────────────────────────┤ │ │
│  │  │ CAGR by Micro-Mkt  │ 8.4%       │ Outpacing S&P — alpha play  │ │ │
│  │  │ Price/SqFt Trends  │ $1,247     │ 12% YoY — compression risk  │ │ │
│  │  │ DOM vs Sold Price  │ 34 / 97%   │ Tight market — leverage low  │ │ │
│  │  └────────────────────┴────────────┴──────────────────────────────┘ │ │
│  │                                                                      │ │
│  │  ──────── (divider: border, 1pt)                                    │ │
│  │                                                                      │ │
│  │  VOCABULARY GUIDE                                                    │ │
│  │  Use:  [basis] [alpha] [total return] [cap rate] [liquidity]        │ │
│  │  (bg: primary-light, radius: sm, text-xs)                           │ │
│  │  Avoid: [dream home] [cozy] [charming] [starter]                   │ │
│  │  (bg: surface, border: error, text-xs, strikethrough)               │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─ Persona Card (bg: surface, border: border, radius: sm) ────────────┐ │
│  │  THE COASTAL ESCAPE SEEKER (font: serif, text: lg, color: primary)  │ │
│  │                                                                      │ │
│  │  [Same structure as above — talking points, narrative lens,          │ │
│  │   key metrics, vocabulary guide — with persona-specific content]     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─ Blended Intelligence (bg: accent-light, radius: sm, padding: 16) ─┐ │
│  │  BLENDED INTELLIGENCE                                                │ │
│  │  (font: serif, text: lg, color: primary)                             │ │
│  │                                                                      │ │
│  │  COMBINED TALKING POINTS (max 7)                                     │ │
│  │  [Same talking point format as above]                                │ │
│  │                                                                      │ │
│  │  METRIC UNION                                                        │ │
│  │  Combined metrics from all selected personas:                        │ │
│  │  CAGR • Price/SqFt • Cash % • Waterfront Premium • Furnished %     │ │
│  │                                                                      │ │
│  │  FILTER OVERLAP                                                      │ │
│  │  Price: $8M–$25M  |  Types: Single Family, Estate                   │ │
│  │  Communities: Waterfront, Golf                                       │ │
│  │                                                                      │ │
│  │  ⚠ CONFLICTS                                                        │ │
│  │  (bg: accent-light, border-left: 2pt, color: warning)               │ │
│  │  "Days on Market" — emphasized by Business Mogul,                    │ │
│  │  de-emphasized by Coastal Escape Seeker.                             │ │
│  │  Resolution: Included as secondary context.                          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─ Footer (fixed) ────────────────────────────────────────────────────┐ │
│  │  Naples Intelligence Report — Knox Brothers          12 / 14        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### PersonaFraming Callout (in narrative sections 1, 5, 6, 8)

```
┌─ Section Content (existing) ──────────────────────────────────────────────┐
│                                                                           │
│  ...existing section narrative text...                                    │
│  ...existing highlights, tables, etc...                                   │
│                                                                           │
│  ┌─ Persona Callout (bg: primary-light, radius: sm, padding: 12,      ┐ │
│  │   margin-top: 16)                                                    │ │
│  │                                                                      │ │
│  │  PERSONA LENS: THE BUSINESS MOGUL                                    │ │
│  │  (font: sans, text-xs, weight: semibold, color: accent)             │ │
│  │                                                                      │ │
│  │  Frame this section through capital allocation and ROI.              │ │
│  │  Emphasize CAGR, price/sqft trends, and cash transaction dominance. │ │
│  │  (font: sans, text: body-small, color: text-secondary)              │ │
│  │                                                                      │ │
│  │  Focus: CAGR • Price/SqFt • Cash % • DOM                           │ │
│  │  (font: sans, text-xs, color: text-secondary)                       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

## Implementation Notes

### Files to Create/Modify

1. **`lib/pdf/templates/renderers.tsx`** — Add PersonaIntelligencePdf renderer + register in RENDERER_MAP
2. **`lib/pdf/styles.ts`** — Add styles for persona cards, talking points, vocabulary tags, callout boxes
3. **`lib/pdf/templates/renderers.tsx`** — Modify existing narrative section renderers (ExecutiveSummaryPdf, NarrativeSectionPdf) to render PersonaFraming callout when present
4. **`__tests__/pdf/persona-intelligence-pdf.test.tsx`** — Tests for all scenarios

### Content Type Interfaces

```typescript
// PersonaIntelligencePdf receives this as section.content
interface PersonaIntelligenceContent {
  strategy: "hybrid";
  personas: PersonaContent[];
  blended: BlendedContent | null;
  meta: {
    personaCount: number;
    primaryPersona: string;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
  };
}

// PersonaFraming is already defined in report-assembler output
interface PersonaFraming {
  personaName: string;
  perspective: string;
  emphasis: string[];
  deEmphasis: string[];
  toneGuidance: string;
}
```

### Style Tokens Used

| Element | Token(s) |
|---------|----------|
| Page background | `color-report-bg` (#FAFAF9) |
| Persona card | `color-surface`, `color-border`, `radius-sm` |
| Primary persona accent | `color-accent` (gold left border) |
| Talking point headline | `font-sans`, `text-sm`, `font-semibold` |
| Talking point body | `font-sans`, body (10pt), `color-text` |
| Data source tag | `font-sans`, `text-xs`, `color-text-tertiary` |
| Emphasis dots | `color-success` (green), `color-text-tertiary` (gray for de-emphasis) |
| Vocabulary "use" tags | `color-primary-light` bg, `radius-sm` |
| Vocabulary "avoid" tags | `color-surface` bg, `color-error` border |
| Metric table | Standard table styles (tableRow, tableHeader, tableCell) |
| Blended section | `color-accent-light` bg |
| Conflict box | `color-warning` left border |
| Persona callout | `color-primary-light` bg, `radius-sm` |
| Callout label | `font-sans`, `text-xs`, `color-accent`, `font-semibold` |

### React-PDF Rendering Considerations

- **Page breaks**: Section 10 may span multiple pages for 3 personas + blended content. Use `<View wrap={false}>` on individual persona cards to prevent mid-card breaks. Allow page break between cards.
- **Conditional rendering**: Entire Section 10 is conditional on section existence. PersonaFraming callout is conditional on `personaFraming !== null`.
- **Existing renderers**: ExecutiveSummaryPdf, NarrativeSectionPdf already exist. Add PersonaFraming rendering at the bottom of their output, guarded by null check.
- **No new pages**: PersonaFraming callouts are inline within existing section pages, not separate pages.

## Component References

- Card: `.specs/design-system/components/card.md` (persona card)
- Badge: (inline vocabulary tag — no standalone component doc needed)
- Table: (reuses existing table styles from styles.ts)

## Persona Revision Notes

**Reviewed through user persona lenses**:

- **Rising Star Agent (Alex)**: Alex will flip directly to Section 10 after receiving the PDF. The per-persona talking points are Alex's "executive briefing" preparation tool — ready-made conversation starters backed by real metrics. The vocabulary guide tells Alex exactly which words to use with Business Mogul clients ("basis," "alpha," "total return") and which to avoid ("dream home," "cozy"). Alex calls this "the cheat sheet." The gold accent on the primary persona card immediately signals which buyer type drives the conversation. Alex's word: "credibility" — this section delivers it.

- **Established Practitioner (Jordan)**: Jordan values the narrative overlay most — "Frame all insights through capital allocation and total return" is the advisory perspective Jordan has always delivered intuitively but can now show explicitly. The metric emphasis table gives Jordan conviction: "I can point to CAGR by micro-market and say with authority that this neighborhood outperforms." Jordan will use the PersonaFraming callouts in sections 1, 5, 6, 8 as reading guides — they tell Jordan how to reinterpret the core analysis for specific client conversations. Jordan's word: "conviction."

- **Team Leader (Taylor)**: Taylor sees Section 10 as a team training document. The structured format — talking points, narrative lens, key metrics, vocabulary guide — is a "persona playbook" that any team member can follow. When a new agent asks "how do I present to a family office client?", Taylor points to the Legacy Builder persona card. The blended section addresses Taylor's concern about consistency: when two agents select the same personas, they get the same quality output. Taylor's word: "scalable."

**Vocabulary adjustments made**: Used "talking points" (agent vocabulary, not "conversation starters"). Used "playbook" (Taylor's vocabulary). Used "executive briefing" (Alex's vocabulary). Used "conviction" (Jordan's vocabulary). Used "persona lens" (not "buyer filter" — matches the advisory framing). Section title "Persona Intelligence Briefing" matches the naming in feature #93.

## Learnings

### 2026-03-10
- **Decision**: PersonaFramingCallout lives at SectionPage level, not inside individual renderers. The callout checks `section.content.personaFraming` existence and renders after the main renderer output. This keeps the 4 eligible sections (1, 5, 6, 8) clean — they don't need to know about persona framing.
- **Pattern**: `humanizeDataSource()` splits on dots, special-cases "yoy" → "YoY", then applies camelCase→space→Title Case to each segment. Handles real pipeline keys like "yoy.volumeChange" → "YoY Volume Change".
- **Gotcha**: With 2+ personas rendered, text like "CAGR" appears in talking points, metric emphasis tables, emphasis lists, and vocabulary — causing `getByText` to throw on multiple matches. Use `getAllByText().length > 0` for presence assertions.
- **Pattern**: Persona cards sort by `selectionOrder` before rendering. Primary persona (order=1) gets gold left border accent + "PRIMARY PERSONA" label. Secondary personas get standard border only.
- **Pattern**: Blended section only renders when `content.blended !== null` — single-persona reports skip it cleanly with no conditional logic in the caller.
