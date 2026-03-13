---
feature: Data Analyst Agent
domain: agent-pipeline
source: lib/agents/data-analyst.ts
tests:
  - __tests__/agents/data-analyst.test.ts
  - __tests__/services/market-analytics.test.ts
  - __tests__/utils/math.test.ts
components: []
personas:
  - rising-star-agent
  - competitive-veteran
status: implemented
created: 2026-03-09
updated: 2026-03-13
---


# Data Analyst Agent

**Source File**: `lib/agents/data-analyst.ts`
**Design System**: N/A (service layer)
**Personas**: Rising Star Agent, Competitive Veteran

## Feature: Data Analyst Agent

The Data Analyst agent is the first agent in the pipeline. It fetches property data via connectors (RealEstateAPI, ScrapingDog), computes segment-level metrics, YoY calculations, price-per-sqft ratios, intelligence ratings, and market health scores. Its structured JSON output feeds all downstream agents (insight-generator, competitive-analyst, forecast-modeler).

This agent does NOT call Claude — it is pure computation over fetched data. AI narrative generation happens in downstream agents.

### Scenario: Analyze a market with available property data
Given a market definition for "Palm Beach, FL" with luxury tier "ultra_luxury" and price floor $5M
And the RealEstateAPI connector returns property search results
When the data-analyst agent executes
Then it produces a structured analysis with segment metrics, price statistics, and volume counts
And the output conforms to the AgentResult interface from the orchestrator

### Scenario: Compute segment-level metrics
Given property search results with mixed property types (single_family, condo, estate)
When the data-analyst computes segment metrics
Then each segment includes: count, median price, average price, min/max price, median price-per-sqft
And segments with fewer than 3 properties are flagged as "low_sample"

### Scenario: Calculate YoY changes
Given property data with lastSaleDate spanning the current and prior year
When the data-analyst computes YoY metrics
Then it calculates year-over-year change for median price, volume, price-per-sqft, average price, and total volume
And the YoY values are expressed as decimal percentages (e.g., 0.12 for 12%)
And domChange and listToSaleChange are initialized as null (set later from PropertyDetail cohort data by market-analytics)

### Scenario: Generate intelligence ratings
Given computed segment metrics and YoY changes
When the data-analyst assigns ratings
Then each segment receives a rating from A+ to C based on price growth, volume, and market health
And the overall market receives an aggregate rating

### Scenario: Handle empty or insufficient data gracefully
Given a market with no matching property results
When the data-analyst executes
Then it returns a result with empty segments and confidence level set to reflect sample quality (e.g., "low" for zero or few results)
And does not throw an error

### Scenario: Include data freshness in output
Given property search results that include stale cached data
When the data-analyst produces output
Then the metadata includes confidence_level based on data freshness
And stale data produces "low" confidence, fresh data produces "high" confidence

### Scenario: Produce structured ComputedAnalytics output
Given a complete analysis with segments, YoY, and ratings
When the data-analyst builds its output
Then it produces a ComputedAnalytics object with typed fields: market, segments, yoy, insightsIndex, dashboard, confidence, and peerComparisons
And this structured object feeds all downstream agents (insight-generator, competitive-analyst, forecast-modeler) rather than named report sections

### Scenario: Conform to computation layer interface
Given the data-analyst is a pure computation layer (not a pipeline agent)
When Layer 0 (data-fetcher.ts) fetches property data and Layer 1 (market-analytics.ts) invokes computation
Then the module exports computation functions (computeSegmentMetrics, computeYoY, assignRating) and types
And it does NOT export an AgentDefinition or execute(context) — it is called directly by market-analytics, not by the pipeline orchestrator

### Scenario: IQR outlier filtering removes wild prices from overall metrics
Given property data that includes an extreme outlier (e.g., $403M on 1 transaction)
When market-analytics computes overall metrics (median, average, volume)
Then the `removeOutliers()` IQR filter (Tukey fences, k=2.0 for luxury markets) is applied to prices
And the outlier does not distort median, average, or volume calculations
And per-sqft calculations also apply outlier filtering

### Scenario: Per-neighborhood YoY enforces minimum sample size
Given a neighborhood with fewer than 3 transactions in either the current or prior year
When market-analytics computes per-neighborhood YoY
Then `yoyPriceChange` is null (not -100% or a misleading value)
And the `NEIGHBORHOOD_MIN_SAMPLE = 3` threshold is enforced before calling `computeYoY`

### Scenario: Neighborhood names fall back to well-known zip map
Given property data for a zip code where the API does not return `neighborhood.name`
And the zip code is in the `WELL_KNOWN_ZIP_NEIGHBORHOODS` static map (e.g., 90210 → "Beverly Hills")
When market-analytics builds the neighborhood breakdown
Then the neighborhood name uses the static map entry instead of the raw zip code
And unknown zips not in the map fall back to the raw zip code

### Scenario: Empty detail cohorts return null for DOM and list-to-sale changes
Given a small detail sample where the current or prior year cohort is empty
When `computeDetailYoY` calculates year-over-year detail metrics
Then it returns `{ domChange: null, listToSaleChange: null }` instead of throwing or producing NaN
And the pipeline continues without error

### Scenario: splitByYear falls back to prior two years when current year has insufficient data
Given property data where the current calendar year has fewer than 3 sales
When `splitByYear` partitions properties for YoY computation
Then it compares `currentYear - 1` vs `currentYear - 2` instead of `currentYear` vs `currentYear - 1`
And this prevents misleading YoY figures early in a calendar year

## Technical Notes

### Output Schema

```typescript
interface DataAnalystOutput {
  // Overall market metrics
  market: {
    totalProperties: number;
    medianPrice: number;
    averagePrice: number;
    medianPricePerSqft: number;
    totalVolume: number;
    rating: string;  // A+ through C
  };
  // Per-segment breakdown
  segments: Array<{
    name: string;
    propertyType: string;
    count: number;
    medianPrice: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    medianPricePerSqft: number | null;
    rating: string;
    lowSample: boolean;
  }>;
  // Year-over-year comparisons
  yoy: {
    medianPriceChange: number | null;  // decimal percentage
    volumeChange: number | null;
    pricePerSqftChange: number | null;
    averagePriceChange: number | null;
    totalVolumeChange: number | null;
    domChange: number | null;          // set from PropertyDetail cohort data
    listToSaleChange: number | null;   // set from PropertyDetail cohort data
  };
  // Confidence and freshness
  confidence: {
    level: "high" | "medium" | "low";
    staleDataSources: string[];
    sampleSize: number;
  };
}
```

### Rating Logic

| Rating | Criteria |
|--------|----------|
| A+ | Price growth > 10% YoY, volume stable or growing, strong per-sqft |
| A  | Price growth 5-10% YoY, healthy volume |
| B+ | Price growth 0-5% YoY, adequate volume |
| B  | Flat or slight decline, sufficient sample |
| C+ | Declining metrics but sufficient data |
| C  | Declining or insufficient data |

### Agent Registration

```typescript
const dataAnalystAgent: AgentDefinition = {
  name: "data-analyst",
  description: "Fetches property data, computes segment metrics, YoY calculations, and intelligence ratings",
  dependencies: [],  // First in pipeline, no upstream deps
  execute: executeDataAnalyst,
};
```

### Data Flow

```
data-fetcher: two date-bounded searchProperties() calls (current + prior 12-month periods)
    │
    ▼
Parse & group by property type
    │
    ▼
Compute per-segment metrics (median, avg, min/max, per-sqft)
    │
    ▼
Split by year → compute YoY changes (5 search-derived metrics)
    │
    ▼
market-analytics: computeDetailYoY() → DOM + list-to-sale ratio changes
    │
    ▼
Apply rating logic per segment + overall
    │
    ▼
Package as ComputedAnalytics for all 9 report sections
```

## User Journey

1. Agent configures market and starts report generation
2. Pipeline runner starts → **Data Analyst runs first (no deps)**
3. Data Analyst fetches property data from RealEstateAPI
4. Computes metrics, segments, ratings → outputs structured JSON
5. Downstream agents (insight-generator, competitive-analyst, forecast-modeler) consume this output
