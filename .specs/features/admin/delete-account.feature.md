---
feature: Delete Account
domain: admin
source: app/api/admin/users/[id]/delete/route.ts
tests:
  - __tests__/admin/delete-account.test.tsx
components:
  - UserDetailPanel
personas:
  - primary
  - anti-persona
status: implemented
created: 2026-03-11
updated: 2026-03-12
---

# Delete Account

**Source File**: app/api/admin/users/[id]/delete/route.ts
**Design System**: .specs/design-system/tokens.md

## Feature: Admin Delete Account

Admin users can soft-delete agent accounts from the user detail page. The account is marked as deleted, but reports are kept in the database (orphaned) for analytics. Deletion requires a confirmation dialog.

### Scenario: Admin deletes an active account
Given the admin is on the user detail page for an active user
When the admin clicks Delete Account
And confirms the action in the confirmation dialog
Then the user status changes to deleted
And the status badge updates to show deleted
And an activity log entry is recorded for the deletion
And a success message "Account deleted" is shown

### Scenario: Admin deletes a suspended account
Given the admin is on the user detail page for a suspended user
When the admin clicks Delete Account
And confirms the deletion
Then the user status changes to deleted
And reports remain in the database (orphaned, not cascade-deleted)

### Scenario: Delete button not shown for already deleted user
Given the admin is on the user detail page for a deleted user
Then the Delete Account button is not shown

### Scenario: Admin cannot delete themselves
Given the admin is viewing their own user detail page
Then the Delete Account button is not shown

### Scenario: Confirmation required for deletion
Given the admin is on the user detail page for an active user
When the admin clicks Delete Account
Then a confirmation dialog appears with the user's name
And the dialog warns that reports will be kept for analytics but de-linked from their profile
And the dialog states "This action cannot be undone"
And the admin must confirm before the action proceeds

### Scenario: Cancel hides confirmation dialog
Given the admin has opened the delete confirmation dialog
When the admin clicks Cancel
Then the confirmation dialog is hidden
And no API call is made

### Scenario: API validates admin authorization
Given a non-admin user tries to call the delete API
Then the API returns 401 Unauthorized

### Scenario: API prevents self-deletion
Given an admin tries to delete their own account via the API
Then the API returns 403 Forbidden

### Scenario: API prevents deleting already-deleted accounts
Given the target account is already deleted
When the admin calls the delete API
Then the API returns 409 Conflict with "Account is already deleted"

## User Journey

1. Admin navigates to /admin/users
2. Admin clicks on a user row to view details
3. Admin clicks Delete Account and confirms (this feature)
4. User is soft-deleted, reports orphaned
5. Admin returns to user list (deleted user filterable)

## Component References

- UserDetailPanel: components/admin/user-detail-panel.tsx
- Service: lib/services/user-status.ts (softDeleteUser)
- Activity Log: lib/services/activity-log.ts
