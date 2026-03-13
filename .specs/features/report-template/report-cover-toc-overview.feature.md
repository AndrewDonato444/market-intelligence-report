---
feature: Report Cover, TOC, and Market Overview + Insights Index
domain: report-template
source: lib/pdf/templates/cover-page.tsx
tests:
  - __tests__/pdf/cover-toc-overview.test.tsx
components:
  - CoverPage
  - TableOfContents
  - InsightsIndex
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Report Cover, TOC, and Market Overview + Insights Index

**Source Files**: `lib/pdf/templates/cover-page.tsx`, `lib/pdf/templates/table-of-contents.tsx`, `lib/pdf/templates/insights-index.tsx`, `lib/pdf/document.tsx`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Enhanced Cover Page, Table of Contents, and Insights Index

Enhances the PDF report with: (1) improved cover page with optional logo support, (2) a table of contents listing all sections, (3) an insights index page showing headline metrics and confidence ratings synthesized from report data.

### Scenario: Enhanced cover page with logo support
Given agent branding with name, company, and optional logoUrl
When the cover page renders
Then it shows the report title in Playfair Display
And it shows the market name with gold accent
And it shows the agent name and company
And if logoUrl is provided, it includes an Image element
And it shows "Market Intelligence Report" subtitle
And it shows the generation date

### Scenario: Table of contents page
Given a report with multiple sections
When the TOC page renders
Then it lists each section title
And sections appear in SECTION_REGISTRY order
And each entry shows the section type label
And the TOC uses Inter font for readability
And it has a "Table of Contents" heading

### Scenario: Insights index page with headline metrics
Given report metadata with confidence level and sample size
And sections containing market overview highlights
When the insights index renders
Then it shows a "Market Intelligence Summary" heading
And it shows the confidence level as a badge
And it shows the sample size
And it shows key highlights from the market overview
And it shows the generation date

### Scenario: Document assembly includes TOC and insights index
Given a complete ReportData with sections and metadata
When ReportDocument renders
Then the cover page is first
And the table of contents is second
And the insights index is third
And then section pages follow in order
And the metadata page is last

### Scenario: TOC handles variable section count
Given a report with only required sections (3 sections)
When the TOC renders
Then it only lists the 3 sections present
And no empty entries appear

### Scenario: Insights index handles missing metrics gracefully
Given report metadata with unknown confidence level
And no market overview section present
When the insights index renders
Then it still renders with available data
And hasTransactionData is false when totalProperties is 0
And Transactions, Volume, and Median Price cards show em-dash (—) fallback
And YoY Price card always displays a formatted value (e.g. "0.0%")

## Document Assembly Order

1. Cover page
2. Table of Contents
3. Insights Index (Market Intelligence Summary)
4. market_overview (section page)
5. executive_summary (section page)
6. key_drivers (section page)
7. competitive_market_analysis (section page)
8. forecasts (section page)
9. strategic_summary (section page)
10. polished_report (section page)
11. methodology (section page)
12. Metadata page (report information)

## Learnings

(To be filled after implementation)
