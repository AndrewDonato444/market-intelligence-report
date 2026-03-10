---
feature: Admin Dashboard
domain: admin
source: app/admin/layout.tsx, app/admin/eval/page.tsx, components/layout/admin-sidebar.tsx, lib/supabase/admin-auth.ts
tests:
  - __tests__/admin/admin-auth.test.ts
  - __tests__/admin/admin-sidebar.test.tsx
  - __tests__/admin/admin-eval-page.test.tsx
components:
  - AdminSidebar
personas:
  - internal-developer
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Admin Dashboard

**Source Files**: `app/admin/layout.tsx`, `app/admin/eval/page.tsx`, `components/layout/admin-sidebar.tsx`, `lib/supabase/admin-auth.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Supabase Auth (`lib/supabase/auth.ts`), Profile Service (`lib/services/profile.ts`), DB Schema (`lib/db/schema.ts`), Pipeline Eval Suite (`.specs/features/agent-pipeline/pipeline-eval-suite.feature.md`)

---

## Feature: Admin Dashboard

A separate route group (`/admin/*`) with its own layout and sidebar, accessible only to users with `role = 'admin'` in the `users` table. The admin dashboard is where internal developer tools live (starting with the eval suite). It is completely separated from the user-facing app — no admin links appear in the user sidebar, and no user-facing links appear in the admin sidebar (except "Back to App").

**Who it's for**: Internal developers and team members who need to run eval suites, monitor pipeline quality, and access developer tools. These are NOT the luxury real estate agent personas — admins are technical users who understand the pipeline internals.

**What problem it solves**: The eval suite was temporarily placed in the user-facing sidebar at `/eval`. This is a developer tool that doesn't belong in the client-facing product. We need a clean separation between the user app and admin tools, with proper role-based access control.

---

## Scenario: Admin user accesses admin dashboard

Given a user with `role = 'admin'` in the `users` table is signed in
When they navigate to `/admin/eval`
Then they see the admin layout with the AdminSidebar on the left
And the AdminSidebar shows "Back to App" and "Eval Suite" nav items
And the EvalDashboard component renders in the main content area
And the page title/breadcrumb reflects the admin context

## Scenario: Non-admin user is rejected from admin routes

Given a user with `role = 'user'` (the default) in the `users` table is signed in
When they navigate to `/admin/eval`
Then they are redirected to `/dashboard`
And they do NOT see the admin layout or sidebar

## Scenario: Unauthenticated user is rejected from admin routes

Given no user is signed in
When they navigate to `/admin/eval`
Then they are redirected to `/sign-in` by the existing middleware
And they never reach the admin auth check

## Scenario: Admin sidebar navigation

Given an admin user is on the admin dashboard
When they look at the AdminSidebar
Then they see exactly two nav items:
  - "Back to App" with a left-arrow icon, linking to `/dashboard`
  - "Eval Suite" with a beaker icon, linking to `/admin/eval`
And the currently active page is highlighted (same styling as user sidebar)
And the sidebar footer shows "Modern Signal Advisory" (same as user sidebar)

## Scenario: "Back to App" returns admin to user-facing app

Given an admin user is on `/admin/eval`
When they click "Back to App" in the admin sidebar
Then they are navigated to `/dashboard`
And they see the regular user layout with the user sidebar

## Scenario: User sidebar does not show admin links

Given any user (admin or regular) is on the user-facing app (e.g., `/dashboard`)
When they look at the user sidebar
Then they see only: Dashboard, Reports, Markets, Settings
And there is NO "Eval" or "Admin" link visible

## Scenario: Database role column defaults to 'user'

Given a new user signs up
When their record is created in the `users` table
Then the `role` column defaults to `'user'`
And they have no access to admin routes

---

## User Journey

1. Admin signs in via normal `/sign-in` flow
2. Admin navigates to `/admin/eval` (direct URL or bookmarked)
3. **Admin Dashboard** — runs eval suite, reviews results
4. Clicks "Back to App" to return to `/dashboard`

---

## Data Model

### Migration: `user_role` enum + column

```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'user';
```

### Drizzle Schema Addition

```typescript
// In lib/db/schema.ts
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

// Add to users table definition:
role: userRoleEnum("role").notNull().default("user"),
```

---

## Architecture

### Route Directory: `admin/`

Note: We use `app/admin/` (real directory) instead of `app/(admin)/` (route group) because parenthesized route groups don't create URL segments, which caused path conflicts with `(protected)`.

```
app/
├── (auth)/           # sign-in, sign-up (existing)
├── (protected)/      # user-facing app (existing)
│   ├── dashboard/
│   ├── reports/
│   ├── markets/
│   └── settings/
└── admin/            # NEW — admin tools (real directory → /admin/*)
    ├── layout.tsx    # AdminSidebar + TopNav + PageShell
    └── eval/
        └── page.tsx  # requireAdmin() + <EvalDashboard />
```

### Auth Helper: `requireAdmin()`

```typescript
// lib/supabase/admin-auth.ts
export async function requireAdmin(): Promise<string | null>
```

1. Calls `getAuthUserId()` — returns null if not authenticated
2. Calls `getProfile(authId)` — gets user record from DB
3. Checks `profile.role === 'admin'` — returns authId if admin, null otherwise

### Admin Layout

Same structure as `(protected)/layout.tsx`:
- `TopNav` (reused from user layout)
- `AdminSidebar` (new component, replaces `Sidebar`)
- `PageShell` (reused from user layout)

---

## UI Mockup

### Admin Layout with Eval Suite

```
┌─────────────────────────────────────────────────────────────┐
│  [TopNav] Market Intelligence Report    [user avatar ▾]     │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  ← Back    │  Pipeline Eval Suite                          │
│  to App    │                                                │
│            │  ┌─ Summary ─────────────────────────────────┐│
│  ● Eval    │  │ Test Cases: 24  Pass Rate: —  Avg: —      ││
│    Suite   │  │ [Run All] [Export]                         ││
│            │  └───────────────────────────────────────────┘│
│            │                                                │
│            │  ┌─ Test Cases Table ────────────────────────┐│
│            │  │ ID │ Description │ Agent │ Cat │ Sc │ Act ││
│            │  │ ...                                       ││
│            │  │ (24 rows — same as existing eval UI)      ││
│            │  └───────────────────────────────────────────┘│
│            │                                                │
│ ────────── │                                                │
│ Modern     │                                                │
│ Signal     │                                                │
│ Advisory   │                                                │
└────────────┴────────────────────────────────────────────────┘
```

### AdminSidebar Detail

```
┌────────────────┐
│                │
│  ← Back to App │  (color-text-secondary, hover: color-text)
│                │  (link to /dashboard)
│                │
│  ◆ Eval Suite  │  (color-primary when active, beaker icon)
│                │  (link to /admin/eval)
│                │
│                │
│  (future:      │
│   more admin   │
│   tools here)  │
│                │
│ ────────────── │
│ Modern Signal  │  (text-xs, color-text-tertiary)
│ Advisory       │
└────────────────┘
```

Tokens used:
- Sidebar: `bg: color-surface`, `border-r: color-border`, `w-60`
- Nav items: `font-sans`, `text-sm`, `radius-sm`, `spacing-2`/`spacing-3`
- Active state: `bg: color-primary-light`, `text: color-primary`, `font-medium`
- Hover state: `bg: color-primary-light`, `text: color-text`
- Footer: `text-xs`, `color-text-tertiary`, `border-t: color-border`

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/XXXXXX_add_user_role.sql` | Add `user_role` enum and `role` column |
| `lib/supabase/admin-auth.ts` | `requireAdmin()` helper |
| `app/admin/layout.tsx` | Admin layout with AdminSidebar |
| `components/layout/admin-sidebar.tsx` | Admin-specific sidebar |
| `app/admin/eval/page.tsx` | Admin eval page (moved from protected) |

## Files to Modify

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add `userRoleEnum` and `role` column to users |
| `components/layout/sidebar.tsx` | Remove "Eval" nav item and beaker icon |
| `components/layout/index.ts` | Export `AdminSidebar` |

## Files to Delete

| File | Reason |
|------|--------|
| `app/(protected)/eval/page.tsx` | Moved to `app/admin/eval/` |

## No Changes Needed

- `lib/eval/*` — all eval backend code stays
- `components/eval/*` — all eval UI components stay
- `app/api/eval/*` — API routes stay (auth check at page level, API uses `getAuthUserId()`)
- `__tests__/eval/*` — all 105 tests stay
- `lib/supabase/middleware.ts` — no changes needed (middleware already protects non-public routes)

---

## Component References

| Component | Status | File |
|-----------|--------|------|
| AdminSidebar | New (to be created) | `components/layout/admin-sidebar.tsx` |
| TopNav | Existing (reused) | `components/layout/top-nav.tsx` |
| PageShell | Existing (reused) | `components/layout/page-shell.tsx` |
| Sidebar | Existing (modified — remove Eval) | `components/layout/sidebar.tsx` |

---

## Design Tokens Used

- `color-surface` — Sidebar background
- `color-border` — Sidebar border, footer divider
- `color-primary-light` — Active/hover nav item background
- `color-primary` — Active nav item text
- `color-accent` — Active nav item icon
- `color-text` — Hover nav item text
- `color-text-secondary` — Inactive nav item text
- `color-text-tertiary` — Footer text
- `font-sans` — Nav labels
- `text-sm` — Nav item font size
- `text-xs` — Footer font size
- `radius-sm` — Nav item border radius
- `spacing-1`, `spacing-2`, `spacing-3` — Padding and gaps
- `duration-default` — Hover transition

---

## Learnings

- **Route groups vs real directories**: `app/(admin)/` (parenthesized route group) doesn't create a URL segment, so `app/(admin)/eval/page.tsx` resolves to `/eval` — conflicting with `(protected)`. Use `app/admin/` (real directory) to get `/admin/eval`.
- **Split environment**: Auth runs on remote Supabase, DB queries run on local Docker. New users need a profile row manually inserted in the local DB matching their remote auth ID.
- **Never `supabase db reset`**: It destroys all local data. Apply migrations via `node -e` with the `postgres` npm package or Supabase Studio SQL Editor.
