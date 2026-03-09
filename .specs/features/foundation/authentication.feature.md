---
feature: Authentication with Supabase
domain: foundation
source: middleware.ts, app/(auth)/sign-in/[[...sign-in]]/page.tsx, app/(auth)/sign-up/[[...sign-up]]/page.tsx
tests:
  - __tests__/auth/auth.test.tsx
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Authentication with Supabase

**Source Files**: `middleware.ts`, `app/(auth)/`, `app/(protected)/`, `lib/supabase/`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star (quick signup), Legacy Agent (simple flow)

## Feature: Authentication

Supabase Auth-based authentication that protects all app routes. Agents sign up, sign in, and access the protected application. Public routes include landing page and auth pages only.

### Scenario: Unauthenticated user is redirected to sign-in
Given a user is not signed in
When they navigate to a protected route (e.g., /dashboard)
Then they are redirected to /sign-in

### Scenario: User can sign up
Given a user is on the sign-up page
When they complete the sign-up form with email and password
Then their account is created via Supabase Auth
And they are redirected to /dashboard

### Scenario: User can sign in
Given a user has an account
When they enter valid credentials on /sign-in
Then they are authenticated via Supabase Auth
And redirected to /dashboard

### Scenario: Authenticated user can access protected routes
Given a user is signed in
When they navigate to any protected route
Then the page renders normally
And the user's session is active

### Scenario: User can sign out
Given a user is signed in
When they click sign out
Then their session is terminated
And they are redirected to /sign-in

### Scenario: Public routes are accessible without auth
Given a user is not signed in
When they navigate to / (landing page)
Then the page renders without redirect

## Technical Notes

- Supabase middleware refreshes sessions and protects routes
- Route groups: (auth) for sign-in/sign-up, (protected) for app routes
- Server client: `lib/supabase/server.ts` for API routes and server components
- Browser client: `lib/supabase/client.ts` for client-side auth operations
- Auth helper: `lib/supabase/auth.ts` exports `getAuthUserId()` and `getAuthUser()`
- User sync to database uses `auth_id` column (Supabase user UUID)
