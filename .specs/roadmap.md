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
| ✅ Completed | 28 |
| 🔄 In Progress | 0 |
| ⬜ Pending | 8 |
| ⏸️ Blocked | 0 |

**Last updated**: 2026-03-09

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

**Goal**: The system can fetch real market data, cache it intelligently, and track costs per API call.

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
| 54 | Trending Insights + Forecasts + Methodology + Strategic Summary sections | vision | L | 50, 36, 34 | ⬜ |
| 55 | Data visualization components (charts, confidence dots, segment matrices) | vision | L | 50 | ⬜ |
| 56 | Agent branding injection (logo, colors, contact info, disclaimers) | vision | M | 50, 10 | ⬜ |
| 57 | PDF export + digital sharing links | vision | M | 50, 51 | ⬜ |

**Goal**: A complete, magazine-quality PDF that matches the Naples Intelligence Report reference — branded to the agent, print-ready at 300dpi, with real data visualizations.

---

## Phase 7: Post-Generation & Management

> Edit, iterate, save, and reuse. Agents refine reports after generation and build a library over time.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 60 | Report editor — adjust narratives, refine insights post-generation | vision | L | 42, 57 | ⬜ |
| 61 | Report history + versioning | vision | M | 2, 57 | ⬜ |
| 62 | Report templates — save/reuse market configurations | vision | M | 40, 61 | ⬜ |

**Goal**: An agent can edit any section of a generated report, maintain a version history, and reuse market configurations for future reports.

---

## Phase 8: Account & Billing

> Monetization infrastructure. Subscription management, usage tracking, and cost transparency.

| # | Feature | Source | Complexity | Deps | Status |
|---|---------|--------|------------|------|--------|
| 70 | Account settings page | vision | S | 3, 4 | ⬜ |
| 71 | Subscription management + Stripe integration | vision | M | 70 | ⬜ |
| 72 | Usage dashboard — API costs, report count, billing summary | vision | M | 23, 71 | ⬜ |

**Goal**: Agents can manage their subscription, see how many reports they've generated, and understand their API cost consumption.

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

### Phase Dependencies
- Phases 1-2 are strictly sequential (foundation then user setup)
- Phase 3 (data) and Phase 4 (agents) can be partially parallelized — the orchestration framework (#30) doesn't need real data to scaffold
- Phase 5 (builder UI) and Phase 6 (PDF templates) can be parallelized — the wizard doesn't need the PDF engine to work, and vice versa
- Phase 7 (editing) requires both Phase 5 and Phase 6 to be complete
- Phase 8 (billing) only depends on Phase 1 and can be built anytime after foundation

### Critical Path
`#1 → #2 → #11 → #20 → #22 → #31 → #36 → #51 → #57` — this is the minimum path from empty repo to a generated report PDF. Everything else enriches this spine.

### Parallelization Opportunities
After Phase 1, multiple workstreams can run in parallel:
- **Workstream A**: #10, #11, #12, #13 (user & market setup)
- **Workstream B**: #20, #21, #22, #23, #24, #25 (data infrastructure)
- **Workstream C**: #50, #55 (report template engine + data viz components)

After Phase 3 + early Phase 6:
- **Workstream D**: #30-#36 (agent pipeline)
- **Workstream E**: #51-#54 (report sections)

---

_This file is the single source of truth for `/build-next`. Features are picked in order, respecting dependencies._
_Create with `/roadmap create`, add features with `/roadmap add`, restructure with `/roadmap reprioritize`._
