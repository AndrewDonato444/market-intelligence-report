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

- **NEVER run `supabase db reset`** — it destroys all local data. To apply a new migration locally, use `node -e` with the `postgres` npm package to run SQL directly, or direct the user to Supabase Studio (`http://localhost:54323` → SQL Editor). No `psql` is installed locally.
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

_No learnings yet._
