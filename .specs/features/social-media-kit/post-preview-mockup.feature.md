---
feature: Platform Post Preview Mockup
domain: social-media-kit
source: components/reports/kit-viewer.tsx
tests:
  - __tests__/social-media-kit/post-preview.test.ts
components:
  - PostPreview
  - LinkedInPreview
  - InstagramPreview
  - XPreview
  - FacebookPreview
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# Platform Post Preview Mockup

**Source File**: components/reports/kit-viewer.tsx (PostPreview component added inline)
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md

## Feature: Platform Post Preview Mockup

The single most impactful UX feature of the Content Studio: agents see their content rendered as a pixel-faithful mockup of the actual platform post — LinkedIn card, Instagram square, X tweet, Facebook post — before they copy it. The psychological shift from "reading text" to "this is already my post" is the entire value proposition.

Alex (Rising Star) needs to see the LinkedIn post rendered as it will look to a prospect scrolling their feed — profile photo, name, connection degree, formatted body, reactions bar. This removes all friction between "report insight" and "published thought leadership." Jordan (Established Practitioner) wants to preview the full caption on Instagram before committing — character count, hashtag formatting, image placeholder.

A "Preview" toggle button on each Platform Caption card reveals the mockup below the card. A second click collapses it. No navigation. No API calls. Pure client-side rendering using content already in the card.

---

### Scenario: Preview button appears on Platform Caption cards
Given the Platform Captions section is displayed
Then each caption card has a "Preview" button beside the Copy button
And the button shows the platform icon at 12px
And the button label reads "Preview"

### Scenario: Clicking Preview expands the platform mockup
Given a Platform Caption card is displayed
When the user clicks the "Preview" button
Then a platform-specific post mockup animates in below the card (Framer Motion slide-down)
And the button label changes to "Close Preview"
And only one preview can be open at a time per section (opening a new one closes the previous)

### Scenario: LinkedIn preview renders correct chrome
Given a LinkedIn caption card preview is open
Then the mockup shows:
  - A light gray card with LinkedIn's white background and subtle shadow
  - A circular avatar placeholder (navy initials "YN" for "Your Name")
  - The agent name as "Your Name" in bold black
  - Subtitle: "Luxury Real Estate Advisor · 1st" in gray
  - "Just now" timestamp in gray
  - The full caption text, formatted with line breaks preserved
  - Hashtags rendered in LinkedIn blue (#0A66C2)
  - A reaction bar: 👍 Like · 💬 Comment · 🔁 Repost · ✉️ Send
And the mockup has a LinkedIn blue top border (3px)
And a small LinkedIn logo appears in the top-right corner of the card

### Scenario: Instagram preview renders correct chrome
Given an Instagram caption card preview is open
Then the mockup shows:
  - A square image placeholder (aspect ratio 1:1) with a gradient background in brand colors
  - The agent handle "@yourname" and a "Follow" button in the header
  - The caption text below the image, truncated to 125 characters with "... more"
  - Hashtags in Instagram pink (#E4405F)
  - An action bar: ♡ · 💬 · ✈️ · 🔖
  - A "View all N comments" link in gray
And the mockup uses Instagram's clean white background

### Scenario: X (Twitter) preview renders correct chrome
Given an X caption card preview is open
Then the mockup shows:
  - A circular avatar placeholder with "YN" initials
  - The agent name "Your Name" in bold beside "@yourhandle" in gray
  - The full post text (character count must be ≤ 280, shown as warning if exceeded)
  - A character count indicator showing remaining characters
  - An action bar: 💬 · 🔁 · ♡ · 📊 · ↑
And the mockup uses X's dark-tinted border (#0F1419 at 15% opacity)

### Scenario: Facebook preview renders correct chrome
Given a Facebook caption card preview is open
Then the mockup shows:
  - A circular avatar placeholder with "YN" initials
  - The agent name "Your Name" in bold
  - "Just now · 🌐" timestamp
  - The full caption text
  - A reaction bar: 👍 Like · 💬 Comment · ↗️ Share
And the mockup uses Facebook's characteristic white card with light gray background

### Scenario: Character limit warning on X
Given an X caption card preview is open
And the caption text exceeds 280 characters
Then the character count indicator shows the overage in red
And the caption text is truncated at 280 characters with an ellipsis
And a warning label "Exceeds X limit — edit before posting" appears

### Scenario: Preview persists copy button
Given a caption card preview is open
Then the Copy button remains visible above the preview
And clicking Copy copies the full caption text (not just the visible truncated portion)

### Scenario: Closing preview collapses with animation
Given a caption card preview is open
When the user clicks "Close Preview"
Then the mockup collapses with a slide-up/fade-out animation
And the button label reverts to "Preview"

### Scenario: Only one preview open at a time
Given caption card A's preview is open
When the user clicks "Preview" on caption card B
Then card A's preview closes
And card B's preview opens
And the transition is smooth (no jarring layout shift)

### Scenario: Preview also available on Post Ideas
Given a Post Ideas card is displayed
And the post targets a single platform
Then a "Preview" button appears on that card
And clicking it shows the platform mockup using the post body as the caption text
And if the post targets multiple platforms, a platform selector appears in the preview header

### Scenario: Preview on Persona Posts
Given a Persona-Targeted Post card is displayed
Then a "Preview" button appears on the card
And clicking it shows the platform mockup using the post text
And the persona name appears in the avatar placeholder instead of "Your Name"

---

## User Journey

1. Agent opens Content Studio for a completed kit
2. Agent browses Platform Captions section
3. **Agent clicks "Preview" on the LinkedIn caption** → sees their post as it will appear on LinkedIn
4. Agent adjusts their mental model: "This is already my post. I just need to copy and paste."
5. Agent clicks Copy → pastes directly into LinkedIn
6. Agent repeats for Instagram, adjusting their expectation for caption length
7. Agent screenshots the X preview for a client presentation showing their content plan

---

## UI Mockup

```
Platform Captions  4                                    [↻]
──────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐  ← 3px LinkedIn blue left border
│ [🔵 LinkedIn]  587 characters           [Preview] [Copy]│
│                                                         │
│ Newport's luxury market recorded a 90.9% volume         │
│ collapse year-over-year, yet price-per-square-foot      │
│ rose 10.3%...                                           │
│                                                         │
│ #NewportLuxury #RealEstateMarketIntelligence            │  ← gold hashtags
└─────────────────────────────────────────────────────────┘

  ↓ [Preview open — Framer Motion slide-down]

  ┌───────────────────────────────────────────────────┐
  │▐▌▐▌▐▌ (3px LinkedIn blue top border)              │
  │                              [in] (LinkedIn logo) │
  │  ┌──┐  Your Name                                  │
  │  │YN│  Luxury Real Estate Advisor · 1st           │
  │  └──┘  Just now                                   │
  │                                                   │
  │  Newport's luxury market recorded a 90.9%         │
  │  volume collapse year-over-year, yet price-       │
  │  per-square-foot rose 10.3%. This paradox         │
  │  reveals the market's true character: radically   │
  │  selective, not broken...                         │
  │                                                   │
  │  #NewportLuxury #RealEstateMarketIntelligence      │  ← LinkedIn blue
  │  #LuxuryRealEstate #MarketAnalysis                │
  │                                                   │
  │  ─────────────────────────────────────────────    │
  │  👍 Like   💬 Comment   🔁 Repost   ✉️ Send      │
  └───────────────────────────────────────────────────┘

                                           [Close Preview]


Instagram caption — same card, different mockup:

  ┌───────────────────────────────────────────────────┐
  │  [@yourname]                          [Follow]    │
  │  ┌─────────────────────────────────────────────┐  │
  │  │                                             │  │
  │  │   gradient placeholder image (1:1 square)  │  │
  │  │   navy → dark, "Newport Luxury Market"      │  │
  │  │                                             │  │
  │  └─────────────────────────────────────────────┘  │
  │  ♡  💬  ✈️                             🔖         │
  │                                                   │
  │  yourname  90.9% volume decline. 10.3% per-sqft  │
  │  gain. Newport's luxury market isn't broken—      │
  │  it's become radically selective...  more        │
  │                                                   │
  │  View all 24 comments                            │
  │  #NewportLuxury #RealEstateMarketIntelligence     │  ← Instagram pink
  └───────────────────────────────────────────────────┘


X (Twitter) mockup with character warning:

  ┌───────────────────────────────────────────────────┐
  │  ┌──┐  Your Name  @yourhandle                     │
  │  │YN│                                             │
  │  └──┘  90.9% volume decline. 10.3% per-sqft       │
  │        gain. Newport's luxury market isn't         │
  │        broken—it's become radically selective...   │
  │                                                   │
  │        💬 12   🔁 8   ♡ 47   📊 2.1K   ↑        │
  │                                       [247/280]   │  ← character count
  └───────────────────────────────────────────────────┘

  If over 280:
  ┌───────────────────────────────────────────────────┐
  │  ...                              [318/280 ⚠️]    │  ← red
  │  ⚠ Exceeds X limit — edit before posting          │
  └───────────────────────────────────────────────────┘
```

## Component References

- PostPreview: inline within components/reports/kit-viewer.tsx
- Design Tokens: .specs/design-system/tokens.md
- Platform colors: --color-platform-{linkedin|instagram|x|facebook} (in globals.css)
- Animations: lib/animations.ts (slideVariant for expand/collapse)

## Learnings

