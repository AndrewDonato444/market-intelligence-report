---
feature: Buyer Persona Data Model
domain: buyer-personas
source: lib/db/schema.ts
tests:
  - __tests__/buyer-personas/buyer-persona-model.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-10
updated: 2026-03-10
---

# Buyer Persona Data Model + Seed Data

**Source Files**: `lib/db/schema.ts`, `lib/services/buyer-personas.ts`
**Design System**: .specs/design-system/tokens.md
**Reference**: .specs/reference/knox-brothers-persona-framework.pdf

## Feature: Buyer Persona Data Model

Store the 8 Knox Brothers luxury buyer archetypes in the database so that downstream features (persona selection UI, Persona Intelligence Agent, PDF templates) can query and use them. These personas represent the agent's **clients** (luxury home buyers), not our users.

### Scenario: All 8 personas are seeded on database reset
Given the database has been reset with seed data
When the buyer_personas table is queried
Then 8 persona records are returned
And each has a unique slug and display_order from 1 to 8

### Scenario: Each persona contains complete Knox Brothers data
Given a buyer persona record exists
Then it contains profile_overview text
And it contains demographics as structured JSON
And it contains decision_drivers as an array of weighted factors
And it contains report_metrics as structured JSON
And it contains property_filters as structured JSON
And it contains narrative_framing with language, vocabulary, and avoid lists
And it contains talking_point_templates as an array
And it contains sample_benchmarks as structured JSON

### Scenario: Report can be linked to up to 3 personas
Given a report exists
When personas are selected for that report
Then up to 3 report_persona junction records can be created
And each has a selection_order (1, 2, or 3)

### Scenario: Fetch all personas via API
Given the user is authenticated
When GET /api/buyer-personas is called
Then all 8 personas are returned
And they are ordered by display_order ascending

### Scenario: Fetch single persona by slug
Given the user is authenticated
When GET /api/buyer-personas/business-mogul is called
Then the full persona record is returned with all JSONB fields

### Scenario: Persona slugs match the 8 Knox Brothers archetypes
Given the seed data has been loaded
Then these slugs exist: business-mogul, legacy-builder, coastal-escape-seeker, tech-founder, seasonal-second-home, international-buyer, celebrity-public-figure, corporate-executive

## Data Model

```
buyer_personas
├── id (UUID, PK)
├── name (VARCHAR) — display name
├── slug (VARCHAR, UNIQUE) — URL-safe identifier
├── tagline (TEXT) — one-line persona summary
├── display_order (INTEGER) — 1-8
├── profile_overview (TEXT) — paragraph description
├── primary_motivation (VARCHAR)
├── buying_lens (VARCHAR)
├── what_wins_them (VARCHAR)
├── biggest_fear (VARCHAR)
├── demographics (JSONB) — age, net worth, residence, etc.
├── decision_drivers (JSONB) — array of {factor, weight, description}
├── report_metrics (JSONB) — intelligence specs
├── property_filters (JSONB) — price, type, community, etc.
├── narrative_framing (JSONB) — language, vocabulary, avoid
├── talking_point_templates (JSONB) — templated conversation starters
├── sample_benchmarks (JSONB) — Naples 2025 reference data
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

report_personas (junction)
├── id (UUID, PK)
├── report_id (UUID, FK → reports)
├── buyer_persona_id (UUID, FK → buyer_personas)
├── selection_order (INTEGER) — 1, 2, or 3
└── created_at (TIMESTAMP)
```

## User Journey

1. Agent creates a market definition (Phase 2)
2. Agent starts report builder wizard (Phase 5)
3. **Agent selects buyer personas** (Phase 10, feature #91 — depends on THIS feature)
4. Pipeline generates persona-tailored content (Phase 10, #92-95)
