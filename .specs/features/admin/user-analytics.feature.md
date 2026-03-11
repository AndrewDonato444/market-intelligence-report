---
feature: User Analytics
domain: admin
source: app/admin/analytics/users/page.tsx, components/admin/user-analytics-dashboard.tsx, app/api/admin/analytics/users/route.ts
tests:
  - __tests__/admin/user-analytics-dashboard.test.tsx
components:
  - UserAnalyticsDashboard
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# User Analytics

**Source Files**: `app/admin/analytics/users/page.tsx`, `components/admin/user-analytics-dashboard.tsx`, `app/api/admin/analytics/users/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Analytics API Endpoints (#130), Activity Log Schema (#111)

## Feature: User Analytics

Admin analytics view showing user engagement metrics: active users, new signups over time, power users (most reports generated), and churn indicators (users who stopped generating reports). Uses real data from the `users`, `reports`, and `user_activity` tables. Extends the existing `/api/admin/analytics/users` endpoint with power user and churn data. Adds a "Users" tab to the analytics navigation.

### Scenario: Dashboard loads with user KPI cards
Given an admin navigates to `/admin/analytics/users`
When the page loads
Then the users analytics API is called
And four KPI cards are displayed: total users, active users (report in last 30d), new signups (last 30d), inactive users (no report in 60d+)

### Scenario: Signup trend chart renders with default period
Given an admin is on the user analytics page
When the page loads
Then a line chart shows new signups over time with `period=30d` and `granularity=daily`
And each data point shows the signup count for that bucket

### Scenario: Admin changes period filter
Given an admin is on the user analytics page
When they click the "90d" period tab
Then the API is called with `period=90d` and the current granularity
And the signup chart and all metrics update to reflect the selected time range

### Scenario: Admin changes granularity
Given an admin is on the user analytics page
When they select "Weekly" granularity
Then the API is called with `granularity=weekly` and the current period
And the signup chart updates with weekly-bucketed data

### Scenario: Power users table displays top report generators
Given an admin is on the user analytics page
When data loads
Then a "Power Users" table shows the top 10 users ranked by report count
And each row shows: user name, email, report count, last report date
And rows are sorted by report count descending

### Scenario: Churn indicators section shows at-risk users
Given an admin is on the user analytics page
When data loads
Then a "Churn Indicators" section shows users who were active (report in prior 90d) but inactive (no report in last 30d)
And each row shows: user name, email, last report date, days since last report
And the section header shows the total count of at-risk users

### Scenario: Empty state with no users
Given the platform has no users beyond the admin
When an admin loads the user analytics page
Then KPI cards show zero or minimal values
And the signup chart shows an empty state message
And the power users table shows an empty state

### Scenario: Loading state
Given an admin navigates to user analytics
When data is being fetched
Then a loading spinner is displayed across all sections

### Scenario: Error state with retry
Given the analytics API is unreachable
When an admin loads user analytics
Then an error message is displayed with a "Retry" button
When they click "Retry"
Then the API is called again

### Scenario: Analytics tab navigation includes Users
Given an admin is on any analytics sub-page
Then the analytics tab bar includes "Volume", "Geographic", and "Users" tabs
And the "Users" tab links to `/admin/analytics/users`

### Scenario: Admin clicks through to user detail
Given an admin is viewing the power users table
When they click a user's name
Then they are navigated to `/admin/users/{userId}` (the admin user detail page)

## User Journey

1. Admin clicks "Analytics" in the admin sidebar
2. Admin clicks the "Users" tab in the analytics navigation
3. **User Analytics dashboard loads with KPI cards, signup chart, power users, and churn indicators**
4. Admin adjusts period/granularity to explore signup trends
5. Admin identifies at-risk users in the churn section and clicks through to their profiles

## UI Mockup

```
┌─ Analytics Nav (bg: surface, border-bottom: border) ─────────────────────┐
│  [Volume]  [Geographic]  [Users (bg: primary-light, border: accent)]     │
└──────────────────────────────────────────────────────────────────────────-┘

┌─ KPI Cards Row (gap: spacing-6) ────────────────────────────────────────-┐
│                                                                          │
│  ┌─ Card (bg: surface, radius: md, shadow: sm, p: spacing-4) ────────┐  │
│  │  Total Users (font: sans, text: sm, color: text-secondary)        │  │
│  │  247 (font: sans, text: 2xl, weight: bold, color: text)           │  │
│  └───────────────────────────────────────────────────────────────────-┘  │
│                                                                          │
│  ┌─ Card ────────────────────────────────────────────────────────────-┐  │
│  │  Active Users (font: sans, text: sm, color: text-secondary)       │  │
│  │  189 (font: sans, text: 2xl, weight: bold, color: success)        │  │
│  │  last 30d                                                         │  │
│  └───────────────────────────────────────────────────────────────────-┘  │
│                                                                          │
│  ┌─ Card ────────────────────────────────────────────────────────────-┐  │
│  │  New Signups (font: sans, text: sm, color: text-secondary)        │  │
│  │  34 (font: sans, text: 2xl, weight: bold, color: accent)          │  │
│  │  last 30d                                                         │  │
│  └───────────────────────────────────────────────────────────────────-┘  │
│                                                                          │
│  ┌─ Card ────────────────────────────────────────────────────────────-┐  │
│  │  Inactive (60d+) (font: sans, text: sm, color: text-secondary)    │  │
│  │  23 (font: sans, text: 2xl, weight: bold, color: warning)         │  │
│  └───────────────────────────────────────────────────────────────────-┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────-┘

┌─ Signup Trends (bg: surface, radius: md, shadow: sm, p: spacing-6) ────-┐
│                                                                          │
│  New Signups Over Time (font: sans, text: lg, weight: semibold)          │
│                                                                          │
│  ┌─ Period Tabs ────────────────────────────────────────────────────-┐   │
│  │  [7d]  [30d (active: accent)]  [90d]  [365d]                    │   │
│  └──────────────────────────────────────────────────────────────────-┘   │
│  ┌─ Granularity Tabs ──────────────────────────────────────────────-┐   │
│  │  [Daily (active)]  [Weekly]  [Monthly]                           │   │
│  └──────────────────────────────────────────────────────────────────-┘   │
│                                                                          │
│  ┌─ Line Chart (Recharts, color: chart-accent) ────────────────────-┐   │
│  │       ╱╲                                                         │   │
│  │      ╱  ╲    ╱╲                                                  │   │
│  │  ╱╲╱    ╲╱╲╱  ╲                                                  │   │
│  │ ╱              ╲╱                                                │   │
│  │──────────────────────────────────────────────                    │   │
│  │ Mar 1    Mar 5    Mar 10   Mar 15   Mar 20                      │   │
│  └──────────────────────────────────────────────────────────────────-┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────-┘

┌─ Power Users (bg: surface, radius: md, shadow: sm, p: spacing-6) ──────-┐
│                                                                          │
│  Top Report Generators (font: sans, text: lg, weight: semibold)          │
│                                                                          │
│  ┌─ Table (font: sans) ────────────────────────────────────────────-┐   │
│  │  NAME (text: xs, weight: medium,  EMAIL   REPORTS  LAST REPORT  │   │
│  │        color: text-secondary)                                    │   │
│  │  ─────────────────────────────────────────────────────────────   │   │
│  │  Jordan Ellis (link, color: accent) jordan@... 47  Mar 10, 2026 │   │
│  │  Morgan Hale                        morgan@... 38  Mar 9, 2026  │   │
│  │  Taylor Kim                         taylor@... 31  Mar 11, 2026 │   │
│  │  Alex Rivera                        alex@...   28  Mar 8, 2026  │   │
│  │  Pat Donovan                        pat@...    22  Mar 7, 2026  │   │
│  │  ...                                                             │   │
│  └──────────────────────────────────────────────────────────────────-┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────-┘

┌─ Churn Indicators (bg: surface, radius: md, shadow: sm, p: spacing-6) ─-┐
│                                                                          │
│  At-Risk Users (font: sans, text: lg, weight: semibold)                  │
│  12 users active in prior 90d but no report in last 30d                  │
│  (font: sans, text: sm, color: text-secondary)                           │
│                                                                          │
│  ┌─ Table (font: sans) ────────────────────────────────────────────-┐   │
│  │  NAME                  EMAIL              LAST REPORT  DAYS AGO │   │
│  │  ─────────────────────────────────────────────────────────────   │   │
│  │  Casey Morgan (link)   casey@...          Feb 5, 2026    34     │   │
│  │  Robin Park            robin@...          Jan 28, 2026   42     │   │
│  │  Sam Chen              sam@...            Jan 15, 2026   55     │   │
│  │  ...                                                             │   │
│  └──────────────────────────────────────────────────────────────────-┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────-┘
```

## API Design

### Enhanced `/api/admin/analytics/users` endpoint

**Query Parameters**: `period` (7d, 30d, 90d, 365d), `granularity` (daily, weekly, monthly)

**Response Shape**:
```json
{
  "signups": [{ "date": "2026-03-01", "count": 5 }],
  "summary": {
    "totalUsers": 247,
    "activeUsers": 189,
    "newSignups": 34,
    "inactiveOver60d": 23
  },
  "powerUsers": [
    {
      "id": "uuid",
      "name": "Jordan Ellis",
      "email": "jordan@...",
      "reportCount": 47,
      "lastReportDate": "2026-03-10T..."
    }
  ],
  "churnRisk": [
    {
      "id": "uuid",
      "name": "Casey Morgan",
      "email": "casey@...",
      "lastReportDate": "2026-02-05T...",
      "daysSinceLastReport": 34
    }
  ],
  "period": "30d",
  "granularity": "daily"
}
```

### Queries

- **Active users**: `SELECT DISTINCT userId FROM reports WHERE createdAt >= NOW() - 30d`
- **Power users**: `SELECT userId, COUNT(*) as reportCount, MAX(createdAt) as lastReport FROM reports GROUP BY userId ORDER BY reportCount DESC LIMIT 10`
- **Churn risk**: Users who have a report in the (30d–90d ago) window but NOT in the last 30d window. Ordered by last report date ascending (i.e. most days since last report first).
- **Signups**: Group `users.createdAt` by date bucket (same zero-fill pattern as volume endpoint)

## Component References

- Design tokens: `.specs/design-system/tokens.md`
- Pattern: follows `VolumeMetricsDashboard` layout (KPI cards + chart + tables)
- Navigation: extends `analytics-nav.tsx` with "Users" tab
- APIs: `/api/admin/analytics/users` (enhanced with power users + churn data)
- Recharts: reuse existing chart patterns from volume metrics

## Persona Revision Notes

- **Internal admin** is the user here — MSA team members monitoring platform health
- Labels use business vocabulary: "Active Users" not "DAU/MAU", "At-Risk" not "Churned", "Power Users" not "Top N by report_count"
- "Inactive (60d+)" uses a parenthetical qualifier so the admin immediately understands the threshold
- Churn section says "active in prior 60d but no report in last 30d" — explains the logic, doesn't assume the admin knows the formula
- User names in tables are clickable links (color: accent) to the admin user detail page — operational shortcut for investigating at-risk accounts
