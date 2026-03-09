---
feature: PDF Export + Digital Sharing Links
domain: report-template
source: lib/services/report-sharing.ts
tests:
  - __tests__/pdf/pdf-export-sharing.test.tsx
components:
  - ReportActions
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# PDF Export + Digital Sharing Links

**Source Files**: `lib/services/report-sharing.ts`, `app/api/reports/[id]/share/route.ts`, `app/api/reports/share/[token]/route.ts`, `components/reports/report-actions.tsx`, `lib/db/schema.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: PDF Export + Digital Sharing Links

Allow agents to download generated PDFs and create shareable links for their reports. Share links use crypto-secure tokens with optional expiration.

### Scenario: Download PDF button on report detail page
Given a report is completed
When the report detail page renders
Then a "Download PDF" button is visible
And clicking it triggers the PDF generation endpoint

### Scenario: Share link generation
Given a completed report
When the agent clicks "Share Report"
Then a unique share token is generated and stored
And the shareable URL is displayed for copying

### Scenario: Share token in database
Given the reports table
When a share token is created
Then shareToken and shareTokenExpiresAt fields are stored on the report

### Scenario: Public share endpoint
Given a valid share token
When a public user visits the share URL
Then they can view the report metadata and download the PDF

### Scenario: Expired share token
Given a share token that has expired
When someone visits the share URL
Then they see a "link expired" error

### Scenario: Revoke sharing
Given a report with an active share link
When the agent revokes the share
Then the share token is cleared
And the previous share URL stops working

### Scenario: Report sharing service functions
Given the report sharing service
When generateShareToken is called
Then it creates a crypto-secure random token
And when getReportByShareToken is called with a valid token
Then it returns the report data

## UI Mockup

```
┌─────────────────────────────────────────────────┐
│ Naples Market Intelligence Report               │
│ Status: Completed                               │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Download PDF  │  │ Share Report │             │
│  └──────────────┘  └──────────────┘             │
│                                                 │
│ [Share Dialog]                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Share Link:                                 │ │
│ │ https://app.com/reports/share/abc123def456  │ │
│ │                          [Copy] [Revoke]    │ │
│ │ Expires: March 16, 2026                     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```
