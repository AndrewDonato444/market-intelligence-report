---
feature: Social Media Kit Viewer
domain: social-media-kit
source: app/(protected)/reports/[id]/kit/page.tsx
tests:
  - __tests__/social-media-kit/kit-viewer.test.ts
components:
  - KitViewer
  - KitContentSection
  - KitContentCard
  - KitPlatformFilter
personas:
  - rising-star-agent
  - established-practitioner
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Social Media Kit Viewer

**Source Files**: app/(protected)/reports/[id]/kit/page.tsx, components/reports/kit-viewer.tsx, app/api/reports/[id]/kit/status/route.ts
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md

## Feature: Social Media Kit Viewer (#163)

Browse a generated social media kit organized by content type. Filter by platform (LinkedIn, Instagram, X, Facebook) and persona. Copy individual items to clipboard. Expandable sections for each content type.

The Rising Star Agent (Alex) wants to quickly grab LinkedIn posts and stat callouts to build credibility. The Established Practitioner (Jordan) wants to review everything methodically and copy curated selections for their audience. Both need fast copy-to-clipboard on each item.

### Scenario: View completed kit organized by content type
Given a completed social media kit exists for a report
When the user navigates to /reports/[id]/kit
Then the kit content is displayed organized into sections:
  | Section              | Content Type         |
  | Post Ideas           | postIdeas            |
  | Platform Captions    | captions             |
  | Persona-Targeted     | personaPosts         |
  | Polls                | polls                |
  | Conversation Starters| conversationStarters |
  | Stat Callouts        | statCallouts         |
  | Content Calendar     | calendarSuggestions  |

### Scenario: Filter content by platform
Given the kit viewer is displayed
When the user clicks a platform filter (LinkedIn, Instagram, X, Facebook)
Then content items with a platform field are filtered (postIdeas, captions, personaPosts, polls)
And sections without a platform field always display (conversationStarters, statCallouts, calendarSuggestions)
And the active filter is visually highlighted
And clicking "All" resets the filter

### Scenario: Filter content by persona
Given the kit has persona-targeted posts
When the user selects a persona filter
Then only persona posts for that persona are shown
And the platform filter still applies additively

### Scenario: Copy individual item to clipboard
Given the user is viewing kit content
When the user clicks the copy button on any content item
Then the text content is copied to the clipboard
And a brief "Copied!" confirmation appears
And the confirmation fades after 2 seconds

### Scenario: Kit not found
Given no social media kit exists for the report
When the user navigates to /reports/[id]/kit
Then a message "No social media kit found" is shown
And a "Generate Kit" call-to-action is displayed

### Scenario: Kit is still generating (or queued)
Given a kit with status "generating" or "queued" exists
When the user navigates to /reports/[id]/kit
Then a generating status message is shown
And a GenerateKitButton with the current status handles polling for completion

### Scenario: Navigate back to report
Given the user is viewing the kit
When the user clicks the back link
Then they return to the report detail page

### Scenario: Empty persona posts (no personas selected)
Given the kit was generated for a report with no persona selections
When the user views the kit
Then the "Persona-Targeted" section shows a message "No personas were selected for this report"
And all other sections display normally

### Scenario: Kit generation failed
Given a kit with status "failed" exists
When the user navigates to /reports/[id]/kit
Then a "Kit Generation Failed" heading is shown
And the error message from the kit is displayed
And a GenerateKitButton with "failed" status allows retry

### Scenario: Regenerate from viewer
Given the user is viewing a completed kit
When the user clicks "Regenerate Kit"
Then kit generation is triggered via POST /api/reports/[id]/kit/generate
And the user is redirected to the report detail page

### Scenario: API returns kit content for authorized user
Given a completed kit exists for the user's report
When GET /api/reports/[id]/kit/status is called
Then it returns the kit with full content JSONB
And includes status, generatedAt, and content fields

## User Journey

1. User generates a report (existing flow)
2. Report completes -> user sees "Generate Social Media Kit" button
3. User clicks generate -> kit is created
4. Button changes to "View Social Media Kit" (link to /reports/[id]/kit)
5. **User views kit organized by content type**
6. **User filters by platform or persona**
7. **User copies individual items to clipboard**
8. User pastes into their social media scheduling tool

## UI Mockup

```
/reports/[id]/kit
+----------------------------------------------------------+
| <- Back to Report                     [Regenerate Kit]   |
+----------------------------------------------------------+
| Social Media Kit                                         |
| Generated Mar 11, 2026                                   |
+----------------------------------------------------------+
| Platform: [All] [LinkedIn] [Instagram] [X] [Facebook]    |
+----------------------------------------------------------+
|                                                          |
| POST IDEAS (5)                                           |
| +------------------------------------------------------+ |
| | The Waterfront Premium Index                   [Copy] | |
| | Naples waterfront properties command a 42%...        | |
| | Platforms: LinkedIn, Instagram                       | |
| +------------------------------------------------------+ |
|                                                          |
| PLATFORM CAPTIONS (4)                                    |
| +------------------------------------------------------+ |
| | LinkedIn                                       [Copy] | |
| | "The luxury market is telling a story that...        | |
| | #LuxuryRealEstate #MarketIntelligence (187 chars)    | |
| +------------------------------------------------------+ |
|                                                          |
| PERSONA-TARGETED POSTS (3)                               |
| Persona: [All] [The International Buyer] [The Exec...]  |
| +------------------------------------------------------+ |
| | For: The International Buyer                   [Copy] | |
| | Platform: LinkedIn                                   | |
| | "For global investors evaluating the US luxury..."   | |
| +------------------------------------------------------+ |
|                                                          |
| POLLS (2)                                                |
| +------------------------------------------------------+ |
| | What's driving your luxury market decisions?   [Copy] | |
| | - Location & lifestyle                               | |
| | - Investment potential                               | |
| | Context: Based on Q1 buyer motivation data           | |
| | Platform: LinkedIn                                   | |
| +------------------------------------------------------+ |
|                                                          |
| CONVERSATION STARTERS (3)                                |
| +------------------------------------------------------+ |
| | Market Timing                                  [Copy] | |
| | "I've been analyzing the Q1 transaction data..."     | |
| +------------------------------------------------------+ |
|                                                          |
| STAT CALLOUTS (4)                                        |
| +------------------------------------------------------+ |
| | 42% Waterfront Premium                         [Copy] | |
| | Naples waterfront properties command 42% above...    | |
| | Source: Q1 2026 MLS transaction data                 | |
| | Caption: "The waterfront premium tells the..."       | |
| +------------------------------------------------------+ |
|                                                          |
| CONTENT CALENDAR (4 weeks)                               |
| +------------------------------------------------------+ |
| | Week 1: Market Intelligence Launch                   | |
| | Posts: "Waterfront Premium reveal", "Q1 snapshot"    | |
| | Platforms: LinkedIn, Instagram                       | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

## Component References

- GenerateKitButton: components/reports/generate-kit-button.tsx (update to link to kit viewer)
- KitViewer: components/reports/kit-viewer.tsx (new)
