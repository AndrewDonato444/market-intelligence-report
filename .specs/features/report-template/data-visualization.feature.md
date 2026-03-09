---
feature: Data Visualization Components
domain: report-template
source: lib/pdf/components/data-viz.tsx
tests:
  - __tests__/pdf/data-viz.test.tsx
components:
  - ConfidenceDots
  - RatingBadge
  - SegmentMatrix
  - MetricCard
personas:
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Data Visualization Components

**Source Files**: `lib/pdf/components/data-viz.tsx`
**Design System**: `.specs/design-system/tokens.md`

## Feature: PDF Data Visualization Components

Reusable React-PDF components for visualizing data in reports: confidence level dots, intelligence rating badges, segment performance matrices, and metric highlight cards. These are PDF-native components using View/Text primitives (not SVG).

### Scenario: Confidence dots display
Given a confidence level (high/medium/low)
When ConfidenceDots renders
Then it shows filled/half/empty dots matching the level
And high = 3 filled dots
And medium = 2 filled + 1 empty
And low = 1 filled + 2 empty

### Scenario: Rating badge display
Given a rating string (A+, A, B+, B, C)
When RatingBadge renders
Then it shows the rating text in a colored badge
And A ratings are green, B amber, C red

### Scenario: Segment matrix display
Given an array of segment metrics
When SegmentMatrix renders
Then it shows a table with segment name, count, median price, rating columns
And each row is styled with alternating backgrounds

### Scenario: Metric card display
Given a label and value
When MetricCard renders
Then it shows the label in small caps
And the value prominently styled

## Learnings

(To be filled after implementation)
