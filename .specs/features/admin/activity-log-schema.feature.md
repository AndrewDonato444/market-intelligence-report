---
feature: Activity Log Schema
domain: admin
source: lib/db/schema.ts
tests:
  - __tests__/lib/db/activity-log-schema.test.ts
components: []
personas:
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Activity Log Schema

**Source File**: lib/db/schema.ts
**Service File**: lib/services/activity-log.ts
**Migration**: lib/db/migrations/0002_add_activity_log.sql
**Personas**: .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: User Activity Logging

Add a `user_activity` table that records significant user actions — report created, report exported, market changed, profile updated, login. This provides the activity timeline for admin user detail pages (#113) and feeds user analytics (#133).

### Scenario: Activity table exists with required columns
Given the database migration has run
When I inspect the `user_activity` table
Then it has columns: id (uuid PK), userId (uuid FK to users), action (varchar), entityType (varchar), entityId (uuid nullable), metadata (jsonb nullable), createdAt (timestamptz)
And there is an index on userId
And there is an index on createdAt
And there is a composite index on userId + createdAt

### Scenario: Log activity for a user action
Given an agent creates a new report
When the report is saved to the database
Then an activity record is inserted with action report_created, entityType report, entityId the reportId
And the metadata contains the report title

### Scenario: Log login activity
Given an agent authenticates successfully
When their session is established
Then an activity record is inserted with action login, entityType user, entityId the userId

### Scenario: Query activity timeline for a user
Given an admin views a user detail page
When they request the activity timeline
Then activities are returned in reverse chronological order (newest first)

### Scenario: Query activity by entity
Given an admin wants to see all activity on a specific report
When they query by entityType report and entityId the reportId
Then all activities related to that report are returned in reverse chronological order, up to 100 results

### Scenario: Activity log does not block the parent action
Given an agent is creating a report
When the activity logging insert fails
Then the report creation still succeeds
And the activity log failure is logged to console (non-blocking)

## Schema: user_activity table

| Column | Type | Default | Nullable | Index |
|--------|------|---------|----------|-------|
| id | uuid | gen_random_uuid() | NOT NULL (PK) | PK |
| userId | uuid | - | NOT NULL (FK to users) | btree |
| action | varchar(100) | - | NOT NULL | No |
| entityType | varchar(50) | - | NOT NULL | No |
| entityId | uuid | - | Yes | No |
| metadata | jsonb | - | Yes | No |
| createdAt | timestamptz | now() | NOT NULL | btree |

Composite index on (userId, createdAt) for timeline queries.

## Action Types

| Action | Entity Type | When | Metadata |
|--------|-------------|------|----------|
| login | user | Auth callback (pending) | {} |
| report_created | report | Report inserted | { title } |
| report_completed | report | Pipeline finishes | { title } |
| report_exported | report | PDF downloaded/shared (pending) | { format } |
| report_deleted | report | Report deleted (pending) | { title } |
| market_created | market | Market saved | { name } |
| market_updated | market | Market edited (pending) | { name, fieldsChanged } |
| profile_updated | user | Profile saved | { fieldsChanged } |

## Service Functions

- logActivity(params) - Core insert, fire-and-forget, never throws
- getActivityByUser(userId, options?) - Reverse chronological, paginated
- getActivityByEntity(entityType, entityId) - Entity-scoped query

## Insert Hooks Strategy

Explicit calls at action points, NOT database triggers. Each wrapped in try/catch so failures never break the parent action.

## Dependencies

- Depends on: #110 (User Status Schema) - Completed
- Depended on by: #113 (Admin user detail), #133 (User analytics)
