---
feature: Social Media Kit Data Model
domain: social-media-kit
source: lib/db/schema.ts
tests:
  - __tests__/social-media-kit/data-model.test.ts
components: []
personas:
  - established-practitioner
  - rising-star-agent
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Social Media Kit Data Model

**Source File**: lib/db/schema.ts
**Migration**: supabase/migrations/20260311220000_add_social_media_kits.sql

## Feature: Social Media Kit Data Model (#160)

### Scenario: Table exists with required columns
### Scenario: Status enum has correct values (queued, generating, completed, failed)
### Scenario: Content JSONB conforms to SocialMediaKitContent type
### Scenario: Foreign keys enforce referential integrity (CASCADE)
### Scenario: Indexes on reportId, userId, status
### Scenario: Unique constraint on reportId (one kit per report)
### Scenario: Migration file creates table, enum, indexes
### Scenario: TypeScript types exported from schema

## Learnings

_(to be filled after implementation)_
