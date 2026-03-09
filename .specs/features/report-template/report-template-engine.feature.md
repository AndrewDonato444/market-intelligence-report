---
feature: Report Template Engine
domain: report-template
source: lib/pdf/document.tsx
tests:
  - __tests__/pdf/document.test.tsx
  - __tests__/pdf/styles.test.ts
  - __tests__/pdf/renderer.test.ts
components:
  - ReportDocument
  - ReportPage
  - SectionTemplate
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Report Template Engine

**Source Files**: `lib/pdf/document.tsx`, `lib/pdf/styles.ts`, `lib/pdf/renderer.ts`, `lib/pdf/fonts.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`

## Feature: Report Template Engine

React-PDF based rendering pipeline that transforms assembled ReportData (from the agent pipeline) into magazine-quality PDF documents. Uses design tokens for styling, registers custom fonts (Playfair Display + Inter), and provides a render function that produces PDF bytes from report data and agent branding.

### Scenario: Define PDF style tokens
Given the design system tokens exist
When PDF styles are initialized
Then styles map design tokens to React-PDF StyleSheet objects
And colors use token values (navy primary, gold accent, warm white background)
And typography uses Playfair Display for headings and Inter for body text
And page dimensions default to US Letter (8.5" x 11") with 64pt margins

### Scenario: Register custom fonts
Given React-PDF requires explicit font registration
When the font module is loaded
Then Playfair Display is registered with regular and bold variants
And Inter is registered with regular, medium, and bold variants
And fonts are loaded from Google Fonts CDN URLs

### Scenario: Render a complete report document
Given assembled ReportData with sections, metadata, and pull quotes
And agent branding (name, company, logo URL)
When the document is rendered
Then it produces a React-PDF Document with pages for each section
And sections appear in SECTION_REGISTRY order
And each section uses its type-specific template
And the document includes page numbers on each page

### Scenario: Render cover page
Given report title, market name, and agent branding
When the cover page renders
Then it shows the report title prominently
And it shows the market name
And it shows the agent name and company
And it shows the generation date
And it uses the navy/gold color scheme

### Scenario: Render section pages
Given a section with sectionType and content
When the section template renders
Then it displays the section title as a heading
And it renders content based on section type
And market_overview shows narrative, highlights, and recommendations
And key_drivers shows themes with impact levels and trends
And forecasts shows projections table and scenario cards
And generic sections show formatted text content

### Scenario: Render metadata footer
Given report metadata with confidence level and generation timestamp
When the metadata section renders
Then it shows confidence level and sample size
And it shows the generation date and total duration
And it shows data source information

### Scenario: Generate PDF bytes from report data
Given complete ReportData and agent branding
When renderReportPdf is called
Then it returns a Buffer of PDF bytes
And the PDF is valid and non-empty
And the rendering completes without errors

### Scenario: Handle missing optional sections
Given ReportData with only required sections (market_overview, executive_summary, key_drivers)
When the document renders
Then it renders only the available sections
And no errors occur for missing optional sections
And page numbering adjusts correctly

### Scenario: PDF generation API endpoint
Given a completed report exists with sections in the database
When POST /api/reports/[id]/pdf is called
Then it loads the report and sections from the database
And it loads the user branding
And it renders the PDF using renderReportPdf
And it returns the PDF bytes with Content-Type application/pdf
And it updates the report's pdfUrl field

## Section Display Order

Follows SECTION_REGISTRY from lib/agents/schema.ts:
1. Cover page (always first)
2. market_overview
3. executive_summary
4. key_drivers
5. competitive_market_analysis
6. forecasts
7. strategic_summary
8. polished_report (pull quotes integrated)
9. methodology
10. Metadata page (always last — confidence, generation info, pull quotes)

Note: competitive_market_analysis, polished_report, and methodology use the generic fallback renderer in this feature. Dedicated renderers are added in features #51-54.

## Architecture

```
lib/pdf/
├── fonts.ts              # Font registration (Playfair Display + Inter)
├── styles.ts             # Design token → React-PDF StyleSheet mapping
├── document.tsx          # Root <Document> with section dispatch
├── templates/
│   ├── cover-page.tsx    # Title page with branding
│   ├── section-page.tsx  # Generic section wrapper with header/footer
│   ├── metadata-page.tsx # Report info, confidence, pull quotes (last page)
│   └── renderers.tsx     # Type-specific content renderers
├── renderer.ts           # renderReportPdf() — async PDF byte generation

app/api/reports/[id]/pdf/
└── route.ts            # POST endpoint for PDF generation
```

## Learnings

(To be filled after implementation)
