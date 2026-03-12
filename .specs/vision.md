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

## The Artifact: Social Media Kit

The Social Media Kit is the second product. Once a report is finalized, agents can generate a companion Social Media Kit — a comprehensive, text-based content package that helps them talk about their market intelligence on social media. The kit turns the report into a marketing engine.

The Social Media Kit is **text-only** — no image generation, no asset creation. Agents bring their own visuals; we give them the words, structure, and strategy.

### Kit Contents

| Content Type | Purpose | Example |
|-------------|---------|---------|
| **Post Ideas** | Ready-to-use social media post concepts tied to specific report insights | "3 reasons ultra-luxury waterfront is outperforming the broader market" |
| **Captions** | Platform-optimized captions (Instagram, LinkedIn, X/Twitter, Facebook) with hashtag suggestions | LinkedIn-length thought leadership vs. Instagram-concise with hooks |
| **Persona-Targeted Posts** | Posts written for specific buyer personas — using their vocabulary and addressing their concerns | Post targeting Tech Founders vs. post targeting Legacy Wealth families |
| **Poll Ideas** | Engagement-driving polls tied to market data from the report | "Which luxury segment do you think will outperform in 2026?" with data-backed answer context |
| **Conversation Starters** | DM/comment templates for engaging with prospects who interact with posts | "Great question — our latest market analysis shows..." |
| **Content Calendar Suggestions** | Recommended posting cadence and sequence to maximize the report's content lifespan | "Week 1: headline stats → Week 2: deep dive on key driver → Week 3: persona-specific insight" |
| **Stat Callouts** | Snackable, quotable statistics pulled directly from report data | "$6.58B in luxury transactions — here's what that means for your portfolio" |

### Kit Quality Standards

- **Report-grounded**: Every post, caption, and poll ties back to specific data or insights from the generated report — no generic social media advice
- **Platform-aware**: Content is optimized for each platform's format, tone, and character limits
- **Persona-aligned**: When the report includes buyer personas, the kit generates persona-specific content using the same vocabulary and framing
- **Agent-voiced**: Content is written from the agent's perspective as a market expert, not from MSA's perspective
- **Engagement-optimized**: Posts include hooks, questions, and CTAs designed to drive interaction

### Paywall Strategy

The Social Media Kit is a paid feature gated by subscription tier. See the Subscription & Entitlement System section for details.

---

## Key Screens / Areas

| Screen | Purpose | Priority |
|--------|---------|----------|
| **Report Creation Flow** | Unified guided experience — market definition through report generation in one seamless flow (see Report Creation Experience section below) | Core — Redesign |
| **Data Pipeline Status** | Shows API calls in progress, caching status, agent pipeline progress — integrated into the creation flow as the final stage | Core |
| **Report Preview** | Live preview of the generated report as it's being assembled | Core |
| **Report Editor** | Post-generation editing — adjust narratives, swap photos, refine insights | Core |
| **Report Export** | PDF generation, digital sharing links, print-ready output | Core |
| **Social Media Kit Generator** | Post-report action — generate a full social media content kit from the finalized report. Shows generation progress, then presents the kit organized by content type | Core |
| **Social Media Kit Viewer** | Browse, copy, and customize generated social media content — organized by content type (posts, captions, polls, etc.) with platform filters and persona filters | Core |
| **Dashboard** | Home base — recent reports, quick-start new report, market overview | Core — Redesign |
| **Report History** | Past reports, templates, versioning | Secondary |
| **Account & Billing** | Subscription tier display, current usage vs. caps, upgrade prompts, usage tracking (API costs are real) | Core |

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
| **Admin: Subscription Tiers** | Create/edit subscription tiers — set caps (reports/month, markets, social media kits), included features, display pricing. Changes apply to all users on that tier | Core |
| **Admin: Entitlement Overrides** | Grant individual users tier overrides, entitlement boosts, or feature unlocks without payment. Full audit trail of who granted what and why | Core |

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
| **Social Media Agent** | Reads the finalized report and generates a comprehensive social media content kit — post ideas, platform-specific captions, persona-targeted posts, polls, conversation starters, stat callouts, and content calendar suggestions | Finalized report (all sections) + selected personas | Complete social media kit (text-only, structured JSON) |

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

## Report Creation Experience

The current market creation and report generation flows are separate wizards — two disconnected 3-step forms that feel utilitarian and boxy. This needs to be reimagined as a single, premium guided experience that makes agents feel like they're being walked through something special.

### Design Philosophy

This is where agents spend most of their time. It needs to feel like a luxury concierge experience, not a web form. Think: Stripe's checkout flow meets a luxury hotel booking experience. Every step should have purpose, clarity, and polish.

### Unified Flow

The market definition and report generation are merged into one continuous flow. If the agent already has a market defined, they can skip ahead. If they're new, they start from the beginning. The flow adapts.

**Step 1: Your Market** — Where do you operate?
- Geography selection with smart autocomplete and map context
- Animated transition as the market comes into focus
- Contextual helper text explaining what we'll do with each field ("We'll use this to find luxury transactions in your area")
- Visual feedback: as they type a city, show a subtle market summary preview (e.g., "Naples, FL — 2,234 luxury transactions last year")

**Step 2: Your Tier** — What level of luxury?
- Visual tier selector (not radio buttons) — each tier is a card with price range, example properties, and a brief description
- Selecting a tier animates price floor/ceiling into view with sensible defaults
- Tooltip: "Most agents in [city] focus on [tier]" (data-driven hint if available)

**Step 3: Your Focus** — What matters most?
- Market segments and property types as visual toggleable cards (not checkboxes)
- Each option has an icon and short description
- Smart defaults based on market and tier selection
- "Popular in your market" badges on commonly selected options

**Step 4: Your Audience** — Who are you advising?
- Persona selection (currently step 2 of the report wizard) — integrated here
- Large persona cards with personality illustration, key traits, and "what they care about"
- Preview panel slides in from the right when a persona is selected
- Max 3 with graceful enforcement (card dims with explanation, not just disabled)

**Step 5: Review & Generate** — Your report at a glance
- Beautiful summary card showing all selections with edit links back to each step
- Report title (auto-generated, editable)
- Estimated generation time
- "Generate Report" as a prominent, satisfying CTA
- Transition into the pipeline status view (step 6) with animation

**Step 6: Generating** — Your report is being built
- Pipeline progress integrated into the flow (not a separate page)
- Each agent stage shows progress with contextual descriptions ("Analyzing 2,234 transactions...")
- Animated progress indicators
- Estimated time remaining
- Option to be notified when complete

### UX Requirements

- **Framer Motion** for all transitions — step-to-step slide animations, card selections, panel reveals, progress bars
- **Contextual tooltips** on every input — explain what each field does and why it matters, in the agent's language (not developer language)
- **Inline instructions** — short, friendly guidance text above or beside each section ("This helps us find the right comps for your market")
- **Progress indicator** — refined step indicator that shows where you are, what's coming, and what's done. Not just dots — names and a sense of progress
- **Validation with personality** — errors are helpful, not red and scary. "We need a city to find your market data" instead of "City is required"
- **Persistence** — if the agent leaves mid-flow and comes back, they pick up where they left off
- **Responsive** — works beautifully on desktop (primary) and tablet. Mobile is acceptable but not primary
- **Animations**: entrance animations for each step's content, smooth transitions between steps, subtle hover states on interactive elements, satisfying selection feedback (scale + color change), progress bar animations during generation
- **Empty state artistry** — when the agent hasn't selected anything yet, show inviting placeholders, not blank space

### Returning Users

Agents who already have markets defined get a streamlined experience:
- Dashboard shows their markets with a "New Report" action on each
- Clicking "New Report" on an existing market skips to Step 4 (persona selection)
- "New Market" flow starts at Step 1
- Market editing is accessible from the flow (edit icon on Step 1 summary) — not a separate page

---

## Design Principles

1. **Premium by default** — the app itself must feel as polished as the reports it produces. This is a tool for luxury professionals; it can't feel like a startup MVP.
2. **Data confidence over data volume** — show fewer metrics with high confidence rather than many metrics with uncertainty. Mirror the report's own methodology standards.
3. **Progressive disclosure** — the report builder should feel simple even though the underlying data pipeline is complex. Hide complexity, surface results.
4. **Print-first report design** — the LMIR is designed for print and PDF. Screen viewing is secondary. Typography, spacing, and layout must work at 300dpi.
5. **Agent-branded output** — every report prominently features the agent's branding, not Modern Signal Advisory's. MSA is the engine, not the face.
6. **Guided, not gated** — every step in the creation flow should teach the agent something about their market. Tooltips, contextual hints, and smart defaults make the process feel effortless, not bureaucratic.
7. **Motion with purpose** — animations and transitions serve comprehension (showing relationships between steps, confirming selections, indicating progress), never decoration. Framer Motion throughout, but always purposeful.

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

## Subscription & Entitlement System

The platform gates features and volume behind subscription tiers. No Stripe account exists yet — the entitlement system is built internally first, with Stripe wired up later.

### Subscription Tiers (Illustrative — Admin-Editable)

| Tier | Reports/Month | Markets | Social Media Kits | Personas/Report | Price (Display Only) |
|------|--------------|---------|-------------------|-----------------|---------------------|
| **Starter** | 2 | 1 | Not included | 1 | $0 / Free |
| **Professional** | 10 | 3 | 1 per report | 3 | $199/mo |
| **Enterprise** | Unlimited | Unlimited | Unlimited | 3 | Custom |

Tiers, caps, and included features are **fully admin-editable** — the table above is a starting point, not hardcoded.

### Entitlement Types

| Entitlement | Cap Type | Examples |
|------------|---------|---------|
| `reports_per_month` | Numeric or unlimited | 2, 10, unlimited |
| `markets_created` | Numeric or unlimited | 1, 3, unlimited |
| `social_media_kits` | Per-report cap or not included | 0, 1, unlimited |
| `personas_per_report` | Numeric | 1, 3 |

New entitlement types can be added as features grow — the system is designed to be extensible without schema changes (entitlements stored as JSONB).

### Gating Behavior

When a user hits a cap:
- **Soft gate**: show what they'd get if they upgraded (preview, not a hard wall)
- **Clear messaging**: "You've used 2 of 2 reports this month. Upgrade to Professional for 10 reports/month."
- **No data loss**: if a user downgrades, their existing reports/kits/markets remain accessible (read-only), they just can't create new ones beyond the new cap
- **Entitlement checks**: every gated action (create report, create market, generate kit) checks entitlements before proceeding. The check is a single utility function used app-wide.

### Admin Overrides

Admins can grant individual users:
- **Tier override**: assign any tier without payment (comp accounts, beta testers, partnerships)
- **Entitlement boost**: increase a specific cap for a user without changing their tier (e.g., "give this user 5 extra reports this month")
- **Feature unlock**: grant access to a paid feature (e.g., social media kit) without upgrading their tier
- **Override expiry**: overrides can be permanent or time-limited (e.g., "3 months of Professional for free")
- **Override audit trail**: all overrides logged with admin ID, reason, and timestamp

### Stripe Readiness

No Stripe account exists yet. The system is built **Stripe-ready**:
- Tier definitions, entitlement checks, and usage tracking are all internal (no Stripe dependency)
- `stripeCustomerId` and `stripeSubscriptionId` columns exist on the subscriptions table but are nullable
- When Stripe is connected later, the only work is: webhook handler to sync subscription status, checkout session creation, and customer portal link
- **No payment processing happens in-app until Stripe is wired up** — tiers are assigned manually by admin or defaulted on signup

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
- Social media image/graphic generation (kit is text-only — agents bring their own visuals)
- Social media scheduling or auto-posting (agents copy content to their own tools)
- Stripe payment processing (entitlement system is internal-first; Stripe wired up later)
- Self-service tier upgrades/downgrades (admin-managed until Stripe is connected)
- Proration, refunds, or billing cycle management (deferred to Stripe integration)

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
