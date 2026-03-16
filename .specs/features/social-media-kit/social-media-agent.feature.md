---
feature: Social Media Agent
domain: social-media-kit
source: lib/agents/social-media.ts
tests:
  - __tests__/agents/social-media.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-11
updated: 2026-03-16
---

# Social Media Agent

**Source File**: lib/agents/social-media.ts
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: Social Media Agent (#161)

The Social Media Agent is a Claude-powered agent that reads a finalized report's assembled sections and generates a comprehensive social media content kit. It follows the same agent pattern as `persona-intelligence.ts` — exports an `AgentDefinition`, uses `buildSystemPrompt()`/`buildUserPrompt()`, and returns structured JSON matching the `SocialMediaKitContent` type already defined in `lib/db/schema.ts`.

**Unlike the report pipeline agents**, this agent runs **independently** — not as part of the 4-layer pipeline. It is triggered on-demand after a report is finalized, and writes directly to the `social_media_kits` table rather than producing `SectionOutput[]`.

This is a content marketing engine for luxury agents. Alex (Rising Star) uses it to build credibility on LinkedIn. Taylor (Team Leader) uses it to standardize the team's social presence. Jordan (Established Practitioner) uses it to re-engage past clients with data-backed thought leadership.

---

### Scenario: Agent generates a complete kit from a finalized report
Given a report with status "completed" and assembled sections stored in the database
And the report has computed analytics and agent narratives available
When the Social Media Agent is executed with the report ID
Then the agent produces a `SocialMediaKitContent` object with all 7 content types populated
And every post idea references a specific report section and insight
And every stat callout quotes a real number from the report data
And the kit is stored in the `social_media_kits` table with status "completed"

### Scenario: Agent generates platform-specific captions
Given a finalized report with market data
When the Social Media Agent generates captions
Then LinkedIn captions are 150-300 words with thought-leadership framing and professional tone
And Instagram captions are 50-150 words with hooks and 10-15 relevant hashtags
And X/Twitter captions are under 280 characters with a compelling stat or question
And Facebook captions are 100-200 words with community-oriented framing
And each caption references real data from the report (not generic advice)

### Scenario: Agent generates persona-targeted posts when report includes personas
Given a finalized report that was generated with buyer personas selected (e.g., "Private Equity Principal" and "Retiring UHNW")
When the Social Media Agent generates persona posts
Then each selected persona gets 2-3 posts using that persona's vocabulary
And posts for "Private Equity Principal" emphasize ROI, tax efficiency, and market intelligence
And posts for "Retiring UHNW" emphasize lifestyle, design quality, and experience
And each persona post specifies the target platform
And persona posts use vocabulary from the persona's `keyVocabulary` list

### Scenario: Agent generates persona-targeted posts when no personas selected
Given a finalized report with no buyer personas
When the Social Media Agent generates the kit
Then the `personaPosts` array is empty
And all other content types are still generated normally

### Scenario: Agent generates data-backed poll ideas
Given a finalized report with segment-level analytics
When the Social Media Agent generates polls
Then each poll question is tied to a real insight from the report
And poll options are plausible and data-informed (not random)
And each poll includes `dataContext` explaining the data behind the question
And polls are platform-appropriate (LinkedIn polls get 4 options, X polls get 2-4)

### Scenario: Agent generates conversation starters
Given a finalized report
When the Social Media Agent generates conversation starters
Then each starter provides a `context` describing when to use it (e.g., "When a follower asks about market timing")
And each starter provides a `template` with a natural, agent-voiced response referencing report data
And starters are written from the agent's perspective as a market expert

### Scenario: Agent generates a content calendar
Given a finalized report
When the Social Media Agent generates calendar suggestions
Then the calendar spans 4 weeks
And each week has a theme tied to a report section (e.g., Week 1: headline stats, Week 2: key driver deep dive)
And each week suggests 2-3 specific post ideas with target platforms
And the cadence builds from attention-grabbing stats to deeper analysis

### Scenario: Agent generates stat callouts
Given a finalized report with computed analytics showing real numbers
When the Social Media Agent generates stat callouts
Then each callout contains a `stat` (the number), `context` (why it matters), and `source` (which report section)
And each `suggestedCaption` is a ready-to-post snippet that frames the stat compellingly
And stats are real values from computed analytics (total volume, median price, YoY changes, segment counts)
And no stats are fabricated or hallucinated

### Scenario: Agent handles missing or malformed computedAnalytics gracefully
Given a finalized report where `report.config.computedAnalytics` is missing
And the fallback `analyticsSection.content` has a different shape (e.g., `{dashboard, detailMetrics, narrative}`)
When the Social Media Agent is executed
Then the agent does NOT crash with "Cannot read properties of undefined"
And the agent generates the kit using report section narratives only (without key metrics table)
And all 7 content types are still populated

### Scenario: Agent handles report with minimal data gracefully
Given a finalized report where some sections have thin data (e.g., only 3 transactions, no YoY comparison available)
When the Social Media Agent generates the kit
Then the agent still produces all 7 content types
And posts/callouts reference only the data that exists (no fabricated comparisons)
And the agent focuses on available insights rather than apologizing for missing data

### Scenario: Agent output matches SocialMediaKitContent schema exactly
Given the Social Media Agent has finished generating content
When the output is validated against the `SocialMediaKitContent` type from `lib/db/schema.ts`
Then every field matches the expected type
And `postIdeas` each have `title`, `body`, `platforms[]`, `reportSection`, `insightRef`
And `captions` each have `platform`, `caption`, `hashtags[]`, `characterCount`
And `personaPosts` each have `personaSlug`, `personaName`, `post`, `platform`, `vocabularyUsed[]`
And `polls` each have `question`, `options[]`, `dataContext`, `platform`
And `conversationStarters` each have `context`, `template`
And `calendarSuggestions` each have `week`, `theme`, `postIdeas[]`, `platforms[]`
And `statCallouts` each have `stat`, `context`, `source`, `suggestedCaption`

### Scenario: Agent execution records token usage and timing
Given the Social Media Agent is executed
When the agent completes
Then the result includes `durationMs` (total execution time)
And the result includes metadata with `promptTokens`, `completionTokens`, and `modelUsed`
And these metrics are available for cost tracking and admin analytics

### Scenario: Agent handles Claude API errors gracefully
Given the Social Media Agent is called but the Claude API returns an error (rate limit, timeout, etc.)
When the error occurs
Then the kit status is updated to "failed" in the `social_media_kits` table
And the `errorMessage` column stores the error details
And the error is retriable (rate limit or transient) or terminal (schema/validation failure)

### Scenario: Agent voices content from the agent's perspective
Given a finalized report for a market (e.g., "Naples, FL — Ultra-Luxury")
When the Social Media Agent generates content
Then all posts, captions, and starters are written from the luxury agent's voice — not MSA's
And content sounds like "Our latest market analysis reveals..." not "Modern Signal Advisory found..."
And the tone is authoritative but approachable — an "executive briefing" not a "data dump"

---

## Architecture

### Agent Pattern

The Social Media Agent follows the established agent pattern in `lib/agents/`:

```
lib/agents/social-media.ts
├── SocialMediaAgentInput (interface) — report sections, analytics, market, personas
├── SocialMediaAgentResult (interface) — content + durationMs + metadata
├── buildSystemPrompt() → Claude system message
├── buildUserPrompt(input: SocialMediaAgentInput) → formatted report data for Claude
├── executeSocialMediaAgent(input: SocialMediaAgentInput) → SocialMediaAgentResult
└── Export: not an AgentDefinition (not in pipeline) — standalone async function
```

**Key difference from pipeline agents**: This agent is **not registered** in the pipeline runner's `ALL_AGENTS` array. It runs independently, triggered by a service function — not the orchestrator.

### Input

The agent receives:
1. **Report sections** — all assembled report content (market overview, executive summary, key drivers, forecasts, competitive analysis, trending insights, methodology, strategic summary)
2. **Computed analytics** — raw numbers (total volume, median price, YoY changes, segment breakdowns) for stat accuracy
3. **Selected personas** (if any) — buyer persona specs from the report's configuration, with vocabulary and decision drivers
4. **Market definition** — city, state, tier, segments for contextual framing

### Output

Returns `SocialMediaKitContent` (already defined in `lib/db/schema.ts`) — 7 content type arrays.

### Service Layer

A service function orchestrates the full flow:

```
lib/services/social-media-kit.ts
├── generateSocialMediaKit(reportId, userId) → SocialMediaKitContent
│   ├── Validate report is completed
│   ├── Load report sections + computed analytics
│   ├── Load selected personas (if any)
│   ├── Create social_media_kits row with status "queued"
│   ├── Update status to "generating"
│   ├── Call executeSocialMediaAgent()
│   ├── Validate output against SocialMediaKitContent schema
│   ├── Store content in social_media_kits row
│   ├── Update status to "completed"
│   └── Return kit content
└── Error handling: update status to "failed", store errorMessage
```

### Claude Prompt Strategy

The system prompt establishes the agent as a luxury real estate social media strategist. The user prompt provides:

1. **Full report text** — all section narratives (the agent reads the report like a human would)
2. **Key metrics table** — extracted numbers for accuracy (the agent must reference these, not hallucinate)
3. **Platform specs** — character limits, hashtag conventions, format expectations per platform
4. **Persona specs** (if selected) — vocabulary, decision drivers, tone guidance
5. **Output schema** — exact JSON shape expected, with examples

The prompt explicitly instructs:
- "Every stat you quote must appear in the Key Metrics Table above"
- "Write as the luxury agent, not as Modern Signal Advisory"
- "Each post idea must reference a specific report section"

---

## User Journey

1. Agent generates a report (Phases 4-6)
2. Report completes and is viewable
3. **Agent clicks "Generate Social Media Kit"** (feature #162 — next feature)
4. Social Media Agent runs, kit is stored
5. Agent browses kit in viewer (feature #163)

---

## UI Mockup

_No UI in this feature — #161 is the backend agent only. UI is feature #162 (trigger) and #163 (viewer)._

---

## Component References

_No UI components — agent-only feature._

---

## Minimum Content Counts

To ensure the kit is substantive enough to be valuable:

| Content Type | Minimum | Target |
|-------------|---------|--------|
| Post Ideas | 5 | 8-10 |
| Platform Captions | 4 (1 per platform) | 8 (2 per platform) |
| Persona Posts | 0 (if no personas) or 2 per persona | 3 per persona |
| Polls | 2 | 4 |
| Conversation Starters | 3 | 5 |
| Calendar Suggestions | 4 (4 weeks) | 4 (4 weeks) |
| Stat Callouts | 4 | 6-8 |

---

## Learnings

- The Social Media Agent follows a different pattern than pipeline agents: standalone `executeSocialMediaAgent()` function instead of `AgentDefinition`. Takes pre-loaded data as input rather than using `AgentContext`.
- Service layer (`lib/services/social-media-kit.ts`) handles DB orchestration (queued → generating → completed/failed), report validation, section loading, and persona loading.
- The agent uses `temperature: 0.7` (slightly higher than pipeline agents at 0.6) for more creative social media content.
- `SocialMediaKitContent` type was already defined in schema.ts as part of feature #160 — agent just needs to produce JSON matching that type.
- Error handling follows the same `retriable` boolean pattern as pipeline agents for consistency.
- **Bug fix (2026-03-16):** `computedAnalytics` was never persisted to `report.config` by the pipeline executor. The social-media-kit service fell back to `analyticsSection.content` (a section content blob with `{dashboard, detailMetrics, narrative}`), which doesn't have `.market.totalProperties`. Fix: (1) pipeline now stores `computedAnalytics` in `report.config` at completion, (2) defensive shape validation in both service layers and agent prompt builders checks for `analytics?.market` before accessing properties. Same bug existed in email-campaign service/agent — fixed there too.
