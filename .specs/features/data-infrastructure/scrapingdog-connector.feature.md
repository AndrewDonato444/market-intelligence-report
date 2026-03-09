---
feature: ScrapingDog Connector
domain: data-infrastructure
source: lib/connectors/scrapingdog.ts
tests:
  - __tests__/connectors/scrapingdog.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# ScrapingDog Connector

**Source File**: `lib/connectors/scrapingdog.ts`
**Design System**: N/A (backend connector)
**Personas**: All (invisible — agents see neighborhood context in Key Drivers and Trending Insights)

## Feature: ScrapingDog Neighborhood Intelligence Connector

Fetches neighborhood-level data using ScrapingDog's Google Local API and web scraping endpoints. Provides local business counts, restaurant/retail density, lifestyle amenity signals, and area context that enriches the Key Drivers and Trending Insights report sections. Uses cache layer with 7d TTL (neighborhood data is slow-moving).

### Scenario: Fetch local businesses for a market area
Given a market geography (city, state)
When the connector queries ScrapingDog's Google Local API
Then it returns categorized local business data (restaurants, retail, wellness, services)
With business name, category, rating, and review count

### Scenario: Fetch neighborhood amenities by category
Given a market geography and category (e.g., "luxury restaurants")
When the connector queries for that category
Then it returns businesses matching the category
With location-relevant results for the market area

### Scenario: Cache integration with 7-day TTL
Given the cache layer is available
When the connector fetches neighborhood data
Then it checks cache first (key includes city, state, category)
And on cache miss, calls ScrapingDog API
And stores response with source "scrapingdog" (7d TTL)
And logs the API call via usage service

### Scenario: Handle API error gracefully
Given ScrapingDog returns an error
When the connector encounters the error
Then it throws a typed error with provider and status
And logs the failed call

### Scenario: Serve stale data on API failure
Given expired cached neighborhood data exists
And the API is currently unavailable
When the connector attempts to fetch fresh data
Then the expired cached data is returned as a fallback marked stale

### Scenario: Scrape a URL for neighborhood content
Given a target URL with neighborhood information
When the connector scrapes the page
Then it returns the raw HTML content
And the result is cached with the URL as key

## Technical Notes

### API Details

- Base URL: `https://api.scrapingdog.com`
- Auth: `api_key` query parameter
- Key endpoints:
  - `GET /google_local` — Google Local business results
  - `GET /scrape` — General web scraping

### Connector API

```typescript
interface LocalBusiness {
  name: string;
  category: string;
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
}

interface LocalSearchResult {
  businesses: LocalBusiness[];
  query: string;
  stale: boolean;
}

interface ScrapeResult {
  html: string;
  url: string;
  stale: boolean;
}

searchLocal(query: string, location: string, options?: ConnectorOptions): Promise<LocalSearchResult>
scrapeUrl(url: string, options?: ConnectorOptions): Promise<ScrapeResult>
buildLocalQuery(category: string, market: { city: string; state: string }): string
```

### Neighborhood Categories for Luxury Markets

| Category | Query Pattern | Report Section |
|----------|--------------|----------------|
| Fine dining | "luxury restaurants {city}" | Trending Insights |
| Wellness | "luxury spa wellness {city}" | Trending Insights |
| Retail | "luxury retail shopping {city}" | Trending Insights |
| Golf/Recreation | "golf country club {city}" | Key Drivers |
| Schools | "private schools {city}" | Key Drivers |
| Marinas | "marina yacht club {city}" | Key Drivers |

### Caching Strategy

- Local search key: `scrapingdog:local:{query}:{location}`
- Scrape key: `scrapingdog:scrape:{url-hash}`
- TTL: 604800s (7d) per SOURCE_TTLS config

## User Journey

1. Agent defines market (Phase 2 ✅)
2. Report generation triggers data pipeline
3. **Pipeline calls ScrapingDog for neighborhood context**
4. Insight Generator uses neighborhood data in Key Drivers + Trending Insights

## Learnings

(To be filled after implementation)
