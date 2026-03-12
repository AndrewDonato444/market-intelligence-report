---
feature: Authentication with Supabase
domain: foundation
source: middleware.ts, app/(auth)/sign-in/[[...sign-in]]/page.tsx, app/(auth)/sign-up/[[...sign-up]]/page.tsx, app/(auth)/layout.tsx, app/auth/callback/route.ts, app/auth/verified/page.tsx
tests:
  - __tests__/auth/auth.test.tsx
  - __tests__/auth/email-confirmation.test.ts
components:
  - AuthLayout
  - SignInPage
  - SignUpPage
  - BrandPanel
  - MobileBrandHeader
  - SizzlePanel
  - MobileSizzleHeader
  - ConfirmationSent
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

---

## Feature: Auth Pages Visual Redesign

The sign-in and sign-up pages need to feel like a premium product from the first interaction. Currently both are plain centered forms on a white/gray background with no visual differentiation and no value proposition. The redesign makes each page feel intentional and distinct while communicating the product's premium positioning.

### Design Strategy

**Sign-In**: Clean, efficient, dark — returning users want to get in fast. Navy (`color-primary`) left panel with brand presence, white right panel with form. Minimal friction.

**Sign-Up**: Aspirational, gold-accented — new users need to feel the value. Navy left panel with a "sizzle reel" of what's coming (report preview, key stats, feature highlights). Gold CTA button instead of navy. The sign-up call-to-action must be unmissable.

**Shared Layout**: Split-screen (two-column) on desktop. Left panel is the brand/sizzle panel (dark navy background). Right panel is the form. On mobile, the left panel collapses to a compact brand header.

### Scenario: Sign-in page has split-screen layout with brand panel
Given a user navigates to /sign-in
Then they see a two-column layout on desktop (≥768px)
And the left column has a navy (`color-primary`) background
And the left column shows the MSA logo/wordmark, tagline "Luxury Market Intelligence", and a subtle gold accent line
And the right column has a white (`color-surface`) background with the sign-in form
And the form has a "Welcome back" heading (serif font)
And the form has labeled email and password inputs with visible labels (not just placeholders)
And the submit button is navy (`color-primary`) with text "Sign In"
And below the form is a prominent sign-up callout: "New to Modern Signal Advisory?" with a gold-accented "Create Account" link

### Scenario: Sign-up page has split-screen layout with sizzle panel
Given a user navigates to /sign-up
Then they see a two-column layout on desktop (≥768px)
And the left column has a navy (`color-primary`) background
And the left column shows a "sizzle" preview of the product:
  - Brand label: "MODERN SIGNAL ADVISORY" (uppercase, tracking-wide, accent color)
  - Heading: "Walk into the room as the advisor who brought the research." (serif, text-inverse)
  - Subtext: "AI-powered intelligence reports grounded in real transaction data — branded to you, ready in under two minutes."
  - 3 feature highlight cards (semi-transparent white bg, `bg-white/[0.07]`):
    1. "31 Market Indicators" — "Institutional-grade analysis across every dimension of your luxury market"
    2. "8 Buyer Personas" — "Tailored intelligence lenses for every luxury client type you advise"
    3. "Your Name on the Cover" — "A designed publication branded to you — ready to hand to your most important clients"
  - Social proof: "Trusted by luxury agents at Sotheby's, Douglas Elliman, Compass, and The Agency."
And the right column has a white (`color-surface`) background with the sign-up form
And the form has a "Start Your Intelligence Edge" heading (serif font)
And the form has labeled email and password inputs with visible labels
And the submit button is gold (`color-accent`) with navy text "Create Account" — visually distinct from sign-in's navy button
And below the form: "Already have an account?" with "Sign In" link

### Scenario: Sign-up CTA is visually prominent and distinct from sign-in
Given a user is viewing either auth page
Then the sign-up action uses gold (`color-accent`) for its primary CTA (button or link)
And the sign-in action uses navy (`color-primary`) for its primary CTA
And the visual hierarchy makes it immediately clear which page is for new users vs returning users

### Scenario: Auth pages are responsive on mobile
Given a user views either auth page on a screen < 768px
Then the layout is single-column
And the left brand/sizzle panel collapses to a compact header:
  - MSA wordmark + gold accent line
  - On sign-up: a single-line value prop ("Market intelligence for luxury agents")
And the form takes the full width below
And the gold/navy button distinction is preserved

### Scenario: Sign-up sizzle panel communicates product value
Given a new user lands on /sign-up
Then the sizzle panel answers "Why should I sign up?" without scrolling
And the content is static (no API calls, no dynamic data)
And the feature highlights use the agent's vocabulary (not developer terms)
And the panel establishes trust: professional typography, navy + gold palette, clean layout

### Scenario: Form inputs have proper labels and focus states
Given a user is on either auth page
Then each input has a visible label above it (not just placeholder text)
And inputs have a `color-border` default border
And focused inputs have a `color-border-strong` ring
And the overall form feels polished and intentional (consistent spacing, proper alignment)

---

## UI Mockup

### Sign-In (Desktop ≥768px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─ Left Panel (bg: primary, 45%) ────────┐ ┌─ Right Panel (bg: surface) ─┐│
│  │                                         │ │                             ││
│  │                                         │ │                             ││
│  │                                         │ │                             ││
│  │     MODERN SIGNAL ADVISORY              │ │   Welcome back              ││
│  │     (font: serif, text: 2xl,            │ │   (font: serif, text: 2xl,  ││
│  │      color: text-inverse, bold)         │ │    color: primary, bold)    ││
│  │                                         │ │                             ││
│  │     Luxury Market Intelligence          │ │   Email                     ││
│  │     (font: sans, text: sm,              │ │   ┌─────────────────────┐   ││
│  │      color: text-inverse, opacity 70%)  │ │   │ you@email.com       │   ││
│  │                                         │ │   └─────────────────────┘   ││
│  │     ━━━━━━━━━ (color: accent, w: 48px)  │ │                             ││
│  │                                         │ │   Password                  ││
│  │                                         │ │   ┌─────────────────────┐   ││
│  │                                         │ │   │ ••••••••            │   ││
│  │                                         │ │   └─────────────────────┘   ││
│  │                                         │ │                             ││
│  │                                         │ │   ┌─────────────────────┐   ││
│  │                                         │ │   │     Sign In         │   ││
│  │                                         │ │   │  (bg: primary,      │   ││
│  │                                         │ │   │   color: inverse)   │   ││
│  │                                         │ │   └─────────────────────┘   ││
│  │                                         │ │                             ││
│  │                                         │ │   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ││
│  │                                         │ │                             ││
│  │                                         │ │   New to Modern Signal      ││
│  │                                         │ │   Advisory?                 ││
│  │                                         │ │   Create Account →          ││
│  │                                         │ │   (color: accent, bold)     ││
│  │                                         │ │                             ││
│  └─────────────────────────────────────────┘ └─────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Sign-Up (Desktop ≥768px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─ Left Panel (bg: primary, 45%) ────────┐ ┌─ Right Panel (bg: surface) ─┐│
│  │                                         │ │                             ││
│  │     MODERN SIGNAL ADVISORY              │ │                             ││
│  │     ━━━━━━━━━ (accent line)             │ │                             ││
│  │                                         │ │   Start Your                ││
│  │     Walk into the room as the          │ │   Intelligence Edge         ││
│  │     advisor who brought the            │ │   (font: serif, text: 2xl,  ││
│  │     research.                          │ │    color: primary, bold)    ││
│  │     (font: serif, text: xl,             │ │                             ││
│  │      color: text-inverse)               │ │   Email                     ││
│  │                                         │ │   ┌─────────────────────┐   ││
│  │  ┌─ Feature Card (bg: white/7%) ─────┐  │ │   │ you@email.com       │   ││
│  │  │  📊 31 Market Indicators          │  │ │   └─────────────────────┘   ││
│  │  │  Institutional-grade analysis     │  │ │                             ││
│  │  │  across every dimension           │  │ │   Password                  ││
│  │  └──────────────────────────────────┘  │ │   ┌─────────────────────┐   ││
│  │                                         │ │   │ ••••••••            │   ││
│  │  ┌─ Feature Card (bg: white/7%) ─────┐  │ │   └─────────────────────┘   ││
│  │  │  👤 8 Buyer Personas              │  │ │   (min 6 characters)        ││
│  │  │  Tailored intelligence lenses     │  │ │                             ││
│  │  │  for every luxury client type     │  │ │   ┌─────────────────────┐   ││
│  │  └──────────────────────────────────┘  │ │   │   Create Account    │   ││
│  │                                         │ │   │  (bg: accent,      │   ││
│  │  ┌─ Feature Card (bg: white/7%) ─────┐  │ │   │   color: primary,   │   ││
│  │  │  📄 Your Name on the Cover        │  │ │   │   font: semibold)   │   ││
│  │  │  A designed publication           │  │ │   └─────────────────────┘   ││
│  │  │  branded to you                   │  │ │                             ││
│  │  └──────────────────────────────────┘  │ │   Already have an account?  ││
│  │                                         │ │   Sign In →                 ││
│  │  Trusted by agents at Sotheby's...     │ │   (color: accent)           ││
│  └─────────────────────────────────────────┘ └─────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px) — Sign-Up Example

```
┌────────────────────────────────┐
│                                │
│  ┌─ Brand Header (bg: primary, │
│  │  compact) ────────────────┐ │
│  │  MODERN SIGNAL ADVISORY   │ │
│  │  ━━━━ (accent)            │ │
│  │  Market intelligence for  │ │
│  │  luxury agents            │ │
│  └───────────────────────────┘ │
│                                │
│  Start Your Intelligence Edge  │
│  (font: serif, text: xl)       │
│                                │
│  Email                         │
│  ┌──────────────────────────┐  │
│  │ you@email.com             │  │
│  └──────────────────────────┘  │
│                                │
│  Password                      │
│  ┌──────────────────────────┐  │
│  │ ••••••••                  │  │
│  └──────────────────────────┘  │
│  (min 6 characters)            │
│                                │
│  ┌──────────────────────────┐  │
│  │    Create Account         │  │
│  │   (bg: accent, gold)      │  │
│  └──────────────────────────┘  │
│                                │
│  Already have an account?      │
│  Sign In →                     │
│                                │
└────────────────────────────────┘
```

---

## User Journey

1. Agent discovers MSA (marketing, referral, search)
2. Lands on landing page or is linked directly to `/sign-up`
3. **Sign-Up page** — sizzle panel sells the value, gold CTA is unmissable
4. Completes sign-up → "Check Your Email" confirmation
5. Confirms email → `/auth/verified` success page
6. **Sign-In page** — clean, efficient, gets them to dashboard fast
7. Authenticated → `/dashboard`

---

## Component References

- AuthLayout: `app/(auth)/layout.tsx` — shared split-screen container
- SignInPage: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- SignUpPage: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

---

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

### Visual Redesign Implementation Notes

- Layout changes are in `app/(auth)/layout.tsx` — becomes a split-screen container
- Left panel content varies by route: pass `variant` prop or use route-aware logic in layout
- Sizzle content is static — no API calls, no dynamic data, pure presentational
- Feature highlight icons can be simple SVG or emoji — no external image dependencies
- Gold CTA on sign-up uses `color-accent` / `color-accent-hover` from tokens
- Mobile breakpoint at `screen-md` (768px) — use Tailwind `md:` prefix
- No new dependencies needed — pure Tailwind + existing design tokens
- Ensure "Check Your Email" confirmation state still looks correct in the new layout

## Learnings
