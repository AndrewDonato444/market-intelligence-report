---
feature: Deal Analysis Data Model
domain: deal-analyzer
source: lib/db/schema.ts
tests:
  - __tests__/deal-analyzer/deal-analysis-data-model.test.ts
components: []
personas:
  - established-practitioner
  - rising-star-agent
design_refs: []
status: implemented
created: 2026-03-15
updated: 2026-03-15
---

# Deal Analysis Data Model

**Source File**: `lib/db/schema.ts`
**Migration**: `lib/db/migrations/0010_add_deal_analyses.sql`
**Design System**: N/A (data layer only)
**Personas**: `.specs/personas/established-practitioner.md`, `.specs/personas/rising-star-agent.md`

## Feature: Deal Analysis Data Model

The `deal_analyses` table stores every property analysis an agent runs through the Deal Analyzer. Each record captures the raw property data from RealEstateAPI, the generated Deal Brief content from Claude, and the motivated seller score.

### Where it lives

The Deal Analyzer is accessed **from within a completed report** — not as a standalone page. When viewing a report for "Naples, FL — $6M+", the agent sees an "Analyze a Property" action. This naturally scopes the analysis to the correct market and makes the data connection obvious. The table stores both `marketId` (NOT NULL) and `reportId` (NOT NULL) — the report provides the computed analytics that power the brief.

### Organization and retrieval

Analyses are organized by report — each analysis belongs to the report it was initiated from. Within the report view, agents see a list of their past analyses for that report, ordered by most recent. Each analysis has a `title` field that defaults to the property address but can be edited by the agent (e.g., "4100 Gulf Shore - Linekin estate" or "Comp for Johnson meeting"). This keeps things structured without requiring folders or tags — the report is the natural organizing boundary.

### Branding

Every Deal Brief output (PDF export, shareable web link) carries the agent's branding — logo, colors, name, company, contact info, disclaimer — pulled from the same `users` fields that brand the full report (#56). The `briefContent` JSONB stores the raw analysis; branding is injected at render time (not stored in the record), so it stays current if the agent updates their profile.

### Geographic restriction

The address must fall within the market's geography. The market definition includes `city`, `state`, and optionally `county`/`zipCodes`. The lookup endpoint validates the property's city/state against the market geography before proceeding. If someone types a Beverly Hills address while viewing their Naples report, the system rejects it: "This property isn't in your Naples, FL market area."

### Entitlement gating

Deal analyses consume a `deal_analyses_per_month` entitlement:
- **Starter**: 0 (not included — upgrade prompt with preview of what Deal Analyzer does)
- **Professional**: 10/month
- **Enterprise**: unlimited (-1)

This entitlement type must be added to `TierEntitlements` and the seed tiers updated. Usage is tracked via the existing `usage_records` table with `entitlementType: 'deal_analyses_per_month'`.

### Rate limiting

The Deal Analyzer is a direct proxy to a paid API (REAPI) and an expensive Claude call. Without rate limiting, a bot could drain API credits. Defense in depth:

1. **Per-user burst limit**: 5 requests per minute (prevents scripted loops)
2. **Per-user daily ceiling**: 20 requests per 24 hours (hard stop regardless of tier)
3. **Entitlement monthly cap**: tier-based (Starter: 0, Pro: 10, Enterprise: unlimited)

Validation order (cheapest to most expensive): rate limit -> entitlement -> geographic validation -> REAPI call. Each check short-circuits before reaching the next.

---

### Scenario: Create a deal analysis record
Given the database schema includes a `deal_analyses` table
When a new deal analysis is inserted with userId, marketId, reportId, address, and propertyData
Then a record is created with a UUID primary key
And title defaults to the address value
And status defaults to "queued"
And createdAt and updatedAt are set automatically
And the record is retrievable by id

### Scenario: Custom title for organization
Given an agent has completed a deal analysis for "4100 Gulf Shore Blvd N"
When they edit the title to "Linekin estate - Johnson meeting prep"
Then the title is updated
And the analysis appears with the custom title in the report's analysis list

### Scenario: Store enriched property data from REAPI
Given a deal analysis record exists
When propertyData JSONB is populated with REAPI response
Then the column stores sale history, mortgage history, owner info, demographics, and tax data
And the data is queryable via JSONB operators

### Scenario: Store Deal Brief content from Claude
Given a deal analysis record exists with status "generating"
When the Deal Brief Agent completes
Then briefContent JSONB is populated with pricing assessment, persona match, negotiation points, market timing, and summary
And status transitions to "completed"
And generatedAt timestamp is set

### Scenario: Require a completed report
Given an agent has a market "Naples, FL" but no completed reports for it
When they attempt to access the Deal Analyzer for that market
Then the action is blocked at the application layer
And the agent sees "Generate a report first to unlock Deal Analyzer for this market"

### Scenario: Validate address is within market geography
Given an agent is analyzing within their "Naples, FL" market report
When they enter an address in "Beverly Hills, CA"
Then the analysis is rejected at the application layer before calling REAPI
And the agent sees "This property isn't in your Naples, FL market area"

### Scenario: Store motivated seller score
Given a deal analysis record exists with propertyData
When the Motivated Seller Scoring engine runs
Then motivatedSellerScore (0-100) is stored on the record
And motivatedSellerSignals JSONB stores which signals fired and their weights

### Scenario: Record analysis failure
Given a deal analysis is in "generating" status
When the Deal Brief Agent or REAPI lookup fails
Then status transitions to "failed"
And errorMessage stores the failure reason
And the record is preserved (not deleted) for debugging

### Scenario: Check entitlement before creating analysis
Given an agent on the Starter tier attempts a deal analysis
Then the action is blocked before any API call
And the agent sees an upgrade prompt explaining Deal Analyzer is a Professional+ feature

### Scenario: Enforce monthly cap
Given a Professional agent has used 10 of 10 deal analyses this month
When they attempt an 11th analysis
Then the action is blocked
And the agent sees "You've used all 10 deal analyses this month. Upgrade to Enterprise for unlimited."

### Scenario: Track usage on successful analysis
Given a Professional agent has used 3 of 10 analyses this month
When they successfully complete a deal analysis
Then a usage_record is incremented for entitlementType "deal_analyses_per_month"
And their remaining count shows 6

### Scenario: Rate limit — per-user burst protection
Given any authenticated agent
When they submit more than 5 deal analysis requests within a 1-minute window
Then the 6th request is rejected with HTTP 429
And the response includes a Retry-After header
And no REAPI credits are consumed

### Scenario: Rate limit — per-user daily ceiling
Given any authenticated agent (regardless of tier)
When they submit more than 20 deal analysis requests in a 24-hour period
Then further requests are rejected with HTTP 429
And the agent sees "Daily analysis limit reached. Try again tomorrow."

### Scenario: Rate limit checked before entitlement
Given a request comes in from an authenticated agent
Then rate limit is checked first (cheapest check)
Then entitlement/monthly cap is checked second
Then geographic validation is checked third
Then REAPI is called last (most expensive)
And each check short-circuits before reaching the next

### Scenario: List analyses under a report
Given an agent has run 8 deal analyses from their "Naples Q1 2026" report
And 3 analyses from their "Naples Q4 2025" report
When viewing the "Naples Q1 2026" report
Then only the 8 analyses for that report are shown
And they are ordered by createdAt desc
And each shows title, address, status, motivated seller score, and date

### Scenario: Branded PDF output
Given an agent has logo, brand colors, company name, and contact info set
When they export a completed Deal Brief as PDF
Then the PDF includes the agent's logo, brand colors, company, and contact info
And branding is pulled from the users table at render time (not stored in briefContent)
And the PDF includes a standard disclaimer footer

### Scenario: Branded shareable web link
Given an agent shares a Deal Brief via web link
When the recipient opens the link
Then the page displays the agent's branding (logo, colors, company)
And the content matches the briefContent JSONB
And branding reflects the agent's current profile (not a snapshot from generation time)

### Scenario: Query analyses by user
Given an agent has run 15 deal analyses
When querying deal_analyses filtered by userId
Then all 15 records are returned ordered by createdAt desc
And the query uses the userId index efficiently

### Scenario: Query analyses by market for Watch List
Given 50 deal analyses exist for a specific market
When querying by marketId to build the Motivated Seller Watch List
Then records are filterable by marketId and sortable by motivatedSellerScore desc
And the query uses the marketId index

### Scenario: Cascade delete when user is deleted
Given an agent has 10 deal analyses
When their user account is deleted
Then all 10 deal analyses are cascade-deleted

### Scenario: Cascade delete when market is hard-deleted
Given an agent has 5 analyses linked to a market
When the market is hard-deleted
Then all 5 deal analyses are cascade-deleted

### Scenario: Preserve analyses when market is archived
Given an agent has 5 analyses linked to a market
When the market is soft-deleted (archived_at set)
Then the deal analyses are preserved (market still exists, just archived)
And the analyses remain accessible as historical records

---

## Data Schema

```
deal_analyses
├── id              UUID PK (defaultRandom)
├── userId          UUID FK -> users.id (NOT NULL, CASCADE)
├── marketId        UUID FK -> markets.id (NOT NULL, CASCADE)
├── reportId        UUID FK -> reports.id (NOT NULL, CASCADE)
├── title           VARCHAR(500) NOT NULL (defaults to address, editable)
├── address         VARCHAR(500) NOT NULL
├── propertyData    JSONB (REAPI response: property details, sale history, mortgages, demographics)
├── briefContent    JSONB (Deal Brief: pricing, persona match, negotiation, timing, summary)
├── motivatedSellerScore    INTEGER (0-100, nullable)
├── motivatedSellerSignals  JSONB (signal breakdown: { inherited: bool, weight: N, ... })
├── status          ENUM (queued, generating, completed, failed)
├── errorMessage    TEXT (nullable, populated on failure)
├── generatedAt     TIMESTAMP WITH TZ (nullable, set on completion)
├── createdAt       TIMESTAMP WITH TZ NOT NULL DEFAULT now()
└── updatedAt       TIMESTAMP WITH TZ NOT NULL DEFAULT now()

Indexes:
├── deal_analyses_user_id_idx        ON (userId)
├── deal_analyses_market_id_idx      ON (marketId)
├── deal_analyses_report_id_idx      ON (reportId)
├── deal_analyses_status_idx         ON (status)
└── deal_analyses_user_created_idx   ON (userId, createdAt DESC)
```

## Entitlement Changes

```typescript
// Added to TierEntitlements in schema.ts
export type TierEntitlements = {
  // ... existing fields ...
  deal_analyses_per_month: number;  // 0 = not included, N = monthly cap, -1 = unlimited
};

// Seed tier updates:
// Starter:      deal_analyses_per_month: 0
// Professional:  deal_analyses_per_month: 10
// Enterprise:    deal_analyses_per_month: -1
```

## TypeScript Types

```typescript
// JSONB shape for propertyData (from REAPI PropertyDetail)
type DealPropertyData = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  subdivision?: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  estimatedValue?: number;
  lastSaleDate?: string;
  lastSaleAmount?: number;
  pricePerSqFt?: number;
  ownerOccupied?: boolean;
  inherited?: boolean;
  adjustableRate?: boolean;
  saleHistory?: Array<{
    date: string;
    amount: number;
    buyer?: string;
    seller?: string;
  }>;
  mortgageHistory?: Array<{
    amount: number;
    rate?: number;
    lender?: string;
    originationDate?: string;
    dueDate?: string;
    type?: string;
  }>;
  taxAssessment?: number;
  annualTaxes?: number;
  medianIncome?: number;
  floodZone?: string;
};

// JSONB shape for briefContent (from Deal Brief Agent)
type DealBriefContent = {
  summary: string;
  pricingAssessment: {
    narrative: string;
    vsMedian: string;         // e.g., "+12% above segment median"
    vsSegmentComps: string;
    pricePerSqFtContext: string;
  };
  personaMatch: {
    bestFitPersona: string;   // persona slug
    matchRationale: string;
    talkingPoints: string[];
  };
  negotiationPoints: {
    leverageItems: string[];
    dataBackedArguments: string[];
    riskFactors: string[];
  };
  marketTiming: {
    signal: "buy" | "wait" | "neutral";
    rationale: string;
    forecastContext: string;
  };
};

// JSONB shape for motivatedSellerSignals
type MotivatedSellerSignals = {
  inherited: { fired: boolean; weight: number };
  nonOwnerOccupied: { fired: boolean; weight: number };
  adjustableRate: { fired: boolean; weight: number };
  longHoldPeriod: { fired: boolean; weight: number; yearsHeld?: number };
  helocPattern: { fired: boolean; weight: number; mortgageCount?: number };
  highEquity: { fired: boolean; weight: number; equityPercent?: number };
  totalScore: number;
};
```

## Migration

```sql
-- 0010_add_deal_analyses.sql

CREATE TYPE deal_analysis_status AS ENUM ('queued', 'generating', 'completed', 'failed');

CREATE TABLE deal_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  address VARCHAR(500) NOT NULL,
  property_data JSONB,
  brief_content JSONB,
  motivated_seller_score INTEGER,
  motivated_seller_signals JSONB,
  status deal_analysis_status NOT NULL DEFAULT 'queued',
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX deal_analyses_user_id_idx ON deal_analyses(user_id);
CREATE INDEX deal_analyses_market_id_idx ON deal_analyses(market_id);
CREATE INDEX deal_analyses_report_id_idx ON deal_analyses(report_id);
CREATE INDEX deal_analyses_status_idx ON deal_analyses(status);
CREATE INDEX deal_analyses_user_created_idx ON deal_analyses(user_id, created_at DESC);

-- Add deal_analyses_per_month to existing tier entitlements
-- (handled in application code when updating seed tiers)
```

## Learnings

(empty -- to be filled after implementation)
