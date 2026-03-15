---
feature: Property Address Lookup
domain: deal-analyzer
source: app/api/deal-analyzer/lookup/route.ts
tests:
  - __tests__/deal-analyzer/property-address-lookup.test.ts
components: []
personas:
  - rising-star-agent
  - established-practitioner
design_refs: []
status: implemented
created: 2026-03-15
updated: 2026-03-15
---

# Property Address Lookup

**Source File**: `app/api/deal-analyzer/lookup/route.ts`
**Service**: `lib/services/deal-analyzer/property-lookup.ts`
**Design System**: N/A (API endpoint only)
**Personas**: `.specs/personas/rising-star-agent.md`, `.specs/personas/established-practitioner.md`

## Feature: Property Address Lookup

An agent viewing a completed report types in a property address and gets back enriched property data — facts, sale history, mortgage history, motivated seller signals, and demographics — all from RealEstateAPI. This is the data-fetching step before the Deal Brief Agent (#222) generates analysis.

The endpoint calls REAPI PropertySearch (to find the property ID from an address string) then PropertyDetail (to get the full record), transforms the response into the `DealPropertyData` shape defined in schema.ts, and computes a `MotivatedSellerSignals` score from the raw flags and history.

### Why two API calls?

REAPI PropertySearch takes a freeform address and returns matching property IDs. PropertyDetail takes a property ID and returns the full record (sale history, mortgages, tax, flags, etc.). There's no single endpoint that does both. The lookup service chains them: search → pick best match → detail → transform → score.

### Geographic validation

The address must fall within the market's geography. The market record's `geography` JSONB contains `city`, `state`, and optionally `county`/`zipCodes`. Before calling REAPI, we validate that the address's city+state matches. If it doesn't, we reject with a clear message: "This property isn't in your [market name] market area."

Implementation note: We do geographic validation **after** the PropertySearch call (not before), because PropertySearch normalizes the address and returns the canonical city/state/zip. The user might type "Pelican Bay, FL" but REAPI resolves it to "Naples, FL" — which would match a Naples market. Validating the raw user input would produce false rejections.

### Motivated Seller Scoring

The lookup computes six boolean signals from the PropertyDetail response, each with a weight. The total score (0–100) indicates how motivated the seller might be:

| Signal | Source Fields | Weight | Logic |
|--------|--------------|--------|-------|
| `inherited` | saleHistory[0].documentType | 20 | Last transfer was inheritance/probate/estate |
| `nonOwnerOccupied` | flags.ownerOccupied | 15 | Owner doesn't live there (absentee) |
| `adjustableRate` | currentMortgages[0].interestRateType | 15 | ARM exposure in rising-rate environment |
| `longHoldPeriod` | ownerInfo.ownershipLengthMonths | 20 | Held > 10 years (likely high equity, life transition) |
| `helocPattern` | currentMortgages.length | 15 | 2+ active mortgages (cash extraction pattern) |
| `highEquity` | equityPercent | 15 | > 60% equity (doesn't need the money, but may want to unlock) |

Total = sum of weights for fired signals, normalized to 0–100.

---

## Scenarios

### Scenario 1: Happy path — address found, property enriched
```gherkin
Given the agent is viewing a completed report for market "Naples, FL — $6M+"
  And the market geography is { city: "Naples", state: "FL" }
When they POST to /api/deal-analyzer/lookup with:
  | address  | 4100 Gulf Shore Blvd N, Naples, FL 34103 |
  | marketId | {market-uuid}                             |
Then the response status is 200
  And the response body contains:
  | field          | type   | description                        |
  | property       | object | DealPropertyData shape              |
  | sellerSignals  | object | MotivatedSellerSignals shape         |
  | sellerScore    | number | 0-100 motivated seller score        |
  And property.id is a non-empty string (REAPI property ID)
  And property.address is the canonical address from REAPI
  And property.city is "Naples"
  And property.state is "FL"
```

### Scenario 2: Address resolves to different city within market
```gherkin
Given the market geography is { city: "Naples", state: "FL", county: "Collier" }
When they POST with address "2000 Royal Marco Way, Marco Island, FL"
  And REAPI PropertySearch returns city: "Marco Island", state: "FL", county: "Collier"
Then the response status is 200
  And the property is returned (county match is sufficient)
```

### Scenario 3: Address outside market geography — rejected
```gherkin
Given the market geography is { city: "Naples", state: "FL" }
When they POST with address "100 S Pointe Dr, Miami Beach, FL"
  And REAPI PropertySearch returns city: "Miami Beach", state: "FL"
Then the response status is 422
  And the error message is "This property isn't in your Naples, FL market area"
  And no PropertyDetail API call is made (save credits)
```

### Scenario 4: Address not found in REAPI
```gherkin
Given a valid market
When they POST with address "99999 Nonexistent Rd, Naples, FL"
  And REAPI PropertySearch returns 0 results
Then the response status is 404
  And the error message is "No property found matching this address"
```

### Scenario 5: Multiple search results — pick best match
```gherkin
Given a valid market
When they POST with address "100 Gulf Shore, Naples, FL"
  And REAPI PropertySearch returns 3 results
Then the system picks the result with the highest address similarity score
  And calls PropertyDetail for that property ID only
```

### Scenario 6: PropertyDetail returns sale history
```gherkin
Given a valid property is found via search
When PropertyDetail returns saleHistory with 3 entries
Then property.saleHistory contains 3 items
  And each item has: date, amount
  And items are ordered newest-first
  And buyer/seller names are included when available
```

### Scenario 7: PropertyDetail returns mortgage history
```gherkin
Given a valid property is found via search
When PropertyDetail returns currentMortgages with 2 entries
Then property.mortgageHistory contains 2 items
  And each item has: amount
  And rate, lender, originationDate, dueDate, type are included when available
```

### Scenario 8: Motivated seller — inherited property
```gherkin
Given PropertyDetail returns saleHistory[0].documentType containing "Probate"
When the motivated seller score is computed
Then sellerSignals.inherited.fired is true
  And sellerSignals.inherited.weight is 20
  And the totalScore includes 20 points from this signal
```

### Scenario 9: Motivated seller — non-owner-occupied
```gherkin
Given PropertyDetail returns flags.ownerOccupied = false
When the motivated seller score is computed
Then sellerSignals.nonOwnerOccupied.fired is true
  And sellerSignals.nonOwnerOccupied.weight is 15
```

### Scenario 10: Motivated seller — adjustable rate mortgage
```gherkin
Given PropertyDetail returns currentMortgages[0].interestRateType = "ARM"
When the motivated seller score is computed
Then sellerSignals.adjustableRate.fired is true
  And sellerSignals.adjustableRate.weight is 15
```

### Scenario 11: Motivated seller — long hold period
```gherkin
Given PropertyDetail returns ownerInfo.ownershipLengthMonths = 180 (15 years)
When the motivated seller score is computed
Then sellerSignals.longHoldPeriod.fired is true
  And sellerSignals.longHoldPeriod.yearsHeld is 15
  And sellerSignals.longHoldPeriod.weight is 20
```

### Scenario 12: Motivated seller — HELOC pattern
```gherkin
Given PropertyDetail returns currentMortgages with 3 entries
When the motivated seller score is computed
Then sellerSignals.helocPattern.fired is true
  And sellerSignals.helocPattern.mortgageCount is 3
  And sellerSignals.helocPattern.weight is 15
```

### Scenario 13: Motivated seller — high equity
```gherkin
Given PropertyDetail returns equityPercent = 0.85 (85%)
When the motivated seller score is computed
Then sellerSignals.highEquity.fired is true
  And sellerSignals.highEquity.equityPercent is 85
  And sellerSignals.highEquity.weight is 15
```

### Scenario 14: Motivated seller — no signals fired
```gherkin
Given PropertyDetail returns:
  - flags.ownerOccupied = true
  - ownershipLengthMonths = 24 (2 years)
  - currentMortgages = [1 fixed-rate mortgage]
  - equityPercent = 0.20
  - saleHistory[0].documentType = "Warranty Deed"
When the motivated seller score is computed
Then sellerScore is 0
  And all signal.fired values are false
```

### Scenario 15: Motivated seller — all signals fired
```gherkin
Given all 6 conditions are met
When the motivated seller score is computed
Then sellerScore is 100
  And all signal.fired values are true
```

### Scenario 16: Missing marketId — validation error
```gherkin
When they POST with address but no marketId
Then the response status is 400
  And the error message is "marketId is required"
```

### Scenario 17: Missing address — validation error
```gherkin
When they POST with marketId but no address
Then the response status is 400
  And the error message is "address is required"
```

### Scenario 18: Market not found
```gherkin
When they POST with a non-existent marketId
Then the response status is 404
  And the error message is "Market not found"
```

### Scenario 19: Market belongs to different user
```gherkin
Given market belongs to user A
When user B POSTs to lookup with that marketId
Then the response status is 403
  And the error message is "You don't have access to this market"
```

### Scenario 20: Unauthenticated request
```gherkin
When an unauthenticated user POSTs to /api/deal-analyzer/lookup
Then the response status is 401
```

### Scenario 21: REAPI returns error (500/503)
```gherkin
Given a valid address and market
When REAPI PropertySearch returns HTTP 500
Then the response status is 502
  And the error message is "Property data service temporarily unavailable"
  And the error is logged for monitoring
```

### Scenario 22: REAPI returns error on PropertyDetail
```gherkin
Given PropertySearch succeeds and returns a property ID
When PropertyDetail returns HTTP 500 for that ID
Then the response status is 502
  And the error message is "Property data service temporarily unavailable"
```

### Scenario 23: Cached REAPI response used
```gherkin
Given the same address was looked up within the last 24 hours
When the agent looks it up again
Then the cached PropertySearch + PropertyDetail results are used
  And no new REAPI API calls are made
  And the response includes property.stale = false
```

### Scenario 24: Stale cache fallback
```gherkin
Given a cached response exists from 3 days ago (past 24h TTL)
  And REAPI is returning errors
When the agent looks up the same address
Then the stale cached response is used
  And the response includes property.stale = true
```

### Scenario 25: PropertyDetail data mapped to DealPropertyData shape
```gherkin
Given PropertyDetail returns a full record
When the response is transformed
Then the output matches the DealPropertyData type from schema.ts:
  | DealPropertyData field | Source |
  | id                     | PropertyDetail.id |
  | address                | propertyInfo.address.address |
  | city                   | propertyInfo.address.city |
  | state                  | propertyInfo.address.state |
  | zip                    | propertyInfo.address.zip |
  | county                 | propertyInfo.address.county ?? "" |
  | subdivision            | lotInfo.subdivision |
  | propertyType           | PropertyDetail.propertyType |
  | bedrooms               | propertyInfo.bedrooms |
  | bathrooms              | propertyInfo.bathrooms |
  | squareFeet             | propertyInfo.sqft |
  | lotSize                | lotInfo.lotSquareFeet |
  | yearBuilt              | propertyInfo.yearBuilt |
  | estimatedValue         | estimatedValue |
  | lastSaleDate           | lastSaleDate |
  | lastSaleAmount         | lastSalePrice |
  | pricePerSqFt           | propertyInfo.pricePerSquareFoot |
  | ownerOccupied          | flags.ownerOccupied |
  | inherited              | (computed from saleHistory) |
  | adjustableRate         | (computed from mortgages) |
  | saleHistory            | saleHistory[] mapped |
  | mortgageHistory        | currentMortgages[] mapped |
  | taxAssessment          | taxInfo.assessedValue |
  | annualTaxes            | taxInfo.taxAmount (parsed) |
  | floodZone              | flags.floodZone → "Yes"/"No" |
```

### Scenario 26: Address string normalization
```gherkin
Given the agent types "  4100 gulf shore blvd n, naples fl  "
When the address is sent to PropertySearch
Then leading/trailing whitespace is trimmed
  And REAPI handles case normalization
```

### Scenario 27: Empty address string
```gherkin
When they POST with address ""
Then the response status is 400
  And the error message is "address is required"
```

### Scenario 28: API usage logged
```gherkin
Given a successful lookup
Then two API usage records are created:
  | provider       | endpoint           |
  | realestateapi  | /v2/PropertySearch |
  | realestateapi  | /v2/PropertyDetail |
  And each record includes userId, responseTimeMs, cached flag
```

---

## User Journey

1. Agent opens a completed report (e.g., "Naples, FL — $6M+")
2. Agent sees "Analyze a Property" action
3. **Agent types an address → this endpoint is called**
4. Property data card appears with enriched data
5. Agent clicks "Generate Deal Brief" → Feature #222

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  POST /api/deal-analyzer/lookup                          │
│  { address: string, marketId: string }                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Auth check (requireAuth)                             │
│  2. Validate input (address, marketId required)          │
│  3. Fetch market → verify ownership + geography          │
│                                                          │
│  4. ┌─ PropertySearch(address) ─────────────────────┐    │
│     │  Uses existing realestateapi.ts connector      │    │
│     │  Cache: 24h TTL, 7d stale fallback             │    │
│     └───────────────────────────────────┬────────────┘    │
│                                         │                 │
│  5. Geographic validation (city/state/county vs market)   │
│                                         │                 │
│  6. ┌─ PropertyDetail(propertyId) ──────┤────────────┐   │
│     │  Full record: sales, mortgages,   │ taxes, etc │   │
│     │  Cache: 24h TTL, 7d stale fallback│            │   │
│     └───────────────────────────────────┬────────────┘   │
│                                         │                 │
│  7. Transform → DealPropertyData                         │
│  8. Compute → MotivatedSellerSignals + score             │
│  9. Return { property, sellerSignals, sellerScore }      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## File Structure

```
app/api/deal-analyzer/lookup/
  route.ts                    ← Next.js route handler (thin)

lib/services/deal-analyzer/
  property-lookup.ts          ← Core logic: search → detail → transform → score
  motivated-seller.ts         ← Signal computation (pure function, testable)
  geo-validation.ts           ← Market geography check (pure function)

lib/connectors/realestateapi.ts  ← Already exists — reuse searchProperties + getPropertyDetail
```

## Learnings

(To be filled after implementation)
