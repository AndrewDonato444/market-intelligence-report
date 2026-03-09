---
feature: Report History + Versioning
domain: report-editor
source: lib/services/report-history.ts
tests:
  - __tests__/reports/report-history.test.tsx
components:
  - ReportHistory
personas:
  - established-practitioner
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Report History + Versioning

**Source Files**: `lib/services/report-history.ts`, `lib/db/schema.ts`, `app/api/reports/[id]/history/route.ts`, `components/reports/report-history.tsx`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Report History + Versioning

Track edit history for report sections so agents can see what changed and when. Uses a dedicated edit_history table to log changes without creating full report copies.

### Scenario: Edit history table in database
Given the database schema
When edit history is defined
Then a report_edit_history table exists with reportId, sectionId, previousContent, editedAt fields

### Scenario: Edit history is recorded on section update
Given the report service updateReportSection function
When a section is updated
Then the previous content is logged to the edit history table

### Scenario: History API endpoint
Given a report with edit history
When GET /api/reports/[id]/history is called
Then it returns the list of edits ordered by most recent

### Scenario: ReportHistory component
Given a report with past edits
When the history component renders
Then it shows each edit with timestamp and section name

### Scenario: Report version number increments
Given a report at version 1
When a section is edited
Then the report version is incremented to 2
