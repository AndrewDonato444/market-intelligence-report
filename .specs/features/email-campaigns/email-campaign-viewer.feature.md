---
feature: Bulk Email Campaign Viewer
domain: email-campaigns
source: app/(protected)/reports/[id]/emails/page.tsx
tests:
  - __tests__/email-campaigns/email-campaign-viewer.test.ts
components:
  - EmailCampaignViewer
  - EmailContentSection
  - EmailContentCard
  - GenerateEmailButton
  - EmailPersonaFilter
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-12
updated: 2026-03-13
---

# Bulk Email Campaign Viewer

**Source Files**: app/(protected)/reports/[id]/emails/page.tsx, components/reports/email-viewer.tsx, components/reports/generate-email-button.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: Bulk Email Campaign Viewer (#167)

Browse a generated email campaign organized by content type — drip sequences, newsletters, persona-targeted emails, subject line variants, CTA blocks, and re-engagement templates. Filter by persona. Copy individual items to clipboard. Preview email formatting with subject lines, preview text, and body structure visible.

The backend is fully built (feature #166): agent, service, API routes (`/api/reports/[id]/email-campaign/generate`, `/api/reports/[id]/email-campaign/status`, `/api/reports/[id]/email-campaign/regenerate`), and database table (`email_campaigns`) all exist. This feature adds the UI layer.

Alex (Rising Star) wants to quickly grab drip sequence emails and subject line variants to nurture HNWIs after listing presentations — copy, paste into their CRM, and go. Jordan (Established Practitioner) wants to review the full newsletter methodically and copy curated blocks for their quarterly intelligence brief to wealth managers. Taylor (Team Leader) wants to distribute standardized email templates across 10 agents — browsing by content type and copying persona-targeted variants for each team member's client base.

---

### Scenario: View completed campaign organized by content type
Given a completed email campaign exists for a report
When the user navigates to /reports/[id]/emails
Then the campaign content is displayed organized into sections:
  | Section                | Content Type       |
  | Drip Sequence          | dripSequence       |
  | Market Update Newsletter | newsletter       |
  | Persona-Targeted Emails | personaEmails     |
  | Subject Line Variants  | subjectLines       |
  | CTA Blocks             | ctaBlocks          |
  | Re-Engagement Emails   | reEngagementEmails |
And each section shows a count of items
And the page title includes the report market name

### Scenario: View drip sequence with progressive story structure
Given the campaign has a drip sequence of 4-5 emails
When the user views the "Drip Sequence" section
Then each email is displayed as a card showing:
  | Field         | Display                              |
  | Day offset    | "Day 0", "Day 3", "Day 7", etc.     |
  | Subject line  | Bold, prominent                       |
  | Preview text  | Muted text below subject              |
  | Body          | Full email body (collapsible)         |
  | CTA           | Highlighted call-to-action            |
  | Report section| Badge showing which section it draws from |
And emails are ordered by `sequenceOrder` (ascending)
And the section header reads "Post-Meeting Drip Sequence"
And each card has a copy button that copies subject + body + CTA

### Scenario: View market update newsletter
Given the campaign has a newsletter
When the user views the "Market Update Newsletter" section
Then the newsletter displays:
  | Element        | Display                             |
  | Headline       | Large heading (font-serif)           |
  | Subheadline    | Secondary text below headline        |
  | Content blocks | Expandable cards with heading + body + metric callout |
  | Footer CTA     | Highlighted at the bottom            |
And each content block shows its key metric callout prominently
And the section header reads "Market Intelligence Newsletter"
And a "Copy Full Newsletter" button copies the entire newsletter as formatted text

### Scenario: Filter persona-targeted emails by persona
Given the campaign has persona-targeted emails for multiple personas
When the user views the "Persona-Targeted Emails" section
Then persona filter pills are shown (one per persona in the campaign)
And clicking a persona pill shows only emails for that persona
And each email card shows:
  | Field           | Display                                |
  | Persona name    | Badge with persona name                |
  | Subject line    | Bold, prominent                         |
  | Preview text    | Muted text below subject                |
  | Body            | Full email body (collapsible)           |
  | CTA             | Highlighted call-to-action              |
  | Vocabulary used | Small tags showing persona vocabulary   |
And clicking "All" resets the persona filter
And the active filter pill is visually highlighted (bg: accent-light)

### Scenario: Empty persona emails when no personas selected
Given the campaign was generated for a report with no persona selections
When the user views the "Persona-Targeted Emails" section
Then the section shows "No buyer personas were selected for this report"
And a subtle prompt: "Add personas to your next report for targeted email copy"
And all other sections display normally

### Scenario: View subject line variants with style labels
Given the campaign has subject line sets
When the user views the "Subject Line Variants" section
Then each set is grouped by email context (e.g., "Drip Email 1", "Newsletter", "Re-Engagement")
And within each group, 3 variants are shown:
  | Variant Style   | Visual Label     |
  | data-forward    | "Data-Forward"   |
  | curiosity       | "Curiosity"      |
  | urgency         | "Urgency"        |
And each variant shows the subject line and matching preview text
And each variant has its own copy button (copies subject + preview text)
And style labels use muted badge styling (bg: primary-light, text: text-secondary)

### Scenario: View CTA blocks with placement context
Given the campaign has CTA blocks
When the user views the "CTA Blocks" section
Then each CTA card shows:
  | Field          | Display                               |
  | Button text    | Styled as a button preview (bg: accent) |
  | Supporting copy| Text below the button preview          |
  | Context        | Where in the email to use it           |
  | Placement      | Badge: "Primary" or "Inline"          |
And each card has a copy button that copies buttonText + supportingCopy

### Scenario: View re-engagement emails
Given the campaign has re-engagement templates
When the user views the "Re-Engagement Emails" section
Then each template card shows:
  | Field | Display                               |
  | Hook  | Bold opening line — the "surprising stat" lead |
  | Body  | Full email body (collapsible)          |
  | CTA   | Low-friction call-to-action             |
  | Tone  | Small badge (e.g., "Warm", "Advisory") |
And the section header reads "Re-Engagement Templates"
And each card has a copy button

### Scenario: Copy individual item to clipboard
Given the user is viewing campaign content
When the user clicks the copy button on any content card
Then the relevant text content is copied to the clipboard
And a brief "Copied!" confirmation appears on the button
And the confirmation fades after 2 seconds
And the copy format preserves line breaks and structure

### Scenario: Copy full newsletter to clipboard
Given the user is viewing the newsletter section
When the user clicks "Copy Full Newsletter"
Then the headline, subheadline, all content blocks (with headings and body), and footer CTA are copied as a single formatted text block
And a "Copied!" confirmation appears

### Scenario: Campaign not found — show generate action
Given no email campaign exists for the report
When the user navigates to /reports/[id]/emails
Then a message "No email campaign has been generated yet" is shown
And a "Generate Email Campaign" call-to-action button is displayed
And the button triggers POST /api/reports/[id]/email-campaign/generate
And the page shows a brief description: "Generate drip sequences, newsletters, and persona-targeted emails from your report data"

### Scenario: Campaign is still generating
Given a campaign with status "generating" or "queued" exists
When the user navigates to /reports/[id]/emails
Then a generating status message is shown: "Your email campaign is being generated..."
And a progress indicator or spinner is displayed
And the embedded GenerateEmailButton polls GET /api/reports/[id]/email-campaign/status every 3 seconds
And when status changes to "completed", a "View Email Campaign" link appears (page is server-rendered, so user clicks to see the viewer)

### Scenario: Campaign generation failed
Given a campaign with status "failed" exists
When the user navigates to /reports/[id]/emails
Then a "Campaign Generation Failed" heading is shown
And the error message from the campaign is displayed
And a "Retry" button allows re-triggering generation
And the retry button triggers the same generate endpoint

### Scenario: Navigate back to report
Given the user is viewing the email campaign
When the user clicks the back link
Then they return to the report detail page at /reports/[id]

### Scenario: Refresh individual content section
Given the user is viewing a completed campaign
When the user clicks the refresh icon on any content section header
Then POST /api/reports/[id]/email-campaign/regenerate is called with that section's contentType
And the section shows a spinning refresh indicator while regenerating
And after regeneration completes, the section content updates in place
And an "Updated!" indicator appears for 3 seconds
And the refresh icon is available on all 6 content sections

### Scenario: Regenerate campaign from viewer
Given the user is viewing a completed campaign
When the user clicks "Regenerate Campaign"
Then a confirmation popover appears below the button: "This will replace your current email campaign. Continue?"
And on confirm, POST /api/reports/[id]/email-campaign/generate is called
And the page redirects to the report detail page (which shows generating state)
And on cancel, the popover closes and nothing happens

### Scenario: Generate Email Campaign button on report detail page
Given a completed report exists
When the user views the report detail page
Then a "Generate Email Campaign" button is shown (if no campaign exists)
Or a "View Email Campaign" link is shown (if campaign is completed), with a "Regenerate" button beside it
Or a "Generating Email Campaign..." disabled button is shown (if campaign is in progress)
Or a failed state with error message and "Retry" button is shown (if generation failed)
And the button/link follows the same pattern as the social media kit button
And the component supports a `compact` prop for condensed display (shorter labels like "Generate Emails", "View Emails", "Retry Emails")

### Scenario: API returns campaign content for authorized user
Given a completed campaign exists for the user's report
When GET /api/reports/[id]/email-campaign/status is called
Then it returns the campaign with full content JSONB
And includes status, generatedAt, and content fields
And returns 404 if no campaign exists
And returns 403 if the report belongs to another user

---

## User Journey

1. Agent generates a report (existing flow)
2. Report completes — agent sees report detail page
3. Agent may generate a Social Media Kit (existing feature #162-#163)
4. **Agent clicks "Generate Email Campaign" on report detail page**
5. Campaign generates (polling state with progress indicator)
6. **Agent clicks "View Email Campaign" → navigates to /reports/[id]/emails**
7. **Agent browses by content type — drip sequence, newsletter, persona emails**
8. **Agent filters persona emails by buyer persona**
9. **Agent copies individual items or full newsletter to clipboard**
10. Agent pastes into their CRM, email tool, or newsletter platform

---

## UI Mockup

```
/reports/[id]/emails
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Report                          [Regenerate Campaign] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Email Campaign                                              │
│  (font: serif, text: 2xl, weight: bold, color: text)        │
│  Generated Mar 12, 2026 (text: sm, color: text-secondary)   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  POST-MEETING DRIP SEQUENCE (5)                              │
│  (font: sans, text: xs, weight: semibold, color: text-secondary, │
│   uppercase, letter-spacing: tracked)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Day 0 · Thank You + Key Stat            [Copy] │  │
│  │ (badge: bg primary-light, text: text-secondary)       │  │
│  │                                                        │  │
│  │ Subject: Your market outperformed Miami Beach by 12%   │  │
│  │ (font: sans, text: base, weight: semibold)             │  │
│  │                                                        │  │
│  │ Preview: Here's what that means for your portfolio...  │  │
│  │ (font: sans, text: sm, color: text-secondary)          │  │
│  │                                                        │  │
│  │ ▼ View Full Email                                      │  │
│  │ (collapsible body - font: sans, text: sm)              │  │
│  │                                                        │  │
│  │ CTA: Schedule a market briefing →                      │  │
│  │ (color: accent, weight: semibold)                      │  │
│  │                                                        │  │
│  │ Source: Executive Summary                              │  │
│  │ (badge: bg primary-light, radius: full, text: xs)      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Day 3 · Key Driver Deep Dive            [Copy] │  │
│  │ ...                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  MARKET INTELLIGENCE NEWSLETTER (1)     [Copy Full Newsletter] │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Naples Ultra-Luxury: Q1 2026 Intelligence Brief        │  │
│  │ (font: serif, text: xl, weight: bold)                  │  │
│  │                                                        │  │
│  │ What the latest transaction data reveals about your    │  │
│  │ market — and what it means for your clients            │  │
│  │ (font: sans, text: base, color: text-secondary)        │  │
│  │                                                        │  │
│  │ ┌──────────────────────────────────────────────────┐   │  │
│  │ │ The Waterfront Premium Story                     │   │  │
│  │ │ $6.58B (color: accent, text: 2xl, weight: light) │   │  │
│  │ │ Total luxury transaction volume...               │   │  │
│  │ │ [Copy Block]                                     │   │  │
│  │ └──────────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │ ┌──────────────────────────────────────────────────┐   │  │
│  │ │ Forward Outlook                                  │   │  │
│  │ │ 12% YoY (color: success, text: 2xl)              │   │  │
│  │ │ Growth trajectory analysis...                    │   │  │
│  │ │ [Copy Block]                                     │   │  │
│  │ └──────────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │ Footer CTA: "Schedule a market advisory session"       │  │
│  │ (bg: accent, color: primary, radius: sm, weight: semibold) │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PERSONA-TARGETED EMAILS (6)                                 │
│  Persona: [All] [PE Principal] [Legacy Wealth]               │
│  (filter pills: bg surface, border: border, radius: full,    │
│   active: bg accent-light, border: accent)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ PE Principal                              [Copy] │  │
│  │ (badge: bg accent-light, text: xs, radius: full)       │  │
│  │                                                        │  │
│  │ Subject: The ROI case for Naples waterfront — by the   │  │
│  │ numbers                                                │  │
│  │ (font: sans, text: base, weight: semibold)             │  │
│  │                                                        │  │
│  │ Preview: Tax efficiency + 42% premium + constrained... │  │
│  │ (font: sans, text: sm, color: text-secondary)          │  │
│  │                                                        │  │
│  │ ▼ View Full Email                                      │  │
│  │                                                        │  │
│  │ CTA: Review the full market intelligence brief →       │  │
│  │                                                        │  │
│  │ Vocabulary: ROI · tax efficiency · capital allocation   │  │
│  │ (tags: bg primary-light, text: xs, radius: sm)         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  SUBJECT LINE VARIANTS (5 sets)                              │
│                                                              │
│  Drip Email 1                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Data-Forward                              [Copy] │  │
│  │ (badge: bg primary-light, text: xs)                    │  │
│  │ "$6.58B in luxury transactions — here's your edge"     │  │
│  │ Preview: The numbers your clients need to see          │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Curiosity                                 [Copy] │  │
│  │ "Is your market outperforming Miami Beach?"            │  │
│  │ Preview: The answer might surprise your clients        │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Urgency                                   [Copy] │  │
│  │ "The 90-day window in your market"                     │  │
│  │ Preview: Timing signals from Q1 transaction data       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CTA BLOCKS (5)                                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Primary                                   [Copy] │  │
│  │ (badge: bg accent-light)                               │  │
│  │                                                        │  │
│  │ ┌──────────────────────────────────────────┐           │  │
│  │ │  Schedule a Market Briefing              │           │  │
│  │ │  (bg: accent, color: primary, radius: sm) │           │  │
│  │ └──────────────────────────────────────────┘           │  │
│  │                                                        │  │
│  │ "Get a personalized walkthrough of your market's       │  │
│  │ key intelligence — 15 minutes, data-driven."           │  │
│  │ (font: sans, text: sm, color: text-secondary)          │  │
│  │                                                        │  │
│  │ Context: End of drip sequence / newsletter              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  RE-ENGAGEMENT TEMPLATES (3)                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Warm · Advisory                           [Copy] │  │
│  │ (tone badges: bg primary-light, text: xs)              │  │
│  │                                                        │  │
│  │ Hook: "While most markets cooled, yours grew 12%"      │  │
│  │ (font: sans, text: base, weight: semibold, color: text) │  │
│  │                                                        │  │
│  │ ▼ View Full Email                                      │  │
│  │                                                        │  │
│  │ CTA: Reply "interested" for the full briefing          │  │
│  │ (color: accent, weight: medium)                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Empty / Generating / Failed States

```
/reports/[id]/emails (no campaign exists)
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Report                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  No email campaign has been generated yet                    │
│  (font: sans, text: lg, color: text)                        │
│                                                              │
│  Generate drip sequences, newsletters, and persona-targeted  │
│  emails from your report data.                               │
│  (font: sans, text: sm, color: text-secondary)              │
│                                                              │
│  [ Generate Email Campaign ]                                │
│  (bg: accent, color: primary, radius: sm, weight: semibold) │
│                                                              │
└──────────────────────────────────────────────────────────────┘

/reports/[id]/emails (generating)
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Report                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Your email campaign is being generated...                   │
│  (font: sans, text: lg, color: text)                        │
│                                                              │
│  [  ═══════════░░░  ]  (animated progress bar)              │
│                                                              │
│  Crafting drip sequences, newsletters, and persona copy      │
│  from your market intelligence data.                         │
│  (font: sans, text: sm, color: text-secondary)              │
│                                                              │
└──────────────────────────────────────────────────────────────┘

/reports/[id]/emails (failed)
┌──────────────────────────────────────────────────────────────┐
│ ← Back to Report                                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Campaign Generation Failed                                  │
│  (font: sans, text: lg, color: error)                       │
│                                                              │
│  Error: Rate limit exceeded. Please try again in a moment.  │
│  (font: sans, text: sm, color: text-secondary)              │
│                                                              │
│  [ Retry ]                                                  │
│  (bg: accent, color: primary, radius: sm)                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Component References

- **EmailCampaignViewer**: components/reports/email-viewer.tsx (new — mirrors kit-viewer.tsx pattern)
- **GenerateEmailButton**: components/reports/generate-email-button.tsx (new — mirrors generate-kit-button.tsx pattern)
- **EmailContentSection**: Reusable section wrapper with title, count badge, optional action button
- **EmailContentCard**: Reusable card with subject/body/CTA layout, copy button, collapsible body
- **EmailPersonaFilter**: Persona filter pills (reusable from kit-viewer if extracted, or new)

### Component Stubs Needed

- `.specs/design-system/components/email-viewer.md`
- `.specs/design-system/components/generate-email-button.md`

---

## Implementation Notes

### Pattern: Mirror Social Media Kit Viewer

This feature follows the exact same pattern as the Social Media Kit Viewer (#163):

| Social Media Kit | Email Campaign | Notes |
|-----------------|---------------|-------|
| `/reports/[id]/kit/page.tsx` | `/reports/[id]/emails/page.tsx` | Same async page pattern |
| `kit-viewer.tsx` | `email-viewer.tsx` | Content sections differ |
| `generate-kit-button.tsx` | `generate-email-button.tsx` | Same polling pattern |
| `GET /api/reports/[id]/kit/status` | `GET /api/reports/[id]/email-campaign/status` | Already exists |
| `POST /api/reports/[id]/kit/generate` | `POST /api/reports/[id]/email-campaign/generate` | Already exists |

### API Routes (Already Built)

All backend routes exist from feature #166:
- `POST /api/reports/[id]/email-campaign/generate` — triggers generation (202 response)
- `GET /api/reports/[id]/email-campaign/status` — returns campaign with content
- `POST /api/reports/[id]/email-campaign/regenerate` — regenerates specific content type

### Key Differences from Kit Viewer

1. **No platform filter** — email content isn't platform-specific (unlike social media posts)
2. **Persona filter only** — applies to `personaEmails` section
3. **Collapsible email bodies** — emails are longer than social posts, so bodies collapse by default
4. **Subject + preview text** — email-specific fields that don't exist in social media content
5. **Drip sequence ordering** — emails must display in sequence order with day offset badges
6. **Newsletter is singular** — one newsletter with multiple content blocks, not a list of items
7. **Copy Full Newsletter** — bulk copy action for the entire newsletter as formatted text
8. **CTA button preview** — CTA blocks render with a visual button preview, not just text

---

## Persona Revision Notes

After drafting, the spec was revised through persona lenses:

- **Alex (Rising Star)**: Changed section headers to use advisory vocabulary — "Post-Meeting Drip Sequence" not "Follow-Up Emails", "Market Intelligence Newsletter" not "Market Update Newsletter". Alex copies drip sequences into their CRM immediately after listing presentations — the copy button must be one-click, no confirmation dialogs. Subject line variants are Alex's favorite — 3 options per context means Alex can A/B test without writing anything.

- **Jordan (Established Practitioner)**: Newsletter section is Jordan's primary use case — the "Copy Full Newsletter" action lets Jordan paste an entire quarterly intelligence brief into their email tool. Ensured newsletter heading uses font-serif (Playfair Display) — Jordan treats this as a publication, not a blast. Vocabulary tags on persona emails help Jordan verify the tone matches what wealth managers expect.

- **Taylor (Team Leader)**: The organized-by-content-type layout lets Taylor distribute different sections to different team members — "you get the drip sequence, you get the newsletter." Persona filter is critical for Taylor: 10 agents serving different buyer types each need persona-targeted variants. Copy-to-clipboard on everything means Taylor can paste into a shared doc for the team.

- **Anti-persona (Report Reader)**: Ensured no hedging in the UI copy. Description says "Generate drip sequences, newsletters, and persona-targeted emails" — clear, direct, no "you might want to consider." Error states are helpful, not apologetic.

---

## Learnings

### 2026-03-12
- **Pattern**: Mirrored the kit-viewer.tsx pattern (CopyButton, SectionHeading, Card components) but added email-specific CollapsibleBody and Badge components. The refresh/regenerate polling pattern is identical.
- **Decision**: Persona filter pills use `rounded-full` + `accent-light` active state (per spec mockup) rather than the kit viewer's `primary bg + white text` pattern. This better matches the email campaign's persona-centric UI.
- **Decision**: Regeneration uses a lightweight popover confirmation instead of a modal — simpler implementation, no portal/backdrop needed, positioned absolute relative to the button.
- **Gotcha**: The status endpoint returns `data.campaign.content` (not `data.kit.content`) — the key name differs from the social media kit API response shape.
- **Pattern**: Newsletter copy text composition: headline + subheadline + blocks (each: heading + keyMetric + body) + footerCta, joined with double newlines for readability when pasted.
