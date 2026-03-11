---
feature: Admin Sidebar — Report Registry & Error Triage Nav
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

# Admin Sidebar — Report Registry & Error Triage Nav

**Source File**: `components/layout/admin-sidebar.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Admin Report List (#121), Admin Sidebar Update (#116)

## Feature: Add Report Registry & Error Triage to Admin Sidebar

Add two new navigation items to the admin sidebar — "Report Registry" linking to `/admin/reports` and "Error Triage" linking to `/admin/error-triage`. These pages already exist (built in features #121-#124) but are not yet reachable from the sidebar navigation. Placement should group them logically: after "User Management" and before "Eval Suite", since report operations are more frequently accessed than eval/pipeline tools.

### Scenario: Report Registry nav item is visible
Given an admin user is viewing the admin sidebar
Then the sidebar shows a "Report Registry" nav item
And it links to `/admin/reports`

### Scenario: Error Triage nav item is visible
Given an admin user is viewing the admin sidebar
Then the sidebar shows an "Error Triage" nav item
And it links to `/admin/error-triage`

### Scenario: Nav items appear in correct order
Given an admin user is viewing the admin sidebar
Then the sidebar shows these items in order:
  | Back to App |
  | User Management |
  | Report Registry |
  | Error Triage |
  | Eval Suite |
  | Data Sources |
  | Pipeline |
  | System Monitor |

### Scenario: Report Registry active state on list page
Given an admin user is on `/admin/reports`
Then the "Report Registry" nav item is highlighted as active
And other nav items are not highlighted

### Scenario: Report Registry active state on detail sub-page
Given an admin user is on `/admin/reports/abc123`
Then the "Report Registry" nav item is highlighted as active

### Scenario: Error Triage active state
Given an admin user is on `/admin/error-triage`
Then the "Error Triage" nav item is highlighted as active
And other nav items are not highlighted

### Scenario: Error Triage does not match report registry routes
Given an admin user is on `/admin/reports`
Then the "Error Triage" nav item is not highlighted as active

### Scenario: Report Registry does not match error triage route
Given an admin user is on `/admin/error-triage`
Then the "Report Registry" nav item is not highlighted as active

### Scenario: Icons are consistent with existing sidebar style
Given an admin user is viewing the admin sidebar
Then the "Report Registry" nav item has an icon (document/file-text style)
And the "Error Triage" nav item has an icon (alert-triangle style)
And both icons are 18x18px SVG stroke icons matching existing nav items

## User Journey

1. Admin logs in and lands on admin dashboard
2. **Admin sees Report Registry and Error Triage in sidebar** (this feature)
3. Admin clicks "Report Registry" to browse all platform reports
4. Admin clicks "Error Triage" to investigate failed reports

## UI Mockup

```
+----------------------------+
|  <- Back to App            |
|                            |
|  User Management           |
|  Report Registry     [new] |  <- file-text icon, links /admin/reports
|  Error Triage        [new] |  <- alert-triangle icon, links /admin/error-triage
|  Eval Suite                |
|  Data Sources              |
|  Pipeline                  |
|  System Monitor            |
|                            |
| -------------------------- |
|  Modern Signal Advisory    |
|  (text: xs, color:         |
|   text-tertiary)           |
+----------------------------+

Active state: bg: primary-light, text: primary, icon: accent
Hover state: bg: primary-light, text: text
Default: text: text-secondary
Font: sans, text-sm, font-medium (active) / font-normal (default)
Spacing: gap spacing-3 between icon and label
Padding: px spacing-3, py spacing-2
Radius: radius-sm
Transition: duration-default
```

## Implementation Notes

- Add two entries to the `navItems` array in `admin-sidebar.tsx`
- Insert after "User Management" (index 1) and before "Eval Suite" (index 2)
- Add SVG icons to `iconMap`: `file-text` for Report Registry, `alert-triangle` for Error Triage
- The existing `isActive` logic (`pathname === item.href || pathname.startsWith(item.href + "/")`) works correctly for both new routes
- Error Triage at `/admin/error-triage` will not false-match `/admin/error-*` since the check is exact or prefix+slash

## Component References

- AdminSidebar: `components/layout/admin-sidebar.tsx`
