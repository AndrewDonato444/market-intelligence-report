---
feature: Report Editor
domain: report-editor
source: components/reports/section-editor.tsx
tests:
  - __tests__/reports/report-editor.test.tsx
components:
  - SectionEditor
  - EditableSection
  - ReportEditor
personas:
  - established-practitioner
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Report Editor

**Source Files**: `components/reports/section-editor.tsx`, `components/reports/report-editor.tsx`, `lib/services/report.ts`, `app/api/reports/[id]/sections/[sectionId]/route.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Report Editor

Allow agents to edit any section of a generated report — adjust narratives, refine insights, update highlights — and save changes back to the database. Provides inline editing with type-specific form fields.

### Scenario: Section update API endpoint
Given a completed report with sections
When the agent sends a PATCH to /api/reports/[id]/sections/[sectionId]
Then the section content is updated in the database
And the updatedAt timestamp is refreshed

### Scenario: Report editor component with editable sections
Given a completed report is displayed
When the report editor renders
Then each section has an "Edit" button
And clicking Edit shows inline editing fields

### Scenario: Narrative section editing
Given a section with narrative content (market_overview, executive_summary, strategic_summary)
When editing mode is active
Then the narrative is shown in a textarea
And highlights are shown as editable list items

### Scenario: Save edits
Given the agent has modified a section
When they click "Save"
Then the changes are sent to the API
And the section returns to view mode with updated content

### Scenario: Cancel edits
Given the agent is editing a section
When they click "Cancel"
Then changes are discarded
And the section returns to view mode with original content

### Scenario: Update report section service function
Given the report service
When updateReportSection is called
Then it updates the section content and title in the database
And validates the user owns the report
