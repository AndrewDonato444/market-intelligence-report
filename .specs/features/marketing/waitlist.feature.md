---
feature: Waitlist Page
domain: marketing
source: app/waitlist/page.tsx
tests:
  - __tests__/app/waitlist.test.tsx
components:
  - WaitlistPage
  - WaitlistForm
personas:
  - rising-star-agent
  - established-solo
status: implemented
created: 2026-03-18
updated: 2026-03-18
---

# Waitlist Page

**Source File**: `app/waitlist/page.tsx`
**API Endpoint**: `app/api/waitlist/route.ts`
**Email Service**: `lib/resend/client.ts`
**Design System**: `.specs/design-system/tokens.md` (Marketing-Specific section)
**Personas**: Rising Star Agent, Established Solo

## Overview

A public-facing waitlist page for founding cohort acquisition. Captures prospect details (name, email, phone, market, website), stores them in Supabase, and sends a confirmation email via Resend. Branded with the warm marketing palette to feel continuous with the homepage.

### Why these fields

| Field | Required | Rationale |
|-------|----------|-----------|
| First Name | Yes | Personalization in outreach |
| Last Name | Yes | Professional context |
| Email | Yes | Primary contact + confirmation delivery |
| Phone | No | For personal outreach (founding cohort is high-touch) |
| Primary Market | Yes | Validates fit for luxury market intelligence |
| Website/LinkedIn | No | Helps team assess prospect before outreach |

---

## Feature: Waitlist Page

### Scenario: Visitor navigates to waitlist page
Given a visitor clicks "Join the Waitlist" from the homepage or nav
When the `/waitlist` page loads
Then they see a marketing-branded page with the warm palette
And a headline "Reserve your position in the founding cohort"
And a subheadline about 25 founding members
And "7 spots remaining" in gold accent
And a form with fields: First Name, Last Name, Email, Phone, Primary Market, Website/LinkedIn
And a "Reserve My Spot" submit button
And a back link to the homepage

### Scenario: Successful waitlist submission
Given a visitor fills in all required fields (first name, last name, email, market)
When they submit the form
Then the form is replaced with a confirmation state
And they see "You're on the list" heading
And a message "We've sent a confirmation to {email}"
And a note "A member of our team will reach out personally when the founding cohort opens"
And the entry is stored in the `waitlist` table with status "pending"
And a confirmation email is sent via Resend

### Scenario: Duplicate email submission
Given a visitor submits an email that already exists in the waitlist
When the API returns 409
Then they see a message "This email is already on our waitlist"
And a link "Sign in instead" pointing to /sign-in
And no duplicate row is created

### Scenario: Validation errors
Given a visitor submits the form with missing required fields
When client-side validation fails
Then the browser's native validation prevents submission (required attribute on firstName, lastName, email, market)
And the form is not submitted
And the server also validates required fields (returns 400 if missing)

### Scenario: API error
Given the API returns a 500 error
When the submission fails
Then they see "Something went wrong. Please try again."
And the form remains editable with their data preserved

### Scenario: Confirmation email via Resend
Given a waitlist entry is successfully created
When the API processes the submission
Then Resend sends an email to the prospect's address
And the email subject is "You're on the Modern Signal Advisory waitlist"
And the email body includes:
  - Their first name
  - Confirmation they're on the list
  - "7 spots remaining" scarcity note
  - What to expect next (personal outreach when cohort opens)
  - Modern Signal Advisory branding (gold accent, warm tone)
And the from address is "Modern Signal Advisory <waitlist@modernsignaladvisory.com>" (or configured domain)

### Scenario: Page is viewed on mobile
Given the visitor is on a mobile device
When the page renders
Then the form stacks vertically
And all touch targets are at least 44px
And the page uses the marketing warm palette

---

## Database Schema

### waitlist table

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default random | |
| firstName | varchar(100) | NOT NULL | |
| lastName | varchar(100) | NOT NULL | |
| email | varchar(255) | NOT NULL, UNIQUE, indexed | |
| phone | varchar(50) | nullable | |
| market | varchar(255) | NOT NULL | e.g. "Naples, FL" |
| website | text | nullable | URL or LinkedIn |
| status | waitlist_status enum | NOT NULL, default "pending" | pending / invited / joined |
| createdAt | timestamp w/ tz | NOT NULL, default now | |
| updatedAt | timestamp w/ tz | NOT NULL, default now | |

### waitlist_status enum

- `pending` — submitted, awaiting cohort opening
- `invited` — team has sent invitation to join
- `joined` — converted to a user account

---

## UI Mockup

```
┌──────────────────────────────────────────────────────────────────────┐
│ (ivory bg, marketing-branded, no nav — minimal page)                 │
│                                                                      │
│    ← Back to homepage                                                │
│                                                                      │
│              FOUNDING COHORT                                         │
│              (gold, 11px, tracking)                                  │
│                                                                      │
│    Reserve your position in                                          │
│    the founding cohort.                                              │
│         (Cormorant Garamond, charcoal)                               │
│                                                                      │
│    25 founding members. 7 spots remaining.                           │
│         (DM Sans, warm-gray, gold "7 spots remaining")               │
│                                                                      │
│    ┌─────────────────────┬─────────────────────┐                    │
│    │ First Name *        │ Last Name *          │                    │
│    └─────────────────────┴─────────────────────┘                    │
│    ┌───────────────────────────────────────────┐                    │
│    │ Email *                                   │                    │
│    └───────────────────────────────────────────┘                    │
│    ┌─────────────────────┬─────────────────────┐                    │
│    │ Phone (optional)    │ Primary Market *     │                    │
│    └─────────────────────┴─────────────────────┘                    │
│    ┌───────────────────────────────────────────┐                    │
│    │ Website or LinkedIn (optional)            │                    │
│    └───────────────────────────────────────────┘                    │
│                                                                      │
│    ┌───────────────────────────────────────────┐                    │
│    │          RESERVE MY SPOT                  │                    │
│    │     (charcoal bg, warm-white text)         │                    │
│    └───────────────────────────────────────────┘                    │
│                                                                      │
│    No commitment. We'll reach out personally                         │
│    when the founding cohort opens.                                   │
│         (stone, 13px)                                                │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│ CONFIRMATION STATE (replaces form on success)                        │
│                                                                      │
│              ✓ (gold circle/checkmark)                               │
│                                                                      │
│         You're on the list.                                          │
│              (Cormorant Garamond, charcoal)                          │
│                                                                      │
│    We've sent a confirmation to alex@example.com.                    │
│    A member of our team will reach out personally                    │
│    when the founding cohort opens.                                   │
│              (DM Sans, warm-gray)                                    │
│                                                                      │
│         [Return to Homepage]                                         │
│              (gold text link)                                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Resend Integration

### Setup
- Install `resend` npm package
- Add `RESEND_API_KEY` to `.env.local`
- Create `lib/resend/client.ts` — lazy-initialized Resend instance (same pattern as Stripe client)

### Email Template
- Use Resend's React email support or plain HTML
- Branded with marketing palette (warm tone, gold accents)
- Simple, editorial feel — not a SaaS transactional email
- From: configurable via `RESEND_FROM_EMAIL` env var

### Graceful Degradation
- If `RESEND_API_KEY` is not set, skip email sending (log warning)
- Waitlist entry is still saved even if email fails
- Email failure does not cause the API to return an error

---

## Design Token Usage

| Element | Token(s) |
|---------|----------|
| Page background | `color-mkt-bg` |
| Form inputs | `color-mkt-surface` bg, `color-mkt-border` border, `color-mkt-text` text |
| Input focus | `color-mkt-accent` border |
| Headlines | `font-display` (Cormorant Garamond), `color-mkt-text` |
| Body text | `font-body` (DM Sans), `color-mkt-text-secondary` |
| Submit button | `color-mkt-text` bg, `color-mkt-surface` text |
| "7 spots remaining" | `color-mkt-accent`, `font-body`, font-medium |
| Fine print | `color-mkt-text-muted` |
| Success checkmark | `color-mkt-success` or `color-mkt-accent` |
| Back link | `color-mkt-accent` |
| Spacing | Shared `spacing-*` scale |
| Border radius | Shared `radius-sm` for inputs/button |

---

## Technical Notes

- No authentication required — public page
- Form is a client component (needs useState for form state + submission)
- API endpoint: `POST /api/waitlist` with JSON body
- Resend client uses lazy initialization (same pattern as `lib/stripe/client.ts`)
- Email sending is fire-and-forget — don't block the API response
- Primary Market field is freeform text (not a dropdown) — lets prospects describe their market naturally
- Homepage CTAs change from inline email forms to `<Link href="/waitlist">` buttons

---

## Learnings

(empty — to be filled after implementation)
