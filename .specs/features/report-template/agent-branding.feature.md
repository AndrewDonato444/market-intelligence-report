---
feature: Agent Branding Injection
domain: report-template
source: lib/pdf/document.tsx
tests:
  - __tests__/pdf/agent-branding.test.tsx
components:
  - CoverPage
  - SectionPage
  - MetadataPage
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Agent Branding Injection

**Source Files**: `lib/pdf/document.tsx`, `lib/pdf/styles.ts`, `lib/pdf/templates/cover-page.tsx`, `lib/pdf/templates/section-page.tsx`, `lib/pdf/templates/metadata-page.tsx`, `app/api/reports/[id]/pdf/route.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Agent Branding Injection

Inject the agent's branding (brand colors, contact info, disclaimers) into every page of the PDF report. The cover page shows full contact details, section page footers include the agent's company name, and all accent colors respect the agent's brand palette.

### Scenario: Extended AgentBranding interface
Given the PDF system needs full branding data
When AgentBranding is defined
Then it includes brandColors (primary, secondary, accent), phone, email, title, and disclaimer fields

### Scenario: Brand colors override PDF accents
Given an agent has set custom brand colors
When the PDF renders
Then the cover page background uses brandColors.primary
And accent lines use brandColors.accent
And pull quote backgrounds use brandColors.primary

### Scenario: Cover page shows contact info
Given an agent has name, title, company, phone, and email
When the cover page renders
Then it displays agent name, title, company, phone, and email

### Scenario: Section page footer shows company name
Given an agent has a company name
When section pages render
Then the footer includes the company name alongside the page number

### Scenario: Metadata page shows disclaimer
Given an agent has set a custom disclaimer
When the metadata page renders
Then the disclaimer text appears at the bottom

### Scenario: API route passes full branding
Given the PDF API route loads user data
When it queries the user
Then it includes brandColors, phone, email, and title in the branding object

### Scenario: Default colors when no brand colors set
Given an agent has NOT set custom brand colors
When the PDF renders
Then it uses the default navy/gold color scheme
