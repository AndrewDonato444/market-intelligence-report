---
feature: Account Settings Page
domain: account
source: app/(protected)/settings/account/page.tsx
tests:
  - __tests__/account/account-settings.test.tsx
components:
  - AccountSettings
  - SettingsNav
personas:
  - established-practitioner
  - rising-star-agent
status: specced
created: 2026-03-09
updated: 2026-03-09
---

# Account Settings Page

**Source File**: app/(protected)/settings/account/page.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/established-practitioner.md, .specs/personas/rising-star-agent.md

## Feature: Account Settings

Provides agents with a dedicated account management page within settings. Includes a settings sub-navigation to move between Profile and Account tabs, account info display, report/market counts, and sign-out-all capability.

### Scenario: Settings layout with sub-navigation
Given an agent is on any settings page
When the settings layout renders
Then a sub-navigation shows "Profile" and "Account" tabs
And the current tab is highlighted

### Scenario: Agent views account information
Given an agent navigates to /settings/account
When the page loads
Then they see their email address
And they see the date they joined
And they see a summary of their report count and market count

### Scenario: Account stats loaded from API
Given an agent is on the account settings page
When the page loads
Then a GET request to /api/account/stats returns report count and market count
And the counts are displayed in the account info section

### Scenario: Agent signs out from all devices
Given an agent is on the account settings page
When they click "Sign Out Everywhere"
Then they are redirected to the sign-in page

### Scenario: Settings page redirects to profile
Given an agent navigates to /settings
When the page loads
Then they are redirected to /settings/profile (existing behavior preserved)

## User Journey

1. Agent clicks "Settings" in sidebar
2. Redirected to /settings/profile (existing)
3. Agent clicks "Account" tab in settings sub-nav
4. **Agent views account info, stats** (this feature)
5. Future: Agent manages subscription (Feature #71)

## UI Mockup

```
┌──────────────────────────────────────────────┐
│  Settings                                    │
│                                              │
│  [Profile]  [Account]        ← settings nav  │
│  ─────────────────────────────────────────── │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Account Information                   │  │
│  │  ─── gold accent line ───              │  │
│  │                                        │  │
│  │  Email          you@example.com        │  │
│  │  Member Since   March 2026             │  │
│  │  Reports        12                     │  │
│  │  Markets        3                      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Session Management                    │  │
│  │  ─── gold accent line ───              │  │
│  │                                        │  │
│  │  Sign out from all active sessions.    │  │
│  │  [Sign Out Everywhere]                 │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

## Component References

- Card pattern: same as ProfileForm (surface bg, shadow-sm, radius-md, gold accent line)
- Button: gold accent CTA pattern from ProfileForm
- Sub-nav: tab-style links matching sidebar active states
