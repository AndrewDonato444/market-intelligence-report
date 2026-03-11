---
feature: Admin Sidebar Update
domain: admin
source: components/layout/admin-sidebar.tsx
tests:
  - __tests__/admin/admin-sidebar.test.tsx
components:
  - AdminSidebar
personas:
  - internal-developer
status: implemented
created: 2026-03-11
updated: 2026-03-11
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

### Scenario: Back to App is never active in admin context
Given an admin user is on any `/admin/*` route
Then the "Back to App" nav item is not highlighted as active

### Scenario: All nav items present
Given an admin user is viewing the admin sidebar
Then the sidebar shows these items in order:
  | Back to App |
  | User Management |
  | Eval Suite |
  | Data Sources |
  | Pipeline |
  | System Monitor |

## UI Mockup

```
+----------------------+
|  <- Back to App      |
|                      |
|  User Management     |  <- renamed from "Users"
|  Eval Suite          |
|  Data Sources        |
|  Pipeline            |
|  System Monitor      |
|                      |
| -------------------- |
|  Modern Signal       |
|  Advisory            |
+----------------------+
```

## Component References

- AdminSidebar: `components/layout/admin-sidebar.tsx`
