# Build Roadmap

> Luxury Market Intelligence Report platform — powered by Modern Signal Advisory.
> Every feature serves one goal: generating contextually deep, beautifully produced market intelligence reports for luxury real estate agents.

## Implementation Rules

**Every feature in this roadmap must be implemented with real data, real API calls, and real database operations.** No exceptions.

- **No mock data** — never use hardcoded arrays, fake JSON, or placeholder content to simulate functionality. If a feature needs data, it reads from the database or calls a real API.
- **No fake API endpoints** — every endpoint must do real work. No routes that return static JSON.
- **No placeholder UI** — components must be wired to real data sources. If the data isn't available yet, show a proper empty state, not fake data.
- **No "demo mode"** — features either work end-to-end or they aren't done. A feature is only ✅ when a real user can use it with their real data.
- **Real validation** — forms validate against real constraints, not just "is this field filled in?"
- **Real error handling** — API failures, empty results, rate limits, and edge cases must be handled, not ignored.
- **Test against real flows** — when verifying a feature, use the app as a user would. Trigger real API calls, see real results.

---

## Progress

| Status | Count |
|--------|-------|
| ✅ Completed | 116 |
| 🔄 In Progress | 0 |
| ⬜ Pending | 24 |
| ⏸️ Blocked | 0 |

**Last updated**: 2026-03-15

---

## Phase 1: Foundation

> Project scaffolding, authentication, database, and base layout. Everything depends on this.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 1 | Next.js project scaffold + Tailwind + design tokens | vision | M | - | ✅ |
| 2 | Database schema + Supabase setup | vision | M | 1 | ✅ |
| 3 | Authentication with Clerk | vision | M | 1 | ✅ |
| 4 | Base app layout — nav, sidebar, page shell | vision | M | 1 | ✅ |
| 5 | Environment config + API key management | vision | S | 1 | ✅ |

**Goal**: A deployed app skeleton where an authenticated user lands on a dashboard shell.

---

## Phase 2: User & Market Setup

> Agent identity and market definition. This is the input that drives everything downstream.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 10 | Agent profile + branding (name, logo, contact, colors) | vision | M | 2, 3 | ✅ |
| 11 | Market definition wizard (geography, segments, luxury tiers) | vision | M | 2, 4 | ✅ |
| 12 | Peer market selection for competitive analysis | vision | S | 11 | ✅ |
| 13 | Market configuration persistence + edit | vision | S | 11 | ✅ |

**Goal**: An agent can sign up, set up their brand, and define their target market (e.g., "Naples, FL — $6M+ — waterfront focus").

---

## Phase 3: Data Infrastructure

> Cache-first backend that fetches, stores, and serves market data. APIs are expensive — this phase ensures we don't burn money.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 20 | Cache layer — DB-backed with TTL by data type | vision | M | 2 | ✅ |
| 22 | RealEstateAPI connector (property search, detail, comps, valuations) | vision | L | 20 | ✅ |
| 23 | API cost tracking + usage logging | vision | S | 20 | ✅ |
| 24 | Data freshness indicators + staleness fallback | vision | S | 20, 22 | ✅ |
| 25 | ScrapingDog connector (neighborhood intelligence, local amenities, area context) | vision | M | 20 | ✅ |
| 26 | Agent output cache — hash-based dedup of Claude calls when source data unchanged | user-request | M | 20, 30 | ✅ |

**Goal**: The system can fetch real market data, cache it intelligently, cache agent outputs to minimize token spend, and track costs per API call.

---

## Phase 4: AI Agent Pipeline

> The intelligence engine. Specialized Claude-powered agents that transform raw data into strategic narratives. This is the core IP.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 30 | Agent orchestration framework (pipeline runner, state, error handling) | vision | L | 5 | ✅ |
| 31 | Data Analyst agent (segment metrics, YoY calculations, ratios, ratings) | vision | L | 30, 22 | ✅ |
| 32 | Insight Generator agent (strategic narratives from structured analysis) | vision | M | 30, 31 | ✅ |
| 33 | Competitive Analyst agent (market vs. peer luxury markets) | vision | M | 30, 31, 12 | ✅ |
| 34 | Forecast Modeler agent (projections, confidence ratings, base cases) | vision | M | 30, 31 | ✅ |
| 35 | Polish Agent (consistency, editorial tone, pull quotes, final pass) | vision | M | 30, 32 | ✅ |
| 36 | Agent output schema + validation (structured JSON for report assembly) | vision | M | 30 | ✅ |

**Goal**: Given a market definition + cached data, the pipeline produces structured, validated JSON containing every section of the report — narratives, metrics, ratings, forecasts.

---

## Phase 5: Report Builder UI

> The guided wizard that takes users from "I want a report" to "generating now." Progressive disclosure — simple surface, complex engine underneath.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 40 | Report builder wizard — market params, section selection, customization | vision | L | 4, 11, 13 | ✅ |
| 41 | Pipeline status dashboard — real-time agent progress, stage tracking | vision | M | 30, 40 | ✅ |
| 42 | Report preview — live assembly as sections complete | vision | M | 41, 36 | ✅ |

**Goal**: An agent walks through a polished wizard, hits "Generate," watches the pipeline work in real-time, and sees the report take shape.

---

## Phase 6: Report Template & PDF Output

> The artifact itself. Magazine-quality PDF generation with the full report structure from the reference report. Print-first design using design tokens.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 50 | Report template engine (React-PDF or Puppeteer rendering pipeline) | vision | L | 1 | ✅ |
| 51 | Report cover, TOC, and Market Overview + Insights Index sections | vision | L | 50, 36 | ✅ |
| 52 | Executive Summary + Market Analysis Matrix sections | vision | L | 50, 36 | ✅ |
| 53 | Key Drivers + Second Homes + Competitive Analysis sections | vision | L | 50, 36, 33 | ✅ |
| 54 | Trending Insights + Forecasts + Methodology + Strategic Summary sections | vision | L | 50, 36, 34 | ✅ |
| 55 | Data visualization components (charts, confidence dots, segment matrices) | vision | L | 50 | ✅ |
| 56 | Agent branding injection (logo, colors, contact info, disclaimers) | vision | M | 50, 10 | ✅ |
| 57 | PDF export + digital sharing links | vision | M | 50, 51 | ✅ |

**Goal**: A complete, magazine-quality PDF that matches the Naples Intelligence Report reference — branded to the agent, print-ready at 300dpi, with real data visualizations.

---

## Phase 7: Post-Generation & Management

> Edit, iterate, save, and reuse. Agents refine reports after generation and build a library over time.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 60 | Report editor — adjust narratives, refine insights post-generation | vision | L | 42, 57 | ✅ |
| 61 | Report history + versioning | vision | M | 2, 57 | ✅ |
| 62 | Report templates — save/reuse market configurations | vision | M | 40, 61 | ✅ |

**Goal**: An agent can edit any section of a generated report, maintain a version history, and reuse market configurations for future reports.

---

## Phase 8: Account & Billing

> Monetization infrastructure. Subscription management, usage tracking, and cost transparency.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 70 | Account settings page | vision | S | 3, 4 | ✅ |
| 71 | Subscription management + Stripe integration | vision | M | 70 | ✅ |
| 72 | Usage dashboard — API costs, report count, billing summary | vision | M | 23, 71 | ✅ |

**Goal**: Agents can manage their subscription, see how many reports they've generated, and understand their API cost consumption.

---

## Phase 9: Pipeline Execution & Admin

> The glue that makes everything work end-to-end. Pipeline execution, data source management, and system observability.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 80 | Pipeline execution service (trigger, section persistence, status updates) | discussion | L | 30, 36, 22, 25 | ✅ |
| 81 | Data source registry (pluggable connector management, health checks) | discussion | M | 80, 22, 25 | ✅ |
| 82 | Pipeline visualizer (admin view of agent execution, timing, errors) | discussion | M | 80, 41 | ✅ |
| 83 | System monitoring dashboard (cache stats, API costs, pipeline health) | discussion | M | 23, 80 | ✅ |

**Goal**: Reports generate end-to-end when triggered. Admin can visualize the pipeline, manage data sources, and monitor system health.

---

## Phase 10: Buyer Persona Intelligence

> Persona-driven content generation. Agents select which buyer archetypes their report should address, and a new Persona Intelligence Agent reframes all data and insights through those lenses — generating persona-specific talking points, narrative framing, and metric emphasis. These are the agent's clients, not our users.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 90 | Buyer persona data model + seed data (8 personas from Knox Brothers framework) | vision | M | 2 | ✅ |
| 91 | Persona selection UI in report builder wizard (pick up to 3, with preview of what each adds) | vision | M | 40, 90 | ✅ |
| 92 | Persona Intelligence Agent (reframe data through persona lenses, generate talking points, apply narrative framing) | vision | L | 30, 31, 32, 33, 34, 90 | ✅ |
| 93 | Multi-persona output strategy — hybrid: dedicated Section 10 + persona framing injected into narrative sections | vision | M | 92 | ✅ |
| 94 | Persona content in PDF template (format depends on #93 decision — blended narrative, dedicated sections, or appendix) | vision | L | 50, 92, 93 | ✅ |
| 95 | Market calibration engine (auto-adjust persona specs to local market — price tiers, community types, seasonal patterns) | vision | M | 92, 22 | ✅ |

**Goal**: An agent selects 1-3 buyer personas during report setup. The generated report includes persona-tailored insights, talking points, and narrative framing that speak directly to those buyer types — using their vocabulary, addressing their decision drivers, and emphasizing the metrics they care about.

---

## Phase 11: Marketing & Public Pages

> Public-facing marketing pages that drive signups and establish brand positioning.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 100 | Marketing landing page (editorial design, creative brief, all sections) | vision | L | 1 | ✅ |

**Goal**: A premium, editorial-quality public landing page that communicates the product's value proposition and drives agent signups.

---

## Phase 12: Report Creation Experience Redesign

> Merge the separate market wizard and report wizard into a single, premium guided experience. Replace boxy form fields with visual card selectors, add Framer Motion animations, contextual tooltips, inline instructions, and a refined progress indicator. The creation flow should feel like a luxury concierge experience, not a web form.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 150 | Animation & UX infrastructure — install Framer Motion, create tooltip component, shared animation variants (fade, slide, scale), transition primitives | vision | S | 1 | ✅ |
| 151 | Unified creation flow shell — new `/reports/create` route, step state machine (6 steps), refined progress indicator with step names + completion state, back/next with slide animations | vision | L | 150, 4, 11, 40 | ✅ |
| 152 | Step 1: Your Market — geography with smart autocomplete, contextual helper text ("We'll use this to find luxury transactions in your area"), animated market preview as user types | vision | M | 151, 11 | ✅ |
| 153 | Step 2: Your Tier — visual tier card selector (not radio buttons), animated price floor/ceiling with sensible defaults, data-driven tooltip hints ("Most agents in [city] focus on [tier]") | vision | M | 151 | ✅ |
| 154 | Step 3: Your Focus — segments + property types as visual toggleable cards with icons and descriptions, smart defaults based on market/tier, "Popular in your market" badges | vision | M | 151 | ✅ |
| 155 | Step 4: Your Audience — large persona cards with key traits + "what they care about", slide-in preview panel, graceful max-3 enforcement (dim with explanation, not just disabled) | vision | M | 151, 90 | ✅ |
| 156 | Step 5: Review & Generate — beautiful summary card with edit-back links to each step, auto-generated editable title, estimated generation time, premium "Generate Report" CTA | vision | M | 151 | ✅ |
| 157 | Step 6: Generating — pipeline progress integrated into flow (not separate page), contextual stage descriptions ("Analyzing 2,234 transactions..."), animated progress indicators, time remaining | vision | M | 151, 80 | ✅ |
| 158 | Flow persistence + returning user shortcuts — save/resume mid-flow state, existing-market users skip to Step 4, market editing inline (not separate page) | vision | M | 151 | ✅ |
| 159 | Dashboard redesign — market cards with "New Report" quick-start action, recent reports list, empty state artistry, animated entrance | vision | M | 150, 4 | ✅ |

**Goal**: The market definition and report generation flow is a single, beautiful guided experience. Agents feel walked through something special — visual card selectors, smooth animations, contextual help at every step, and a refined progress indicator. Returning users skip ahead seamlessly.

---

## Phase 13: Admin — User Management

> Full lifecycle management of agent accounts. Suspend, delete, view activity, search and filter users. Requires schema changes to support account status and activity logging.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 110 | User status schema — add `status` enum (active/suspended/deleted), `suspendedAt`, `deletedAt`, `lastLoginAt` columns to users table | vision | S | 2 | ✅ |
| 111 | Activity log schema — `user_activity` table (userId, action, entityType, entityId, metadata, timestamp) + insert hooks | vision | M | 110 | ✅ |
| 112 | Admin user list page — search, filter by status, sort by last activity, pagination | vision | M | 110, 83 | ✅ |
| 113 | Admin user detail page — profile info, account status, report count, market(s), activity timeline | vision | M | 112, 111 | ✅ |
| 114 | Suspend/unsuspend account — admin action + suspended user login gate ("contact support" message) | vision | M | 110, 3 | ✅ |
| 115 | Delete account — confirmation flow, cascade reports to orphan state (keep for analytics, de-link from user) | vision | M | 110, 114 | ✅ |
| 116 | Admin sidebar update — add User Management nav item, update active state highlighting | vision | S | 112 | ✅ |

**Goal**: Admin can view all users, search/filter by status, drill into individual user details with activity history, and suspend or delete accounts with proper cascading behavior.

---

## Phase 14: Admin — Report Registry & Error Triage

> Cross-user visibility into every report on the platform. Surface errors, allow admin intervention, re-trigger failed pipelines. The operational "command center" for report quality.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 120 | Report error tracking schema — add `errorDetails` JSONB (agent, message, stack, input snapshot) to reports table, add `retriedAt`, `retriedBy` columns | vision | S | 2 | ✅ |
| 121 | Admin report list page — all reports across all users, filterable by status (queued/generating/completed/failed), date range, user, market | vision | L | 120, 83 | ✅ |
| 122 | Admin report detail page — full report view, agent execution breakdown (which agents ran, timing, cache hits, API costs) | vision | M | 121, 80 | ✅ |
| 123 | Error triage view — dedicated filtered view of failed/errored reports with error details, agent failure info, input data | vision | M | 121, 120 | ✅ |
| 124 | Pipeline re-trigger — admin can re-run a failed report's pipeline (full or from failed agent), with audit trail | vision | M | 123, 80 | ✅ |
| 125 | Admin sidebar update — add Report Registry + Error Triage nav items | vision | S | 121 | ✅ |

**Goal**: Admin can browse all platform reports, quickly identify failures, see exactly which agent failed and why, and re-trigger the pipeline to fix user-facing issues.

---

## Phase 15: Admin — Analytics Dashboard

> Operational intelligence for the MSA team. Volume metrics, geographic breakdowns, segment analysis, user analytics, pipeline performance — everything needed to understand platform health and usage patterns.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 130 | Analytics API endpoints — aggregate queries for report volume (daily/weekly/monthly), user signups, error rates | vision | M | 2, 120 | ✅ |
| 131 | Volume metrics dashboard — report count over time (line chart), total volume, growth trend | vision | M | 130 | ✅ |
| 132 | Geographic analytics — reports by state and city, ranked list or heat map, market concentration view | vision | M | 130, 11 | ✅ |
| 133 | User analytics — active users, power users (most reports), new signups over time, churn indicators | vision | M | 130, 111 | ✅ |
| 134 | Pipeline performance metrics — average generation time, cache hit rates, API cost per report, error rates by agent | vision | M | 130, 23, 80 | ✅ |
| 135 | Analytics data export — CSV/JSON export of all analytics views for external analysis | vision | S | 130 | ✅ |

**Goal**: Admin has a comprehensive analytics dashboard showing volume trends, geographic demand patterns, user behavior, and pipeline performance — enabling data-driven operational decisions.

---

## Phase 16: Admin — Report Eval Suite

> End-to-end quality scoring of finished reports. Complements the existing per-agent eval suite by evaluating the complete assembled report against quality criteria. Enables regression tracking and quality enforcement.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 140 | Report eval test cases — define evaluation criteria (data accuracy, completeness, narrative quality, formatting, actionability, persona alignment) with rubrics | vision | M | 36 | ✅ |
| 141 | Report eval runner — execute report-level evals using LLM-as-judge scoring (1–5) with per-criterion breakdown | vision | L | 140, 57 | ✅ |
| 142 | Report eval dashboard — UI for running report evals, viewing scores, comparing across reports, filtering by criterion | vision | M | 141 | ✅ |
| 143 | Regression tracking — store eval scores over time, chart quality trends, alert on score degradation | vision | M | 141 | ✅ |

**Goal**: Admin can run end-to-end quality evaluations on finished reports, track quality scores over time, and catch pipeline degradation before it affects users.

---

## Phase 17: Social Media Kit

> A new agent-powered product that turns finalized reports into comprehensive social media content kits. Agents generate a kit after their report is complete and get platform-optimized posts, persona-targeted content, polls, stat callouts, and content calendar suggestions — all text-based, all grounded in their report data.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 160 | Social media kit data model — `social_media_kits` table (kitId, reportId, userId, status, content JSONB, generatedAt) + schema for kit content types (posts, captions, polls, stat callouts, calendar suggestions) | user-request | M | 2 | ✅ |
| 161 | Social Media Agent — Claude agent that reads a finalized report and generates the full kit: post ideas, platform-specific captions (LinkedIn, Instagram, X, Facebook), persona-targeted posts, poll ideas with data-backed context, conversation starters, stat callouts, content calendar suggestions | user-request | L | 30, 36, 160 | ✅ |
| 162 | Social media kit generation trigger — "Generate Social Media Kit" action on completed reports (report detail page + dashboard), triggers the Social Media Agent, shows generation progress | user-request | M | 161, 57 | ✅ |
| 163 | Social media kit viewer — browse generated kit organized by content type, filter by platform (LinkedIn/Instagram/X/Facebook) and persona, copy-to-clipboard on each item, expandable sections | user-request | L | 160, 162 | ✅ |
| 164 | Social media kit regeneration — regenerate the full kit or specific content types if the agent wants fresh alternatives | user-request | S | 162 | ✅ |
| 165 | Social media kit in admin — kits visible in admin report detail, generation stats in analytics (kit generation rate, most-used content types) | user-request | M | 160, 121, 130 | ✅ |

| 166 | Bulk Email Campaign Agent — Claude agent that reads a finalized report and generates email campaign content: drip sequences, market update newsletters, persona-targeted email copy, subject lines, CTAs — all grounded in report data | user-request | L | 30, 36, 160 | ✅ |
| 167 | Bulk email campaign viewer — browse generated email content by campaign type, filter by persona, copy-to-clipboard, preview formatting | user-request | M | 166 | ✅ |

**Goal**: After generating a report, agents can generate a Social Media Kit and Bulk Email Campaigns — comprehensive, text-based content packages with posts, captions, polls, stat callouts, email sequences, and content calendar suggestions, all grounded in their specific report data. Agents copy the content to their own tools and customize as needed.

---

## Phase 18: Subscription & Entitlement System

> Internal entitlement system that gates features and volume behind subscription tiers. No Stripe — tiers are admin-managed, entitlement checks are app-wide, and overrides let admins comp users. Stripe-ready columns exist but are nullable until payment processing is wired up later.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 170 | Subscription tier data model — `subscription_tiers` table (tierId, name, entitlements JSONB, displayPrice, isActive, sortOrder) + seed default tiers (Starter, Professional, Enterprise) | user-request | M | 2 | ✅ |
| 171 | User entitlement model — add `tierId` FK to users/subscriptions, `entitlement_overrides` table (userId, entitlementType, value, expiresAt, grantedBy, reason, createdAt), Stripe-ready nullable columns (`stripeCustomerId`, `stripeSubscriptionId`) | user-request | M | 170 | ✅ |
| 172 | Usage tracking — `usage_records` table (userId, entitlementType, periodStart, periodEnd, count) + increment on report creation, market creation, kit generation. Reset logic for monthly caps | user-request | M | 171 | ✅ |
| 173 | Entitlement check utility — single `checkEntitlement(userId, entitlementType)` function that resolves tier + overrides + usage → allowed/denied with remaining count. Used app-wide before gated actions | user-request | M | 171, 172 | ✅ |
| 174 | Entitlement gating in report creation — check `reports_per_month` before allowing report generation, show soft gate with upgrade messaging when cap hit | user-request | M | 173, 40 | ✅ |
| 175 | Entitlement gating in market creation — check `markets_created` before allowing new market, show soft gate with upgrade messaging | user-request | S | 173, 11 | ✅ |
| 176 | Entitlement gating in social media kit — check `social_media_kits` before allowing kit generation, show "not included in your plan" or cap-hit messaging | user-request | S | 173, 162 | ✅ |
| 177 | Account & billing page — show current tier, usage vs. caps for each entitlement, upgrade prompts (display-only pricing, no checkout yet) | user-request | M | 171, 172 | ✅ |
| 178 | Admin: subscription tier management — CRUD for tiers, edit entitlement caps and display pricing, reorder tiers, activate/deactivate | user-request | M | 170 | ✅ |
| 179 | Admin: entitlement overrides — grant tier override, entitlement boost, or feature unlock to individual users. Set expiry, reason. Full audit trail view | user-request | M | 171, 112 | ✅ |
| 180 | Default tier assignment on signup — new users auto-assigned Starter tier, tier shown in onboarding | user-request | S | 170, 3 | ✅ |
| 181 | Entitlement gating for social media kit as Pro feature — social media kit generation restricted to Professional+ tiers, Starter sees upgrade prompt with preview of kit value | user-request | S | 173, 176 | ✅ |
| 182 | Entitlement gating for bulk email campaigns — email campaign generation restricted to Professional+ tiers, gated same as social media kit | user-request | S | 173, 166 | ✅ |
| 183 | Entitlement gating for expanded transaction scope — Pro users can analyze beyond last 100 transactions, configurable cap per tier (e.g., Starter=100, Pro=500, Enterprise=unlimited) | user-request | M | 173 | ✅ |

**Goal**: Every gated action (create report, create market, generate social media kit, generate email campaigns, expanded transaction scope) checks the user's tier entitlements before proceeding. Admins can create/edit tiers, grant overrides to individual users, and see a full audit trail. Users see their usage vs. caps and upgrade prompts. No payment processing — tiers are admin-assigned until Stripe is connected.

---

## Phase 19: Report Output V2

> Comprehensive report restructuring based on user feedback. Redesign section layout, remove weak sections, add clarity and definitions, tighten narratives, and improve data transparency. Touches Layer 1 computation, Layer 2 agent prompts, Layer 3 assembly, and PDF rendering.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 200 | Cover page redesign — create naming convention for report titles, move Key Themes summary to cover page with proper formatting, define what rating chips/data chips mean | user-feedback | M | 50 | ✅ |
| 201 | New "Market Intelligence Summary" section — "At a Glance" section after cover before Executive Brief, include charts (not just text/metrics), visual summary of report highlights | user-feedback | L | 50, 55 | ✅ |
| 202 | Executive Brief improvements — add explainer text for each tile/metric, pull and display data dates (freshness), add headers for each pro item | user-feedback | M | 50 | ✅ |
| 203 | Market Insights Index redesign — add usage context ("how to read this index"), ensure every index returns a rating (no blanks), redesign layout from rectangles to square tile structure | user-feedback | M | 50, 31 | ✅ |
| 204 | Luxury Market Dashboard restructuring — Power Five: remove Transaction Volume. Tier Two: remove Cash Buyer, TSV, Flood Zone Exposure. Combine Tier Two + Three. Keep Investor Activity Rate with definition. Add 3-sentence narrative headline about last 100 sales | user-feedback | L | 50, 31, 32 | ✅ |
| 205 | Neighborhood Intelligence trim — add source attribution (where narrative comes from), significantly reduce text volume, tighten narrative output from agent | user-feedback | M | 32 | ✅ |
| 206 | Market Segments rating transparency — explain how segment ratings are calculated, show methodology inline in the section | user-feedback | S | 31 | ⬜ |
| 207 | Comparative Position data definitions — define all data points clearly with inline explanations so reader understands each metric | user-feedback | S | 50 | ⬜ |
| 208 | Strategic Benchmark reframing — adjust framing from scorecard-like to more strategic positioning language, less grading more advising | user-feedback | M | 35 | ⬜ |
| 209 | Remove Market Scorecard section — cut entirely from report assembly and PDF rendering | user-feedback | S | 50 | ✅ |
| 210 | Remove Methodology section from report — cut from PDF, move disclaimer/advisory language to front-end UI | user-feedback | S | 50 | ✅ |
| 211 | Eliminate cash buyers from liquidity metrics — cross-cutting data change in Layer 1 computation affecting dashboard and all liquidity calculations | user-feedback | M | 31 | ✅ |
| 212 | YoY calculation transparency — add explanation of how YoY stats are calculated, visible in-report or in front-end UI | user-feedback | S | 31 | ⬜ |
| 213 | Front-end UI transaction disclaimer — add disclaimer/advisory sales language about "based on last 100 transactions" to report view page and creation flow | user-feedback | S | 42 | ⬜ |
| 214 | Pro feature: expanded transaction scope — support analyzing more than last 100 transactions, configurable per tier, update data fetcher + pipeline to accept transaction count param | user-feedback | L | 22, 80, 183 | ⬜ |

**Goal**: The report output is tighter, clearer, and more actionable. Weak sections (Market Scorecard, Methodology) are removed. Every metric and rating is defined. Narratives are shorter and sourced. The cover page leads with Key Themes. A new "At a Glance" summary with charts gives readers an instant overview. Cash buyers are stripped from liquidity metrics. Pro users can expand beyond 100 transactions.

---

## Phase 20: Report Advisor (Chat)

> AI-powered contextual advisor that turns a static report into an interactive strategy session. Agents chat about their specific report to get meeting prep, persona-specific talking points, objection handling, and strategic recommendations — all grounded in their actual data. Gated by subscription tier.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 190 | Advisor data model — `advisor_conversations` table (conversationId, reportId, userId, messages JSONB, turnCount, createdAt, updatedAt) + indexes on reportId and userId | vision | S | 2 | ✅ |
| 191 | Advisor chat API endpoint — streaming Claude endpoint that receives report content + persona specs as system context, maintains conversation history within session, enforces turn limits per entitlement | vision | L | 190, 30, 57 | ⬜ |
| 192 | Advisor chat UI — slide-out chat panel on report view page, message input with send, streaming response display, conversation history within session, clear "Ask about this report" entry point | vision | L | 191, 42 | ⬜ |
| 193 | Entitlement gating for advisor — check `advisor_conversations` entitlement before allowing chat, show soft gate with upgrade messaging for Starter tier, enforce per-report turn cap for Professional tier | vision | S | 191, 173 | ⬜ |
| 194 | Advisor in admin — conversation count in report detail, advisor usage stats in analytics (conversations/report, avg turns, most common question types), conversation log viewer for debugging | vision | M | 190, 121, 130 | ⬜ |

**Goal**: After generating a report, agents can open a chat panel and ask questions like "How do I use this data with a tech founder?" or "A client says the market is overpriced — what does my report say?" The advisor cites specific data from their report, frames advice through selected personas, and helps agents turn intelligence into client conversations.

---

## Phase 21: Property Deal Analyzer

> Turns market intelligence into a daily-use tool. Agents input any property address and get an instant AI-generated Deal Brief — pricing context, persona fit, negotiation leverage, and market timing — all grounded in the stored market analytics already computed for their market. A "Hidden Inventory Intelligence" layer surfaces motivated seller candidates across the market before they list.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 220 | Deal analysis data model — `deal_analyses` table (analysisId, userId, marketId, address, propertyData JSONB, briefContent JSONB, status, createdAt, updatedAt) + indexes | user-request | S | 2 | ⬜ |
| 221 | Property address lookup endpoint — `/api/deal-analyzer/lookup` takes address string, calls REAPI PropertySearch + PropertyDetail in sequence, returns enriched property data with sale history, mortgage history, motivated seller signals, demographics | user-request | M | 22, 220 | ⬜ |
| 222 | Deal Brief Agent — Claude agent that receives enriched property data + agent's stored market analytics (segment medians, YoY trends, persona specs, forecast outputs already in DB) → generates structured Deal Brief: pricing assessment, buyer persona match, negotiation talking points, market timing signal, one-paragraph summary | user-request | L | 30, 31, 34, 90, 220 | ⬜ |
| 223 | Deal Analyzer UI — standalone page `/deal-analyzer`, address autocomplete input, property summary card (key facts, sale history, estimated value), Deal Brief display with collapsible sections, copy-to-clipboard on each section | user-request | L | 221, 222 | ⬜ |
| 224 | Motivated Seller Scoring — signal-weighted scoring engine across all properties in a market: `inherited`, `ownerOccupied: false`, `adjustableRate`, long hold period, HELOC pattern (multiple mortgages), high equity. Surfaces top 10–15 candidates in a "Watch List" panel on the Deal Analyzer page | user-request | M | 221, 220 | ⬜ |
| 225 | Deal Brief shareable output — one-click PDF export and shareable web link for a Deal Brief, reusing existing PDF rendering pipeline and share token infrastructure | user-request | M | 222, 57 | ⬜ |
| 226 | Entitlement gating for Deal Analyzer — check `deal_analyses_per_month` entitlement before allowing analysis, show upgrade prompt for Starter tier, wire into existing entitlement check utility | user-request | S | 173, 223 | ⬜ |
| 227 | Admin analytics for Deal Analyzer — analyses count per user in admin user detail, platform-wide deal analysis volume in analytics dashboard, most-analyzed markets | user-request | M | 220, 113, 130 | ⬜ |

**Goal**: An agent sitting with a buyer pulls up any property address and gets instant AI-backed context — where it sits relative to the market, which buyer persona it fits and why, negotiation leverage points, and whether now is the right time to move. A Watch List of motivated sellers surfaces hidden inventory before it lists. Deal Briefs are shareable as PDFs or web links.

---

## Phase 22: Production Reliability & Monitoring

> Safeguards to prevent extended outages like the 24-hour Supabase circuit breaker incident (2026-03-15). Automated monitoring, connection resilience, deployment health gates, and operational runbooks.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 230 | Connection recycling — add `max_lifetime` to postgres client so stale credentials auto-heal without redeploy | incident-2026-03-15 | S | 2 | ⬜ |
| 231 | Cron health monitor + alerting — Vercel cron hitting `/api/health` every 5 min, fires Slack/email webhook on failure | incident-2026-03-15 | M | 2, 5 | ⬜ |
| 232 | Production runbook — `docs/runbook-supabase.md` documenting failure modes (stale pooler creds, paused project, IPv4, circuit breaker) with exact fix steps | incident-2026-03-15 | S | - | ⬜ |
| 233 | Post-deploy health gate — GitHub Actions workflow that curls `/api/health` after Vercel deploy, red X on commit if unhealthy | incident-2026-03-15 | S | 2 | ⬜ |

**Goal**: Outages are detected within 5 minutes (not 24 hours), connections self-heal from credential changes, bad deploys are flagged immediately, and recovery is a 10-minute checklist instead of a 2-hour investigation.

---

## Ad-hoc Requests

> Features added from triage that don't fit a phase. Processed after current phase.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| — | — | — | — | — | — |

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Pending — not started |
| 🔄 | In Progress — currently being built |
| ✅ | Completed — working end-to-end with real data |
| ⏸️ | Blocked — waiting on dependency or decision |
| ❌ | Cancelled — no longer needed |

## Complexity Legend

| Symbol | Meaning | Typical Scope |
|--------|---------|---------------|
| S | Small | 1-3 files, single component or utility |
| M | Medium | 3-7 files, multiple components, moderate logic |
| L | Large | 7-15 files, full feature, complex logic |

---

## Notes

### Architecture Decisions Needed
- **PDF engine**: React-PDF vs. Puppeteer — React-PDF is more portable but Puppeteer produces pixel-perfect output. Decision should be made in Phase 6 spec.
- **MLS data source**: Using RealEstateAPI (realestateapi.com) for property data — provides property search, detail, comps, valuations, MLS data, and sales history for 157M+ properties. No direct MLS integration needed.
- **Neighborhood intelligence**: Using ScrapingDog (scrapingdog.com) for neighborhood-level data — local amenities, lifestyle signals, area context via Google Local API and web scraping. Feeds Key Drivers and Trending Insights sections.
- **Redis vs. DB cache**: Vision mentions both. For v1, DB-backed cache (Supabase) is simpler to deploy. Redis can be added later for performance.
- **Analytics chart library**: Phase 15 needs charts (line charts, bar charts, possibly heat maps). Recharts is already available via the existing data viz components in Phase 6. Consider reusing.

### Phase Dependencies (Phases 1–11 complete)
- Phases 1-2 are strictly sequential (foundation then user setup)
- Phase 3 (data) and Phase 4 (agents) can be partially parallelized
- Phase 5 (builder UI) and Phase 6 (PDF templates) can be parallelized
- Phase 7 (editing) requires both Phase 5 and Phase 6
- Phase 8 (billing) only depends on Phase 1

### Phase Dependencies (Phase 12 — UX Redesign)
- Phase 12 (creation flow redesign) builds on top of existing Phase 2 (#11 market wizard), Phase 5 (#40 report wizard), Phase 9 (#80 pipeline), and Phase 10 (#90 personas)
- #150 (animation infrastructure) is the foundation — all other Phase 12 features depend on it
- #151 (flow shell) is the second foundation — steps 1-6 (#152-#157) all depend on it
- Steps 1-6 can be built sequentially or in parallel (each is self-contained within the flow shell)
- #158 (persistence) and #159 (dashboard) can be built after the flow shell exists
- Phase 12 is **independent from admin phases** — can run in parallel with Phases 13-16

### Phase Dependencies (Phases 13–16 — Admin Expansion)
- Phase 13 (user management) is independent — only needs the existing users table and admin auth
- Phase 14 (report registry) is independent — only needs existing reports table and admin auth
- Phase 15 (analytics) benefits from Phase 13 (#111 activity log) and Phase 14 (#120 error tracking) for richer data, but can start with existing tables
- Phase 16 (report eval) is independent — builds on the existing eval infrastructure in `lib/eval/`
- **All four admin phases can be parallelized** since they have no cross-dependencies (except Phase 15 is richer with 13+14 data)

### Critical Path
`#1 → #2 → #11 → #20 → #22 → #31 → #36 → #51 → #57` — this is the minimum path from empty repo to a generated report PDF. Everything else enriches this spine.

### Recommended Build Order (Phases 12–16)
1. **Phase 12** first — UX redesign is user-facing and highest impact. This is what agents experience every time they use the product
2. **Phase 13** second — user management is foundational for admin ops, and the activity log (#111) feeds Phase 15 analytics
3. **Phase 14** third — error triage is highest operational value (directly helps users with broken reports)
4. **Phase 15** fourth — analytics dashboard benefits from data from Phases 13 + 14
5. **Phase 16** last — report eval suite is important but less urgent than user-facing operational tools

### Phase Dependencies (Phase 17 — Social Media Kit)
- Phase 17 depends on having a finalized report, so it requires Phase 6 (#57 PDF export) and Phase 4 (#36 agent output schema) at minimum
- #160 (data model) only needs the database (Phase 1)
- #161 (Social Media Agent) needs the agent framework (#30) and agent output schema (#36)
- #162 (generation trigger) needs the agent (#161) and report export (#57)
- #163 (kit viewer) needs the data model (#160) and trigger (#162)
- #164 (regeneration) is a small add-on to #162
- #165 (admin) needs the data model (#160) plus admin report list (#121) and analytics (#130)
- **Phase 17 is independent from Phases 12-16** — can run in parallel

### Phase Dependencies (Phase 18 — Subscription & Entitlements)
- #170 (tier data model) only needs the database (Phase 1)
- #171 (user entitlement model) needs tiers (#170)
- #172 (usage tracking) needs entitlement model (#171)
- #173 (entitlement check utility) needs model + tracking (#171, #172) — this is the critical piece everything else depends on
- #174-#176 (gating in report/market/kit creation) each need #173 + the feature they're gating
- #176 (kit gating) depends on Phase 17's #162 (kit generation trigger)
- #177 (account page) needs model + tracking (#171, #172)
- #178-#179 (admin tier management + overrides) need #170 and #171 respectively
- #180 (signup assignment) needs tiers (#170) + auth (#3)
- **Phase 18 can start immediately** — #170-#173 have no dependency on Phases 12-17
- **Gating features (#174-#176) can be added incrementally** as each gated feature exists

### Phase Dependencies (Phase 19 — Report Advisor)
- #190 (data model) only needs the database (Phase 1)
- #191 (chat API) needs the data model (#190), agent framework (#30) for Claude API patterns, and report export (#57) for report content
- #192 (chat UI) needs the API (#191) and report preview (#42) for the panel integration
- #193 (entitlement gating) needs the API (#191) and entitlement check utility (#173)
- #194 (admin) needs the data model (#190) plus admin report list (#121) and analytics (#130)
- **Phase 19 can start immediately** — #190 has no dependency on other pending phases
- System prompt template is at `.specs/reference/report-advisor-system-prompt.md`

### Phase Dependencies (Phase 20 — Report Output V2)
- Phase 20 touches all 4 layers: Layer 1 (#211 liquidity metrics), Layer 2 (#204-#205 agent prompts), Layer 3 (#209-#210 assembly), and PDF rendering (#200-#208)
- #200-#210 (section changes) only depend on existing Phase 6 components (#50) and Phase 4 agents (#31, #32, #35) — all completed
- #211 (eliminate cash buyers) is a Layer 1 computation change — affects `market-analytics.ts`
- #213 (front-end disclaimer) is independent UI work
- #214 (expanded transactions) depends on entitlement gating (#183) and data fetcher (#22, #80) — the only cross-phase dependency
- **Phase 20 can start immediately** — all deps are completed except #183 (for #214 only)
- **Recommended build order**: #209-#210 (removals) → #211 (data fix) → #200-#203 (cover + new sections) → #204-#208 (section redesigns) → #212-#213 (transparency) → #214 (pro feature, after #183)

### Phase Dependencies (Phase 21 — Property Deal Analyzer)
- #220 (data model) only needs the database (Phase 1)
- #221 (lookup endpoint) needs the REAPI connector (#22) and data model (#220)
- #222 (Deal Brief Agent) needs the agent framework (#30), market analytics (#31), forecast (#34), personas (#90), and data model (#220) — all completed
- #223 (UI) needs lookup (#221) and agent (#222)
- #224 (Motivated Seller Scoring) needs lookup (#221) and data model (#220) — pure computation, no new APIs
- #225 (shareable output) needs the agent (#222) and existing PDF export (#57) + share tokens — minimal new surface area
- #226 (entitlement gating) needs the UI (#223) and entitlement utility (#173) — already completed
- #227 (admin analytics) needs data model (#220) plus existing admin user detail (#113) and analytics (#130)
- **Phase 21 can start immediately** — #220 has no dependencies beyond Phase 1
- **~90% of infrastructure already exists**: REAPI connector, market analytics DB, persona calibration, Claude agent framework, PDF rendering, share tokens, entitlement system

### Phase Dependencies (Phase 17/18 additions)
- #166-#167 (bulk email) follow same pattern as #161-#163 (social media agent) — depend on agent framework and report output
- #181-#182 (pro gating for social/email) depend on entitlement utility (#173) which is already completed
- #183 (expanded transaction gating) depends on #173 — already completed. #214 depends on #183

### Parallelization Opportunities
After Phase 1, multiple workstreams can run in parallel:
- **Workstream A**: #10, #11, #12, #13 (user & market setup)
- **Workstream B**: #20, #21, #22, #23, #24, #25 (data infrastructure)
- **Workstream C**: #50, #55 (report template engine + data viz components)

After Phase 3 + early Phase 6:
- **Workstream D**: #30-#36 (agent pipeline)
- **Workstream E**: #51-#54 (report sections)

UX redesign + admin expansion (Phases 12–16):
- **Workstream F**: #150-#159 (UX redesign) — user-facing, highest priority
- **Workstream G**: #110-#116 (user management) + #120-#125 (report registry) — can run in parallel with F
- **Workstream H**: #140-#143 (report eval) — independent, can run anytime
- **Workstream I**: #130-#135 (analytics) — ideally after G completes for richer data
- **Workstream J**: #160-#165 (social media kit) — independent, can run anytime after report pipeline is stable
- **Workstream K**: #170-#173 (entitlement foundation) → #174-#180 (gating + admin) — foundation can start immediately, gating added incrementally
- **Workstream L**: #190-#192 (report advisor) → #193 (gating, after K) → #194 (admin analytics) — can start immediately, gating wired after entitlement foundation
- **Workstream M**: #209-#210, #211, #200-#208, #212-#213 (report output V2) — can start immediately, all deps met
- **Workstream N**: #166-#167 (bulk email campaigns) — can start after social media kit agent pattern is established
- **Workstream O**: #181-#183 (pro feature gating) → #214 (expanded transactions) — entitlement foundation already complete
- **Workstream P**: #220 (data model) → #221 (lookup) → #222 (agent) + #224 (scoring) → #223 (UI) → #225 (share) → #226 (gating) → #227 (admin) — can start immediately, independent of all other pending phases

---

_This file is the single source of truth for `/build-next`. Features are picked in order, respecting dependencies._
_Create with `/roadmap create`, add features with `/roadmap add`, restructure with `/roadmap reprioritize`._
