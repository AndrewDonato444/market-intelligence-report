---
feature: Social Media Kit Regeneration
domain: social-media-kit
source: app/api/reports/[id]/kit/regenerate/route.ts, lib/services/social-media-kit.ts, lib/agents/social-media.ts, components/reports/kit-viewer.tsx
tests:
  - __tests__/social-media-kit/kit-regeneration.test.ts
components:
  - KitViewer
  - GenerateKitButton
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Social Media Kit Regeneration

**Source Files**: app/api/reports/[id]/kit/regenerate/route.ts, lib/services/social-media-kit.ts, components/reports/kit-viewer.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: Social Media Kit Regeneration (#164)

Agents can regenerate a full social media kit or regenerate specific content types when they want fresh alternatives. Full kit regeneration already works via the existing `POST /api/reports/[id]/kit/generate` endpoint. This feature adds **per-section regeneration** — the agent can request fresh post ideas without losing their existing captions, or regenerate stat callouts while keeping their polls.

Alex (Rising Star) uses this when the first batch of LinkedIn posts doesn't feel punchy enough — they want fresh alternatives without regenerating the entire kit. Taylor (Team Leader) uses it to regenerate persona-targeted posts after realizing a different audience angle works better. Jordan (Established Practitioner) regenerates conversation starters when the initial ones feel too generic for their advisory style.

---

### Scenario: Regenerate a specific content type from the kit viewer
Given a completed social media kit is displayed in the kit viewer
When the agent clicks "Refresh" on the Post Ideas section heading
Then a POST request is sent to `/api/reports/[id]/kit/regenerate` with `{ contentType: "postIdeas" }`
And the section shows a generating indicator (spinner or pulsing state)
And other sections remain fully visible and usable
And when regeneration completes, the section updates with new content
And a brief "Updated!" confirmation appears on the section heading

### Scenario: Regenerate full kit from the kit viewer
Given a completed social media kit is displayed
When the agent clicks "Regenerate Kit" in the header
Then the existing full-kit regeneration flow is triggered (same as today)
And the user is redirected to the report page where polling handles the rest

### Scenario: API accepts per-section regeneration request
Given a completed kit exists for the report
When POST `/api/reports/[id]/kit/regenerate` is called with `{ contentType: "captions" }`
Then the API validates the report belongs to the user
And validates the kit exists and is completed
And validates `contentType` is one of: `postIdeas`, `captions`, `personaPosts`, `polls`, `conversationStarters`, `calendarSuggestions`, `statCallouts`
And the API returns 202 with `{ status: "regenerating", contentType }` once the regeneration starts

### Scenario: API rejects invalid content type
Given a completed kit exists
When POST `/api/reports/[id]/kit/regenerate` is called with `{ contentType: "invalidType" }`
Then the API returns 400 with message "Invalid content type"

### Scenario: API rejects regeneration when no kit exists
Given no social media kit exists for the report
When POST `/api/reports/[id]/kit/regenerate` is called
Then the API returns 404 with message "No social media kit found. Generate a kit first."

### Scenario: API rejects regeneration when kit is still generating
Given a kit with status "generating" exists
When POST `/api/reports/[id]/kit/regenerate` is called with a contentType
Then the API returns 409 with message "Kit is currently being generated. Please wait."

### Scenario: Service regenerates a single content type
Given a completed kit exists with all 7 content types populated
When `regenerateKitSection(reportId, userId, "statCallouts")` is called
Then the Social Media Agent is called with the same report data as the original generation
And the agent is instructed to generate ONLY the requested content type
And the resulting content replaces ONLY the `statCallouts` array in the kit's content JSONB
And all other content type arrays are preserved unchanged
And the kit's `updatedAt` timestamp is refreshed
And the kit status remains "completed" throughout (no intermediate state change)

### Scenario: Service handles agent failure during per-section regeneration
Given a completed kit exists
When `regenerateKitSection` is called but the Claude API returns an error
Then the kit content is NOT modified (original content preserved)
And the kit status remains "completed" (not changed to "failed")
And the error is logged server-side (the API has already returned 202 due to fire-and-forget)

### Scenario: Per-section regeneration for persona posts with no personas
Given a completed kit where `personaPosts` is empty (no personas were selected)
When the agent tries to regenerate persona posts
Then the API returns 400 with message "No personas were selected for this report. Nothing to regenerate."

### Scenario: Refresh button appears on each section heading
Given the kit viewer is displaying a completed kit
Then each content type section has a small "Refresh" icon button next to the heading
And the button uses a subtle refresh icon (not text) to avoid clutter
And hovering the button shows a tooltip: "Generate fresh alternatives"
And the button is disabled while that section is being regenerated

### Scenario: Multiple sections cannot regenerate simultaneously
Given the agent is regenerating the Post Ideas section
When the agent clicks "Refresh" on the Captions section
Then the Captions refresh starts independently
And both sections show their own generating indicators
And they resolve independently as each completes

### Scenario: Regenerated content replaces previous content entirely
Given the kit has 8 post ideas
When the agent regenerates the Post Ideas section
Then the new post ideas completely replace the old ones (no merging)
And the count in the section heading updates to reflect the new count

---

## Architecture

### New API Endpoint

```
POST /api/reports/[id]/kit/regenerate
Body: { contentType: "postIdeas" | "captions" | "personaPosts" | "polls" | "conversationStarters" | "calendarSuggestions" | "statCallouts" }

Returns:
  202: { status: "regenerating", contentType }
  400: { error: "Invalid content type" }
  404: { error: "No social media kit found" }
  409: { error: "Kit is currently being generated" }
  500: { error: "Regeneration failed: ..." } (synchronous errors only; async agent failures are logged server-side)
```

### Service Layer Addition

```
lib/services/social-media-kit.ts
├── (existing) generateSocialMediaKit(reportId, userId) → full kit
├── (new) regenerateKitSection(reportId, userId, contentType) → updated kit
│   ├── Load existing kit + report data (same as full generation)
│   ├── Call executeSocialMediaAgent() with a sectionOnly flag/prompt override
│   ├── Merge: replace only the requested contentType array in existing kit JSONB
│   └── Update kit row (content, updatedAt)
```

### Agent Prompt Modification

The Social Media Agent receives an optional `sectionOnly` parameter:
- When absent or null: generates all 7 content types (existing behavior)
- When set to a content type string: generates ONLY that content type, returning the same JSON shape but with only the requested array populated

The service layer merges the result: `{ ...existingContent, [contentType]: newResult[contentType] }`.

### Kit Viewer Changes

```
components/reports/kit-viewer.tsx
├── (existing) Platform filter, persona filter, copy buttons
├── (new) Per-section refresh button on each SectionHeading
├── (new) Per-section loading state (independent per content type)
├── (new) handleRefreshSection(contentType) → calls regenerate API, polls for result
├── (new) "Updated!" confirmation toast on section heading after refresh
```

---

## User Journey

1. Agent generates a report (existing flow)
2. Agent generates a social media kit (feature #162)
3. Agent views kit in kit viewer (feature #163)
4. Agent reads through post ideas — wants different angles
5. **Agent clicks refresh icon on "Post Ideas" heading**
6. Post Ideas section shows generating state; other sections unchanged
7. New post ideas appear; brief "Updated!" confirmation
8. Agent continues browsing, copies items they like

---

## UI Mockup

```
/reports/[id]/kit (completed kit)
+----------------------------------------------------------+
| <- Back to Report                     [Regenerate Kit]   |
+----------------------------------------------------------+
| Social Media Kit                                         |
| Generated Mar 11, 2026                                   |
+----------------------------------------------------------+
| Platform: [All] [LinkedIn] [Instagram] [X] [Facebook]    |
+----------------------------------------------------------+
|                                                          |
| POST IDEAS (5)                            [↻] ← refresh |
| +------------------------------------------------------+ |
| | The Waterfront Premium Index                  [Copy] | |
| | Naples waterfront properties command a 42%...        | |
| +------------------------------------------------------+ |
|                                                          |
| PLATFORM CAPTIONS (4)                     [↻] ← refresh |
| +------------------------------------------------------+ |
| | ...                                                  | |
| +------------------------------------------------------+ |
|                                                          |
| During section regeneration:                             |
| POST IDEAS                               [↻ spinning]   |
| +------------------------------------------------------+ |
| |  ░░░ Generating fresh alternatives...  ░░░           | |
| +------------------------------------------------------+ |
|                                                          |
| After section refresh completes:                         |
| POST IDEAS (6) ✓ Updated!                [↻]            |
| +------------------------------------------------------+ |
| | (all new content displayed)                          | |
| +------------------------------------------------------+ |
+----------------------------------------------------------+
```

---

## Component References

- KitViewer: components/reports/kit-viewer.tsx (update — add per-section refresh)
- GenerateKitButton: components/reports/generate-kit-button.tsx (no changes needed)
- SectionHeading: internal to kit-viewer.tsx (update — add refresh button + loading/confirmation state)

---

## Minimum Viable Behavior

| Capability | Required for #164 |
|-----------|-------------------|
| Full kit regeneration | Already works (existing #162 API) |
| Per-section regeneration API | Yes — new endpoint |
| Per-section agent call | Yes — prompt modification |
| Content merge in service layer | Yes — replace one array, preserve rest |
| Refresh button on section headings | Yes — UI update |
| Per-section loading indicators | Yes — UX feedback |
| "Updated!" confirmation | Yes — UX feedback |
| Concurrent section regeneration | Nice-to-have (can serialize for v1) |

---

## Learnings

### 2026-03-11
- **Pattern**: Per-section regeneration uses fire-and-forget with `.catch()` for the async service call, returning 202 immediately. Synchronous errors (validation, service constructor) are caught by try/catch and return 500. This matches the existing full-kit generation pattern but is faster since only one content type is regenerated.
- **Decision**: The `sectionOnly` parameter on the agent prompt appends a "SECTION-ONLY REGENERATION" instruction after the full prompt context. The agent sees all report data (for context) but is instructed to populate only the target array. The service merges via `{ ...existingContent, [contentType]: newResult[contentType] }`.
- **Decision**: Kit status remains "completed" throughout per-section regeneration — no intermediate status change. This means the kit viewer can continue displaying all other sections while one regenerates. Errors during per-section regen don't change kit status either (original content preserved).
- **Gotcha**: The spec says "API returns 500" for agent failure, but the async fire-and-forget pattern means the API has already returned 202. Synchronous throws (e.g., "Kit not found") do return 500 — async agent failures are caught by `.catch()` and logged.
- **Pattern**: Per-section refresh in the UI uses independent loading/confirmation state per content type via `Record<string, boolean>`. Each section refreshes independently — no global loading lock. After refresh, polls `/kit/status` for updated content and shows "Updated!" for 3 seconds.
