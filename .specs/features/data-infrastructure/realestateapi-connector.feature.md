---
feature: RealEstateAPI Connector
domain: data-infrastructure
source: lib/connectors/realestateapi.ts
tests:
  - __tests__/connectors/realestateapi.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# RealEstateAPI Connector

**Source File**: `lib/connectors/realestateapi.ts`
**Design System**: N/A (backend connector)
**Personas**: All (invisible — agents see market data in reports, not raw API calls)

## Feature: RealEstateAPI Property Data Connector

Fetches property data from RealEstateAPI (realestateapi.com) for luxury market intelligence reports. Provides typed access to Property Search (filtered market transactions), Property Detail (single property deep data), and Property Comps (comparable sales). Uses cache layer (#20) with 24h TTL and logs all calls via API usage service.

### Scenario: Search properties by market definition
Given a market definition for Naples, FL with luxury tier ($6M+)
When the connector searches properties matching those filters
Then it returns a list of matching properties with key fields (address, price, sqft, bedrooms, property type, sale date)
And the results are paginated

### Scenario: Search with cache integration
Given the cache layer is available
When the connector searches for properties in a market
Then it first checks cache for the search key
And on cache miss, calls the RealEstateAPI Property Search endpoint
And stores the response in cache with source "realestateapi" (24h TTL)
And logs the API call via usage service

### Scenario: Get property detail by ID
Given a property ID from a previous search result
When the connector fetches the full property detail
Then it returns comprehensive data (owner info, sale history, mortgage, valuation, lot details)

### Scenario: Get property comps
Given a subject property address
When the connector fetches comparable properties
Then it returns comp properties with AVM values, price per sqft, distance, and similarity metrics

### Scenario: Handle API error gracefully
Given the RealEstateAPI returns an error (rate limit, 401, 500)
When the connector encounters the error
Then it throws a typed error with provider and status code
And logs the failed call with error status

### Scenario: Serve stale data on API failure
Given expired cached data exists for a property search
And the API is currently unavailable
When the connector attempts to fetch fresh data
Then the expired cached data is returned as a fallback
And the response is marked as stale

### Scenario: Map market definition to search params
Given a market definition with geography (city, state, zipCodes), luxury tier, price range, and property types
When the search params are built
Then city, state, zip codes are mapped to location filters
And priceFloor/priceCeiling are mapped to price range filters
And property types are mapped to the API's property type filters

### Scenario: Convert state names to 2-letter abbreviations
Given a market with a full state name (e.g., "Florida")
When building search params or the API request body
Then the state is converted to its 2-letter code (e.g., "FL")
And 2-letter codes are preserved as-is

### Scenario: Map app property types to REAPI enum values
Given app-level property types (e.g., "single_family", "estate", "penthouse", "chalet")
When constructing the API request body
Then each type is mapped to a valid REAPI enum: SFR, MFR, LAND, CONDO, OTHER, or MOBILE
And duplicate mapped values are deduplicated (e.g., "single_family" + "estate" → ["SFR"])
And unknown types fall through to "OTHER"

## Technical Notes

### API Details

- Base URL: `https://api.realestateapi.com`
- Auth: `x-api-key` header
- Content-Type: `application/json` (POST requests)
- Key endpoints:
  - `POST /v2/PropertySearch` — search/filter properties
  - `POST /v2/PropertyDetail` — single property deep data
  - `POST /v3/PropertyComps` — comparable sales with AVM

### Connector API

```typescript
// lib/connectors/realestateapi.ts
interface PropertySearchParams {
  city: string;
  state: string;
  zipCodes?: string[];
  priceMin?: number;
  priceMax?: number;
  propertyTypes?: string[];
  limit?: number;
  offset?: number;
}

interface PropertySummary {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  yearBuilt: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
}

interface PropertySearchResult {
  properties: PropertySummary[];
  total: number;
  stale: boolean;
}

interface PropertyDetail {
  id: string;
  address: string;
  owner: { name: string; mailingAddress: string } | null;
  saleHistory: Array<{ date: string; price: number }>;
  mortgage: { amount: number; lender: string; date: string } | null;
  valuation: { estimated: number; low: number; high: number } | null;
  lotSize: number | null;
  sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  stale: boolean;
}

interface CompProperty {
  address: string;
  price: number;
  sqft: number | null;
  pricePerSqft: number | null;
  distance: number | null;
  similarity: number | null;
}

interface CompsResult {
  subjectProperty: string;
  comps: CompProperty[];
  avm: { estimated: number; low: number; high: number } | null;
  stale: boolean;
}

searchProperties(params: PropertySearchParams, options?: ConnectorOptions): Promise<PropertySearchResult>
getPropertyDetail(propertyId: string, options?: ConnectorOptions): Promise<PropertyDetail>
getPropertyComps(address: string, options?: ConnectorOptions): Promise<CompsResult>
buildSearchParamsFromMarket(market: Market): PropertySearchParams
```

### Caching Strategy

- Search key: `reapi:property-search:{sorted-params-hash}`
- Detail key: `reapi:property-detail:{propertyId}`
- Comps key: `reapi:property-comps:{address-hash}`
- TTL: 86400s (24h) per SOURCE_TTLS config
- Stale fallback: on API error, return expired cache with `stale: true`

## User Journey

1. Agent defines market (Phase 2 ✅)
2. Report generation triggers data pipeline
3. **Pipeline calls RealEstateAPI for property transactions in the market**
4. Data Analyst agent processes transaction data into segment analysis
5. Results flow into Executive Summary, Market Analysis Matrix, etc.

## Learnings

- REAPI requires 2-letter state codes (not full names like "Florida"). The connector now converts via `toStateAbbr()`.
- REAPI property_type enum is `[SFR, MFR, LAND, CONDO, OTHER, MOBILE]`. App-level types like "estate", "penthouse", "chalet" must be mapped via `toReapiPropertyTypes()` before sending.
- Turbopack may serve stale compiled modules after file changes. Always clear `.next` cache and restart the dev server after modifying connector code to ensure changes take effect.
- The `PROPERTY_TYPE_MAP` includes luxury property types: penthouse→CONDO, chalet→SFR, villa→SFR, estate→SFR.
