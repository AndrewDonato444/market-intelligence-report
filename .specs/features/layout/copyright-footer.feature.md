---
feature: Copyright Footer
domain: layout
source: components/layout/footer.tsx
tests:
  - __tests__/layout/copyright-footer.test.tsx
components:
  - Footer
personas:
  - primary
status: implemented
created: 2026-03-16
updated: 2026-03-16
---

# Copyright Footer

**Source File**: components/layout/footer.tsx
**Design System**: .specs/design-system/tokens.md

## Feature: Copyright notices on all app pages

A reusable Footer component displaying © Modern Signal Advisory with the current year, visible on every page of the application.

### Scenario: Footer displays copyright text
Given the user is on any page of the application
Then a footer is visible at the bottom of the page
And it displays "© {current year} Modern Signal Advisory"

### Scenario: Footer appears on protected pages
Given the user is logged in
When they view any protected page (dashboard, reports, markets, settings)
Then the copyright footer is visible

### Scenario: Footer appears on admin pages
Given the user is an admin
When they view any admin page
Then the copyright footer is visible

### Scenario: Footer appears on auth pages
Given the user is not logged in
When they view sign-in or sign-up pages
Then the copyright footer is visible

### Scenario: Footer appears on landing page
Given a visitor is on the landing page
Then the copyright footer is visible at the bottom

### Scenario: Year updates automatically
Given the current year changes
Then the footer displays the new year without code changes

## UI Mockup

```
+--------------------------------------+
|          (page content)              |
+--------------------------------------+
|   © 2026 Modern Signal Advisory     |
+--------------------------------------+
```

## Component References

- Footer: components/layout/footer.tsx
