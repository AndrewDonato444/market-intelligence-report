---
feature: Report Templates
domain: report-editor
source: lib/services/report-templates.ts
tests:
  - __tests__/reports/report-templates.test.tsx
components:
  - TemplateList
  - SaveTemplateDialog
personas:
  - established-practitioner
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Report Templates

**Source Files**: `lib/services/report-templates.ts`, `lib/db/schema.ts`, `app/api/templates/route.ts`, `components/reports/template-list.tsx`, `components/reports/save-template-dialog.tsx`

## Feature: Report Templates — Save/Reuse Market Configurations

Allow agents to save report configurations as reusable templates. A template captures the market, section selection, and custom prompts so future reports can be generated with one click.

### Scenario: Report templates table in database
Given the database schema
When templates are defined
Then a report_templates table exists with userId, name, marketId, config fields

### Scenario: Save template from completed report
Given a completed report
When the agent saves it as a template
Then the report's config (sections, customPrompts) is stored as a template

### Scenario: List user templates
Given the user has saved templates
When they visit the template list
Then all their templates are shown with name and market

### Scenario: Create report from template
Given a saved template
When the agent clicks "Use Template"
Then a new report is pre-populated with the template's configuration

### Scenario: Delete template
Given a saved template
When the agent deletes it
Then the template is removed from the database

### Scenario: Template API endpoints
Given the templates API
When CRUD operations are performed
Then GET lists templates, POST creates, DELETE removes
