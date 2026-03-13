---
feature: Bulk Email Campaign Agent
domain: email-campaigns
source: lib/agents/email-campaign.ts
tests:
  - __tests__/agents/email-campaign.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Bulk Email Campaign Agent

**Source File**: lib/agents/email-campaign.ts
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/rising-star-agent.md, .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: Bulk Email Campaign Agent (#166)

The Bulk Email Campaign Agent is a Claude-powered agent that reads a finalized report and generates comprehensive email campaign content — drip sequences, market update newsletters, persona-targeted email copy, subject lines, and CTAs. All content is grounded in the agent's actual report data.

**Like the Social Media Agent**, this agent runs **independently** — not as part of the 4-layer pipeline. It is triggered on-demand after a report is finalized, and writes directly to a new `email_campaigns` table (mirroring `social_media_kits`). It follows the same standalone async function pattern: `executeEmailCampaignAgent()`.

**Unlike the Social Media Agent**, email content is longer-form, structured for sequential delivery (drip sequences), and optimized for inbox conversion rather than social engagement. Subject lines, preview text, and CTA placement are critical.

Alex (Rising Star) uses drip sequences to nurture HNWIs after listing presentations — each email reinforces data credibility. Jordan (Established Practitioner) sends quarterly market update newsletters to wealth managers and family offices. Taylor (Team Leader) standardizes the team's outbound email with consistent, data-backed messaging across 10 agents.

---

### Scenario: Agent generates a complete email campaign from a finalized report
Given a report with status "completed" and assembled sections stored in the database
And the report has computed analytics and agent narratives available
When the Bulk Email Campaign Agent is executed with the report ID
Then the agent produces an `EmailCampaignContent` object with all 6 content types populated
And every email references specific data points from the report
And every stat quoted is a real number from the computed analytics
And the campaign is stored in the `email_campaigns` table with status "completed"

### Scenario: Agent generates a drip sequence for post-meeting follow-up
Given a finalized report for a luxury market
When the Bulk Email Campaign Agent generates a drip sequence
Then the sequence contains 4-5 emails spaced for a 2-week cadence
And Email 1 is a "thank you + one compelling stat" opener (sent same day)
And Email 2 is a "key driver deep dive" with a specific market theme (day 3)
And Email 3 is a "competitive positioning" email comparing their market to peers (day 7)
And Email 4 is a "forward outlook" email with forecast highlights and timing signals (day 10)
And Email 5 is a "call to action" closing with a specific recommendation (day 14)
And each email has a subject line, preview text, body, and CTA
And the sequence tells a progressive story — each email builds on the last

### Scenario: Agent generates a market update newsletter
Given a finalized report with segment-level analytics and YoY comparisons
When the Bulk Email Campaign Agent generates a newsletter
Then the newsletter has a headline, subheadline, and 3-5 content blocks
And each content block has a heading, body text (2-3 paragraphs), and a key metric callout
And content blocks map to report sections (executive summary, key drivers, forecast, competitive position)
And the newsletter includes a footer CTA ("Schedule a market briefing" or similar)
And the tone is authoritative advisory — an "intelligence brief" not a "market update"
And the newsletter is structured for both HTML email rendering and plain-text fallback

### Scenario: Agent generates persona-targeted email copy when report includes personas
Given a finalized report generated with buyer personas (e.g., "Private Equity Principal" and "Legacy Wealth Family")
When the Bulk Email Campaign Agent generates persona emails
Then each selected persona gets 2-3 email variants using that persona's vocabulary
And emails for "Private Equity Principal" lead with ROI, tax efficiency, and market intelligence framing
And emails for "Legacy Wealth Family" lead with legacy, meaning, and long-term hold framing
And each persona email has a subject line optimized for that persona's priorities
And persona emails use vocabulary from the persona's `keyVocabulary` list
And emails avoid vocabulary from the persona's `avoidWords` list

### Scenario: Agent generates persona-targeted emails when no personas selected
Given a finalized report with no buyer personas
When the Bulk Email Campaign Agent generates the campaign
Then the `personaEmails` array is empty
And all other content types are still generated normally

### Scenario: Agent generates subject line variants
Given a finalized report
When the Bulk Email Campaign Agent generates subject lines
Then each subject line set includes 3 variants: data-forward, curiosity-driven, and urgency-based
And data-forward subjects include a specific number ("$6.58B in luxury transactions — what it means for your portfolio")
And curiosity-driven subjects pose a question ("Is your market outperforming Miami Beach?")
And urgency-based subjects reference timing signals ("The 90-day window closing in your market")
And all subjects are under 60 characters (optimized for mobile inbox preview)
And each subject line set includes matching preview text (under 90 characters)

### Scenario: Agent generates CTA blocks
Given a finalized report
When the Bulk Email Campaign Agent generates CTAs
Then each CTA has a `context` (where in the email to place it), `buttonText`, and `supportingCopy`
And CTAs are varied — not all "Schedule a call" (includes: "View the full intelligence brief", "See your market's forecast", "Book a market advisory session", "Download the report")
And each CTA specifies whether it's a primary CTA (end of email) or inline CTA (mid-content)
And CTA language uses persona vocabulary when personas are selected

### Scenario: Agent generates re-engagement emails for dormant contacts
Given a finalized report with compelling market data
When the Bulk Email Campaign Agent generates re-engagement emails
Then 2-3 re-engagement templates are produced
And each template leads with a surprising or contrarian insight from the report ("While most markets cooled, yours grew 12%")
And each template has a low-friction CTA ("Reply with 'interested' for the full briefing")
And the tone is warm and non-pushy — reconnecting as an advisor, not selling
And templates are designed for contacts who haven't engaged in 3-6 months

### Scenario: Agent output matches EmailCampaignContent schema exactly
Given the Bulk Email Campaign Agent has finished generating content
When the output is validated against the `EmailCampaignContent` type
Then every field matches the expected type
And `dripSequence` emails each have `sequenceOrder`, `dayOffset`, `subject`, `previewText`, `body`, `cta`, `reportSection`
And `newsletter` has `headline`, `subheadline`, `contentBlocks[]`, `footerCta`
And `personaEmails` each have `personaSlug`, `personaName`, `subject`, `previewText`, `body`, `cta`, `vocabularyUsed[]`
And `subjectLines` each have `emailContext`, `variants[]` (with `style`, `subject`, `previewText`)
And `ctaBlocks` each have `context`, `buttonText`, `supportingCopy`, `placement`
And `reEngagementEmails` each have `hook`, `body`, `cta`, `tone`

### Scenario: Agent execution records token usage and timing
Given the Bulk Email Campaign Agent is executed
When the agent completes
Then the result includes `durationMs` (total execution time)
And the result includes metadata with `promptTokens`, `completionTokens`, and `modelUsed`
And these metrics are available for cost tracking and admin analytics

### Scenario: Agent handles Claude API errors gracefully
Given the Bulk Email Campaign Agent is called but the Claude API returns an error (rate limit, timeout, etc.)
When the error occurs
Then the campaign status is updated to "failed" in the `email_campaigns` table
And the `errorMessage` column stores the error details
And the error is retriable (rate limit or transient) or terminal (schema/validation failure)

### Scenario: Agent handles report with minimal data gracefully
Given a finalized report where some sections have thin data (e.g., only 3 transactions, no YoY comparison)
When the Bulk Email Campaign Agent generates the campaign
Then the agent still produces all 6 content types
And emails reference only the data that exists (no fabricated comparisons)
And the agent focuses on available insights — framing scarcity as exclusivity, not apologizing for missing data
And subject lines and CTAs still sound compelling despite limited data

### Scenario: Agent voices content from the agent's perspective
Given a finalized report for a market (e.g., "Naples, FL — Ultra-Luxury")
When the Bulk Email Campaign Agent generates content
Then all emails are written from the luxury agent's voice — not MSA's
And content sounds like "Based on our latest market analysis..." not "Modern Signal Advisory found..."
And the tone is authoritative advisory — an "executive briefing" not a "sales blast"
And emails position the agent as a trusted advisor, not a vendor

---

## Architecture

### Agent Pattern

The Bulk Email Campaign Agent follows the same standalone pattern as `lib/agents/social-media.ts`:

```
lib/agents/email-campaign.ts
├── EmailCampaignAgentInput (interface) — report sections, analytics, market, personas
├── EmailCampaignAgentResult (interface) — content + durationMs + metadata
├── buildSystemPrompt() → Claude system message
├── buildUserPrompt(input: EmailCampaignAgentInput) → formatted report data for Claude
├── executeEmailCampaignAgent(input: EmailCampaignAgentInput) → EmailCampaignAgentResult
└── Export: not an AgentDefinition (not in pipeline) — standalone async function
```

**Key**: This agent is **not registered** in the pipeline runner. It runs independently, triggered by a service function — same as the Social Media Agent.

### Input

The agent receives (identical input shape to Social Media Agent):
1. **Report sections** — all assembled report content (market overview, executive summary, key drivers, forecasts, competitive analysis, trending insights, strategic summary)
2. **Computed analytics** — raw numbers (total volume, median price, YoY changes, segment breakdowns) for stat accuracy
3. **Selected personas** (if any) — buyer persona specs with vocabulary and decision drivers
4. **Market definition** — city, state, tier, segments for contextual framing

### Output

Returns `EmailCampaignContent` — 6 content type arrays:

| Type | Fields | Purpose |
|------|--------|---------|
| `DripEmail` | sequenceOrder, dayOffset, subject, previewText, body, cta, reportSection | Post-meeting follow-up drip (4-5 emails over 2 weeks) |
| `NewsletterContent` | headline, subheadline, contentBlocks[], footerCta | Market update newsletter (single send) |
| `PersonaEmail` | personaSlug, personaName, subject, previewText, body, cta, vocabularyUsed[] | Persona-targeted email variants (0 if no personas, else 2-3 per persona) |
| `SubjectLineSet` | emailContext, variants[] (style, subject, previewText) | 3 subject line variants per email context (data-forward, curiosity, urgency) |
| `CtaBlock` | context, buttonText, supportingCopy, placement | Reusable CTA blocks (primary/inline) |
| `ReEngagementEmail` | hook, body, cta, tone | Re-engagement templates for dormant contacts (2-3) |

### Data Model

New `email_campaigns` table (mirrors `social_media_kits`):

```sql
email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('queued', 'generating', 'completed', 'failed')),
  content JSONB,           -- EmailCampaignContent
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

Indexes:
  - report_id (unique constraint)
  - user_id
  - status
```

### Service Layer

Mirrors `lib/services/social-media-kit.ts`:

```
lib/services/email-campaign.ts
├── generateEmailCampaign(reportId, userId) → EmailCampaignContent
│   ├── Validate report is completed
│   ├── Load report sections + computed analytics
│   ├── Load selected personas (if any)
│   ├── Create email_campaigns row with status "queued"
│   ├── Update status to "generating"
│   ├── Call executeEmailCampaignAgent()
│   ├── Validate output against EmailCampaignContent schema
│   ├── Store content in email_campaigns row
│   ├── Update status to "completed"
│   └── Return campaign content
├── regenerateCampaignSection(reportId, userId, contentType)
│   ├── Load existing campaign (must be "completed")
│   ├── Call agent with sectionOnly flag
│   ├── Merge: replace only requested content type
│   └── Update row (content + updatedAt)
└── Error handling: update status to "failed", store errorMessage
```

### Claude Prompt Strategy

The system prompt establishes the agent as a luxury real estate email marketing strategist. The user prompt provides:

1. **Full report text** — all section narratives
2. **Key metrics table** — extracted numbers for accuracy (agent must reference these, not hallucinate)
3. **Email best practices** — subject line length limits, preview text rules, CTA placement guidance
4. **Persona specs** (if selected) — vocabulary, decision drivers, tone guidance
5. **Output schema** — exact JSON shape expected, with examples

The prompt explicitly instructs:
- "Every stat you quote must appear in the Key Metrics Table above"
- "Write as the luxury agent, not as Modern Signal Advisory"
- "Subject lines must be under 60 characters"
- "Each drip email must build on the previous — tell a progressive story"
- "Use advisory language: 'intelligence brief' not 'market update', 'consultation' not 'sales call'"

### Model Configuration

- **Model**: `claude-haiku-4-5-20251001` (same as Social Media Agent — cost-efficient for content generation)
- **Max tokens**: 16,000 (email content is longer-form than social posts)
- **Temperature**: 0.7 (creative content, same as Social Media Agent)

---

## User Journey

1. Agent generates a report (Phases 4-6)
2. Report completes and is viewable
3. Agent may generate a Social Media Kit (feature #162)
4. **Agent clicks "Generate Email Campaign"** (feature #167 — next feature)
5. Bulk Email Campaign Agent runs, campaign is stored
6. Agent browses campaign content in viewer (feature #167)

---

## UI Mockup

_No UI in this feature — #166 is the backend agent only. UI is feature #167 (campaign viewer)._

---

## Component References

_No UI components — agent-only feature._

---

## Minimum Content Counts

To ensure the campaign is substantive enough to be valuable:

| Content Type | Minimum | Target |
|-------------|---------|--------|
| Drip Sequence Emails | 4 | 5 |
| Newsletter | 1 (with 3+ content blocks) | 1 (with 5 content blocks) |
| Persona Emails | 0 (if no personas) or 2 per persona | 3 per persona |
| Subject Line Sets | 3 (one per key email) | 5 |
| CTA Blocks | 3 | 5 |
| Re-Engagement Emails | 2 | 3 |

---

## Persona Revision Notes

After drafting, the spec was revised through persona lenses:

- **Alex (Rising Star)**: Changed "follow-up email sequence" to "post-meeting drip sequence" — Alex thinks in terms of client acquisition funnels. Added "executive briefing" framing to newsletter scenario. Alex needs emails that build credibility, not just share data.
- **Jordan (Established Practitioner)**: Ensured newsletter scenario uses "advisory" and "consultation" vocabulary. Jordan sends to wealth managers — the tone must be institutional, not promotional. Added "intelligence brief" framing throughout.
- **Taylor (Team Leader)**: Validated that the drip sequence and newsletter are standardizable across a team. Taylor needs templates that 10 agents can use with consistent quality. Added persona-targeted variants so team members serving different buyer types get tailored content.
- **Report Reader anti-persona**: Ensured emails maintain conviction — no hedging, no "the market may or may not." Every email must have a quotable stat and a clear stance.

---

## Learnings

_(To be filled after implementation)_
