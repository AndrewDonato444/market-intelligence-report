# API & Data Learnings

Patterns for API and data handling in this codebase.

---

## RealEstateAPI Credit Optimization

The RealEstateAPI has free/cheap query modes to use before full data pulls:

1. **Count query** (`"count": true`) — FREE. Returns number of matching properties.
2. **IDs only** (`"ids_only": true`) — FREE. Returns all matching property IDs. Cross-ref against cache.
3. **Last update filter** (`"last_update_date_min": "YYYYMMDD"`) — Skip stale records.
4. **Exists filter** (`"exists": [{ fieldname: true }]`) — Audit data coverage.
5. **Default size is 50** — set `"size"` explicitly for larger result sets.
6. **Input IDs** (`"ids": []`) — Search through predefined list of properties.

### Optimal fetch flow:
```
1. count: true (free) → know universe size
2. ids_only: true (free) → get all property IDs
3. Cross-ref IDs against cached data → identify new/stale
4. Fetch only new/stale with last_update_date_min → minimize credit usage
```

### Auth: `x-api-key` header. All endpoints POST to `https://api.realestateapi.com`.

---

## Endpoints

### RealEstateAPI
- `/v2/PropertySearch` — find properties by market criteria
- `/v2/PropertyDetail` — single property full details
- `/v3/PropertyComps` — comparable properties + AVM valuation

### ScrapingDog
- `/google_local` — local businesses/amenities via Google Local API
- `/scrape` — raw URL scraping for neighborhood content

---

## Caching & State

- All connectors use cache-first architecture (check cache → call API on miss → store)
- Stale fallback: if API fails, serve expired cache with `stale: true`
- All API calls logged to `api_usage` table for cost tracking
- Cost stored as numeric(10,6)

---

## Error Handling

- Connector wraps fetch errors and logs to api_usage with statusCode
- Stale cache fallback on API errors (graceful degradation)
- Rate limit errors (429) should trigger backoff

### 2026-03-10 — Claude Agent Error Tagging
- **Pattern**: All Claude agents tag errors with `retriable: boolean` before throwing. HTTP 429/500/503 → `retriable: true`. JSON parse failures → `retriable: true` (LLM may produce valid JSON on retry). Abort signals and 400-class errors → `retriable: false`. The orchestrator's `executeWithRetry` reads this flag to decide whether to retry with exponential backoff.

---

## Data Shapes

- RealEstateAPI returns nested objects: `data[].address.full`, `data[].summary.sqft`, etc.
- Connector normalizes to flat `PropertySummary` interface
- ScrapingDog Google Local returns business objects with name, category, rating, reviewCount

---

## Fetching Patterns

- POST for all RealEstateAPI calls, GET for ScrapingDog
- Cache keys built from query params for deduplication
- ConnectorOptions carries userId/reportId for usage attribution
