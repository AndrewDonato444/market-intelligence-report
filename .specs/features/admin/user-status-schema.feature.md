---
feature: User Status Schema
domain: admin
source: lib/db/schema.ts
tests:
  - __tests__/lib/db/user-status-schema.test.ts
components: []
personas:
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# User Status Schema

**Source File**: lib/db/schema.ts
**Migration**: lib/db/migrations/ (new migration file)
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/established-practitioner.md, .specs/personas/team-leader.md

## Feature: User Account Status Management

Add account lifecycle columns to the `users` table — `status` enum (active/suspended/deleted), `suspendedAt`, `deletedAt`, `lastLoginAt` — enabling admin user management (suspend, delete, view activity). This is the schema foundation for Phase 13 (User Management).

### Why This Matters

Admin needs to manage agent accounts across their lifecycle: active agents generating reports, suspended agents locked out pending resolution, and soft-deleted agents whose data is preserved for analytics. Without a `status` column, there is no way to disable an account without deleting it from the database.

### Scenario: New users default to active status
Given an agent signs up for the platform
When their profile is created in the users table
Then their `status` column is set to `active`
And their `suspendedAt` is null
And their `deletedAt` is null

### Scenario: Existing users backfilled to active status
Given users already exist in the database without a `status` column
When the migration runs
Then all existing users receive `status = 'active'`
And no existing data is lost or altered

### Scenario: Last login timestamp is recorded
Given an authenticated agent accesses the platform
When their session is established (middleware or auth callback)
Then `lastLoginAt` is updated to the current timestamp
And this does not affect other user fields

### Scenario: Suspended agent cannot access the platform
Given an admin has set an agent's status to `suspended`
When that agent attempts to access any authenticated route
Then they see a message: "Your account has been suspended. Please contact support."
And they cannot access the dashboard, reports, or any protected resource
And `suspendedAt` records when the suspension occurred

### Scenario: Suspended agent is unsuspended
Given an admin restores a suspended agent's status to `active`
When that agent next logs in
Then they access the platform normally
And `suspendedAt` is reset to null

### Scenario: Soft-deleted agent cannot access the platform
Given an admin has set an agent's status to `deleted`
When that agent attempts to access any authenticated route
Then they see a message: "Your account is no longer active. Please contact support."
And their reports remain in the database (orphaned, not cascade-deleted)
And `deletedAt` records when the deletion occurred

### Scenario: Admin queries users by status
Given an admin is viewing the user management page
When they filter by status `suspended`
Then only suspended agents appear in the results
And the query uses the indexed `status` column for performance

## Schema Changes

### New Enum

```sql
CREATE TYPE user_account_status AS ENUM ('active', 'suspended', 'deleted');
```

### New Columns on `users` Table

| Column | Type | Default | Nullable | Index | Purpose |
|--------|------|---------|----------|-------|---------|
| `status` | `user_account_status` | `'active'` | NOT NULL | Yes (btree) | Account lifecycle state |
| `suspendedAt` | `timestamp with time zone` | null | Yes | No | When account was suspended |
| `deletedAt` | `timestamp with time zone` | null | Yes | No | When account was soft-deleted |
| `lastLoginAt` | `timestamp with time zone` | null | Yes | No | Most recent authenticated access |

### Drizzle Schema Addition

```typescript
export const userAccountStatusEnum = pgEnum("user_account_status", [
  "active",
  "suspended",
  "deleted",
]);

// Add to existing users table definition:
status: userAccountStatusEnum("status").notNull().default("active"),
suspendedAt: timestamp("suspended_at", { withTimezone: true }),
deletedAt: timestamp("deleted_at", { withTimezone: true }),
lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
```

### Migration Strategy

1. Add the `user_account_status` enum type
2. Add all four columns with defaults (non-breaking)
3. Backfill: `UPDATE users SET status = 'active' WHERE status IS NULL` (handled by DEFAULT, but explicit for safety)
4. Add index on `status` column for admin queries

## Auth Gate Implementation

### Middleware Check

The existing `middleware.ts` (which calls `updateSession`) needs a post-auth check:

1. After Supabase session is validated, query the user's `status`
2. If `status === 'suspended'` → redirect to `/suspended` (static page)
3. If `status === 'deleted'` → redirect to `/account-inactive` (static page)
4. If `status === 'active'` → proceed normally

**Performance note**: This adds one DB query per request. Mitigate by:
- Caching status in the session/cookie (invalidated on status change)
- Or checking only on initial auth, not every request

### Static Pages

- `/suspended` — "Your account has been suspended. Please contact support at [email]." No nav, no sidebar. Just the message + contact info.
- `/account-inactive` — "Your account is no longer active. Please contact support at [email]." Same minimal layout.

## Last Login Tracking

Update `lastLoginAt` in the auth callback or profile upsert flow:

```typescript
// In lib/services/profile.ts — upsertProfile or a new updateLastLogin function
await db
  .update(users)
  .set({ lastLoginAt: new Date() })
  .where(eq(users.authId, authId));
```

**Where to call**: In the Supabase auth callback (`app/auth/callback/route.ts`) or in the middleware after successful session validation. Prefer the auth callback to avoid updating on every single request.

## User Journey

1. **Agent signs up** → profile created with `status: 'active'`, `lastLoginAt: now()`
2. **Agent uses platform normally** → `lastLoginAt` updated on each login
3. **Admin suspends agent** (#114) → `status: 'suspended'`, `suspendedAt: now()`
4. **Suspended agent tries to log in** → sees suspension message
5. **Admin unsuspends** → `status: 'active'`, `suspendedAt: null`
6. **Admin deletes agent** (#115) → `status: 'deleted'`, `deletedAt: now()`, reports orphaned

## Dependencies

- **Depends on**: #2 (Database schema + Supabase setup) — ✅ Completed
- **Depended on by**: #111 (Activity log schema), #112 (Admin user list), #114 (Suspend/unsuspend), #115 (Delete account), #116 (Admin sidebar)

## Component References

No new UI components in this feature (schema-only + auth gate + static pages). UI comes in #112–#116.

## Persona Lens

**Jordan (Established Practitioner)**: If suspended, Jordan needs to know immediately and clearly — no ambiguous error. The message should be professional: "Your account has been suspended" not "Access denied." Jordan's clients would notice if reports stopped flowing; the suspension message should include a path to resolution.

**Taylor (Team Leader)**: Taylor manages 10 agents. If a team member's account is suspended, Taylor needs visibility (comes in #112). For now, the schema must support filtering by status efficiently so the admin user list (#112) can query by `active`, `suspended`, `deleted` without scanning the entire table.

## Learnings

### 2026-03-11
- **Gotcha**: Edge middleware can't import Drizzle/postgres-js. Used Supabase REST API (`fetch` to `/rest/v1/users`) with service role key for status checks — Edge-compatible
- **Decision**: Fail-open on status check errors — if REST call fails, allow access. Locking all users out on transient failure is worse than briefly allowing a suspended user
- **Gotcha**: `/suspended` and `/account-inactive` pages must be excluded from status redirect checks to prevent infinite redirect loops
- **Pattern**: Migration is non-breaking — `DEFAULT 'active'` + `NOT NULL` backfills existing rows automatically. Explicit `UPDATE` in migration is belt-and-suspenders
- **Decision**: `lastLoginAt` set on profile creation + auth callback, not on every middleware hit (too expensive per-request)
