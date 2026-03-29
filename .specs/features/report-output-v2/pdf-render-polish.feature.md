---
feature: PDF Render Polish
domain: report-output-v2
source: lib/pdf/styles.ts
tests:
  - __tests__/pdf/pdf-render-polish.test.tsx
components:
  - CoverPage
  - TableOfContents
  - InsightsIndex
  - SectionPage
  - HorizontalBarChart
  - SegmentMatrix
  - TrendIndicator
  - RatingBadge
  - ConfidenceDots
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# PDF Render Polish

**Source Files**:
- `lib/pdf/styles.ts` (design token styles)
- `lib/pdf/fonts.ts` (font registration + hyphenation)
- `lib/pdf/document.tsx` (document root)
- `lib/pdf/components/data-viz.tsx` (charts, badges, indicators)
- `lib/pdf/templates/cover-page.tsx`
- `lib/pdf/templates/table-of-contents.tsx`
- `lib/pdf/templates/insights-index.tsx`
- `lib/pdf/templates/section-page.tsx`
- `lib/pdf/templates/metadata-page.tsx`
- `lib/pdf/templates/renderers.tsx`

**Design System**: .specs/design-system/tokens.md
**Personas**: rising-star-agent, established-practitioner

## Problem

The PDF output is functionally correct but lacks the visual polish expected by luxury real estate agents presenting to HNWIs and wealth managers. Specific issues:
- Sparse pages (TOC, Neighborhood Intelligence) have large empty areas
- Inconsistent padding across card components
- Body text hyphenation disabled globally (breaks body text readability)
- Subheading line height too tight for scannability
- Numeric columns left-aligned instead of right-aligned in tables
- Trend arrows lack color-coded backgrounds for at-a-glance reading
- Badge border-radius inconsistent
- Cover page contact info not clickable (mailto/tel)
- No luminance check when injecting user brand colors
- Redundant confidence data appearing in multiple places
- Persona and blended intelligence sections lack proper page structure
- MetadataPage redundant given Insights Index already shows key metadata

---

## Work Packages

This feature is organized into 5 work packages. Each can be implemented and tested separately.

---

## WP1: Layout & Spacing

### Scenario: TOC page fills vertical space with branded footer rule
Given a report PDF with a Table of Contents page
When the TOC has fewer than 10 sections
Then a branded accent line (gold, 48pt wide, 1pt tall) renders at the bottom of the content area
And the line is pushed to the bottom using `flexGrow: 1` on a spacer View

### Scenario: Card padding is consistent across all card-like components
Given any card-like component in the PDF (card, persona card, metric card)
When the card renders
Then the padding is 16pt on all sides (matching `styles.card`)
And the executive briefing persona callout has 16pt padding (up from 12pt)

### Scenario: Table rows have adequate vertical padding
Given a table in the Luxury Market Dashboard or Neighborhood Intelligence section
When the table renders
Then each row has `paddingVertical: 8` (up from 6)
And the header row has `paddingBottom: 8` (up from 6)

### Scenario: Section pages use minPresenceAhead to prevent orphaned headers
Given any section page with a subsection heading
When the heading would render near the bottom of a page
Then `minPresenceAhead={80}` prevents the heading from being orphaned
(Note: already done for some — ensure all subsection headings have this)

---

## WP2: Typography & Text

### Scenario: Body text uses word-level hyphenation for Inter font
Given a paragraph of body text in the PDF
When the text wraps across lines
Then Inter font uses word-level hyphenation (not the current no-op callback)
And Playfair Display headings still disable hyphenation (no mid-word breaks)

**Technical note**: Change `fonts.ts` to register a real hyphenation callback for Inter only. Playfair Display keeps the current `(word) => [word]` callback. React-PDF's `Font.registerHyphenationCallback` is global — we'll need to handle this per-font by registering the callback conditionally or using the `hyphenationCallback` prop.

### Scenario: Subheadings have improved line height
Given a subheading element in the PDF
When the subheading renders
Then it uses `lineHeight: 1.3` (currently implicit, defaults vary)
And the font weight is 700 (bold) for Playfair Display subheadings

### Scenario: Bullet lists have proper indentation hierarchy
Given a bulleted list in the PDF (highlights, recommendations, persona talking points)
When the list renders
Then top-level bullets have `paddingLeft: 12` (current)
And nested bullets (if any) have `paddingLeft: 24` (12 + 12)
And bullet dots are consistently 10pt Inter

### Scenario: Special characters render correctly
Given text containing em dashes, arrows, or score fractions
When the text renders
Then em dashes use the proper Unicode character U+2014 (—)
And trend arrows (up/down/right) are consistently sized at 8pt
And trend arrows are colored: green (up = success), red (down = error), gray (right = secondary)

---

## WP3: Data Visualization & Tables

### Scenario: Numeric table columns are right-aligned
Given a table with numeric values (prices, percentages, counts)
When the table renders
Then numeric columns (Count, Median Price, YoY) use `textAlign: "right"`
And text columns (Segment, Name) remain `textAlign: "left"`

### Scenario: Table rows use thin horizontal dividers
Given a table in the PDF
When the table renders
Then rows are separated by 1pt lines in `COLORS.border` (#E2E8F0)
And the header row has a 2pt bottom border (current — unchanged)
And alternating row backgrounds remain (current zebra striping)

### Scenario: Trend indicators have tinted backgrounds
Given a trend indicator (YoY changes, impact badges)
When the trend value is positive (up)
Then the indicator has a faint green background (`#F0FDF4`)
When the trend value is negative (down)
Then the indicator has a faint red background (`#FEF2F2`)
When the trend is flat/neutral
Then the indicator has no background tint

### Scenario: Badge border-radius is consistent at 4pt
Given any badge element (rating badge, impact badge, vocab tag)
When the badge renders
Then it has `borderRadius: 4` consistently
And `paddingHorizontal: 8` and `paddingVertical: 3` for comfortable sizing

### Scenario: Cover page theme dots are consistently sized
Given the Key Themes section on the cover page
When theme dots render
Then all dots are `width: 6, height: 6, borderRadius: 3` (current — verify consistency)
And dot colors match impact: high=green, medium=warning, low=gray

### Scenario: Property Type Split renders as mini bar chart
Given a dashboard section with property type distribution data
When the property type split contains multiple types (e.g., SFR: 143, CONDO: 29)
Then each type renders as a proportional horizontal bar
And bars use brand palette colors (navy, slate, gray, gold rotation)
And labels show type name + count to the right of each bar

---

## WP4: Accessibility, Interactivity & Brand Safety

### Scenario: Cover page contact info is clickable
Given the cover page has agent email and/or phone number
When the PDF is viewed in a digital reader
Then the email is wrapped in a `<Link src="mailto:...">` component
And the phone is wrapped in a `<Link src="tel:...">` component

### Scenario: Brand color injection checks luminance
Given a user has custom brand colors
When the primary brand color is injected as a background
Then text on that background uses a luminance-aware contrast color
And the contrast check uses relative luminance formula: `(0.299*R + 0.587*G + 0.114*B) / 255`
If luminance > 0.5, text renders as `COLORS.textPrimary` (dark)
If luminance <= 0.5, text renders as `COLORS.surface` (white)

### Scenario: WCAG AA contrast is maintained for white-on-navy
Given the default navy (#0F172A) background
When white (#FFFFFF) text renders on it
Then the contrast ratio is >= 4.5:1 (WCAG AA)
(Note: #0F172A / #FFFFFF = 17.4:1 — already passes. This scenario documents the requirement.)

---

## WP5: Content Curation & Structure

### Scenario: MetadataPage removed from document assembly
Given a report PDF is being assembled in `document.tsx`
When the document pages are rendered
Then no MetadataPage ("Report Information") is included in the output
And confidence level, sample size, and generated date are NOT rendered as a standalone page
Because this data already appears on the Insights Index page

### Scenario: Confidence data removed from executive briefing
Given the executive briefing section of the report
When the section renders
Then no "Data Confidence" subsection is present
And no confidence level, sample size, or confidence description text appears in the briefing
But forecast confidenceNotes (narrative context) are preserved if present

### Scenario: Confidence data removed from methodology section
Given the methodology section of the report
When the section renders
Then no "Confidence" subsection is present
And no confidence level or sample size text appears in methodology

### Scenario: Confidence footer strip removed from Insights Index
Given the Insights Index page
When the page renders
Then no confidence footer strip (confidence level, sample size, generated date in a row) appears
And a simple generated date footer is shown instead (centered, secondary text)

### Scenario: Metric Union and Filter Overlap removed from Blended Intelligence
Given the Blended Intelligence subsection of the report
When the section renders
Then only talking points and conflicts are displayed
And no "Metric Union" subsection appears
And no "Filter Overlap" subsection appears

### Scenario: Each persona gets its own page with section heading
Given a report with multiple advisor personas
When persona content renders
Then each persona has a proper section heading (Playfair Display 24pt) with an accent line below it
And each persona's content is on its own page (non-first personas force a page break via `break`)
And personas are NOT wrapped in a card component

### Scenario: Persona talking points use numbered card format
Given a persona section with talking points
When the talking points render
Then each talking point is displayed as a numbered card (01, 02, etc.)
And the card has a plain 1pt border (no gold left border)
And the number label uses the persona accent color
Because gold left border would double up with the persona card styling

### Scenario: Narrative Lens renders as a single bordered card
Given a persona section with a narrative lens
When the narrative lens renders
Then it appears as a single bordered card containing:
  - Perspective text at the top
  - A horizontal divider
  - Two-column layout with "Emphasize" and "De-emphasize" lists
  - Another horizontal divider
  - Tone guidance text at the bottom
And the card uses `wrap={false}` to prevent page splitting
And the "Narrative Lens" label is inside the card (not above it) to prevent orphaning

### Scenario: Blended Intelligence has proper section heading and formatted talking points
Given the Blended Intelligence section of the report
When the section renders
Then it has a section heading (Playfair Display 24pt) with an accent line below
And a page break is forced before the section
And talking points render as numbered cards with gold left border (4pt)

### Scenario: Dividers between persona subsections are removed
Given a persona section with multiple subsections (talking points, narrative lens)
When subsections render
Then no horizontal divider lines appear between subsections within a persona
And spacing between subsections is controlled by margin only

---

## Files Changed (by work package)

### WP1: Layout & Spacing
- `lib/pdf/styles.ts` — increase `tableRow.paddingVertical` to 8, `personaCallout.padding` to 16
- `lib/pdf/templates/table-of-contents.tsx` — add flexGrow spacer + bottom accent line
- `lib/pdf/components/data-viz.tsx` — increase `SegmentMatrix` row paddingVertical to 8

### WP2: Typography & Text
- `lib/pdf/fonts.ts` — add real hyphenation callback for Inter (keep no-op for Playfair)
- `lib/pdf/styles.ts` — add `lineHeight: 1.3` to `subheading`, ensure bullet indentation
- `lib/pdf/templates/renderers.tsx` — verify em dash and arrow character usage
- `lib/pdf/templates/cover-page.tsx` — verify theme dot sizing consistency

### WP3: Data Visualization & Tables
- `lib/pdf/components/data-viz.tsx` — right-align numeric columns in SegmentMatrix, add tinted backgrounds to TrendIndicator
- `lib/pdf/templates/renderers.tsx` — right-align numeric columns in dashboard/neighborhood tables, add PropertyTypeSplit mini bar chart
- `lib/pdf/styles.ts` — add `badgeConsistent` style, `trendBgPositive`/`trendBgNegative` colors

### WP4: Accessibility & Interactivity
- `lib/pdf/templates/cover-page.tsx` — wrap email/phone in `<Link>` components
- `lib/pdf/styles.ts` — add luminance utility function
- `lib/pdf/document.tsx` or `styles.ts` — export `getContrastTextColor(bgHex)` utility

### WP5: Content Curation & Structure
- `lib/pdf/document.tsx` — remove MetadataPage from document assembly
- `lib/pdf/templates/renderers.tsx` — remove confidence subsection from executive briefing, remove confidence subsection from methodology, remove metric union and filter overlap from blended intelligence, restructure persona rendering (own pages with section headings, numbered talking point cards, narrative lens as bordered card, remove inter-subsection dividers), add blended intelligence section heading with page break and numbered talking point cards with gold border
- `lib/pdf/templates/insights-index.tsx` — remove confidence footer strip, replace with generated date footer

---

## UI Mockup — Before/After

### Table Row Spacing (Before)
```
+--------------------------------------------------+
| SEGMENT      COUNT   MEDIAN PRICE   RATING       |
|--------------------------------------------------|
| Luxury       143     $2.1M          A-           | <- 6pt padding, left-aligned numbers
| Ultra Luxury 29      $5.8M          B+           |
+--------------------------------------------------+
```

### Table Row Spacing (After)
```
+--------------------------------------------------+
| SEGMENT           COUNT   MEDIAN PRICE   RATING  |
|--------------------------------------------------|
|                                                  |
| Luxury              143        $2.1M       A-    | <- 8pt padding, right-aligned numbers
|                                                  |
| Ultra Luxury         29        $5.8M       B+    |
|                                                  |
+--------------------------------------------------+
```

### Trend Indicator (Before)
```
Median Price    +8.2%  ^
Volume          -3.1%  v
Transactions    +0.5%  -
```

### Trend Indicator (After)
```
+---------------------------------------------+
| Median Price    +8.2%  ^ | faint green bg   |
| Volume          -3.1%  v | faint red bg     |
| Transactions    +0.5%  - | no bg            |
+---------------------------------------------+
```

### TOC Page (Before)
```
+-------------------------------------+
| Table of Contents                   |
| ------- (gold accent line)          |
|                                     |
| 01  Executive Briefing              |
| 02  Market Overview                 |
| 03  Key Drivers                     |
| 04  Forecasts                       |
|                                     |
|                                     |
|                                     | <- wasted space
|                                     |
| --- Table of Contents  3 / 15 ---  |
+-------------------------------------+
```

### TOC Page (After)
```
+-------------------------------------+
| Table of Contents                   |
| ------- (gold accent line)          |
|                                     |
| 01  Executive Briefing              |
| 02  Market Overview                 |
| 03  Key Drivers                     |
| 04  Forecasts                       |
|                                     |
|           (spacer grows)            |
|                                     |
| ------- (gold accent line)          | <- branded footer element
| --- Table of Contents  3 / 15 ---  |
+-------------------------------------+
```

### Persona Page (After — WP5)
```
+-------------------------------------+
| Luxury Buyer's Advisor              |  <- Playfair Display 24pt
| ------- (gold accent line)          |
|                                     |
| Talking Points                      |  <- subsection label
|                                     |
| +-------- 01 ---------+            |
| | First talking point  |            |  <- numbered card, plain border
| | content here...      |            |
| +---------------------+            |
|                                     |
| +-------- 02 ---------+            |
| | Second talking point |            |
| | content here...      |            |
| +---------------------+            |
|                                     |
| Narrative Lens                      |
| +---------------------+            |
| | Perspective: ...     |            |
| | ---------------      |            |  <- single bordered card
| | Emphasize | De-emph  |            |  <- two-column layout
| | - item 1  | - item 1 |            |
| | ---------------      |            |
| | Tone: ...            |            |
| +---------------------+            |
+-------------------------------------+
```

### Blended Intelligence (After — WP5)
```
+-------------------------------------+
| Blended Intelligence                |  <- Playfair Display 24pt
| ------- (gold accent line)          |
|                                     |
| Talking Points                      |
|                                     |
| +====== 01 ===========+            |
| ||  First talking     ||            |  <- numbered card, gold left border
| ||  point here...     ||            |
| +=====================+            |
|                                     |
| Conflicts (if any)                  |
| ...                                 |
+-------------------------------------+
```

---

## Persona Lens Revision

**Alex (Rising Star)**: "When I hand this PDF to a wealth manager, the details matter. Right-aligned numbers in tables is table stakes — it's how financial reports work. The tinted trend backgrounds let me glance at YoY without reading the numbers. And clickable email on the cover? That's how I close the loop. Having each persona on its own page makes it easy to pull out just the relevant advisor brief."

**Jordan (Established Practitioner)**: "Consistent padding and readable text aren't luxuries — they're respect for the reader's time. The current text wrapping issues make some paragraphs look like they were generated, not authored. Hyphenation and line height fixes turn this from 'AI report' into 'my analysis.' Removing redundant confidence data from three places and keeping it on the Insights Index is the right call — say it once, say it well."

---

## Learnings

- MetadataPage was redundant — confidence data already lived on Insights Index. Removing it reduces page count and eliminates a page that added no unique value.
- Confidence data appeared in three places (executive briefing, methodology, Insights Index footer). Consolidating to just the Insights Index avoids repetition without losing information.
- Persona sections work better as full pages with proper section headings than as cards. Cards created visual clutter and made page breaks awkward.
- Narrative Lens must use `wrap={false}` to prevent react-pdf from splitting the card across pages, which breaks the two-column layout.
- Putting the "Narrative Lens" label inside the bordered card (not above it) prevents orphaning where the label ends up on one page and the card on the next.
- Blended Intelligence talking points use gold left border to visually distinguish them from persona talking points (which use plain border), creating a clear hierarchy.
