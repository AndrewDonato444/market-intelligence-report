---
feature: Authentication with Clerk
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

# Authentication with Clerk

**Source Files**: `middleware.ts`, `app/(auth)/`, `app/(protected)/`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star (quick signup), Legacy Agent (simple flow)

## Feature: Authentication

Clerk-based authentication that protects all app routes. Agents sign up, sign in, and access the protected application. Public routes include landing page and auth pages only.

### Scenario: Unauthenticated user is redirected to sign-in
Given a user is not signed in
When they navigate to a protected route (e.g., /dashboard)
Then they are redirected to /sign-in

### Scenario: User can sign up
Given a user is on the sign-up page
When they complete the Clerk sign-up flow
Then their account is created
And they are redirected to /dashboard

### Scenario: User can sign in
Given a user has an account
When they enter valid credentials on /sign-in
Then they are authenticated
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

- Clerk middleware protects all routes except public ones
- Route groups: (auth) for sign-in/sign-up, (protected) for app routes
- ClerkProvider wraps the app in layout.tsx
- User sync to database happens on first sign-in (webhook or on-demand)
