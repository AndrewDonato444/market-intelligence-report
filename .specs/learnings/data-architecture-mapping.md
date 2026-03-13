# Data Architecture Mapping: Report Sections → Metrics → Data Sources → Agent Inputs

## Key Architectural Principle

**Data fetching is completely separate from agent processing.**

```
DATA FETCH LAYER          COMPUTATION LAYER         AGENT LAYER              ASSEMBLY
(API calls)               (pure math)               (Claude narratives)      (9-section report)
─────────────────         ─────────────────         ─────────────────        ─────────────────
REAPI PropertySearch  ──┐
REAPI PropertyDetail  ──┤── CompiledMarketData ──► ComputedAnalytics ──► Agents ──► Report
REAPI PropertyComps   ──┤
ScrapingDog Local     ──┘
```

Agents receive **pre-compiled data** as inputs. They never call APIs directly.

---

## Report Sections (from Architecture v2.0)

| # | Section | Pages | Primary Function |
|---|---------|-------|------------------|
| 1 | Executive Briefing | 1 | Hook; standalone summary |
| 2 | Market Insights Index & Confidence Ratings | 1–2 | Proprietary scoring dashboard |
| 3 | Luxury Market Dashboard | 1–2 | Leading indicators tiered by importance |
| 4 | Neighborhood Intelligence | 2–3 | Hyperlocal deep dives |
| 5 | The Narrative — "What's Really Happening" | 1–2 | Analytical voice; qualitative intelligence |
| 6 | Forward Look & Advisory Implications | 1 | Actionable guidance by audience type |
| 7 | Comparative Market Positioning | 1 | Market vs. peer luxury destinations |
| 8 | Disclaimer & Methodology | ½ | Legal + data sources |
| ~~8~~ | ~~Advisor's Strategic Benchmark~~ | — | REMOVED — duplicated Sections 2 & 3 |

---

## COMPLETE METRICS INVENTORY

### Section 1: Executive Briefing

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) | Computed By |
|--------|----------------|----------------|-------------------|-------------|
| Narrative summary (3-5 sentences) | All computed metrics | — | — | Insight Generator (Claude) |
| Headline number | Transaction data | `/v2/PropertySearch` | `sale.saleprice` | Data computation: e.g., "median price +12% YoY" |
| Directional signal (buyer's/seller's) | Supply vs demand balance | `/v2/PropertySearch` | Active count vs closed count | Computation: months of supply threshold |
| Homeowner implication | Computed metrics | — | — | Insight Generator (Claude) |
| Mini table of contents | — | — | — | Assembly layer (templated) |

### Section 2: Market Insights Index (4 Dimensions, each scored 1-10)

**Dimension: Liquidity Strength**

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) |
|--------|----------------|----------------|-------------------|
| Cash buyer concentration (%) | Property detail flags | `/v2/PropertyDetail` | `cashBuyer`, `cashSale` |
| Transaction velocity (sales/month) | Transaction dates | `/v2/PropertySearch` | `sale.saledate` count per period |
| Capital availability | Mortgage data | `/v2/PropertyDetail` | `currentMortgages[]`, `freeClear` flag |
| Financing independence (% free & clear) | Property flags | `/v2/PropertyDetail` | `freeClear`, `highEquity` |

**Dimension: Timing Advantage**

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) |
|--------|----------------|----------------|-------------------|
| Seasonal patterns (monthly volume) | Transaction dates | `/v2/PropertySearch` | `sale.saledate` grouped by month |
| Cyclical positioning | YoY trend direction | `/v2/PropertySearch` | Current vs prior year medians |
| Momentum signals | Price acceleration | `/v2/PropertySearch` | Compare current YoY% to prior YoY% |

**Dimension: Risk Management**

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) |
|--------|----------------|----------------|-------------------|
| Flood zone exposure (%) | Property detail | `/v2/PropertyDetail` | `floodZone`, `floodZoneType` |
| Concentration risk | Segment distribution | `/v2/PropertySearch` | Volume concentration in top segment |
| Insurance exposure | Limited — flood only | `/v2/PropertyDetail` | `floodZoneDescription` |
| Regulatory changes | **NOT IN REAPI** | — | — |

**Dimension: Value Opportunity**

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) |
|--------|----------------|----------------|-------------------|
| Price-to-value gaps (AVM vs sale) | Comps + AVM | `/v3/PropertyComps` | `avm.estimated` vs `lastSalePrice` |
| Underpriced submarkets | Segment comparison | `/v2/PropertySearch` | Segment medians vs market median |
| Emerging neighborhood trajectories | Neighborhood YoY | `/v2/PropertySearch` | Per-zip YoY price change |

**Forecast Confidence Ratings (per theme, 1-10)**

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) |
|--------|----------------|----------------|-------------------|
| Sample size | Search result count | `/v2/PropertySearch` | `resultCount` |
| Data freshness | Detail timestamps | `/v2/PropertyDetail` | `lastUpdateDate` |
| Source diversity | Multi-endpoint coverage | All endpoints | Whether detail/comps data was available |

### Section 3: Luxury Market Dashboard

**Tier 1 — The Power Five**

| Indicator | Root Data Source | REAPI Endpoint | Response Field(s) | Needs PropertyDetail? |
|-----------|----------------|----------------|-------------------|----------------------|
| Median Sold Price & Price/SF | Transaction data | `/v2/PropertySearch` | `sale.saleprice`, `summary.sqft` | No |
| Months of Supply | Active listings + absorption | `/v2/PropertySearch` | Need 2 queries: `mlsActive=true` count / monthly closed rate | Maybe — depends on search filters |
| Days on Market | MLS history | `/v2/PropertyDetail` | `mlsHistory[].daysOnMarket` | **Yes** |
| List-to-Sale Price Ratio | MLS list price vs sale price | `/v2/PropertyDetail` | `mlsHistory[].price` vs `saleHistory[].saleAmount` | **Yes** |
| New Listing Velocity vs Closed Sales | Date-filtered searches | `/v2/PropertySearch` | New listings entering market vs closings per period | No |

**Tier 2 — Supporting Indicators**

| Indicator | Root Data Source | REAPI Endpoint | Response Field(s) | Needs PropertyDetail? |
|-----------|----------------|----------------|-------------------|----------------------|
| Price band migration | Segment period comparison | `/v2/PropertySearch` | Per-price-band volume current vs prior | No |
| Cash vs financed buyer ratio | Transaction flags | `/v2/PropertyDetail` | `cashBuyer`, `cashSale` flags | **Yes** |
| Concession frequency & magnitude | List-to-sale ratio <97% | `/v2/PropertyDetail` | `mlsHistory[].price` vs sale price | **Yes** |
| Withdrawn/expired listing rates | MLS status | `/v2/PropertyDetail` | `mlsHistory[]` where status = Cancelled/Expired | **Yes** |
| Property type bifurcation | Property type grouping | `/v2/PropertySearch` | `summary.proptype` groups (SFR vs CONDO) | No |
| New construction premium | Year built filter | `/v2/PropertySearch` | `summary.yearbuilt` ≥ current-2 vs older | No |
| Seasonal adjustment patterns | Monthly date distribution | `/v2/PropertySearch` | `sale.saledate` grouped by month | No |

**Tier 3 — Proprietary Analytics Suite**

| Proprietary Index | Root Data Source | REAPI Endpoint | Response Field(s) | Feasibility |
|-------------------|----------------|----------------|-------------------|-------------|
| Waterfront Premium Index | Location/neighborhood filtering | `/v2/PropertySearch` + `/v2/PropertyDetail` | `neighborhood.name`, address analysis | Approximate — no explicit waterfront flag |
| Segment Bifurcation Monitor | Multi-segment comparison | `/v2/PropertySearch` | Per-price-band median + YoY divergence | Full — already have segment computation |
| DOM Correlation Matrix | DOM vs price discount | `/v2/PropertyDetail` | `mlsHistory[].daysOnMarket` + list-to-sale ratio | Full — requires detail records |
| Regulatory Change Tracker | **NOT IN REAPI** | — | — | Not feasible from current sources |
| Branded Residence Premium | Curated list matching | `/v2/PropertySearch` | Address/development matching | Partial — requires curated development list |

### Section 4: Neighborhood Intelligence

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) |
|--------|----------------|----------------|-------------------|
| Per-neighborhood transaction volume | Zip-filtered search | `/v2/PropertySearch` | Count per zip/neighborhood |
| Per-neighborhood median price | Zip-filtered search | `/v2/PropertySearch` | `sale.saleprice` per zip |
| Per-neighborhood DOM | Detail records | `/v2/PropertyDetail` | `mlsHistory[].daysOnMarket` per neighborhood |
| Period-over-period change | Two-period comparison | `/v2/PropertySearch` | Current vs prior period per zip |
| Notable transactions | Top-N by price | `/v2/PropertyDetail` | Full detail (anonymized) |
| Causal analysis | Computed metrics | — | — | Insight Generator (Claude) |
| Forward outlook | Computed trends | — | — | Forecast Modeler (Claude) |
| Amenity context | Local businesses | ScrapingDog `/google_local` | `businesses[]` per category |
| Neighborhood name | Property detail | `/v2/PropertyDetail` | `neighborhood.name`, `neighborhood.type` |

### Section 5: The Narrative

| Metric | Root Data Source | Agent |
|--------|----------------|-------|
| 1-2 editorial themes | All computed analytics | Insight Generator (Claude) |
| Proprietary index references | Computed from Dashboard metrics | Referenced in narrative |
| Voice calibration | — | Claude system prompt (institutional third-person) |

### Section 6: Forward Look & Advisory Implications

| Metric | Root Data Source | Agent |
|--------|----------------|-------|
| 6-month price projections | YoY trends + segment data | Forecast Modeler (Claude) |
| 12-month price projections | YoY trends + segment data | Forecast Modeler (Claude) |
| Base/bull/bear scenarios | YoY + confidence data | Forecast Modeler (Claude) |
| Seller guidance ("if selling in 6mo...") | Projections + confidence | Forecast Modeler (Claude) |
| Buyer guidance ("if evaluating purchase...") | Value opportunity + projections | Forecast Modeler (Claude) |
| Holder guidance ("if holding long-term...") | Confidence ratings | Forecast Modeler (Claude) |
| Variables under surveillance (3) | Key metrics to monitor | Forecast Modeler (Claude) |

### Section 7: Comparative Market Positioning

| Metric | Root Data Source | REAPI Endpoint | Response Field(s) |
|--------|----------------|----------------|-------------------|
| Cash buyer concentration per peer | Peer property details | `/v2/PropertyDetail` | `cashBuyer` flag per peer market |
| YoY price growth by segment per peer | Peer market search | `/v2/PropertySearch` | Per-peer two-period search |
| Inventory (months of supply) per peer | Peer active vs closed | `/v2/PropertySearch` | Per-peer listing counts |
| Average price/sqft per peer | Peer search data | `/v2/PropertySearch` | `sale.saleprice / summary.sqft` |
| Relative value positioning | Cross-market comparison | `/v2/PropertySearch` | Price/sqft ranking across all markets |

### ~~Section 8: Advisor's Strategic Benchmark~~ — REMOVED

> This section was cut from the report. Scorecard data duplicated Sections 2 & 3.
> `computeScorecard()` still runs in Layer 1 — ratings feed into other sections.

### Section 8: Disclaimer & Methodology

| Metric | Root Data Source | Agent |
|--------|----------------|-------|
| Legal disclaimer text | — | Templated (static) |
| Data sources list | Pipeline metadata | Assembly layer |
| Confidence thresholds | Sample sizes + staleness | Computation layer |
| Sample size flags (<10 = flagged, <5 = withheld) | Property search counts | Computation layer |

---

## DATA FETCH PLAN (all API calls, run BEFORE agents)

### Call 1: Target Market — Current Period Properties
```
Endpoint: POST /v2/PropertySearch
Input: { city, state, zipCodes, priceMin, priceMax, propertyTypes, saleDate: "last 6 months" }
Output: PropertySummary[] (current period transactions)
Used by: Sections 1, 2, 3, 4, 5, 8
```

### Call 2: Target Market — Prior Period Properties (YoY)
```
Endpoint: POST /v2/PropertySearch
Input: { city, state, zipCodes, priceMin, priceMax, propertyTypes, saleDate: "6-18 months ago" }
Output: PropertySummary[] (prior period for YoY comparison)
Used by: Sections 1, 2, 3, 6
```

### Call 3: Target Market — Active Listings (for supply metrics)
```
Endpoint: POST /v2/PropertySearch
Input: { city, state, zipCodes, priceMin, priceMax, status: "active" }
Output: PropertySummary[] (currently listed properties)
Used by: Section 3 (months of supply, listing velocity)
```

### Call 4: Property Details (sample of N properties)
```
Endpoint: POST /v2/PropertyDetail (called N times, e.g., top 30-50 by price)
Input: { propertyId } for each property
Output: PropertyDetail[] with MLS history, mortgages, flags, schools, demographics
Used by: Sections 2, 3, 4 (DOM, list-to-sale, cash %, flood zone, neighborhood data)
```

### Call 5: Property Comps (for AVM / value gap analysis)
```
Endpoint: POST /v3/PropertyComps (called for representative properties)
Input: { address } for selected properties
Output: CompsResult[] with AVM estimates
Used by: Section 2 (Value Opportunity dimension), Section 3 (proprietary analytics)
```

### Call 6: Peer Market Properties (one search per peer)
```
Endpoint: POST /v2/PropertySearch (called per peer market)
Input: { city, state, priceMin } for each peer market × 2 periods
Output: PropertySummary[][] per peer
Used by: Section 7 (Comparative Positioning)
```

### Call 7: Neighborhood Amenities
```
Endpoint: GET ScrapingDog /google_local
Input: { query: "luxury restaurants|schools|...", location: "City, State" }
Output: LocalBusiness[] per category
Used by: Section 4 (Neighborhood Intelligence)
```

**Total REAPI calls per report:**
- 2-3 PropertySearch (target market current + prior + active)
- 30-50 PropertyDetail (sample for deep metrics)
- 5-10 PropertyComps (representative properties)
- 2N PropertySearch (N peer markets × 2 periods)
- 3-5 ScrapingDog calls (neighborhood amenity categories)

---

## COMPUTATION LAYER (pure math, no API calls)

Takes CompiledMarketData → produces ComputedAnalytics:

```typescript
interface ComputedAnalytics {
  // Section 1: Executive Briefing data
  headline: {
    medianPrice: number;
    medianPriceYoY: number;      // decimal
    totalVolume: number;
    volumeYoY: number;           // decimal
    directionalSignal: "buyers" | "sellers" | "balanced";
  };

  // Section 2: Market Insights Index
  insightsIndex: {
    liquidityStrength: { score: number; cashBuyerPct: number; transactionVelocity: number; freeClearPct: number; };
    timingAdvantage: { score: number; seasonalTrend: string; momentum: number; cyclicalPosition: string; };
    riskManagement: { score: number; floodZonePct: number; concentrationRisk: number; };
    valueOpportunity: { score: number; avmVsSaleGap: number; underpricedSegments: string[]; };
  };
  confidenceRatings: Array<{ theme: string; score: number; basis: string; }>;

  // Section 3: Dashboard
  dashboard: {
    powerFive: {
      medianSoldPrice: number;
      medianPricePerSqft: number;
      monthsOfSupply: number;
      medianDOM: number;
      listToSaleRatio: number;
      newListingVelocity: number;
      closedSalesVelocity: number;
    };
    tier2: {
      priceBandMigration: Array<{ band: string; currentPct: number; priorPct: number; }>;
      cashVsFinancedRatio: number;
      concessionFrequency: number;
      concessionMagnitude: number;
      withdrawnExpiredRate: number;
      propertyTypeSplit: Array<{ type: string; volume: number; medianPrice: number; }>;
      newConstructionPremium: number;
      seasonalPattern: Array<{ month: number; volume: number; medianPrice: number; }>;
    };
    tier3: {
      segmentBifurcation: Array<{ segment: string; yoyChange: number; divergence: number; }>;
      domCorrelation: Array<{ domBucket: string; avgDiscount: number; count: number; }>;
      // waterfrontPremium and brandedResidence require curated lists
    };
  };

  // Section 4: Neighborhood breakdowns
  neighborhoods: Array<{
    name: string;
    zipCode: string;
    volume: number;
    medianPrice: number;
    medianDOM: number;
    yoyPriceChange: number;
    yoyVolumeChange: number;
    notableTransactions: Array<{ price: number; sqft: number; type: string; date: string; }>;
  }>;

  // Section 7: Peer comparisons
  peerComparisons: Array<{
    name: string;
    medianPrice: number;
    medianPricePerSqft: number;
    totalVolume: number;
    yoyPriceChange: number;
    cashBuyerPct: number;   // if detail data available
    monthsOfSupply: number; // if active listing data available
  }>;

  // Segment scorecard (computed but no longer assembled into a report section)
  segmentScorecard: Array<{
    segment: string;
    rating: string;          // A+, A, B+, B, C+, C
    medianPrice: number;
    volume: number;
    yoyChange: number;
    dom: number;
  }>;

  // Metadata
  confidence: {
    level: "high" | "medium" | "low";
    sampleSize: number;
    staleDataSources: string[];
    detailCoverage: number;  // % of properties with detail records
  };
}
```

---

## AGENT INPUT CONTRACTS

### Agent 1: Insight Generator
**Receives:** ComputedAnalytics (full object)
**Produces:** Sections 1, 5
- Executive Briefing: narrative summary, headline interpretation, homeowner implication
- The Narrative: 1-2 editorial themes with analytical conviction, proprietary index references

### Agent 2: Forecast Modeler
**Receives:** ComputedAnalytics (especially YoY trends, momentum, seasonal patterns)
**Produces:** Section 6
- Forward Look: 6/12-month projections, base/bull/bear scenarios
- Advisory Implications: seller/buyer/holder guidance, variables under surveillance

### Agent 3: Polish Agent
**Receives:** All upstream agent outputs + ComputedAnalytics (for fact-checking)
**Produces:** Methodology content for Section 8
- Polished section revisions, pull quotes, consistency check
- Methodology: data sources, confidence documentation

### Sections Produced by Computation Layer (no Claude needed)
- **Section 2**: Market Insights Index scores + Confidence Ratings → pure math from computed metrics
- **Section 3**: Luxury Market Dashboard → computed indicators formatted into tiers
- **Section 4**: Neighborhood Intelligence (data portion) → computed per-zip metrics
- **Section 7**: Comparative Market Positioning → computed peer comparison table

### Sections Requiring Narrative (Claude agents)
- **Section 1**: Executive Briefing → Insight Generator
- **Section 4** (narrative portions): Causal analysis, forward outlook → Insight Generator + Forecast Modeler
- **Section 5**: The Narrative → Insight Generator
- **Section 6**: Forward Look → Forecast Modeler
- **Section 8**: Methodology note → Polish Agent

---

## GAPS & LIMITATIONS

| Gap | Impact | Workaround |
|-----|--------|------------|
| No active listing search in REAPI | Can't compute months of supply directly | Use `mlsActive` flag from PropertyDetail on sample; or estimate from listing velocity |
| No explicit waterfront flag | Waterfront Premium Index is approximate | Use neighborhood names + manual market configuration |
| No regulatory/policy data | Regulatory Change Tracker not feasible | Omit from v1 or allow manual input per market |
| No insurance premium data | Risk Management dimension limited | Use flood zone data as proxy; note limitation |
| No branded residence list | Branded Residence Premium approximate | Allow market-level configuration of known developments |
| PropertyDetail is per-property (expensive) | Need 30-50 calls for deep metrics | Budget API calls; cache aggressively; prioritize top-N by price |
| List price only in PropertyDetail | List-to-sale ratio requires detail calls | Sample-based (compute from available detail records) |

---

## CURRENT vs IDEAL ARCHITECTURE

### Current (agents call APIs)
```
Orchestrator → Data Analyst (calls REAPI) → Insight Gen (calls Claude)
                                           → Competitive (calls REAPI + Claude)
                                           → Forecast (calls Claude)
                                           → Polish (calls Claude)
```

### Ideal (data pre-fetched, agents receive compiled data)
```
Data Fetch Layer (all REAPI/ScrapingDog calls)
       ↓
Computation Layer (pure math → ComputedAnalytics)
       ↓
Agent Layer (Claude calls only):
  - Insight Generator (narratives for Sections 1, 4, 5)
  - Forecast Modeler (projections for Section 6)
  - Polish Agent (editorial for Sections 8.2, 9)
       ↓
Assembly Layer (compile 9 sections → final report)
```

### What Changes
1. **Data Analyst agent** → becomes the **Data Fetch + Computation Layer** (not a Claude agent)
2. **Competitive Analyst agent** → its REAPI calls move to Data Fetch Layer; peer comparison becomes pure computation
3. **Insight Generator** → receives ComputedAnalytics instead of DataAnalystOutput
4. **Forecast Modeler** → same change
5. **Polish Agent** → same role, receives richer inputs
6. **New**: Assembly layer that maps computed + narrative outputs to 9-section structure
