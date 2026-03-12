---
feature: Admin Subscription Tier Management
domain: admin
source: app/admin/tiers/page.tsx
tests:
  - __tests__/admin/tier-management-api.test.ts
  - __tests__/admin/tier-management-dashboard.test.tsx
components:
  - TierManagementDashboard
status: implemented
created: 2026-03-12
updated: 2026-03-12
---

# Admin: Subscription Tier Management

**Source File**: app/admin/tiers/page.tsx
**Design System**: .specs/design-system/tokens.md
**API Routes**: app/api/admin/tiers/route.ts, app/api/admin/tiers/[id]/route.ts

## Feature: Subscription Tier Management

Admin users can create, read, update, and delete subscription tiers.

### Scenario: Admin views list of tiers
Given the admin is authenticated
When they navigate to /admin/tiers
Then they see all tiers sorted by sortOrder
And each tier shows name, display price, entitlement summary, active status

### Scenario: Admin creates a new tier
Given the admin is on the tiers page
When they click "Add Tier" and fill in the form
Then the tier is created in the database and the list refreshes

### Scenario: Admin edits an existing tier
Given the admin is on the tiers page
When they click "Edit" on a tier and modify values
Then the tier is updated in the database and the list refreshes

### Scenario: Admin toggles tier active/inactive
When they click the active toggle for a tier
Then the tier's isActive status flips

### Scenario: Admin deletes a tier
When they click "Delete" and confirm
Then the tier is deleted from the database

### Scenario: Admin reorders tiers
When they use move up/down buttons
Then the sort order is updated

### Scenario: Non-admin access denied
Given a non-admin user
When they try to access /api/admin/tiers
Then they receive a 401 response

### Scenario: Sidebar navigation
Given the admin is authenticated
Then they see "Subscription Tiers" nav item linking to /admin/tiers

## Component References

- AdminSidebar: components/layout/admin-sidebar.tsx (add nav item)
- TierManagementDashboard: components/admin/tier-management-dashboard.tsx (new)

## Learnings
