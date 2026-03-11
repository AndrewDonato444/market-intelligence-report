---
feature: Admin User Detail
domain: admin
source: app/admin/users/[id]/page.tsx
tests:
  - __tests__/admin/user-detail-panel.test.tsx
components:
  - UserDetailPanel
personas:
  - admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Admin User Detail

**Source File**: app/admin/users/[id]/page.tsx
**Design System**: .specs/design-system/tokens.md
**Depends on**: #112 Admin User List, #111 Activity Log Schema

## Feature: Admin User Detail Page

Admin can drill into any user from the user list to see their full profile, account status, report history, market definitions, and activity timeline.

### Scenario: Admin views user profile info
Given the admin navigates to /admin/users/{userId}
When the page loads
Then the admin sees the user's name, email, company, title, phone
And the admin sees the user's account status badge (active/suspended/deleted)
And the admin sees the user's creation date and last login date
And if the user is suspended, the admin also sees the suspended date
And if the user is deleted, the admin also sees the deleted date

### Scenario: Admin views user's report count
Given the admin is on the user detail page
When the page loads
Then the admin sees the total number of reports the user has generated
And the admin sees the count broken down by status (completed, failed, generating, queued)
And the status breakdown is only shown when the user has at least one report

### Scenario: Admin views user's markets
Given the admin is on the user detail page
When the page loads
Then the admin sees a list of the user's defined markets
And each market shows its city/state, luxury tier, and price floor
And if no markets are defined, the admin sees "No markets defined"

### Scenario: Admin views activity timeline
Given the admin is on the user detail page
When the page loads
Then the admin sees the user's recent activity entries (newest first)
And each entry shows the action, entity type, and timestamp
And the timeline shows up to 50 entries
And if no activity exists, the admin sees "No activity recorded"

### Scenario: Admin navigates back to user list
Given the admin is on the user detail page
When the admin clicks the back link
Then the admin is returned to /admin/users

### Scenario: User not found
Given the admin navigates to /admin/users/{invalidId}
When the API returns no user
Then the admin sees a "User not found" message

### Scenario: Loading state
Given the admin navigates to the user detail page
When data is being fetched
Then the admin sees a loading indicator

### Scenario: Error state
Given the admin navigates to the user detail page
When the API request fails
Then the admin sees an error message with a retry button

## User Journey

1. Admin navigates to User List (#112)
2. **Admin clicks a user row → User Detail (#113)**
3. Admin can view profile, reports, markets, activity
4. Admin can navigate back to user list

## UI Mockup

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Users                                     │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │  PROFILE                                        │ │
│ │  Jane Smith                       [ACTIVE]      │ │
│ │  jane@acme.com                                  │ │
│ │  Acme Real Estate                               │ │
│ │  Senior Agent · (555) 123-4567                  │ │
│ │                                                 │ │
│ │  Created: Jan 15, 2026  Last Login: Mar 10, 2026│ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │ Reports  │ │ Markets  │ │ Activity │             │
│ │    12    │ │    2     │ │    28    │             │
│ │ total    │ │ defined  │ │ entries  │             │
│ └──────────┘ └──────────┘ └──────────┘             │
│                                                     │
│ REPORTS BY STATUS                                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Completed: 10  Failed: 1  Generating: 1         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ MARKETS                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Naples, FL — Luxury — $1M+                      │ │
│ │ Aspen, CO — Ultra Luxury — $5M+                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ RECENT ACTIVITY                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Mar 10  report.created   Report — "Q1 Naples"   │ │
│ │ Mar 9   market.updated   Market — "Naples, FL"  │ │
│ │ Mar 8   login            —                      │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Component References

- StatusBadge: reuses STATUS_COLORS pattern from user-list-dashboard.tsx
