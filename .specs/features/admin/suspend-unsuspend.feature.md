---
feature: Suspend/Unsuspend Account
domain: admin
source: app/api/admin/users/[id]/status/route.ts
tests:
  - __tests__/admin/suspend-unsuspend.test.tsx
components:
  - UserDetailPanel
personas:
  - primary
  - anti-persona
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Suspend/Unsuspend Account

**Source File**: app/api/admin/users/[id]/status/route.ts
**Design System**: .specs/design-system/tokens.md

## Feature: Admin Suspend/Unsuspend Account

Admin users can suspend or unsuspend agent accounts from the user detail page. Suspended users are redirected to a contact support page on next login attempt.

### Scenario: Admin suspends an active account
Given the admin is on the user detail page for an active user
When the admin clicks Suspend Account
And confirms the action in the confirmation dialog
Then the user status changes to suspended
And the status badge updates to show suspended
And an activity log entry is recorded for the suspension
And a success message is shown

### Scenario: Admin unsuspends a suspended account
Given the admin is on the user detail page for a suspended user
When the admin clicks Unsuspend Account
Then the user status changes to active
And the status badge updates to show active
And an activity log entry is recorded for the unsuspension
And a success message is shown

### Scenario: Suspended user attempts login
Given a user account has been suspended
When the user navigates to any authenticated route
Then they are redirected to /suspended
And they see Your account has been suspended
And they see a support contact email

### Scenario: Suspend button not shown for already suspended user
Given the admin is on the user detail page for a suspended user
Then the Suspend Account button is not shown
And the Unsuspend Account button is shown

### Scenario: Unsuspend button not shown for active user
Given the admin is on the user detail page for an active user
Then the Unsuspend Account button is not shown
And the Suspend Account button is shown

### Scenario: Admin cannot suspend themselves
Given the admin is viewing their own user detail page
Then no suspend/unsuspend action buttons are shown

### Scenario: Confirmation required for suspension
Given the admin is on the user detail page for an active user
When the admin clicks Suspend Account
Then a confirmation dialog appears with the user name
And the admin must confirm before the action proceeds

### Scenario: API validates admin authorization
Given a non-admin user tries to call the suspend API
Then the API returns 401 Unauthorized

## Component References

- UserDetailPanel: components/admin/user-detail-panel.tsx
- Middleware: lib/supabase/middleware.ts
- Service: lib/services/user-status.ts
