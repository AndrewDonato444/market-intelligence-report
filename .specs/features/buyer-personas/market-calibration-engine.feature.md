---
feature: Market Calibration Engine
domain: buyer-personas
source: lib/services/market-calibration.ts
tests:
  - __tests__/services/market-calibration.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Market Calibration Engine

**Source File**: `lib/services/market-calibration.ts`
**Design System**: N/A (backend service — no UI)
**Personas**: `.specs/personas/rising-star-agent.md` (needs market-specific credibility), `.specs/personas/established-practitioner.md` (expects locally grounded conviction), `.specs/personas/team-leader.md` (needs consistent calibration across team)
**Depends On**: Feature #92 (Persona Intelligence Agent), Feature #22 (RealEstateAPI Connector)

## Feature: Market Calibration Engine

Buyer persona specs (price tiers, community types, seasonal patterns, property filters) are seeded as market-agnostic defaults derived from the Knox Brothers framework. These defaults reference Naples, FL benchmarks — "$4M-$25M+", "Port Royal, Grey Oaks, Pelican Bay", "Peak: March-June." When an agent generates a report for Aspen, Palm Beach, or any other market, those Naples-specific references are meaningless or misleading.

The Market Calibration Engine analyzes real market data from the target market (via computedAnalytics from Layer 1) and produces calibrated persona overrides that replace hardcoded defaults with locally accurate values. It runs **before** the Persona Intelligence Agent, ensuring every talking point, metric emphasis, and narrative framing reflects the actual market — not a generic template.

**Why it matters**: Without calibration, a Business Mogul talking point for Aspen might say "87% cash transactions" when Aspen's actual cash rate is 62%. A Seasonal Buyer's community filter might reference "Port Royal" when the market is Beverly Hills. Calibration closes the gap between persona archetypes (universal) and market realities (local), giving agents data they can use in conversations without fact-checking every number.

### Scenario: Engine produces calibrated overrides for a target market
Given a report targets "Naples, FL" with market definition { city: "Naples", state: "FL", priceMin: 1000000 }
And computedAnalytics contains transaction data for that market
And the report has "The Business Mogul" persona selected
When the calibration engine runs
Then it produces a CalibratedPersonaOverrides object for the Business Mogul
And the overrides contain locally adjusted price tiers, community names, seasonal patterns, and benchmark values
And the original persona archetype (decision drivers, vocabulary, narrative framing) is preserved unchanged

### Scenario: Price tier boundaries are adjusted to local luxury definitions
Given the Business Mogul's default priceRange is "$4M-$25M+"
And computedAnalytics shows the target market's luxury segments are:
  - Entry luxury: $1M-$3M (45% of transactions)
  - High luxury: $3M-$6M (35%)
  - Ultra luxury: $6M+ (20%)
When the engine calibrates price tiers
Then it adjusts the Business Mogul's priceRange to reflect local distribution
And it maps persona tier labels ("entry", "core", "ultra") to local price boundaries
And it notes the local median luxury price and how the persona's range compares

### Scenario: Community types are substituted with local equivalents
Given the Business Mogul's default keyDevelopmentsExample references "Port Royal, Grey Oaks, Pelican Bay"
And the target market is "Aspen, CO"
And computedAnalytics includes property data with subdivision/neighborhood names
When the engine calibrates community types
Then it replaces Naples-specific communities with Aspen equivalents found in the data
And it preserves the persona's community preference type (e.g., "gated, waterfront" becomes "gated, ski-in/ski-out" or "mountain estate")
And the communityType filter is adjusted to match local community categories

### Scenario: Seasonal patterns are recalibrated from transaction data
Given the Business Mogul's default seasonal pattern is "Peak: March-June"
And computedAnalytics contains transaction dates across 12+ months
When the engine calibrates seasonal patterns
Then it computes monthly transaction volume distribution from actual data
And it identifies peak months (top 3 by volume) and slow months (bottom 3)
And it replaces the default seasonal pattern with the observed local pattern
And it notes if the sample size is too small for reliable seasonality (< 50 transactions)

### Scenario: DOM benchmarks are recalibrated to local norms
Given the Business Mogul's sample benchmarks include "Median DOM: 45 days"
And computedAnalytics shows the target market's actual median DOM is 128 days
When the engine calibrates benchmarks
Then it replaces static DOM values with actual median DOM from computedAnalytics
And it includes DOM by price tier if available (e.g., ultra-luxury DOM vs. entry luxury DOM)
And it adjusts the persona's DOM interpretation context (128 days may be normal for ultra-luxury ski markets)

### Scenario: Cash transaction norms are adjusted
Given the Business Mogul's default emphasizes "87% cash transactions" (Naples benchmark)
And the target market's actual cash transaction rate from computedAnalytics is 54%
When the engine calibrates financial benchmarks
Then it replaces the default cash rate with the actual local rate
And it adjusts the persona's talking point templates that reference cash dominance
And it notes whether the local cash rate is above or below the national luxury average

### Scenario: Engine handles multiple personas with independent calibration
Given a report has 3 personas selected: Business Mogul, Coastal Escape Seeker, Legacy Builder
And each has different default property filters and benchmarks
When the engine runs
Then it produces independent CalibratedPersonaOverrides for each persona
And each calibration uses the same computedAnalytics data
And each persona's unique community type preferences map to different local equivalents
And the calibrations do not interfere with each other

### Scenario: Engine handles sparse market data gracefully
Given computedAnalytics has only 15 transactions (small market or narrow date range)
And seasonal pattern computation requires at least 50 transactions
When the engine runs
Then it marks seasonal calibration as low-confidence
And it uses available data for price tiers and DOM where possible
And it includes a calibrationQuality field: "partial" with notes on what could not be calibrated
And the Persona Intelligence Agent can still run — uncalibrated defaults are used for missing fields

### Scenario: Engine preserves persona identity during calibration
Given the Business Mogul persona has decision drivers, narrative framing, vocabulary, and avoid lists
When the engine calibrates market-specific fields
Then it ONLY modifies: priceRange, communityType, keyDevelopmentsExample, seasonal patterns, and benchmark values in sampleBenchmarks
And it does NOT modify: decisionDrivers, narrativeFraming (vocabulary, avoid lists, tone), reportMetrics, talkingPointTemplates (templates, not filled values)
And the persona archetype identity remains intact

### Scenario: Engine integrates into the pipeline before Persona Intelligence
Given the pipeline is executing Layer 2
And computedAnalytics (Layer 1) is complete
When the persona-intelligence agent is about to execute
Then the calibration engine runs first as a preprocessing step
And it passes calibrated overrides to the persona-intelligence agent
And the persona-intelligence agent uses calibrated values when building its Claude prompt
And the agent's talking points reference local data, not generic defaults

### Scenario: Engine skips calibration when no personas are selected
Given a report has 0 personas selected
When the pipeline reaches the calibration step
Then the calibration engine skips execution entirely
And it returns { skipped: true, reason: "no_personas_selected" }
And the pipeline continues without calibration overhead

### Scenario: Engine caches calibration results for the same market
Given a report for "Naples, FL" was calibrated 2 hours ago
And another report for "Naples, FL" is being generated with the same market definition
When the engine runs
Then it checks if a recent calibration exists for this market fingerprint
And if found within TTL (24 hours, matching property data TTL), reuses it
And if the persona selection differs, it still reuses market-level calibration (community names, seasonal patterns are market-wide)

## Output Schema

```typescript
interface MarketCalibrationResult {
  // Per-persona calibrated overrides
  personas: CalibratedPersonaOverrides[];

  // Market-wide calibration data (shared across personas)
  marketProfile: MarketProfile;

  // Quality indicator
  calibrationQuality: "full" | "partial" | "minimal";
  qualityNotes: string[]; // e.g., ["seasonal patterns: insufficient data (15 txns)"]

  // Cache metadata
  marketFingerprint: string; // hash of market definition for cache key
  calibratedAt: string;     // ISO timestamp
}

interface CalibratedPersonaOverrides {
  personaSlug: string;

  // Adjusted property filters (only fields that changed)
  propertyFilters: {
    priceRange?: string;       // adjusted to local tiers
    communityType?: string;    // adjusted to local community categories
    keyDevelopmentsExample?: string; // replaced with local community names
  };

  // Adjusted benchmarks with local data
  localBenchmarks: LocalBenchmark[];

  // Adjusted seasonal pattern
  seasonalPattern?: {
    peakMonths: string[];       // e.g., ["December", "January", "February"]
    slowMonths: string[];       // e.g., ["July", "August", "September"]
    confidence: "high" | "medium" | "low";
    sampleSize: number;
  };
}

interface LocalBenchmark {
  metric: string;            // e.g., "medianPrice", "cashRate", "medianDOM"
  defaultValue: string;      // from seed data
  calibratedValue: string;   // from computedAnalytics
  context: string;           // brief note: "above national luxury avg" or "typical for ski markets"
}

interface MarketProfile {
  // Derived from computedAnalytics — shared across all personas
  city: string;
  state: string;
  totalTransactions: number;
  dateRange: { start: string; end: string };

  // Price distribution
  priceTiers: PriceTier[];

  // Community prevalence
  topCommunities: CommunityInfo[];

  // Seasonality
  monthlyVolume: { month: string; count: number; percentage: number }[];

  // Key market norms
  medianPrice: number;
  medianDOM: number;
  cashTransactionRate: number;
  ownerOccupiedRate: number;
}

interface PriceTier {
  label: string;       // "entry-luxury", "high-luxury", "ultra-luxury"
  min: number;
  max: number | null;  // null = no cap
  transactionCount: number;
  percentage: number;
}

interface CommunityInfo {
  name: string;
  transactionCount: number;
  medianPrice: number;
  type: string;        // "gated", "waterfront", "golf", "ski", "urban", etc.
}
```

## Data Flow

```
Inputs:
  1. computedAnalytics (Layer 1) --- transactions, segments,
     price tiers, YoY, DOM, cash rates, property details

  2. Database: getReportPersonas(reportId)
     --- [{selectionOrder, persona: {propertyFilters,
          sampleBenchmarks, ...}}]

  3. Market definition (from report config)
     --- { city, state, zipCodes, priceMin, priceMax, ... }

            |
            v

  Market Calibration Engine
  (pure computation, no Claude API)

  1. Build MarketProfile from computedAnalytics
  2. For each persona:
     - Map price tiers to local distribution
     - Map communities to local equivalents
     - Compute seasonal patterns from transaction dates
     - Extract benchmark values (DOM, cash rate, median price)
  3. Assess calibration quality (full/partial/minimal)

            |
            v

  MarketCalibrationResult
  +-- personas: CalibratedPersonaOverrides[]
  +-- marketProfile: MarketProfile
  +-- calibrationQuality: "full" | "partial" | "minimal"

            |
            v

  Persona Intelligence Agent
  (receives calibrated overrides)

  Claude prompt now includes:
  - Local price tiers (not Naples defaults)
  - Local community names
  - Actual seasonal patterns
  - Real benchmark values
```

## Pipeline Integration

### Updated Pipeline Architecture (with calibration step)

```
                    Pipeline Start
                    (Layer 1 done)
                         |
              +----------+----------+
              |          |          |
         Insight    Forecast    Polish
         Generator  Modeler     Agent
              |          |          |
              +----------+----------+
                         |
                    Market          <-- NEW
                    Calibration
                    (pure compute)
                         |
                    Persona
                    Intelligence
                    (uses calibr.)
                         |
                    Pipeline Done
```

### Implementation Approach

The calibration engine is a **pure computation service** — no Claude API calls. It reads computedAnalytics (already available from Layer 1) and persona records (already fetched for the persona-intelligence agent), then produces deterministic overrides.

This means:
- No additional API costs
- Fast execution (< 100ms expected)
- Deterministic output for the same inputs (testable without mocking Claude)
- Can be cached by market fingerprint

### Integration with Persona Intelligence Agent

In `lib/agents/persona-intelligence.ts`, before building the Claude prompt:

```typescript
// Calibrate persona specs to local market
const calibration = await calibratePersonasToMarket(
  computedAnalytics,
  reportPersonas,
  marketDefinition,
);

// Merge calibrated overrides into persona data for the prompt
const calibratedPersonas = mergeCalibrationOverrides(
  reportPersonas,
  calibration,
);

// Build prompt with calibrated personas (not raw DB records)
const userPrompt = buildUserPrompt(computedAnalytics, upstreamResults, calibratedPersonas);
```

### Cache Strategy

```typescript
// Cache key: market fingerprint (city + state + price range hash)
const cacheKey = `calibration:${hashMarketDefinition(marketDef)}`;

// TTL: 24 hours (matches property data TTL)
// Persona selection doesn't affect market-level calibration
```

## User Journey

1. Agent defines their market in the report builder wizard (e.g., "Aspen, CO, $3M+")
2. Agent selects buyer personas (e.g., Business Mogul, Seasonal Buyer)
3. Pipeline starts — Layer 0 fetches Aspen property data, Layer 1 computes analytics
4. Layer 2: insight-generator, forecast-modeler, polish-agent run in parallel
5. **Calibration engine runs** — analyzes Aspen data, adjusts persona specs:
   - Business Mogul price range: "$4M-$25M+" -> "$3M-$20M+" (Aspen distribution)
   - Business Mogul communities: "Port Royal, Grey Oaks" -> "Starwood, Red Mountain, West End"
   - Business Mogul seasonal peak: "March-June" -> "December-March" (ski season)
   - Business Mogul cash rate: "87%" -> "68%" (Aspen actual)
6. **Persona Intelligence Agent runs** with calibrated specs — talking points reference Starwood and Red Mountain, peak season is ski season, cash rate matches Aspen reality
7. Agent receives intelligence briefing grounded in their actual market
8. Report PDF renders with locally accurate persona content

## Persona Revision Notes

**Reviewed through user persona lenses**:

- **Rising Star Agent (Alex)**: Alex's credibility depends on accuracy. If a Business Mogul client in Aspen hears "87% cash transactions" when the local rate is 68%, Alex loses trust instantly. Calibration is invisible to Alex — the report just "gets it right" — which is exactly what Alex needs. Alex would describe this as "the intelligence brief automatically understands my market." The executive briefing feels locally grounded, not templated.

- **Established Practitioner (Jordan)**: Jordan will immediately spot generic benchmarks. After 15 years in Aspen ultra-luxury, Jordan knows Starwood from Red Mountain, knows ski season peaks in December-March, knows the cash rate hovers in the 60s. If the report references Naples communities or summer peaks, Jordan loses confidence in the entire system. Calibration validates that the advisory tool matches Jordan's conviction-level expertise. Jordan would say: "It knows my market the way I know my market."

- **Team Leader (Taylor)**: Taylor's team operates in Beverly Hills. Every team member generating a report should see the same locally calibrated data — not Naples defaults that one agent catches and another misses. Calibration makes the publication consistent and trustworthy across the team. Taylor would call this "market-aware intelligence" — the scalable output Taylor needs.

**Vocabulary adjustments made**: Used "intelligence brief" (Alex's vocabulary) for calibrated output. Used "conviction" and "advisory tool" (Jordan's vocabulary) for accuracy benefits. Used "publication" and "scalable" (Taylor's vocabulary) for team consistency. Referenced specific market examples (Aspen, Beverly Hills) that match persona locations rather than abstract descriptions.

## Component References

None — this is a backend service with no UI components.

## Learnings

- **Pure computation is testable and fast**: The calibration engine requires zero mocks (only cache is mocked for DB isolation). All 25 tests run in < 300ms. No Claude API calls means deterministic output, zero cost, and easy debugging.
- **Seasonal patterns need transaction dates**: Without individual `lastSaleDate` on each property in `computedAnalytics`, seasonal calibration distributes evenly across months. For production accuracy, the pipeline should pass transaction-level date data or pre-compute monthly volume in Layer 1.
- **Merge strategy preserves identity**: Using `JSON.parse(JSON.stringify())` for deep cloning personas before mutation ensures the original DB records are never modified. The override only touches `propertyFilters`, `sampleBenchmarks`, and adds `seasonalPattern` — persona identity (decisionDrivers, narrativeFraming, vocabulary) passes through untouched.
- **Cache by market fingerprint**: Market-level calibration (communities, price tiers, seasonal patterns) is shared across all personas for the same market. Only per-persona overrides (price range mapping, benchmark extraction) are persona-specific. This makes cache reuse effective even when persona selection changes.
