---
feature: Image Library
domain: social-media-kit
source: components/reports/image-library.tsx
tests:
  - __tests__/social-media-kit/image-library.test.ts
components:
  - ImageLibrary
  - StatHeroGraphic
  - MarketSnapshotGraphic
  - PullQuoteGraphic
  - YoYComparisonGraphic
  - StoryGraphic
  - LinkedInBannerGraphic
personas:
  - rising-star-agent
  - established-practitioner
status: specced
created: 2026-03-16
updated: 2026-03-16
---

# Image Library

**Source File**: components/reports/image-library.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md

## Feature: Image Library

Six branded graphic templates generated from the report's stat callouts and key insights — no external API, no external library. Rendered as React components (SVG + styled divs), downloadable as `.svg` files via a Blob URL. Each graphic is on-brand (navy/gold, serif), sized for a specific platform use case, and ready to drop into Canva, Figma, or post directly.

Alex (Rising Star) needs something he can paste into a listing pitch deck or share on LinkedIn right now — the Image Library gives him six ready-made assets that look like an institutional graphic team produced them. Jordan (Established Practitioner) wants visuals that match the seriousness of her advisory brand — the dark navy pullquote cards and stat heroes are exactly that register.

No image generation API. No canvas library. Pure SVG strings built from kit data, offered as browser-native downloads.

---

### Scenario: Image Library section appears in Content Studio
Given a completed social media kit is displayed
Then an "Image Library" section appears after the Content Calendar
And the section heading uses the same accent-bar + icon pattern as other sections
And the section shows a count of available graphics (always 6 when stat callouts exist)

### Scenario: Six graphic cards are displayed
Given the Image Library section is displayed
Then six graphic preview cards are shown in a 2-column grid
And each card shows:
  - A live rendered preview of the graphic
  - The template name
  - The target platform/use case label
  - A "Download SVG" button

### Scenario: Stat Hero graphic renders from first stat callout
Given the Image Library is displayed
Then the Stat Hero card shows:
  - The stat number in large gold serif font (e.g. "90.9%")
  - The stat label below it in white
  - A gold accent divider line
  - The suggested caption in small italic white text
  - Dark navy (#0F172A) background
  - Square format (1:1)
And it uses data from statCallouts[0]

### Scenario: Market Snapshot graphic renders three stats in a grid
Given the Image Library is displayed
Then the Market Snapshot card shows:
  - Up to 3 stat callouts in a 1×3 vertical stack
  - Each stat: gold number + white label
  - A "Market Intelligence" header in uppercase tracking
  - The report's first hashtag as a subtitle
  - Dark navy background, square format

### Scenario: Pull Quote graphic renders from conversation starters
Given the Image Library is displayed
Then the Pull Quote card shows:
  - Large gold opening quote mark (")
  - The first conversation starter template text in white serif
  - The context label in gold uppercase below
  - Dark navy background, square format

### Scenario: YoY Comparison graphic renders two metrics with direction
Given the Image Library is displayed
Then the YoY Comparison card shows:
  - Two stat callouts side by side
  - Each with a directional indicator (↑ or ↓) based on whether the stat contains "decline" / "drop" / "fall" (↓) or "rise" / "gain" / "growth" (↑)
  - A thin gold vertical divider between the two stats
  - "Year-over-Year" label at the bottom in uppercase
  - Dark navy background, wide format (16:9)

### Scenario: Story graphic renders for Instagram/Facebook Stories
Given the Image Library is displayed
Then the Story card shows:
  - A vertical 4:5 format card
  - The stat number large and centered
  - "Market Intelligence" label at top
  - The first hashtag as a market name in the middle
  - Suggested caption at the bottom in small text
  - Gold accent lines at top and bottom edges

### Scenario: LinkedIn Banner graphic renders wide format
Given the Image Library is displayed
Then the LinkedIn Banner card shows:
  - A 1.91:1 wide format card
  - The market name (derived from first hashtag) on the left in large serif
  - A vertical gold divider line
  - The top stat on the right: number + label
  - "Quarterly Market Intelligence" in uppercase at the bottom right
  - Dark navy background

### Scenario: Download SVG button generates a valid SVG file
Given the user clicks "Download SVG" on any graphic card
Then a `.svg` file is downloaded to the user's device
And the filename follows the pattern `{template-name}-{market-slug}.svg`
  (e.g. "stat-hero-newportluxury.svg")
And the SVG contains the correct data from the kit
And no external API call is made

### Scenario: SVG uses inline font references for portability
Given a downloaded SVG is opened in a design tool
Then headings use Georgia (system serif) as the font family
And body text uses system-ui as the font family
So the SVG renders correctly without needing web font loading

### Scenario: Image Library section only shows when stat callouts exist
Given a kit has 0 stat callouts
Then the Image Library section is hidden entirely
And no empty state is shown (the section simply does not render)

### Scenario: Graphics degrade gracefully with fewer than 3 stat callouts
Given a kit has only 1 stat callout
Then the Stat Hero graphic uses statCallouts[0]
And the Market Snapshot graphic shows only 1 stat (not 3 blank slots)
And the YoY Comparison graphic uses statCallouts[0] for both sides if only 1 exists

### Scenario: Platform filter does not affect Image Library
Given the user selects a platform filter (e.g. LinkedIn)
Then the Image Library section remains fully visible
And all 6 graphics still appear (graphics are not platform-specific)

---

## User Journey

1. Agent opens Content Studio for a completed kit
2. Agent browses stat callouts and platform captions
3. **Agent scrolls to Image Library** → sees 6 branded graphic cards
4. Alex (Rising Star): grabs the Stat Hero and LinkedIn Banner for a pitch deck
5. Jordan (Established Practitioner): downloads the Pull Quote for her newsletter
6. Agent opens SVG in Canva, resizes, adds their logo — done in 2 minutes

---

## UI Mockup

```
▎🖼 Image Library  6                                      [↻]
──────────────────────────────────────────────────────────

  ┌───────────────────────────┐  ┌───────────────────────────┐
  │  ████████████████████████ │  │  ████████████████████████ │
  │  ██                    ██ │  │  ██  MARKET INTELLIGENCE ██│
  │  ██      90.9%         ██ │  │  ██                    ██ │
  │  ██  (gold, serif, xl) ██ │  │  ██      90.9%         ██ │
  │  ██  Volume Decline    ██ │  │  ██      Volume        ██ │
  │  ██  ────────────────  ██ │  │  ██  ──────────────    ██ │
  │  ██  "The market       ██ │  │  ██      10.3%         ██ │
  │  ██   isn't broken..." ██ │  │  ██      PSF Gain      ██ │
  │  ████████████████████████ │  │  ████████████████████████ │
  │                           │  │                           │
  │  Stat Hero   · Square     │  │  Market Snapshot · Square │
  │                [Download] │  │                [Download] │
  └───────────────────────────┘  └───────────────────────────┘

  ┌───────────────────────────┐  ┌───────────────────────────┐
  │  ████████████████████████ │  │  ████████████████████████ │
  │  ██  "               ██ │  │  ██  90.9% ↓ │ 10.3% ↑  ██│
  │  ██   I've been       ██ │  │  ██  Volume  │  PSF     ██ │
  │  ██   analyzing the   ██ │  │  ██  Decline │  Gain    ██ │
  │  ██   Q1 data..."     ██ │  │  ██          │          ██ │
  │  ██                   ██ │  │  ██  YEAR-OVER-YEAR     ██ │
  │  ██  MARKET TIMING    ██ │  │  ████████████████████████ │
  │  ████████████████████████ │  │                           │
  │                           │  │  YoY Comparison · Wide    │
  │  Pull Quote  · Square     │  │                [Download] │
  │                [Download] │  └───────────────────────────┘
  └───────────────────────────┘

  ┌───────────────────────────┐  ┌───────────────────────────┐
  │  ████████                 │  │  ████████████████████████ │
  │  ██ MARKET INTELLIGENCE ██│  │  ██                    ██ │
  │  ██                    ██ │  │  Newport    │   90.9%  ██ │
  │  ██      90.9%         ██ │  │  Luxury     │   Volume ██ │
  │  ██   NewportLuxury    ██ │  │  Market     │  Decline ██ │
  │  ██                    ██ │  │  ██                    ██ │
  │  ██  "The market isn't ██ │  │  ██  QUARTERLY MARKET  ██ │
  │  ██   broken..."       ██ │  │  ██  INTELLIGENCE      ██ │
  │  ████████                 │  │  ████████████████████████ │
  │                           │  │                           │
  │  Story       · 4:5        │  │  LinkedIn Banner · Wide   │
  │                [Download] │  │                [Download] │
  └───────────────────────────┘  └───────────────────────────┘
```

## Component References

- ImageLibrary: components/reports/image-library.tsx (new file)
- StatCallout data: SocialMediaKitContent.statCallouts
- ConversationStarter data: SocialMediaKitContent.conversationStarters
- PlatformCaption hashtags: SocialMediaKitContent.captions[0].hashtags
- Design tokens: app/globals.css (--color-primary, --color-accent, --font-serif)
- SVG download: native Blob API — no external dependency

## Learnings

