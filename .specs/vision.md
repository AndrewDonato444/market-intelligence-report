# App Vision

> The Luxury Market Intelligence Report platform — powered by Modern Signal Advisory — enables luxury real estate agents to generate contextually deep, data-driven market intelligence reports for specific luxury, high-luxury, and ultra-luxury markets.

---

## Overview

Modern Signal Advisory is the company. The Luxury Market Intelligence Report (LMIR) is the artifact it produces.

The LMIR is a highly produced, visually polished market intelligence report that transforms raw market data into strategic narratives luxury agents can use to advise clients, spot trends, and differentiate themselves from salespeople. Reports are designed to be shared with clients, distributed digitally, and printed.

The application guides users through a structured input process, collects market parameters, makes API calls to data sources, caches results aggressively (APIs are expensive), and synthesizes everything into a finished report using a pipeline of specialized agents.

**Target users**: Luxury real estate agents and teams operating in high-luxury ($6M-$10M) and ultra-luxury ($10M+) markets who want to position themselves as data-driven advisors rather than salespeople.

**Core value proposition**: Agents get a strategic advantage — a contextually deep, beautifully produced market intelligence report they can customize, brand, and share with clients. It makes them look like the smartest person in the room because the data backs them up.

---

## The Artifact: Luxury Market Intelligence Report

The LMIR is the product. Everything the app does serves the creation of this document. Based on the reference report (Naples Intelligence Report, End of 2025 Edition), the report contains these sections:

### Report Structure

| Section | Purpose | Data Sources |
|---------|---------|--------------|
| **Strategic Market Overview & Insights Index** | Headline metrics and confidence ratings across key forces (liquidity strength, opportunity value, management risk, advantage timing) | Aggregated transaction data, trend analysis |
| **Executive Summary & Market Analysis Matrix** | Total transaction count, volume, segment-by-segment performance with intelligence ratings (A+ through C), risk levels, and action recommendations | MLS data, transaction database |
| **Second Homes Insights** | Owner-occupancy vs. second-home analysis, cash dominance, furnished vs. unfurnished premiums | Transaction data, occupancy patterns |
| **Key Drivers (Five Strategic Themes)** | Deep analysis of the 5 forces shaping the specific market (e.g., ultra-luxury dominance, cash buyer immunity, property type bifurcation, coastal premium concentration, supply constraints) | Multi-source synthesis |
| **Competitive Market Analysis** | Market vs. peer luxury markets (e.g., Naples vs. Miami Beach, Aspen, Hamptons, Palm Beach) | Cross-market data APIs |
| **Trending Insights** | Emerging lifestyle and demand patterns (wellness, smart home, single-family dominance) | Trend analysis, showing data |
| **Forward Outlook & Strategic Forecasts** | Projected growth by segment, base case scenarios, timing recommendations | Predictive modeling |
| **Market Gaps, Methodology & Sources** | Active monitoring areas (30-90 day, 90-180 day, 6-18 month), methodology transparency | Monitoring framework |
| **Strategic Summary** | Confidence levels, key stats recap, call to action | Synthesis |

### Report Quality Standards

- **Highly produced**: Magazine-quality layout with professional photography placeholders, pull quotes, data visualizations (charts, comparison tables, confidence ratings)
- **Contextually deep**: Not generic — every insight ties to specific transaction data, segment analysis, and local market dynamics
- **Actionable**: Every section includes timing recommendations, risk assessments, and strategic positioning advice
- **Shareable**: Designed for digital distribution and print. Branded to the agent/team
- **Data-backed**: Methodology section establishes credibility with source transparency

### Reference Report

The example Naples Intelligence Report is stored at `.specs/reference/naples-intelligence-report-jan2026.pdf`. This is the quality bar and structural template we are building toward.

---

## Key Screens / Areas

| Screen | Purpose | Priority |
|--------|---------|----------|
| **Onboarding / Market Setup** | Agent creates account, defines their market (geography, segments, luxury tiers) | Core |
| **Report Builder - Inputs** | Guided wizard to collect market parameters, select buyer personas (up to 3), select data sources, customize sections | Core |
| **Data Pipeline Status** | Shows API calls in progress, caching status, agent pipeline progress | Core |
| **Report Preview** | Live preview of the generated report as it's being assembled | Core |
| **Report Editor** | Post-generation editing — adjust narratives, swap photos, refine insights | Core |
| **Report Export** | PDF generation, digital sharing links, print-ready output | Core |
| **Report History** | Past reports, templates, versioning | Secondary |
| **Account & Billing** | Subscription management, usage tracking (API costs are real) | Secondary |

### Admin Platform

| Screen | Purpose | Priority |
|--------|---------|----------|
| **Admin: User Management** | View all users, search/filter, suspend or delete accounts, view account status and activity | Core |
| **Admin: Report Registry** | Browse all reports across all users — filter by status (completed, failed, generating), view report details, identify errors that need intervention | Core |
| **Admin: Error Triage** | Surface reports with errors or pipeline failures, show error details, allow admin to re-trigger or manually intervene | Core |
| **Admin: Analytics Dashboard** | Usage statistics — report volume over time, geographic breakdowns (by state, city, market), segment distribution, user activity trends | Core |
| **Admin: Report Eval Suite** | End-to-end eval scoring of finished reports (not just individual agents) — data accuracy, narrative quality, completeness, formatting, actionability | Core |
| **Admin: Agent Eval Suite** | Existing per-agent eval suite — test cases for insight-generator, forecast-modeler, polish-agent | Implemented |
| **Admin: Pipeline Visualizer** | Existing pipeline execution visualization | Implemented |
| **Admin: System Monitoring** | Existing cache stats, API costs, pipeline health dashboard | Implemented |
| **Admin: Data Sources** | Existing data source registry and health checks | Implemented |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes + serverless functions |
| Database | PostgreSQL (Supabase or Neon) |
| Auth | Supabase Auth |
| PDF Generation | React-PDF / Puppeteer for high-fidelity output |
| AI/Agents | Anthropic Claude API (data analysis, insight generation, narrative writing, polishing) |
| Data APIs | RealEstateAPI (property search, detail, comps, valuations), ScrapingDog (neighborhood intelligence, local amenities) |
| Caching | Redis or database-backed cache with TTL management |
| File Storage | S3-compatible (report PDFs, images) |
| Hosting | Vercel (frontend) + serverless backend |

---

## Buyer Persona Intelligence

The LMIR is not one-size-fits-all. Luxury real estate agents serve different buyer archetypes — each with distinct decision frameworks, vocabulary, risk tolerances, and information needs. The platform enables agents to select which buyer personas their report should address, and the system generates persona-specific insights, talking points, and narrative framing tailored to those audiences.

**These are not our users.** Our users are the luxury agents. These personas represent the agent's clients — the buyers they're advising. By selecting personas during report generation, agents get content that directly addresses what their specific buyers care about.

### Buyer Persona Framework

The platform supports 8 universal luxury buyer archetypes, derived from the Knox Brothers Intelligence Framework:

| # | Persona | Core Driver | Buying Lens | What Wins Them Over |
|---|---------|-------------|-------------|---------------------|
| 01 | The Private Equity & Finance Principal | Smart capital allocation | ROI + Tax + Leverage | Data, market intelligence, exclusivity |
| 02 | The Legacy Wealth & Multigenerational Family | Meaning and legacy | Long-term hold | Story + emotional significance |
| 03 | The Retiring UHNW Individual | Lifestyle upgrade | Experience | Design + tranquility |
| 04 | The Tech Founder & Entrepreneur | Efficiency | Liquidity strategy | Efficiency + innovation |
| 05 | The Seasonal & Second-Home Buyer | Peace and balance | Experience | Design + tranquility |
| 06 | The International Buyer | Efficiency and global competence | Portfolio diversification | Concierge-level service |
| 07 | The Celebrity / Public Figure | Privacy | Discretion | Off-market access |
| 08 | The Corporate Executive & C-Suite Relocator | Time savings | Liquidity strategy | Efficiency + innovation |

Each persona includes:
- **Decision Drivers & Priority Matrix** — weighted factors the persona evaluates (Critical / High / Moderate)
- **Report Intelligence Specifications** — the specific metrics and analyses this persona needs to see
- **Property Filter Criteria** — price range, property type, community type, year built preferences
- **Narrative Framing** — language, tone, vocabulary to use (and avoid) when writing for this persona
- **Agent Talking Points** — templated data-driven conversation starters built from market data

### Multi-Persona Output Strategy (TBD)

Agents can select up to 3 personas per report. **Open design decision**: how persona content appears in the final report. Two approaches under consideration:

**Option A: Blended Report** — Persona insights are woven throughout the report. The narrative tone, metric emphasis, and talking points blend all selected personas into a unified document. Rules from the Knox Brothers framework apply:
1. Metric Union — include all primary metrics from all selected personas; use the most detailed specification where they overlap
2. Filter Intersection — apply the most restrictive filter set that still captures the target buyer
3. Narrative Hierarchy — the first-selected persona sets the primary tone; secondary personas contribute vocabulary naturally
4. Blended Talking Points — maximum 7 talking points addressing overlapping concerns
5. De-Emphasis Conflicts — if a metric is emphasized by one persona but de-emphasized by another, include it as secondary context

**Option B: Persona-Specific Sections** — Each selected persona gets its own dedicated section in the report with tailored talking points, metric emphasis, and narrative framing. The core data sections remain neutral; persona sections are additive.

**Option C: Hybrid** — Core report stays neutral, but a persona appendix or addendum provides per-persona talking points and framing that the agent can use in conversations.

This decision will be made during the spec phase for feature #92 (Persona Intelligence Agent).

### Market Calibration

All persona intelligence specifications are market-agnostic by design. When generating for a specific market, the system must:
- Adjust price tier boundaries to local luxury definitions
- Substitute local community names and developments
- Recalibrate seasonal patterns, DOM benchmarks, and cash transaction norms
- Adapt community type filters to local equivalents (golf, waterfront, ski, urban high-rise, etc.)

### Reference Document

The full persona framework with detailed specifications is stored at `.specs/reference/knox-brothers-persona-framework.pdf`.

---

## Agent Pipeline

The report generation process is not a single API call — it's a pipeline of specialized agents:

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Data Collector** | Fetches raw data from APIs, checks cache first | Market parameters, API keys | Raw datasets (transactions, pricing, trends) |
| **Data Analyst** | Processes raw data into segment-level insights, calculates metrics | Raw datasets | Structured analysis (segment performance, YoY changes, ratios) |
| **Insight Generator** | Transforms analysis into strategic narratives, identifies key themes | Structured analysis | Section-by-section narrative content |
| **Competitive Analyst** | Compares target market against peer luxury markets | Target market data + peer market data | Competitive positioning content |
| **Forecast Modeler** | Projects forward trends, assigns confidence ratings | Historical data + current signals | Forecasts with confidence levels |
| **Persona Intelligence Agent** | Reframes data and insights through selected buyer persona lenses — generates persona-specific talking points, narrative framing, and metric emphasis | All prior agent outputs + selected persona specs | Persona-tailored content sections, blended talking points, persona-specific narrative overlays |
| **Report Assembler** | Combines all outputs into the final report layout | All agent outputs (including persona content) + design tokens | Complete report draft |
| **Polish Agent** | Final pass for consistency, tone, formatting, pull quotes | Draft report | Publication-ready report |

---

## Backend: Data & Caching Strategy

APIs for luxury real estate data are expensive. The backend must be built around aggressive caching:

- **Cache-first architecture**: Every API call checks cache before hitting the network
- **TTL by data type**: Transaction data (24h), market trends (7d), economic indicators (12h), competitive data (7d)
- **Cost tracking**: Every API call is logged with cost, so usage dashboards are accurate
- **Batch fetching**: Where possible, batch multiple data requests into single API calls
- **Incremental updates**: For returning users, only fetch data that has changed since last report
- **Fallback data**: If an API is down, serve cached data with a staleness indicator rather than failing

---

## Design Principles

1. **Premium by default** — the app itself must feel as polished as the reports it produces. This is a tool for luxury professionals; it can't feel like a startup MVP.
2. **Data confidence over data volume** — show fewer metrics with high confidence rather than many metrics with uncertainty. Mirror the report's own methodology standards.
3. **Progressive disclosure** — the report builder should feel simple even though the underlying data pipeline is complex. Hide complexity, surface results.
4. **Print-first report design** — the LMIR is designed for print and PDF. Screen viewing is secondary. Typography, spacing, and layout must work at 300dpi.
5. **Agent-branded output** — every report prominently features the agent's branding, not Modern Signal Advisory's. MSA is the engine, not the face.

---

## Admin Platform

The admin platform is the internal operations center for Modern Signal Advisory. It enables the MSA team to manage users, monitor report quality, triage errors, and understand platform usage patterns. All admin screens are behind role-based auth (`requireAdmin()`).

### User Management

Full lifecycle management of agent accounts:
- **User list** with search, filter by status (active, suspended), sort by last activity
- **Suspend accounts** — temporarily disable access without deleting data. Suspended users see a "contact support" message on login
- **Delete accounts** — permanent removal with confirmation. Cascades to orphan reports (kept for analytics but de-linked from user)
- **Account detail view** — registration date, last login, total reports generated, current subscription status, market(s) configured
- **Activity timeline** — chronological log of user actions (report created, report exported, market changed)

### Report Registry & Error Triage

Visibility into every report generated across the platform:
- **Report list** — all reports across all users, filterable by status (queued, generating, completed, failed), date range, user, market
- **Error triage** — dedicated view surfacing failed reports and pipeline errors. For each error: which agent failed, error message, stack trace, input data. Admin can re-trigger the pipeline or mark as "needs manual fix"
- **Report detail** — view the full generated report, see which agents ran, execution time per agent, cache hit rates, API costs incurred
- **Intervention workflow** — when a user's report has errors, admin can investigate, fix underlying data issues, and re-run. User gets notified when their report is ready

### Analytics Dashboard

Operational intelligence for the MSA team:
- **Volume metrics** — total reports generated (daily, weekly, monthly), trend over time
- **Geographic breakdown** — reports by state, city, and market. Heat map or ranked list showing where demand is concentrated
- **Segment analysis** — which luxury tiers are most requested (high-luxury vs ultra-luxury), which buyer personas are most selected
- **User analytics** — active users, churn indicators, power users (most reports), new signups over time
- **Pipeline performance** — average generation time, cache hit rates, API cost per report, error rates by agent
- **Data export** — CSV/JSON export of analytics data for external analysis

### Report Eval Suite

End-to-end quality scoring of finished reports (complements the existing per-agent eval suite):
- **Report-level test cases** — score the full assembled report, not individual agent outputs. Criteria include:
  - **Data accuracy** — do the numbers in the narrative match the underlying data?
  - **Completeness** — are all expected sections present and substantive?
  - **Narrative quality** — is the writing strategic, not generic? Does it reference specific data?
  - **Formatting & structure** — does the report follow the reference layout?
  - **Actionability** — does each section include timing recommendations and strategic positioning?
  - **Persona alignment** — if personas were selected, does the content reflect their vocabulary and priorities?
- **Scoring rubric** — LLM-as-judge scoring (1–5) with breakdown by criterion, mirroring the existing agent eval pattern
- **Regression tracking** — track report quality scores over time to catch pipeline degradation
- **Sample report library** — curated set of "golden" reports that represent the quality bar

### Existing Admin Features (Implemented)

| Feature | Status | Location |
|---------|--------|----------|
| Agent Eval Suite | Implemented | `/admin/eval` — 24 test cases across insight-generator, forecast-modeler, polish-agent |
| Pipeline Visualizer | Implemented | `/admin/pipeline` — execution flow visualization |
| System Monitoring | Implemented | `/admin/monitoring` — cache stats, API costs, pipeline health |
| Data Source Registry | Implemented | `/admin/data-sources` — connector management, health checks |
| Role-based Auth | Implemented | `requireAdmin()` — auth ID + role check |

---

## Out of Scope (for now)

- Mobile native apps (web-responsive is sufficient)
- Multi-market comparison reports (single-market reports first)
- Automated recurring report generation (manual trigger first)
- White-label reselling to brokerages
- Direct MLS integration (start with manual data upload + API where available)
- Real-time market alerts / notifications
- Client-facing portal (agents share PDFs, not app access)
- Public-facing admin API (admin functions are internal UI only)
- Automated user suspension rules (manual admin action only for now)

---

## Reference

**Example report**: `.specs/reference/naples-intelligence-report-jan2026.pdf`
**Report name**: Naples Intelligence Report, End of 2025 Edition
**Produced by**: Knox Brothers, Compass (Naples, Florida)
**Analysis scope**: 2,234 transactions ($1M+) totaling $6.58B across 31 leading indicators
**Analysis date**: 2026-03-09

---

_This file is created by `/vision` and serves as the north star for `/build-next` decisions._
_Update with `/vision --update` to reflect what's been built and learned._
