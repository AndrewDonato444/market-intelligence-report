---
feature: Database Schema + Supabase Setup
domain: foundation
source: lib/db/schema.ts, lib/db/index.ts, lib/db/migrations/
tests:
  - __tests__/db/schema.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Database Schema + Supabase Setup

**Source Files**: `lib/db/schema.ts`, `lib/db/index.ts`
**Design System**: N/A (backend)
**Personas**: All (data layer serves everyone)

## Feature: Database Schema

The data persistence layer. Defines all core tables using Drizzle ORM with PostgreSQL (Supabase). Schema supports the full report generation pipeline: user profiles, market definitions, cached API data, reports, and usage tracking.

### Scenario: Database client connects successfully
Given Supabase credentials are configured in environment variables
When the application initializes the database client
Then a connection to PostgreSQL is established
And the client is available for queries

### Scenario: Users table stores agent profiles
Given the schema defines a users table
When an agent creates an account
Then their profile data is persisted (id, email, name, company, logo_url, brand_colors, created_at, updated_at)

### Scenario: Markets table stores market definitions
Given the schema defines a markets table
When an agent defines their target market
Then the market configuration is persisted (geography, segments, luxury tiers, peer markets)
And the market is linked to a user via user_id

### Scenario: Reports table tracks generated reports
Given the schema defines a reports table
When a report is generated
Then report metadata is persisted (title, market_id, user_id, status, config, output_url, created_at)
And report status tracks the pipeline stages (queued, generating, completed, failed)

### Scenario: Cache table stores API response data
Given the schema defines a cache table with TTL support
When an API response is cached
Then the data, source, key, TTL, and timestamps are stored
And expired entries can be identified by comparing expires_at with current time

### Scenario: API usage table logs cost data
Given the schema defines an api_usage table
When an API call is made
Then the provider, endpoint, cost, tokens used, and timestamp are logged
And usage can be aggregated per user and time period

### Scenario: Report sections table stores pipeline output
Given the schema defines a report_sections table
When an AI agent produces a section
Then the section content, type, agent name, and ordering are persisted
And sections are linked to a report via report_id

## Technical Notes

- Drizzle ORM for type-safe schema definition and queries
- PostgreSQL via Supabase (connection string in env)
- All tables use UUID primary keys
- Timestamps use `timestamp with time zone`
- Soft deletes where appropriate (deleted_at)
- Indexes on foreign keys and frequently queried columns
