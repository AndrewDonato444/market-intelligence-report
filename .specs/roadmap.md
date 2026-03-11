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
| ✅ Completed | 82 |
| 🔄 In Progress | 0 |
| ⬜ Pending | 16 |
| ⏸️ Blocked | 0 |

**Last updated**: 2026-03-11

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
| 143 | Regression tracking — store eval scores over time, chart quality trends, alert on score degradation | vision | M | 141 | ⬜ |

**Goal**: Admin can run end-to-end quality evaluations on finished reports, track quality scores over time, and catch pipeline degradation before it affects users.

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

---

_This file is the single source of truth for `/build-next`. Features are picked in order, respecting dependencies._
_Create with `/roadmap create`, add features with `/roadmap add`, restructure with `/roadmap reprioritize`._
