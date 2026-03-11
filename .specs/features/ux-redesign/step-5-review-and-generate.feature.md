---
feature: "Step 5: Review & Generate"
domain: ux-redesign
source: components/reports/steps/step-your-review.tsx
tests:
  - __tests__/reports/step-your-review.test.tsx
components:
  - StepYourReview
  - ReviewSectionCard
personas:
  - rising-star-agent
  - legacy-agent
  - team-leader
  - competitive-veteran
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Step 5: Review & Generate

**Source File**: `components/reports/steps/step-your-review.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Parent Feature**: Unified Creation Flow Shell (#151)
**Depends On**: Steps 1-4 (#152-#155)

## Feature: Review & Generate

Step 5 of the unified report creation flow. The agent reviews all selections from Steps 1-4 in a clean summary layout, edits the auto-generated report title, sees an estimated generation time, and clicks the premium Generate Report CTA. Each section has an Edit link that navigates back to the corresponding step.

### Scenario: Agent sees the Review step heading
Given the agent completed Steps 1-4 and advanced to Step 5
Then they see the heading "Review Your Report"
And they see helper text "Everything look right? Edit any section or generate your intelligence report."
And they see an accent divider below the heading

### Scenario: Summary displays market selection
Given the agent is on Step 5
Then they see a "Your Market" summary section with the market name (city, state)
And it has an "Edit" link that navigates back to Step 1

### Scenario: Summary displays tier selection
Given the agent is on Step 5
Then they see a "Your Tier" summary section with tier label and price range formatted as currency
And it has an "Edit" link that navigates back to Step 2

### Scenario: Summary displays focus selections
Given the agent is on Step 5
Then they see a "Your Focus" summary section with segments and property types as tags
And it has an "Edit" link that navigates back to Step 3

### Scenario: Summary displays audience selections
Given the agent is on Step 5 and selected personas in Step 4
Then they see a "Your Audience" summary section with persona names as tags
And it has an "Edit" link that navigates back to Step 4

### Scenario: No personas selected shows fallback
Given the agent is on Step 5 and did not select any personas
Then the audience section shows "No buyer personas selected — report will use general framing"

### Scenario: Report title is auto-generated and editable
Given the agent is on Step 5
Then they see a report title input auto-generated as "{City} {Tier} Market Intelligence Report"
And the input is editable with a character count showing "X / 500"

### Scenario: Estimated generation time displayed
Given the agent is on Step 5
Then they see "Estimated generation time: 2-4 minutes"

### Scenario: Generate Report CTA
Given the agent is on Step 5 and the title is valid
Then they see a prominent full-width "Generate Report" button

### Scenario: Generate disabled when title empty
Given the title field is empty
Then the Generate Report button is disabled
And a validation message appears: "Report title is required"

### Scenario: Clicking Generate creates report and navigates
Given the agent clicks Generate Report
Then a loading state appears on the button
And a POST request creates the report via /api/reports
And on success the browser navigates to /reports/{reportId}

### Scenario: New market creation before report
Given the agent selected a new market in Step 1
When they click Generate Report
Then a market is created first via POST /api/markets
And the returned marketId is used for the report creation

### Scenario: API error during generation
Given the API returns an error
Then an error message appears and the button becomes clickable again

### Scenario: Step is always valid
Given the agent reaches Step 5
Then the step reports valid immediately via onValidationChange(true)

## Data Contract

```typescript
export interface StepReviewData {
  reportId: string;
  title: string;
}
```

## Learnings

### 2026-03-11
- **Pattern**: Review step receives all previous step data via props from the shell (not via refetch). This keeps it fast and avoids data inconsistency between what the user selected and what the review shows.
- **Pattern**: Persona names need a separate fetch since Step 4 only stores IDs. The review step fetches `/api/buyer-personas` on mount and builds an id→name map. Graceful fallback shows IDs if fetch fails.
- **Gotcha**: Shell tests that navigate through all steps by clicking "Next" in a loop break when a step hides the Next button (step 4/Review has its own Generate CTA). Tests must be updated to stop at the step that manages its own navigation.
- **Decision**: Step 5 handles both market creation (for new markets) and report creation in a single flow. If `isNewMarket`, it POSTs to `/api/markets` first, then uses the returned ID for `/api/reports`. Both happen under one loading state.
- **Decision**: Report sections are set to ALL_SECTIONS by default (no section picker in the new flow). The old wizard had section selection but the redesigned flow simplifies this.
