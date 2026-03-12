---
feature: Social Media Kit Generation Trigger
domain: social-media-kit
source: app/api/reports/[id]/kit/generate/route.ts
tests:
  - __tests__/social-media-kit/generation-trigger.test.ts
components:
  - GenerateKitButton
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Social Media Kit Generation Trigger

**Source Files**: app/api/reports/[id]/kit/generate/route.ts, app/api/reports/[id]/kit/status/route.ts, components/reports/generate-kit-button.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md

## Feature: Social Media Kit Generation Trigger (#162)

"Generate Social Media Kit" action on completed reports. Triggers the Social Media Agent, shows generation progress. Available on both the report detail page and the reports dashboard.

### Scenario: Trigger kit generation from report detail page
Given a completed report exists
When the user clicks "Generate Social Media Kit"
Then a POST request is sent to /api/reports/[id]/kit/generate
And the button shows a generating state with progress text
And the kit status is polled until completion

### Scenario: Trigger kit generation from reports dashboard
Given a completed report appears in the reports list
When the user clicks the social media kit icon/button on that report card
Then kit generation is triggered for that report

### Scenario: API validates report ownership
Given a report that does not belong to the current user
When a POST is sent to /api/reports/[id]/kit/generate
Then the API returns 404

### Scenario: API rejects non-completed reports
Given a report with status "generating"
When a POST is sent to /api/reports/[id]/kit/generate
Then the API returns 409 with message "Report is not completed. Cannot generate social media kit."

### Scenario: API rejects duplicate generation
Given a kit already exists for the report with status "generating"
When a POST is sent to /api/reports/[id]/kit/generate
Then the API returns 409 with message "Kit is already being generated"

### Scenario: API allows regeneration of completed kit
Given a kit already exists for the report with status "completed"
When a POST is sent to /api/reports/[id]/kit/generate
Then the existing kit row is deleted
And a new kit generation starts
And the API returns 202

### Scenario: API allows retry of failed kit
Given a kit exists for the report with status "failed"
When a POST is sent to /api/reports/[id]/kit/generate
Then the existing failed kit row is deleted
And a new kit generation starts
And the API returns 202

### Scenario: API replaces stale queued kit
Given a kit exists for the report with status "queued" (stale)
When a POST is sent to /api/reports/[id]/kit/generate
Then the existing queued kit row is deleted
And a new kit generation starts
And the API returns 202

### Scenario: Kit status polling
Given a kit is being generated
When GET /api/reports/[id]/kit/status is called
Then it returns the current kit status (queued, generating, completed, failed)
And if completed, includes the kit content

### Scenario: Show existing completed kit
Given a completed kit exists for a report
When the user views the report detail page
Then "Social Media Kit Ready" text is shown with a "Regenerate" button
And the "Generate Social Media Kit" button is no longer displayed

### Scenario: Show failed kit with retry
Given a failed kit exists for a report
When the user views the report detail page
Then the error is shown with a "Retry" button

## User Journey

1. User generates a report (existing flow)
2. Report completes -> report detail page
3. **User clicks "Generate Social Media Kit"**
4. Button shows generating progress
5. Kit completes -> button changes to "View Social Media Kit"
6. User navigates to kit viewer (feature #163, future)

## UI Mockup

```
Report Detail Page (completed report):
+--------------------------------------------------+
| [Download PDF]  [Share Report]  [Generate Kit]   |
+--------------------------------------------------+

During generation:
+--------------------------------------------------+
| [Download PDF]  [Share Report]  [Generating...]  |
+--------------------------------------------------+

After completion:
+--------------------------------------------------+
| [Download PDF]  [Share Report]  [View Kit]       |
+--------------------------------------------------+

Reports Dashboard - each completed report card:
+--------------------------------------------------+
| Report Title                                      |
| Market Name  ·  Created Mar 11                   |
|                    [PDF] [Kit] [Completed]        |
+--------------------------------------------------+
```

## Component References

- ReportActions: components/reports/report-actions.tsx (extend with kit button)
- GenerateKitButton: components/reports/generate-kit-button.tsx (new)
