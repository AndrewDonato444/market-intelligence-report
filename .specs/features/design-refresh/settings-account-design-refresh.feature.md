---
feature: Design Refresh — Settings & Account Pages
domain: design-refresh
source: app/(protected)/settings/layout.tsx, components/layout/settings-nav.tsx, components/profile/profile-form.tsx, components/profile/brand-preview.tsx, components/account/account-settings.tsx, components/account/change-password-section.tsx, components/ui/password-input.tsx
tests: []
components:
  - SettingsNav
  - ProfileForm
  - BrandPreview
  - AccountSettings
  - ChangePasswordSection
  - PasswordInput
design_refs:
  - .specs/design-system/tokens.md
personas:
  - established-practitioner
  - rising-star-agent
status: implemented
tests:
  - __tests__/settings/settings-account-design-refresh.test.tsx
created: 2026-03-28
updated: 2026-03-28
---

# Design Refresh — Settings & Account Pages

**Parent Spec**: `.specs/features/design-refresh/backend-design-refresh.feature.md`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: Established Practitioner (Jordan Ellis), Rising Star Agent (Alex Rivera)

## Overview

The Settings hub (Profile tab + Account tab) still uses cold-palette tokens (`--color-primary`, `--color-surface`, `--color-border`, `--font-serif`, `--font-sans`). The shell around them (TopNav, Sidebar, PageShell) is already warm (Phase 1 ✅). This creates a warm frame around cold content — the user walks from a warm lobby into a cold office.

This spec migrates all Settings & Account components to the warm `--color-app-*` tokens and swaps typography to `--font-display` (Cormorant Garamond) for headings and `--font-body` (DM Sans) for body text.

**Note**: The ChangePasswordSection already uses `--color-mkt-*` tokens and `--font-display`/`--font-body`. Those `--color-mkt-*` references should be migrated to `--color-app-*` equivalents for consistency (mkt tokens are for the marketing page, app tokens are for authenticated pages).

## Hard Constraints

1. **Do NOT touch PDFs** — zero changes to report PDF rendering, PDF templates, PDF components, or any `--color-report-*` tokens
2. **Additive only** — never rename, delete, or change values of existing `--color-*`, `--font-serif`, `--font-sans` tokens
3. **Preserve all functionality** — profile saving, brand color picker, password change, subscription display, sign-out must all keep working
4. **Keep semantic colors** — `--color-success`, `--color-error`, `--color-warning` stay as-is (they're semantic, not aesthetic)
5. **BrandPreview is report-facing** — BrandPreview shows how colors render on the PDF report. It should keep using report tokens (`--color-report-bg`, `--font-serif`, `--font-sans`) since it previews the report, not the app

---

## Token Migration Map

### Settings Layout + Nav

| Old Token | New Token | Component(s) |
|-----------|-----------|--------------|
| `--color-primary` (heading text) | `--color-app-text` | Settings layout h1 |
| `--font-serif` (heading) | `--font-display` | Settings layout h1 |
| `--color-border` (nav border) | `--color-app-border` | SettingsNav bottom border |
| `--font-sans` (tab text) | `--font-body` | SettingsNav tab labels |
| `--color-primary` (active tab) | `--color-app-text` | SettingsNav active tab text |
| `--color-accent` (active underline) | `--color-app-accent` | SettingsNav active tab underline |
| `--color-text-secondary` (inactive tab) | `--color-app-text-secondary` | SettingsNav inactive tab text |
| `--color-text` (tab hover) | `--color-app-text` | SettingsNav tab hover text |
| `--color-border` (tab hover underline) | `--color-app-border` | SettingsNav tab hover underline |

### ProfileForm

| Old Token | New Token | Component(s) |
|-----------|-----------|--------------|
| `--color-surface` (card bg) | `--color-app-surface` | Profile Info card, Report Branding card |
| `--font-serif` (card headings) | `--font-display` | "Your Profile", "Report Branding" headings |
| `--color-primary` (heading text) | `--color-app-text` | Card heading text |
| `--font-sans` (body/labels) | `--font-body` | All labels, inputs, subtitles, buttons |
| `--color-text` (label text) | `--color-app-text` | Form labels, input text |
| `--color-text-secondary` (subtitle) | `--color-app-text-secondary` | Card subtitles, managed-by text |
| `--color-text-tertiary` (hint) | `--color-app-text-tertiary` | "Managed by your auth provider" hint |
| `--color-border` (input border) | `--color-app-border` | Input borders, color picker borders |
| `--color-surface` (input bg) | `--color-app-surface` | Input backgrounds |
| `--color-background` (readonly bg) | `--color-app-bg` | Email (readonly) input background |
| `--color-accent` (focus ring, save btn) | `--color-app-accent` | Input focus ring, Save Profile button bg, accent line |
| `--color-accent-hover` (save hover) | `--color-app-accent-hover` | Save Profile button hover |
| `--color-primary` (save btn text) | `--color-app-surface` | Save Profile button text (light on warm gold) |

### AccountSettings

| Old Token | New Token | Component(s) |
|-----------|-----------|--------------|
| `--color-surface` (card bg) | `--color-app-surface` | All three section cards |
| `--font-serif` (section headings) | `--font-display` | "Account Information", "Your Plan", "Session Management" |
| `--color-primary` (heading text) | `--color-app-text` | Section heading text, stat numbers, tier name |
| `--font-sans` (body text) | `--font-body` | All labels, values, descriptions, buttons |
| `--color-text` (body text) | `--color-app-text` | Data labels, entitlement labels |
| `--color-text-secondary` (meta) | `--color-app-text-secondary` | Subtitles, usage values, descriptions |
| `--color-text-tertiary` (dt labels) | `--color-app-text-tertiary` | Definition term labels (Email, Member Since, etc.) |
| `--color-border` (card borders) | `--color-app-border` | Tier card border, usage bar track, upgrade card border |
| `--color-accent` (accent elements) | `--color-app-accent` | Accent line, unlimited badge, price display, upgrade button bg |
| `--color-primary` (usage bar fill) | `--color-app-text` | Usage bar normal fill (non-warning) |
| `--color-primary` (upgrade btn text) | `--color-app-surface` | Upgrade button text |

### ChangePasswordSection (mkt → app migration)

| Old Token | New Token | Component(s) |
|-----------|-----------|--------------|
| `--color-mkt-surface` | `--color-app-surface` | Card background |
| `--color-mkt-border` | `--color-app-border` | Card border |
| `--color-mkt-text` | `--color-app-text` | Heading text, form labels |
| `--color-mkt-darkest` (btn hover) | `--color-app-accent-hover` | Submit button hover |
| `--color-mkt-text` (btn bg) | `--color-app-accent` | Submit button background |
| `--color-mkt-surface` (btn text) | `--color-app-surface` | Submit button text |

### PasswordInput

| Old Token | New Token | Component(s) |
|-----------|-----------|--------------|
| `--color-border` (input border) | `--color-app-border` | Input border |
| `--font-inter` | `--font-body` | Input font family |
| `--color-text` (input text) | `--color-app-text` | Input text color |
| `--color-text-tertiary` (placeholder) | `--color-app-text-tertiary` | Placeholder text, eye icon |
| `--color-text-secondary` (icon hover) | `--color-app-text-secondary` | Eye icon hover |
| `--color-border-strong` (focus ring) | `--color-app-accent` | Focus ring |

---

## Feature: Settings & Account Warm Refresh

### Scenario: Settings page heading uses warm display font
Given the user navigates to Settings
When the settings layout renders
Then the "Settings" heading uses `--font-display` (Cormorant Garamond)
And the heading text color uses `--color-app-text`

### Scenario: Settings tab navigation uses warm tokens
Given the settings navigation renders
When the user views the tab bar
Then tab labels use `--font-body` (DM Sans)
And the border below tabs uses `--color-app-border`
And the active tab text uses `--color-app-text`
And the active tab underline uses `--color-app-accent`
And inactive tab text uses `--color-app-text-secondary`
And tab hover text uses `--color-app-text`
And tab hover underline uses `--color-app-border`

### Scenario: Profile form cards use warm palette
Given the user is on the Profile tab
When the profile form renders
Then card backgrounds use `--color-app-surface`
And the "Your Profile" heading uses `--font-display` and `--color-app-text`
And the "Report Branding" heading uses `--font-display` and `--color-app-text`
And the accent line under each heading uses `--color-app-accent`
And card subtitles use `--font-body` and `--color-app-text-secondary`

### Scenario: Profile form inputs use warm tokens
Given the profile form is rendered
When form fields are visible
Then input labels use `--font-body` and `--color-app-text`
And input borders use `--color-app-border`
And input backgrounds use `--color-app-surface`
And input text uses `--color-app-text`
And the readonly email input background uses `--color-app-bg`
And the "Managed by your authentication provider" hint uses `--color-app-text-tertiary`
And input focus rings use `--color-app-accent`

### Scenario: Brand preview stays in report palette
Given the profile form shows the brand preview
When the BrandPreview component renders
Then it continues using `--color-report-bg` for background
And it continues using `--font-serif` and `--font-sans` for typography
And the brand color picker border uses `--color-app-border`

### Scenario: Save Profile button uses warm accent
Given the user has made profile changes
When the Save Profile button is visible
Then the button background uses `--color-app-accent`
And the button hover uses `--color-app-accent-hover`
And the button text uses `--color-app-surface` (warm white)
And the button label uses `--font-body`

### Scenario: Account information card uses warm palette
Given the user is on the Account tab
When the account information card renders
Then the card background uses `--color-app-surface`
And the "Account Information" heading uses `--font-display` and `--color-app-text`
And the accent line uses `--color-app-accent`
And definition term labels (Email, Member Since, etc.) use `--font-body`, uppercase, `--color-app-text-tertiary`
And definition values use `--font-body` and `--color-app-text`
And stat numbers (reports, markets) use `--color-app-text`

### Scenario: Subscription tier card uses warm tokens
Given the account page shows subscription data
When the tier card renders
Then the card border uses `--color-app-border`
And the card background uses `--color-app-surface`
And the tier name uses `--font-display` and `--color-app-text`
And the price uses `--font-body` and `--color-app-accent`
And the tier description uses `--font-body` and `--color-app-text-secondary`

### Scenario: Usage entitlement bars use warm tokens
Given the subscription section shows usage bars
When entitlement bars render
Then the entitlement label uses `--font-body` and `--color-app-text`
And the usage count uses `--font-body` and `--color-app-text-secondary`
And the bar track uses `--color-app-border`
And the normal bar fill uses `--color-app-text` (warm charcoal)
And the warning bar fill preserves `--color-warning` (semantic, unchanged)
And the "Unlimited" badge uses `--color-app-accent`
And the remaining count uses `--font-body` and `--color-app-text-secondary`

### Scenario: Upgrade prompt card uses warm tokens
Given a next-tier upgrade prompt is visible
When the upgrade card renders
Then the card border uses `--color-app-border`
And the card background uses `--color-app-surface`
And the tier name uses `--font-display` and `--color-app-text`
And the comparison labels use `--font-body`
And the "Contact Us to Upgrade" button uses `--color-app-accent` background

### Scenario: Session management section uses warm palette
Given the account page shows session management
When the session card renders
Then the card background uses `--color-app-surface`
And the "Session Management" heading uses `--font-display` and `--color-app-text`
And the body text uses `--font-body` and `--color-app-text`
And the "Sign Out Everywhere" button preserves `--color-error` background (semantic, unchanged)

### Scenario: Change password section uses app tokens (not mkt)
Given the account page shows the change password form
When the form renders
Then the card background uses `--color-app-surface`
And the card border uses `--color-app-border`
And the "Change Password" heading uses `--font-display` and `--color-app-text`
And form labels use `--font-body` and `--color-app-text`
And the submit button background uses `--color-app-accent`
And the submit button hover uses `--color-app-accent-hover`
And the submit button text uses `--color-app-surface`
And validation errors preserve `--color-error` (semantic)
And success messages preserve `--color-success` (semantic)

### Scenario: Password input uses warm tokens
Given a password input field is rendered
When the user interacts with it
Then the input font uses `--font-body` (not `--font-inter`)
And the input border uses `--color-app-border`
And the input text uses `--color-app-text`
And the placeholder text uses `--color-app-text-tertiary`
And the focus ring uses `--color-app-accent`
And the eye icon color uses `--color-app-text-tertiary`
And the eye icon hover uses `--color-app-text-secondary`

### Scenario: All settings functionality is preserved
Given the settings pages render with warm tokens
When the user saves their profile
Then the profile saves successfully via PUT /api/profile
When the user changes brand colors
Then the BrandPreview updates in real time
When the user changes their password
Then the password flow works (verify → update)
When the user clicks "Sign Out Everywhere"
Then all sessions are terminated and the user is redirected to sign-in
When the user switches between Profile and Account tabs
Then navigation works correctly with active state updating

---

## User Journey

1. User signs in → dashboard (warm ✅)
2. User clicks "Settings" in sidebar → lands on Profile tab
3. **Settings pages (this feature)** — profile editing, brand customization, account info, subscription, password management
4. User returns to dashboard or navigates to other pages

## UI Mockup (warm settings)

```
┌─────────────────────────────────────────────────────────┐
│  TopNav (--color-app-nav-bg) [Phase 1 ✅]                │
├────────┬────────────────────────────────────────────────┤
│Sidebar │  PageShell (--color-app-bg) [Phase 1 ✅]       │
│(warm)  │                                                │
│        │  "Settings"                                     │
│        │   font-display / --color-app-text               │
│        │                                                │
│        │  ┌────────────┬────────────┐                    │
│        │  │  Profile   │  Account   │  ← font-body      │
│        │  │ (active)   │            │                    │
│        │  │ app-text   │ app-text-  │                    │
│        │  │ ━━━━━━━━━━ │ secondary  │                    │
│        │  │ app-accent │            │                    │
│        │  └────────────┴────────────┘                    │
│        │   ─── (--color-app-border) ───                  │
│        │                                                │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Your Profile  (--color-app-surface)     │  │
│        │  │  font-display / --color-app-text         │  │
│        │  │  ━━━ (--color-app-accent) ━━━            │  │
│        │  │                                          │  │
│        │  │  ┌─────────────┐  ┌─────────────┐       │  │
│        │  │  │ Name *      │  │ Email       │       │  │
│        │  │  │ app-border  │  │ (readonly)  │       │  │
│        │  │  │ app-surface │  │ app-bg      │       │  │
│        │  │  └─────────────┘  └─────────────┘       │  │
│        │  │  ┌─────────────┐  ┌─────────────┐       │  │
│        │  │  │ Company     │  │ Title       │       │  │
│        │  │  └─────────────┘  └─────────────┘       │  │
│        │  │  ┌─────────────┐                        │  │
│        │  │  │ Phone       │                        │  │
│        │  │  └─────────────┘                        │  │
│        │  │  ┌──────────────────────────────┐       │  │
│        │  │  │ Bio (textarea)               │       │  │
│        │  │  └──────────────────────────────┘       │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Report Branding  (--color-app-surface)  │  │
│        │  │  font-display / --color-app-text         │  │
│        │  │  ━━━ (--color-app-accent) ━━━            │  │
│        │  │                                          │  │
│        │  │  ┌───────────────┐  ┌────────────────┐  │  │
│        │  │  │ Color pickers │  │ BrandPreview   │  │  │
│        │  │  │ (P / S / A)  │  │ (report font/  │  │  │
│        │  │  │ app-border   │  │  report tokens) │  │  │
│        │  │  └───────────────┘  └────────────────┘  │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
│        │                    [Save Profile]               │
│        │                     app-accent bg               │
│        │                     app-surface text             │
│        │                                                │
├────────┴────────────────────────────────────────────────┤
│  Footer (--color-app-nav-bg) [Phase 1 ✅]                │
└─────────────────────────────────────────────────────────┘
```

### Account Tab Mockup

```
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Account Information (app-surface)       │  │
│        │  │  font-display / app-text                 │  │
│        │  │  ━━━ (app-accent) ━━━                    │  │
│        │  │                                          │  │
│        │  │  EMAIL          MEMBER SINCE             │  │
│        │  │  app-text-      app-text-                │  │
│        │  │  tertiary       tertiary                 │  │
│        │  │  user@co.com    January 2026             │  │
│        │  │  app-text       app-text                 │  │
│        │  │                                          │  │
│        │  │  REPORTS        MARKETS                  │  │
│        │  │  app-text-      app-text-                │  │
│        │  │  tertiary       tertiary                 │  │
│        │  │  12             3                        │  │
│        │  │  app-text       app-text                 │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Your Plan  (app-surface)                │  │
│        │  │  font-display / app-text                 │  │
│        │  │  ━━━ (app-accent) ━━━                    │  │
│        │  │                                          │  │
│        │  │  ┌ PROFESSIONAL ────── $39/mo ─────────┐ │  │
│        │  │  │ app-text (tier)  app-accent (price)  │ │  │
│        │  │  │ app-text-secondary (description)     │ │  │
│        │  │  │ app-border                           │ │  │
│        │  │  └──────────────────────────────────────┘ │  │
│        │  │                                          │  │
│        │  │  Reports This Month                      │  │
│        │  │  ████████░░░░  3 of 5 used               │  │
│        │  │  app-text fill / app-border track         │  │
│        │  │                                          │  │
│        │  │  Markets                                 │  │
│        │  │  ██████░░░░░░  2 of 5 used               │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Session Management (app-surface)        │  │
│        │  │  font-display / app-text                 │  │
│        │  │  ━━━ (app-accent) ━━━                    │  │
│        │  │                                          │  │
│        │  │  [Sign Out Everywhere]  ← error bg       │  │
│        │  └──────────────────────────────────────────┘  │
│        │                                                │
│        │  ┌──────────────────────────────────────────┐  │
│        │  │  Change Password  (app-surface)          │  │
│        │  │  font-display / app-text                 │  │
│        │  │  app-border                              │  │
│        │  │                                          │  │
│        │  │  Current password  [••••••••]  👁         │  │
│        │  │  New password      [••••••••]  👁         │  │
│        │  │  Confirm           [••••••••]  👁         │  │
│        │  │                                          │  │
│        │  │  [Update Password] ← app-accent bg       │  │
│        │  └──────────────────────────────────────────┘  │
```

## Component References

- Settings Layout: `app/(protected)/settings/layout.tsx`
- SettingsNav: `components/layout/settings-nav.tsx`
- ProfileForm: `components/profile/profile-form.tsx`
- BrandPreview: `components/profile/brand-preview.tsx` (no warm changes — report-facing)
- AccountSettings: `components/account/account-settings.tsx`
- ChangePasswordSection: `components/account/change-password-section.tsx`
- PasswordInput: `components/ui/password-input.tsx`

## Learnings

- ChangePasswordSection was already migrated to `--color-mkt-*` and `--font-display`/`--font-body` (warm fonts) during an earlier pass. However, it used marketing page tokens (`mkt`) instead of app tokens (`app`). This migration normalizes it to `--color-app-*` for consistency with all other authenticated pages.
- BrandPreview intentionally stays on report tokens because it shows how the agent's brand colors will appear on the generated PDF report — it's a preview of a report artifact, not an app UI element.
- ChangePasswordSection required a two-hop migration: it was already on warm fonts (`--font-display`/`--font-body`) but used `--color-mkt-*` tokens (marketing page) instead of `--color-app-*` (authenticated app). When migrating mkt→app, the button semantics also change: `--color-mkt-text` bg → `--color-app-accent` bg, `--color-mkt-darkest` hover → `--color-app-accent-hover`.
- BrandPreview container border is app-facing (uses `--color-app-border`) even though the interior content is report-facing (`--font-serif`, `--font-sans`, `--color-report-bg`). The border is part of the app UI chrome, not the report preview.
- className-based token assertions (`element.className.toContain("--token-name")`) work well for design refresh tests — simpler than fs.readFileSync source inspection and tests actual rendered class application.
