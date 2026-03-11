---
feature: Admin User List
domain: admin
source: app/admin/users/page.tsx, components/admin/user-list-dashboard.tsx, app/api/admin/users/route.ts
tests:
  - __tests__/admin/user-list-dashboard.test.tsx
components:
  - UserListDashboard
personas:
  - internal-developer
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Admin User List

**Source Files**: `app/admin/users/page.tsx`, `components/admin/user-list-dashboard.tsx`, `app/api/admin/users/route.ts`, `lib/services/user-status.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: User Status Schema (#110), Activity Log Schema (#111), System Monitoring Dashboard (#83)

## Feature: Admin User List

Admin page at `/admin/users` for viewing, searching, filtering, and sorting all platform users. Paginated table with status indicators.

### Scenario: Admin views user list
Given an admin user is signed in
When they navigate to `/admin/users`
Then they see a table with columns: Name, Email, Company, Status, Last Login, Created
And users are sorted by most recent activity by default

### Scenario: Admin searches users by name or email
Given the admin is on the user list page
When they type "john" in the search box
Then the table filters to show only users whose name or email contains "john"

### Scenario: Admin filters by status
Given the admin is on the user list page
When they click the "Suspended" status filter
Then the table shows only users with status "suspended"

### Scenario: Admin sees all statuses with "All" filter
Given the admin has filtered by "Suspended"
When they click "All"
Then the table shows users of all statuses

### Scenario: Admin sorts by column
Given the admin is on the user list page
When they click the "Created" column header
Then users are sorted by creation date descending
When they click it again
Then users are sorted by creation date ascending

### Scenario: Pagination
Given there are more than 20 users
When the admin views the first page
Then they see 20 users and pagination controls
When they click "Next"
Then they see the next page of users

### Scenario: Empty state
Given there are no users matching the current search and filter
Then the admin sees "No users found" message

### Scenario: Loading state
Given the admin navigates to `/admin/users`
While data is being fetched
Then they see a loading indicator

### Scenario: Error state
Given the API returns an error
Then the admin sees an error message with retry option

### Scenario: Non-admin user is rejected
Given a user with role 'user' navigates to `/admin/users`
Then they are redirected to `/dashboard`

## User Journey

1. Admin signs in and navigates to admin area
2. **Admin User List** — browse, search, filter users
3. Click a user row → Admin User Detail (#113)

## UI Mockup

```
┌──────────────────────────────────────────────────────────┐
│ Users                                         [Search... ]│
├──────────────────────────────────────────────────────────┤
│ [All (47)]  [Active (44)]  [Suspended (2)]  [Deleted (1)]│
├──────────────────────────────────────────────────────────┤
│ Name ↓      │ Email        │ Company  │Status│Last Login │
│─────────────┼──────────────┼──────────┼──────┼───────────│
│ Jane Smith  │ jane@...     │ Acme RE  │ ●    │ Mar 10    │
│ John Doe    │ john@...     │ Lux Grp  │ ●    │ Mar 9     │
│ ...         │ ...          │ ...      │ ...  │ ...       │
├──────────────────────────────────────────────────────────┤
│ Showing 1-20 of 47                  [← Prev] [Next →]   │
└──────────────────────────────────────────────────────────┘

Status indicators:
  ● green  = active
  ● yellow = suspended
  ● red    = deleted
```

## Component References

- AdminSidebar: `components/layout/admin-sidebar.tsx` (add "Users" nav item)
