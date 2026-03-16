---
feature: ToS Acceptance on Signup
domain: security
source: app/(auth)/sign-up/[[...sign-up]]/page.tsx
tests:
  - __tests__/features/security/tos-acceptance-signup.test.tsx
components:
  - TosCheckbox
personas:
  - rising-star-agent
  - anti-persona-report
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# ToS Acceptance on Signup

**Source File**: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
**Schema File**: `lib/db/schema.ts` (users table)
**Profile Service**: `lib/services/profile.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/rising-star-agent.md`

## Feature: Terms of Service Acceptance at Account Creation

Luxury real estate professionals creating an account must accept the Terms of Service before their account is created. This is a legal compliance requirement for public release. The acceptance is recorded with a timestamp for audit purposes.

The experience should feel professional and trustworthy — not like a legal roadblock. These are advisors who handle million-dollar transactions; a clean, confident ToS flow reinforces that the platform takes compliance seriously.

### Scenario: Successful signup with ToS accepted

```gherkin
Given I am on the signup page
And I have entered a valid email and password
When I check the "I agree to the Terms of Service" checkbox
And I click "Create Account"
Then my account is created with a tos_accepted_at timestamp
And I see the "Check Your Email" confirmation screen
```

### Scenario: Signup blocked without ToS acceptance

```gherkin
Given I am on the signup page
And I have entered a valid email and password
But I have NOT checked the Terms of Service checkbox
When I click "Create Account"
Then account creation does not proceed
And I see a message: "Please accept the Terms of Service to continue"
And the checkbox is highlighted
```

### Scenario: ToS checkbox is unchecked by default

```gherkin
Given I navigate to the signup page
Then the Terms of Service checkbox is unchecked
And the "Create Account" button is visible but will validate on submit
```

### Scenario: ToS link opens Terms of Service page

```gherkin
Given I am on the signup page
When I click the "Terms of Service" link text within the checkbox label
Then the Terms of Service page opens in a new tab
And I remain on the signup page with my form data preserved
```

### Scenario: ToS acceptance timestamp persisted to database

```gherkin
Given I complete signup with ToS accepted
When my user profile is created in the database
Then the tos_accepted_at column is set to the current UTC timestamp
And this timestamp is queryable for compliance audits
```

### Scenario: Existing users without ToS timestamp (migration)

```gherkin
Given a user created before ToS was required
Then their tos_accepted_at column is NULL
And they are NOT blocked from using the platform
And admin can see which users have/haven't accepted ToS
```

## User Journey

1. Agent lands on /sign-up (from landing page CTA or direct link)
2. Fills in email and password
3. **Checks ToS checkbox** (this feature)
4. Clicks "Create Account"
5. Sees "Check Your Email" confirmation
6. Confirms email -> redirected to /auth/verified

## UI Mockup

```
┌─ Sign Up Form (bg: surface, max-w: sm) ────────────────────┐
│                                                              │
│  Start Your Intelligence Edge                                │
│  (font: serif, text: 2xl, weight: bold, color: primary)     │
│                                                              │
│  Commission your first report in under two minutes           │
│  (font: sans, text: sm, color: text-secondary)               │
│                                                              │
│  ┌─ Email ─────────────────────────────────────────────┐    │
│  │  you@example.com                                     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ Password ──────────────────────────────────────────┐    │
│  │  Create a password                            [eye]  │    │
│  └──────────────────────────────────────────────────────┘    │
│  Minimum 6 characters (text: xs, color: text-tertiary)       │
│                                                              │
│  ┌─ ToS Checkbox (spacing-4 above button) ──────────────┐   │
│  │  [ ] I agree to the Terms of Service                  │   │
│  │      ^ checkbox       ^ "Terms of Service" is a link  │   │
│  │        (radius: sm)     (color: accent, opens new tab) │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Error (if unchecked on submit) ─────────────────────┐   │
│  │  Please accept the Terms of Service to continue       │   │
│  │  (text: sm, color: error, bg: red-50, radius: sm)     │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  [ Create Account ]                                          │
│  (bg: accent, color: primary, radius: sm, font: semibold)   │
│                                                              │
│  ─────────────── (border-t, color: border) ───────────────   │
│  Already have an account? Sign In (color: accent)            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Checkbox Detail

```
┌─ ToS Row ────────────────────────────────────────────────────┐
│                                                               │
│  [checkbox]  I agree to the Terms of Service                  │
│   ^                              ^                            │
│   4px radius                     Link: color-accent           │
│   border: color-border           hover: color-accent-hover    │
│   checked: bg-accent             opens /terms in new tab      │
│   w: 16px, h: 16px              (target="_blank")             │
│                                                               │
│   Label text: font-sans, text-sm, color: text-secondary      │
│   Gap between checkbox and label: spacing-2                   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Technical Implementation Notes

### Database Change

Add tos_accepted_at column to the users table:

```typescript
// In lib/db/schema.ts — users table
tosAcceptedAt: timestamp("tos_accepted_at", { withTimezone: true }),
```

- **Nullable** — existing users will have NULL (they are NOT blocked)
- **No default** — only set explicitly when user accepts ToS during signup
- Requires a Drizzle migration

### Frontend Changes (sign-up page)

1. Add tosAccepted boolean state (default: false)
2. Add checkbox + label between password field and submit button
3. Validate on form submit — if not checked, show error and prevent supabase.auth.signUp()
4. "Terms of Service" text in label is a link to /terms (new tab)
5. No change to the Supabase signUp call itself — ToS acceptance is stored when the user profile is created

### Profile Service Change

Update ensureUserProfile() in lib/services/profile.ts to accept and persist tosAcceptedAt:

- The signup page passes tosAcceptedAt to Supabase auth user metadata during signUp()
- Since ensureUserProfile runs on first authenticated request (in the protected layout), the ToS timestamp needs to be conveyed from the signup page to the profile creation step
- **Recommended approach**: Store tosAcceptedAt in Supabase auth user metadata during signUp(), then read it in ensureUserProfile():

```typescript
// In signup page
supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: { tos_accepted_at: new Date().toISOString() },
  },
});

// In ensureUserProfile — read from auth metadata
const tosAcceptedAt = authUser.user_metadata?.tos_accepted_at;
```

### ToS Page

A /terms page needs to exist (even as a placeholder) for the link to work. This can be a static page or a redirect to an external legal document URL. The content of the ToS itself is outside the scope of this feature — the feature is about the acceptance mechanism, not the legal text.

### Admin Visibility

- The tos_accepted_at column should be visible in the admin user detail page (feature #113, already implemented)
- Admin can query/filter users by ToS acceptance status for compliance audits

## Component References

- Password Input: existing components/ui/password-input.tsx
- TosCheckbox: new inline component (not a separate file — it's a checkbox + label, ~15 lines)

## Design Token Usage

| Element | Token |
|---------|-------|
| Checkbox border | color-border |
| Checkbox checked fill | color-accent |
| Checkbox radius | radius-sm |
| Label text | font-sans, text-sm, color-text-secondary |
| Link text | color-accent -> color-accent-hover on hover |
| Error message bg | red-50 (semantic, matches existing error pattern) |
| Error text | color-error, text-sm |
| Spacing above checkbox | spacing-4 |
| Gap: checkbox to label | spacing-2 |

## Persona Revision Notes

**Rising Star (Alex)**: This flow must feel professional and fast. Alex is impatient with unnecessary friction but understands compliance. The single checkbox with a clear link respects their time — no multi-page legal scroll. The error message is helpful, not scolding: "Please accept the Terms of Service to continue" (not "You must agree to the Terms").

**Anti-persona check**: The Academic Analyst would want a full legal document inline with scroll-to-accept. We deliberately avoid this — one checkbox, one link, done.

## Learnings

### 2026-03-16
- **Pattern**: Supabase `user_metadata` is the ideal bridge for conveying signup-time data (like ToS acceptance) to the profile creation step that runs on first authenticated request. No extra API call needed.
- **Decision**: ToS checkbox validation happens client-side before `signUp()` is called — prevents account creation without acceptance. The `tos_accepted_at` timestamp is set at submission time for audit accuracy.
- **Decision**: The `/terms` page is a real page (not a redirect) to avoid external dependency. Content is minimal but covers the legal bases for v1.
