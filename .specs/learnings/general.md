# General Learnings

Patterns that don't fit other categories.

---

## Code Style

<!-- Conventions, naming, organization -->

### 2026-03-09
- **Gotcha**: Next.js App Router route groups with parentheses (e.g., `app/(admin)/`) do NOT create URL segments. `app/(admin)/eval/page.tsx` resolves to `/eval`, NOT `/admin/eval`. This conflicts with other route groups at the same level. Use a real directory (`app/admin/`) when you need the URL segment.
- **Pattern**: Admin routes live at `app/admin/` (real directory) with their own `layout.tsx` that swaps `AdminSidebar` for `Sidebar` while reusing `TopNav` and `PageShell`.

---

## Git Workflow

<!-- Branching, commits, PRs -->

_No learnings yet._

---

## Tooling

<!-- Build tools, linting, formatting -->

- **⛔ NEVER run `supabase db reset` or `npm run db:reset`** — it destroys ALL local data (user-created markets, reports, profiles, everything). This has caused data loss twice. To apply a new migration locally:
  1. **Preferred**: `node -e "const pg = require('postgres'); const sql = pg('postgresql://postgres:postgres@127.0.0.1:54422/postgres'); const fs = require('fs'); sql.unsafe(fs.readFileSync('supabase/migrations/FILE.sql','utf8')).then(()=>{console.log('Done');sql.end()}).catch(e=>{console.error(e);sql.end()})"`
  2. **Alternative**: Supabase Studio (`http://127.0.0.1:54423` → SQL Editor → paste migration SQL → Run)
  3. **Alternative**: `npx supabase migration up --local` (applies only unapplied migrations)
  4. No `psql` is installed locally.
  - See `migrations.md` for full policy. The ONLY acceptable use of `db:reset` is on a brand-new machine with no user data, or when the user explicitly asks for a full wipe.
- **Split environment**: Auth runs on **remote** Supabase (`NEXT_PUBLIC_SUPABASE_URL`), database queries run on **local** Docker (`DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54422/postgres`). This means:
  - `supabase db push --linked` applies migrations to **remote only**
  - Local DB needs migrations applied separately (via node script or Studio)
  - Auth user IDs come from the remote `auth.users` table, but the app's `users` table is local — new users need a profile row inserted locally matching their remote auth ID
  - User's remote auth ID: `e12665f3-1dce-4a2b-a095-8a085c673d2d` (adonatony@gmail.com, role: admin)
- Local Supabase ports: 54422 (Postgres), 54323 (Studio)

---

## Debugging

<!-- Common issues, debugging techniques -->

_No learnings yet._

---

## Other

<!-- Miscellaneous patterns -->

### 2026-03-11 — User Status Schema (#110)
- **Pattern**: Schema migration with safe defaults — add columns with `DEFAULT 'active'` and `NOT NULL` so existing rows get backfilled automatically. No need for a separate backfill step (though explicit `UPDATE` in migration is good for safety). The migration is non-breaking: all new columns are either defaulted or nullable.
- **Pattern**: User account lifecycle as a service module: `lib/services/user-status.ts` groups all status-related operations (suspend, unsuspend, softDelete, updateLastLogin, getUsersByStatus, getUserStatus). Each function operates on a single user and returns the updated row. Status changes always update `updatedAt` alongside the status-specific timestamp.
- **Decision**: `lastLoginAt` is set on profile creation (in `upsertProfile`) and updated via `updateLastLogin` called from the auth callback. Not updated on every middleware hit (too expensive). This gives accurate "last login" without the per-request overhead.

### 2026-03-11 — Step 4: Fetch-driven step with selection order
- **Pattern**: For step components with real API data, fetch on mount via `useCallback` + `useEffect([], [])`. Store loading/error/data in separate state variables. On error, set `onValidationChange(true)` to allow skipping rather than blocking the wizard.
- **Pattern**: Selection order via array position: `selectedIds.indexOf(id) + 1` gives the 1-based position. `filter()` on deselect automatically renumbers since it preserves relative order of remaining elements — no need for a separate order counter or map.
- **Decision**: Preview panel detail is fetched lazily per-click (`/api/buyer-personas/[slug]`) rather than pre-fetching all 8 persona details. This keeps the initial page load to one lightweight list call.

### 2026-03-11 — Step 3: Smart defaults and multi-select validation
- **Pattern**: Smart defaults via static state-to-selections mapping (`STATE_SEGMENT_DEFAULTS`, `STATE_PROPERTY_DEFAULTS`) with `_default` fallback key. Compute once with `useMemo` keyed on `marketData`, use result as `useState` initializer. The "popular" set is separate from selection state — tracked via `useMemo(() => new Set(defaults))` so badges persist after deselection.
- **Pattern**: For multi-select step validation (at least one of N categories), derive `isValid` directly from state (`segments.length > 0 || propertyTypes.length > 0`). Two `useEffect` hooks: one reports `onValidationChange(isValid)`, one calls `onStepComplete(data)` only when valid. This matches the Step 2 pattern but adapted for toggle-based (not radio-based) selection.
- **Pattern**: Empty state prompt only shows when `!isValid && defaultSegments.length === 0` — this prevents the prompt from flashing when smart defaults pre-select cards on mount.

### 2026-03-10
- **Pattern**: To add a new agent to the v2 pipeline: (1) create agent file with `AgentDefinition` export, (2) import and add to `ALL_AGENTS` array in `pipeline-executor.ts`, (3) add a `SectionRegistryEntry` to `SECTION_REGISTRY_V2` in `schema.ts`, (4) add the agent name to the section-grouping loop in `executePipeline()`. All 4 steps are required or the agent won't run / its sections won't be saved.
- **Pattern**: When adding a step to a wizard (e.g., inserting "Personas" between "Sections" and "Review"), all step index references must shift. The `STEPS` array is the single source of truth — update it, then adjust `step === N` conditionals for the new numbering. The `StepIndicator` component automatically adapts to any array length.
- **Decision**: Wizard state for personas (selectedPersonaIds, previewPersonaSlug, personas array) lives in the top-level ReportWizard component alongside market/sections state. Fetch happens on mount (useEffect) for pre-fetching, not when the step is reached. This ensures no loading spinner on step transition.
