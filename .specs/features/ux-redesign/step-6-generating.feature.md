---
feature: "Step 6: Generating"
domain: ux-redesign
source: components/reports/steps/step-generating.tsx
tests:
  - __tests__/reports/step-generating.test.tsx
components:
  - StepGenerating
personas:
  - rising-star-agent
  - legacy-agent
  - team-leader
  - competitive-veteran
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Step 6: Generating

**Source File**: `components/reports/steps/step-generating.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Parent Feature**: Unified Creation Flow Shell (#151)
**Depends On**: Step 5 (#156), Pipeline Execution Service (#80)

## Feature: Generating — Pipeline Progress in Flow

Step 6 of the unified report creation flow. After the agent clicks "Generate Report" in Step 5, the flow advances to Step 6 which shows real-time pipeline progress inline — not on a separate page. The agent sees contextual stage descriptions, an animated progress bar, estimated time remaining, and a premium "View Report" CTA when generation completes. If generation fails, a clear error with retry is shown.

### Scenario: Agent sees generating heading
Given the report was created in Step 5 and the flow advanced to Step 6
Then they see the heading "Generating Your Report"
And they see helper text "Sit back — our AI agents are analyzing your market."
And they see an accent divider below the heading

### Scenario: Heading and subtitle change on completion
Given the pipeline finishes with status "completed"
Then the heading changes to "Your Report Is Ready"
And the subtitle changes to "{reportTitle} has been generated successfully."

### Scenario: Progress bar shows live percentage
Given the agent is on Step 6 and the pipeline is running
Then they see a progress bar with the current percentage
And the percentage updates every 3 seconds via polling

### Scenario: Pipeline stages display with status
Given the agent is on Step 6
Then they see all 5 pipeline stages listed (Data Analysis, Insight Generation, Competitive Analysis, Forecast Modeling, Editorial Polish)
And each stage shows a status indicator (pending, running, completed, or failed)
And the currently running stage has a pulsing accent dot
And a failed stage shows a red error dot

### Scenario: Contextual stage description shown
Given a pipeline stage is running
Then the agent sees a contextual description for the active stage

### Scenario: Estimated time remaining shown
Given the pipeline is running and progress has been reported
Then the agent sees an estimated time remaining display
And it updates as progress changes

### Scenario: Generation completes successfully
Given the pipeline finishes with status "completed"
When the progress poll returns reportStatus "completed"
Then the progress bar fills to 100%
And all pipeline stages show as completed
And the agent sees a success message "Your report is ready"
And a prominent "View Report" button appears

### Scenario: Clicking View Report navigates to report
Given the report generation completed
When the agent clicks "View Report"
Then the browser navigates to /reports/{reportId}

### Scenario: Generation fails with error
Given the pipeline fails
When the progress poll returns reportStatus "failed"
Then the agent sees an error message "Report generation failed"
And a "Try Again" button appears

### Scenario: Retry triggers regeneration
Given the report generation failed
When the agent clicks "Try Again"
Then a POST to /api/reports/{reportId}/generate is sent
And the progress display resets and resumes polling

### Scenario: Back button is hidden during generation
Given the agent is on Step 6 and the pipeline is generating
Then the shell Back button is hidden

### Scenario: Step is always valid
Given the agent reaches Step 6
Then the step reports valid immediately via onValidationChange(true)

### Scenario: Shell Next button hidden
Given the agent is on Step 6
Then the shell Next/Generate buttons are hidden (Step 6 manages its own CTAs)

## Data Contract

```typescript
export interface StepGeneratingProps {
  reportId: string;
  reportTitle: string;
  onStepComplete: () => void;
  onValidationChange?: (valid: boolean) => void;
}
```

## Shell Integration

1. Shell stores reportId when Step 5 calls onStepComplete({ reportId, title })
2. StepYourReview stops calling router.push — shell handles post-creation flow
3. Back button hidden on Step 6
4. Next button hidden on Step 6 — Step 6 manages its own CTA

## Polling Strategy

- Poll /api/reports/{id}/progress every 3 seconds while status is "generating" or "queued"
- Stop polling when status is "completed" or "failed"
- useEffect cleanup clears interval on unmount

## Component References

- Pipeline stages: components/reports/pipeline-status.tsx (PIPELINE_STAGES constant)
- Animations: lib/animations.ts (fadeVariant, staggerContainer)
