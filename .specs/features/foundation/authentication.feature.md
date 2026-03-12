---
feature: Authentication with Supabase
domain: foundation
source: middleware.ts, app/(auth)/sign-in/[[...sign-in]]/page.tsx, app/(auth)/sign-up/[[...sign-up]]/page.tsx, app/auth/callback/route.ts, app/auth/verified/page.tsx
tests:
  - __tests__/auth/auth.test.tsx
  - __tests__/auth/email-confirmation.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-12
---

# Authentication with Supabase

**Source Files**: `middleware.ts`, `app/(auth)/`, `app/(protected)/`, `lib/supabase/`, `app/auth/verified/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Rising Star (quick signup), Legacy Agent (simple flow)

## Feature: Authentication

Supabase Auth-based authentication that protects all app routes. Agents sign up, sign in, and access the protected application. Public routes include landing page and auth pages only.

### Scenario: Unauthenticated user is redirected to sign-in
Given a user is not signed in
When they navigate to a protected route (e.g., /dashboard)
Then they are redirected to /sign-in

### Scenario: User can sign up (email confirmation enabled)
Given a user is on the sign-up page
When they complete the sign-up form with email and password
Then their account is created via Supabase Auth
And a confirmation email is sent with a link to /auth/callback
And they see a "Check Your Email" message with the email they used
And they can choose to use a different email

### Scenario: User confirms email via callback
Given a user has received a confirmation email
When they click the confirmation link
Then the /auth/callback route exchanges the code for a session
And they are redirected to /auth/verified

### Scenario: Email verified page shows success and sign-in link
Given a user has just confirmed their email
When they land on /auth/verified
Then they see a success checkmark and "Email Verified" heading
And they see a message confirming their email has been verified
And they see a "Sign In" button linking to /sign-in

### Scenario: Email confirmation fails
Given a user clicks an expired or invalid confirmation link
When the /auth/callback route cannot exchange the code
Then they are redirected to /sign-in with an error message

### Scenario: User can sign up (email confirmation disabled, dev mode)
Given email confirmation is disabled in Supabase settings
And a user is on the sign-up page
When they complete the sign-up form with email and password
Then their account is created and a session is returned immediately
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
- Email confirmation: `signUp()` passes `emailRedirectTo` pointing to `/auth/callback`
- Auth callback: `app/auth/callback/route.ts` exchanges code for session via `exchangeCodeForSession()`
- Signup detects confirmation-needed when `data.session` is null (user exists but no session)
- Sign-in page shows error banner when redirected with `?error=confirmation_failed`
- Email confirmation callback redirects to `/auth/verified` (not `/dashboard`) so user sees a clear success message
- `/auth/verified` is a public route (allowed in middleware without auth) since the user isn't signed in yet
- For non-email auth flows (e.g. OAuth), callback respects the `next` query param (defaults to `/dashboard`)
