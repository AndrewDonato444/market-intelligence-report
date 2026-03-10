---
feature: Data Source Registry
domain: pipeline
source: lib/services/data-source-registry.ts
tests:
  - __tests__/services/data-source-registry.test.ts
components:
  - AdminDataSourcesPage
personas:
  - primary
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Data Source Registry

**Source File**: lib/services/data-source-registry.ts
**API Route**: app/api/admin/data-sources/route.ts
**Admin Page**: app/admin/data-sources/page.tsx
**Design System**: .specs/design-system/tokens.md

## Feature: Data Source Registry

A pluggable connector management system with health checks. Provides a standard interface for all external data connectors (RealEstateAPI, ScrapingDog, future sources), runtime health checking, and an admin UI to view connector status.

### Scenario: Register connectors at startup
Given the application starts
When the data source registry initializes
Then it registers the RealEstateAPI connector with name "realestateapi"
And it registers the ScrapingDog connector with name "scrapingdog"
And each connector has metadata (name, description, endpoints, cacheTtl, requiredEnvVars)

### Scenario: Health check a healthy connector
Given the RealEstateAPI connector is registered
And the REALESTATEAPI_KEY environment variable is set
When a health check runs for "realestateapi"
Then the connector status is "healthy"
And the response includes latency in milliseconds
And the lastChecked timestamp is updated

### Scenario: Health check a connector with missing API key
Given the ScrapingDog connector is registered
And the SCRAPINGDOG_API_KEY environment variable is empty
When a health check runs for "scrapingdog"
Then the connector status is "degraded"
And the error message indicates the missing API key

### Scenario: Health check a connector with failed API call
Given the RealEstateAPI connector is registered
And the API returns an error
When a health check runs for "realestateapi"
Then the connector status is "unhealthy"
And the error message includes the API error details

### Scenario: Get all data sources via admin API
Given connectors are registered
When a GET request is made to /api/admin/data-sources
Then the response contains all registered connectors
And each connector includes its current health status
And each connector includes cache TTL and endpoint info

### Scenario: Trigger health check via admin API
Given connectors are registered
When a POST request is made to /api/admin/data-sources with action "health-check"
Then all connectors are health-checked
And the response includes updated statuses for all connectors

### Scenario: View data sources in admin UI
Given the admin navigates to /admin/data-sources
Then they see a card for each registered data source
And each card shows: name, status badge, endpoints, cache TTL, last checked time
And there is a "Check Health" button that triggers a health check

### Scenario: Data fetcher uses registry for connector availability
Given the data source registry is initialized
When fetchAllMarketData runs
Then it checks the registry for connector availability before calling APIs
And if a connector is unhealthy, it logs a warning but still attempts the call (graceful degradation)

## User Journey

1. Admin navigates to /admin from the sidebar
2. **Admin clicks "Data Sources" in sidebar**
3. Sees health status of all connectors
4. Clicks "Check Health" to refresh statuses
5. If a connector is unhealthy, investigates the error and fixes config

## UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│  Data Sources                          [Check All]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  RealEstateAPI                    ● Healthy      │    │
│  │  Property search, detail, comps, valuations      │    │
│  │                                                   │    │
│  │  Endpoints: /v2/PropertySearch, /v2/PropertyDetail│    │
│  │  Cache TTL: 24h    │  Last check: 2m ago          │    │
│  │  Env: REALESTATEAPI_KEY ✓                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ScrapingDog                      ● Degraded     │    │
│  │  Neighborhood intelligence, amenities             │    │
│  │                                                   │    │
│  │  Endpoints: /google_local, /scrape                │    │
│  │  Cache TTL: 7d     │  Last check: 2m ago          │    │
│  │  Env: SCRAPINGDOG_API_KEY ✓                       │    │
│  │  ⚠ API key unauthorized — check plan/credits      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component References

- AdminSidebar: components/layout/admin-sidebar.tsx (add "Data Sources" nav item)
- StatusBadge: inline component in admin page
