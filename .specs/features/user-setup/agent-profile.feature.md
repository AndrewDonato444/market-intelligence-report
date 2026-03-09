---
feature: Agent Profile + Branding
domain: user-setup
source: app/(protected)/settings/profile/page.tsx, app/api/profile/route.ts, lib/services/profile.ts, lib/services/profile-validation.ts
tests:
  - __tests__/profile/profile.test.tsx
components:
  - ProfileForm
  - BrandPreview
personas:
  - established-practitioner
  - rising-star-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Agent Profile + Branding

**Source Files**: `app/(protected)/settings/profile/page.tsx`, `app/api/profile/route.ts`, `lib/services/profile.ts`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Established Practitioner (high patience, editorial voice), Rising Star (wants to look polished fast)

## Feature: Agent Profile + Branding

Agents complete their profile — name, company, title, contact info, and brand colors. This data appears on every generated report (logo, colors, contact, disclaimers). The profile syncs from Clerk auth data on first sign-in, then agents customize it.

### Scenario: First-time user sees profile synced from Clerk
Given an agent has signed in for the first time
When they navigate to /settings/profile
Then their name and email are pre-populated from Clerk
And empty fields show clear prompts (not placeholder noise)

### Scenario: Agent completes their profile
Given an agent is on the profile page
When they fill in company, title, phone, and bio
And they click "Save Profile"
Then the data is persisted to the users table
And a success confirmation appears

### Scenario: Agent sets brand colors
Given an agent is on the profile page
When they select a primary color, secondary color, and accent color
Then the colors are stored in brand_colors JSONB
And a preview shows how the colors will appear on reports

### Scenario: Profile validation rejects invalid data
Given an agent is editing their profile
When they submit with an invalid phone number format
Then an inline error appears on the phone field
And the form is not submitted

### Scenario: Agent updates existing profile
Given an agent has a saved profile
When they change their company name
And click "Save Profile"
Then only the changed fields are updated
And updated_at is refreshed

### Scenario: Profile data is available for reports
Given an agent has completed their profile
When a report is generated
Then the report includes the agent's name, company, title, phone, and brand colors

## User Journey

1. Agent signs up via Clerk (Feature #3)
2. **Agent completes their profile + branding** (this feature)
3. Agent defines their target market (Feature #11)
4. Agent generates their first report (Features #40+)

## UI Mockup

```
┌─ Settings / Profile (bg: background) ──────────────────────────────────┐
│                                                                         │
│  ┌─ Card (bg: surface, radius: md, shadow: sm) ──────────────────────┐ │
│  │                                                                     │ │
│  │  YOUR PROFILE (font: serif, text: 2xl, weight: bold, color: primary)│ │
│  │  How you appear on reports. (text: sm, color: text-secondary)       │ │
│  │  ── gold line (color: accent, 48px) ──                              │ │
│  │                                                                     │ │
│  │  ┌─ Two columns ─────────────────────────────────────────────────┐ │ │
│  │  │  Name*          [Victoria Ashford        ]                     │ │ │
│  │  │  Email           victoria@ashford.com (from Clerk, read-only) │ │ │
│  │  │  Company*        [Ashford & Associates    ]                     │ │ │
│  │  │  Title           [Principal Broker        ]                     │ │ │
│  │  │  Phone           [(239) 555-0147          ]                     │ │ │
│  │  │  Bio             [Specializing in Naples waterfront estates...] │ │ │
│  │  └───────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ Card: Report Branding (bg: surface, radius: md, shadow: sm) ─────┐ │
│  │                                                                     │ │
│  │  REPORT BRANDING (font: serif, text: xl, weight: bold)              │ │
│  │  Colors that appear on your generated reports. (text: sm)           │ │
│  │                                                                     │ │
│  │  Primary    [■ #0F172A] [color picker]                              │ │
│  │  Secondary  [■ #CA8A04] [color picker]                              │ │
│  │  Accent     [■ #1E3A5F] [color picker]                              │ │
│  │                                                                     │ │
│  │  ┌─ Preview (bg: report-bg, radius: sm, border) ────────────────┐ │ │
│  │  │  ┌─ Header bar (bg: primary color) ──────────────────────┐   │ │ │
│  │  │  │  ASHFORD & ASSOCIATES (color: inverse, weight: bold)   │   │ │ │
│  │  │  │  ── secondary color line ──                             │   │ │ │
│  │  │  └────────────────────────────────────────────────────────┘   │ │ │
│  │  │  Report Title (serif, color: primary color)                    │ │ │
│  │  │  Key Metric: $8.7M (color: secondary color)                   │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │ │
│  │  [Save Profile (bg: accent, color: primary, radius: sm)]           │ │
│  │                                                                     │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## API Design

### GET /api/profile
- Returns the current user's profile from the users table
- If no profile exists, returns Clerk data as defaults
- Auth: requires Clerk session

### PUT /api/profile
- Updates the current user's profile
- Creates a new user row if none exists (upsert by clerk_id)
- Validates: name required, phone format, colors as hex
- Auth: requires Clerk session

## Component References

- ProfileForm: .specs/design-system/components/profile-form.md (stub)
- ColorPicker: native HTML color input with hex display
- BrandPreview: inline preview of report branding
