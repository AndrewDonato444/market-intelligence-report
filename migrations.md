# Database Migrations

This project uses Supabase (Postgres) with raw SQL migration files and Drizzle ORM for type-safe queries.

## ⛔ CRITICAL: Never Use `db:reset` or `supabase db reset`

**`npm run db:reset` / `supabase db reset` destroys ALL local data.** This includes user-created markets, reports, profiles, and any data entered through the app UI. Seed data is restored but everything else is permanently lost.

**To apply a new migration locally, use one of these safe methods:**

```bash
# Option 1: Run the migration SQL directly via Node.js
node -e "
const pg = require('postgres');
const sql = pg('postgresql://postgres:postgres@127.0.0.1:54422/postgres');
const fs = require('fs');
const migration = fs.readFileSync('supabase/migrations/MIGRATION_FILE.sql', 'utf8');
sql.unsafe(migration).then(() => { console.log('Done'); sql.end(); }).catch(e => { console.error(e); sql.end(); });
"

# Option 2: Use Supabase Studio SQL Editor
# Open http://127.0.0.1:54423 → SQL Editor → paste migration SQL → Run

# Option 3: Use supabase migration up (applies unapplied migrations only)
npx supabase migration up --local
```

**The ONLY acceptable use of `db:reset`** is on a brand-new machine with no user data, or when the user explicitly requests a full database wipe.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (`brew install supabase/tap/supabase`)

## Local Development Setup

```bash
# Start local Supabase (Postgres, Auth, Storage, Studio)
npm run db:start

# Your local Supabase is now running:
#   API:     http://localhost:54421
#   Studio:  http://localhost:54423  (visual database browser)
#   DB:      postgresql://postgres:postgres@localhost:54422/postgres
```

Your `.env.local` should point to the local instance (see `.env.local.example` for the default local credentials). **Never develop against production.**

## Day-to-Day Workflow

### Adding a new table or column

```bash
# 1. Create a timestamped migration file
npm run db:new-migration add_analytics_table

# 2. Edit the new file in supabase/migrations/
#    (the CLI prints the path)

# 3. Apply the migration locally (NON-DESTRUCTIVE — preserves existing data)
node -e "
const pg = require('postgres');
const sql = pg('postgresql://postgres:postgres@127.0.0.1:54422/postgres');
const fs = require('fs');
const migration = fs.readFileSync('supabase/migrations/YOUR_MIGRATION_FILE.sql', 'utf8');
sql.unsafe(migration).then(() => { console.log('Migration applied'); sql.end(); }).catch(e => { console.error(e); sql.end(); });
"

# 4. Regenerate TypeScript types
npm run db:gen-types

# 5. Update your Drizzle schema (lib/db/schema.ts) to match
#    and update application code to use the new schema

# 6. Commit migration + types + schema + app code together
git add supabase/migrations/ lib/types/database.ts lib/db/schema.ts
git commit -m "feat: add analytics table"

# 7. Deploy to production
npm run db:push
```

### Modifying an existing column

**Safe changes** (additive — do these freely):
- Adding a nullable column
- Adding a new table
- Adding an index
- Adding a check constraint with a default

**Dangerous changes** (destructive — use the multi-step pattern):
- Dropping a column or table
- Renaming a column
- Changing a column's type
- Removing a NOT NULL default

For dangerous changes, use two migrations:

```sql
-- Migration 1: Add the new column alongside the old one
ALTER TABLE profiles ADD COLUMN display_name TEXT;

-- (deploy code that writes to BOTH old and new columns)
-- (backfill: UPDATE profiles SET display_name = name WHERE display_name IS NULL)

-- Migration 2 (later): Drop the old column
ALTER TABLE profiles DROP COLUMN name;
```

This prevents downtime and data loss.

## Available Commands

| Command | What it does |
|---------|-------------|
| `npm run db:start` | Start local Supabase (Docker) |
| `npm run db:stop` | Stop local Supabase |
| ⛔ `npm run db:reset` | **DESTRUCTIVE — wipes ALL data.** Only for fresh setups or explicit user request |
| `npm run db:push` | Apply pending migrations to production |
| `npm run db:new-migration <name>` | Create a new timestamped migration file |
| `npm run db:gen-types` | Generate TypeScript types from local schema |
| `npm run db:validate` | Full validation: reset + gen types + check for drift |
| `npm run db:studio` | Open local Studio (visual DB browser) |

## Generated Types

After any migration change, run `npm run db:gen-types`. This writes `lib/types/database.ts` with types generated directly from the database schema. Import them as:

```typescript
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
```

### Drizzle ORM Types

We also maintain Drizzle schema types in `lib/db/schema.ts`. These are used for queries via the Drizzle query builder. After migration changes, update `lib/db/schema.ts` to match and re-export types from `lib/db/index.ts`:

```typescript
import type { User, NewUser, Market, NewMarket } from '@/lib/db'
```

Both type systems should stay in sync. Supabase-generated types are the source of truth for the database shape; Drizzle types are the interface for application code.

## Seed Data

`supabase/seed.sql` contains realistic test data that runs automatically after `npm run db:reset`. Edit it to add data for new features.

## Migration File Naming

New migrations use timestamp prefixes generated by `supabase migration new`. Example: `20260303120000_add_analytics_table.sql`. Always use `npm run db:new-migration` — never create migration files manually.

## Production Safety Checklist

Before running `npm run db:push`:

- [ ] Migration SQL has been applied locally (via node script or Studio) and works correctly
- [ ] `npm run db:gen-types` produces no unexpected changes
- [ ] `lib/db/schema.ts` matches the migration changes
- [ ] Application code works with the new schema locally
- [ ] Tests pass
- [ ] Destructive changes use the multi-step pattern (see above)
- [ ] Migration uses `IF NOT EXISTS` / `IF EXISTS` where appropriate
