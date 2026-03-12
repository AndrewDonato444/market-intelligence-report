---
feature: View Report Read-Only
domain: reports
source: app/(protected)/reports/[id]/page.tsx
tests:
  - __tests__/reports/view-report-readonly.test.tsx
components:
  - ReportPreview
  - SectionRenderer
personas:
  - rising-star
  - established-practitioner
  - legacy-agent
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# View Report Read-Only

**Source Files**:
- `app/(protected)/reports/[id]/page.tsx`
- `components/reports/report-preview.tsx`
- `components/reports/report-editor.tsx` (to be removed from page)

**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star, Established Practitioner, Legacy Agent

## Problem

When a completed report is viewed, the page renders **both** a `ReportEditor`
(with Edit buttons and raw section cards) **and** a `ReportPreview` (formatted
renderers). The editor shows raw JSON for some sections and lets users edit
report text — which is too much responsibility and confusing for agents who
just want to review their intelligence brief.

Additionally, `disclaimer_methodology` sections fall through to
`GenericSectionRenderer` which dumps raw JSON instead of formatted text.

## Feature: Read-Only Report Viewing

Users view completed reports as a polished, read-only intelligence brief.
No editing capability. All section types render formatted content — never raw JSON.

### Scenario: View completed report (happy path)
Given a report with status "completed" and populated sections
When the agent navigates to `/reports/{id}`
Then they see the pipeline status dashboard
And they see report actions (Download PDF, Share)
And they see the Generate Kit button
And they see each section rendered with formatted content
And they do NOT see any Edit buttons
And they do NOT see any editable text fields

### Scenario: Disclaimer/methodology section renders formatted
Given a completed report with a "disclaimer_methodology" section
When the agent views the report
Then the disclaimer section renders as formatted narrative text
And it does NOT render as raw JSON

### Scenario: Unknown section type renders gracefully
Given a completed report with an unrecognized section type
When the agent views the report
Then the section renders its narrative/highlights if present
And falls back to a "Content available in PDF" message if no narrative exists
And it does NOT show raw JSON to the user

### Scenario: Report not yet completed
Given a report with status "generating" or "queued"
When the agent navigates to `/reports/{id}`
Then they see only the pipeline status dashboard
And they do NOT see any sections or editor

### Scenario: Empty sections
Given a completed report with zero sections
When the agent views the report
Then they see a message: "Report sections are being assembled. Check back shortly."

## User Journey

1. Agent generates a report from the dashboard
2. Report completes generation
3. Agent clicks the report title in "Recent Reports"
4. **Views the completed report as a read-only brief** (this feature)
5. Downloads PDF or shares the link

## Changes Required

1. **Remove `ReportEditor` from the report detail page** — stop importing and
   rendering it. The component files can remain (not deleted) in case editing
   is re-introduced later, but they should not appear on the page.

2. **Add `DisclaimerMethodologyRenderer`** to `report-preview.tsx` — renders
   `narrative`, `highlights`, `methodology`, and `dataDisclaimer` fields as
   formatted text instead of JSON.

3. **Improve `GenericSectionRenderer`** — instead of dumping JSON, try to
   extract `narrative`/`highlights` and render them. Only show a fallback
   message (not JSON) if no displayable content exists.

## UI Mockup

```
┌─────────────────────────────────────────────────────┐
│  Pipeline Status Dashboard                          │
│  ┌───────────────────────────────────────────────┐  │
│  │ ✅ Chicago Luxury Market — Completed          │  │
│  │ Generated: March 12, 2026                     │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  [Download PDF]  [Share Report]  [Generate Kit]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─ Executive Summary ─────────────────────────┐   │
│  │  ━━ (gold accent bar)                        │   │
│  │                                              │   │
│  │  The Chicago luxury market continues to...   │   │
│  │                                              │   │
│  │  HIGHLIGHTS                                  │   │
│  │  • Median price up 8.2% YoY                  │   │
│  │  • Days on market decreased to 45            │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Market Overview ───────────────────────────┐    │
│  │  ━━ (gold accent bar)                       │    │
│  │                                             │    │
│  │  (formatted narrative + highlights +        │    │
│  │   recommendations — NO edit button)         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Key Drivers ───────────────────────────────┐    │
│  │  ━━                                         │    │
│  │  ┌─ Theme Card ──────────────────────┐      │    │
│  │  │ Interest Rate Environment ↓ high  │      │    │
│  │  │ Rising rates have cooled...       │      │    │
│  │  └───────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Forecasts ─────────────────────────────────┐    │
│  │  ━━                                         │    │
│  │  Projections + Base/Bull/Bear scenarios      │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Disclaimer & Methodology ──────────────────┐   │
│  │  ━━                                         │   │
│  │  This report was generated using...         │   │
│  │                                             │   │
│  │  METHODOLOGY                                │   │
│  │  Data sourced from MLS records and...       │   │
│  │                                             │   │
│  │  DATA DISCLAIMER                            │   │
│  │  All projections are estimates...           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  (NO editor. NO Edit buttons. NO JSON dumps.)       │
└─────────────────────────────────────────────────────┘
```

## Component References

- ReportPreview: `components/reports/report-preview.tsx`
- SectionRenderer: `components/reports/report-preview.tsx`
- PipelineStatusDashboard: `components/reports/pipeline-status.tsx`
- ReportActions: `components/reports/report-actions.tsx`

## Learnings

(none yet)
