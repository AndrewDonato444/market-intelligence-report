---
feature: Admin Sidebar Update
domain: admin
source: components/layout/admin-sidebar.tsx, components/layout/sidebar.tsx
tests:
  - __tests__/admin/admin-sidebar.test.tsx
  - __tests__/admin/pipeline-retrigger-api.test.ts
  - __tests__/admin/pipeline-test-suite.test.tsx
  - __tests__/admin/snapshot-from-report.test.ts
  - __tests__/pipeline/generate-api.test.ts
  - __tests__/pipeline/pipeline-executor.test.ts
  - __tests__/reports/flow-persistence.test.tsx
components:
  - AdminSidebar
personas:
  - internal-developer
status: implemented
created: 2026-03-11
updated: 2026-03-16
---

# Admin Sidebar Update

**Source File**: `components/layout/admin-sidebar.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Admin User List (#112)

## Feature: Admin Sidebar Update

Update the admin sidebar to rename "Users" to "User Management" for clarity and consistency with Phase 13 naming. Improve active state highlighting so that sub-pages (user detail, suspend, delete flows) correctly highlight the parent nav item.

### Scenario: Nav item displays "User Management"
Given an admin user is viewing the admin sidebar
Then the sidebar shows "User Management" instead of "Users"
And the link navigates to `/admin/users`

### Scenario: Active state on user list page
Given an admin user is on `/admin/users`
Then the "User Management" nav item is highlighted as active
And other nav items are not highlighted

### Scenario: Active state on user detail sub-page
Given an admin user is on `/admin/users/abc123`
Then the "User Management" nav item is highlighted as active

### Scenario: Active state does not bleed to unrelated routes
Given an admin user is on `/admin/eval`
Then the "Eval Suite" nav item is highlighted as active
And the "User Management" nav item is not highlighted

### Scenario: Active state on Report Registry page
Given an admin user is on `/admin/reports`
Then the "Report Registry" nav item is highlighted as active
And the "Error Triage" nav item is not highlighted

### Scenario: Active state on Report Registry detail sub-page
Given an admin user is on `/admin/reports/abc123`
Then the "Report Registry" nav item is highlighted as active

### Scenario: Active state on Error Triage page
Given an admin user is on `/admin/error-triage`
Then the "Error Triage" nav item is highlighted as active
And the "Report Registry" nav item is not highlighted

### Scenario: Back to App is never active in admin context
Given an admin user is on any `/admin/*` route
Then the "Back to App" nav item is not highlighted as active

### Scenario: All nav items present
Given an admin user is viewing the admin sidebar
Then the sidebar shows these 11 items in order:
  | Back to App |
  | User Management |
  | Report Registry |
  | Error Triage |
  | Eval Suite |
  | Data Sources |
  | Pipeline |
  | Test Suite |
  | Analytics |
  | System Monitor |
  | Subscription Tiers |

### Scenario: Footer branding
Given an admin user is viewing the admin sidebar
Then the sidebar footer shows "Modern Signal Advisory"

### Scenario: User sidebar does not show Eval
Given a non-admin user is viewing the main application sidebar
Then the sidebar shows only: Dashboard, How To, Reports, Markets, Settings
And the sidebar does not show an "Eval" or "Eval Suite" link
And the sidebar does not show an "Admin" link

## UI Mockup

```
+----------------------+
|  <- Back to App      |
|                      |
|  User Management     |
|  Report Registry     |
|  Error Triage        |
|  Eval Suite          |
|  Data Sources        |
|  Pipeline            |
|  Test Suite          |
|  Analytics           |
|  System Monitor      |
|  Subscription Tiers  |
|                      |
| -------------------- |
|  Modern Signal       |
|  Advisory            |
+----------------------+
```

## Component References

- AdminSidebar: `components/layout/admin-sidebar.tsx`
