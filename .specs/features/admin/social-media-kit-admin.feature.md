---
feature: Social Media Kit in Admin
domain: admin
source: app/api/admin/reports/[id]/route.ts, app/api/admin/analytics/route.ts, app/api/admin/analytics/kits/route.ts, components/admin/report-detail-panel.tsx, components/admin/analytics-nav.tsx, components/admin/kit-analytics-dashboard.tsx, app/admin/analytics/kits/page.tsx
tests:
  - __tests__/admin/social-media-kit-admin.test.ts
components:
  - ReportDetailPanel
  - AnalyticsDashboard
personas:
  - internal-admin
status: implemented
created: 2026-03-11
updated: 2026-03-11
---

# Social Media Kit in Admin

**Source Files**: `components/admin/report-detail-panel.tsx`, `app/api/admin/reports/[id]/route.ts`, `app/api/admin/analytics/route.ts`, `app/api/admin/analytics/kits/route.ts`
**Design System**: `.specs/design-system/tokens.md`
**Depends On**: Social Media Kit Data Model (#160), Admin Report List (#121), Analytics API Endpoints (#130)

## Feature: Social Media Kit in Admin (#165)

Admin visibility into social media kit usage across the platform. Two surfaces:

1. **Admin Report Detail** — when viewing a report at `/admin/reports/[id]`, show whether a social media kit was generated, its status, generation timing, content type counts, and error details if failed.

2. **Analytics Dashboard** — add social media kit metrics to the analytics overview and a dedicated kit analytics section: kit generation rate (% of completed reports that have a kit), kit generation volume over time, most-used content types, and kit error rate.

This gives the MSA team operational visibility into kit adoption and health without needing to check individual reports.

---

### Scenario: Admin views a report that has a completed social media kit
Given an admin user is signed in
And a report with status "completed" exists at `/admin/reports/[id]`
And a social media kit with status "completed" exists for that report
When the admin navigates to `/admin/reports/[id]`
Then they see a "Social Media Kit" section below the existing report sections
And the section shows status "Completed" with a green status badge
And the section shows the generation timestamp
And the section shows content type counts:
  | Content Type         | Count |
  | Post Ideas           | 8     |
  | Platform Captions    | 4     |
  | Persona Posts        | 6     |
  | Polls                | 3     |
  | Conversation Starters| 5     |
  | Stat Callouts        | 6     |
  | Calendar Weeks       | 4     |

### Scenario: Admin views a report that has a failed social media kit
Given a report exists with a social media kit with status "failed"
When the admin navigates to `/admin/reports/[id]`
Then the "Social Media Kit" section shows status "Failed" with a red status badge
And the error message from the kit is displayed
And the generation timestamp (attempted) is shown

### Scenario: Admin views a report that has a generating social media kit
Given a report exists with a social media kit with status "generating"
When the admin navigates to `/admin/reports/[id]`
Then the "Social Media Kit" section shows status "Generating" with an amber status badge
And no content counts are shown (kit is not yet complete)

### Scenario: Admin views a report with no social media kit
Given a report exists with no social media kit row in the database
When the admin navigates to `/admin/reports/[id]`
Then the "Social Media Kit" section shows "No kit generated" in muted text
And no error details or content counts are shown

### Scenario: Admin report detail API returns kit data
Given a completed social media kit exists for a report
When GET `/api/admin/reports/[id]` is called
Then the response includes a `socialMediaKit` object with:
  | Field          | Type               |
  | id             | string (uuid)      |
  | status         | string (enum)      |
  | generatedAt    | string (ISO date)  |
  | errorMessage   | string or null     |
  | contentCounts  | object             |
And `contentCounts` contains the count of items in each content type array (not the full content JSONB — admin doesn't need the actual text)

### Scenario: Admin report detail API returns null kit when none exists
Given no social media kit exists for the report
When GET `/api/admin/reports/[id]` is called
Then the response includes `socialMediaKit: null`

### Scenario: Analytics overview includes kit metrics
Given social media kits exist in the database (some completed, some failed)
When GET `/api/admin/analytics` is called
Then the response includes a `socialMediaKits` object with:
  | Field                | Description                                        |
  | totalGenerated       | Total kits with status "completed" (all time)       |
  | generatedLast30d     | Kits completed in last 30 days                      |
  | generationRate       | % of completed reports that have a completed kit    |
  | failedLast30d        | Failed kit generations in last 30 days              |
  | failureRate          | Failed / (completed + failed) in last 30 days       |

### Scenario: Dedicated kit analytics endpoint returns detailed stats
Given social media kits exist in the database
When GET `/api/admin/analytics/kits?period=30d` is called
Then the response includes:
  | Field                  | Description                                               |
  | volumeOverTime         | Array of { date, count } for kits generated per day/week  |
  | contentTypeCounts      | Aggregate counts by content type across all completed kits |
  | averageContentPerKit   | Average items per content type across completed kits       |
  | topContentTypes        | Content types ranked by average count per kit              |
  | kitsByStatus           | { completed, failed, generating, queued } counts           |

### Scenario: Kit analytics respects period filter
Given kits exist from various dates
When GET `/api/admin/analytics/kits?period=7d` is called
Then only kits created within the last 7 days are included in volumeOverTime
And kitsByStatus counts all kits (not period-filtered — this is a current state count)
And contentTypeCounts aggregates only kits from the filtered period

### Scenario: Kit analytics handles no kits gracefully
Given no social media kits exist in the database
When GET `/api/admin/analytics/kits` is called
Then the response returns zero counts for all fields
And volumeOverTime is an empty array
And averageContentPerKit has all zeros

### Scenario: Non-admin user is rejected from kit analytics
Given a user with role "user"
When they call GET `/api/admin/analytics/kits`
Then they receive a 401 Unauthorized response

---

## Architecture

### Admin Report Detail Changes

The existing `GET /api/admin/reports/[id]` endpoint adds a `socialMediaKit` field by joining the `social_media_kits` table:

```
GET /api/admin/reports/[id]
Response (existing fields + new):
{
  report: { ... },
  user: { ... },
  market: { ... },
  sections: [ ... ],
  apiUsage: [ ... ],
  totalApiCost: "...",
  socialMediaKit: {                  // NEW
    id: "uuid",
    status: "completed",
    generatedAt: "2026-03-11T...",
    errorMessage: null,
    contentCounts: {
      postIdeas: 8,
      captions: 4,
      personaPosts: 6,
      polls: 3,
      conversationStarters: 5,
      statCallouts: 6,
      calendarSuggestions: 4
    }
  } | null
}
```

The API queries `social_media_kits` where `reportId` matches, extracts counts from the JSONB `content` column using `jsonb_array_length()`, and returns the summary — not the full content text.

### Analytics Overview Changes

The existing `GET /api/admin/analytics` endpoint adds a `socialMediaKits` section:

```
GET /api/admin/analytics
Response (existing fields + new):
{
  reportVolume: { ... },
  userCount: { ... },
  errorRate: { ... },
  avgGenerationTime: { ... },
  socialMediaKits: {                 // NEW
    totalGenerated: 42,
    generatedLast30d: 15,
    generationRate: 0.65,
    failedLast30d: 2,
    failureRate: 0.12
  }
}
```

### New Kit Analytics Endpoint

```
GET /api/admin/analytics/kits?period=30d|7d|24h
Response:
{
  volumeOverTime: [
    { date: "2026-03-01", count: 3 },
    { date: "2026-03-02", count: 5 },
    ...
  ],
  contentTypeCounts: {
    postIdeas: 120,
    captions: 60,
    personaPosts: 45,
    polls: 30,
    conversationStarters: 38,
    statCallouts: 55,
    calendarSuggestions: 42
  },
  averageContentPerKit: {
    postIdeas: 7.5,
    captions: 3.8,
    personaPosts: 4.2,
    polls: 2.8,
    conversationStarters: 4.1,
    statCallouts: 5.5,
    calendarSuggestions: 4.0
  },
  topContentTypes: ["postIdeas", "statCallouts", "conversationStarters", ...],
  kitsByStatus: {
    completed: 42,
    failed: 5,
    generating: 1,
    queued: 0
  }
}
```

### UI Components

**ReportDetailPanel** (`components/admin/report-detail-panel.tsx`) — add a "Social Media Kit" card section after the existing "Report Sections" and "API Usage" tables:

- Status badge using same `STATUS_COLORS` mapping already in the component
- Content type counts displayed as a compact 2-column grid
- Error message shown inline for failed kits
- "No kit generated" empty state for reports without kits

**Analytics Dashboard** — kit metrics appear in:
1. The overview page (`app/admin/analytics/page.tsx`) as a new summary card alongside existing volume/users/errors cards
2. Kit-specific analytics could be added to the existing analytics layout as a new sub-page or integrated into the overview

---

## User Journey

1. Admin navigates to `/admin/reports` (Report Registry)
2. Admin clicks on a specific report to view details
3. **Admin sees Social Media Kit section with status + content counts**
4. Admin navigates to `/admin/analytics`
5. **Admin sees kit generation rate and volume alongside existing metrics**
6. Admin drills into kit analytics for content type breakdowns

---

## UI Mockup

### Admin Report Detail — Kit Section

```
/admin/reports/[id]
+----------------------------------------------------------+
| <- Back to Report Registry                                |
| Naples Ultra-Luxury Q1 2026                   [Completed] |
| Created Mar 11, 2026 . Version 1                         |
+----------------------------------------------------------+
| Agent       | Market           | Generation Time          |
| Alex Rivera | Naples, FL       | 2m 34s                  |
| Knox & Co   | Ultra Luxury $6M+| Started Mar 11, 10:23am |
+----------------------------------------------------------+
| Report Sections (9)                                       |
| Section              | Agent              | Generated At   |
| Market Overview      | insight-generator  | Mar 11, 10:24  |
| ...                  | ...                | ...            |
+----------------------------------------------------------+
| Social Media Kit                            [Completed]   |
|                                                           |
| Generated Mar 11, 2026 at 10:45am                        |
|                                                           |
| Content Summary                                           |
| +---------------------+---------------------+             |
| | Post Ideas        8 | Polls             3 |             |
| | Captions          4 | Starters          5 |             |
| | Persona Posts     6 | Stat Callouts     6 |             |
| | Calendar Weeks    4 |                     |             |
| +---------------------+---------------------+             |
+----------------------------------------------------------+
| API Usage                                   Total: $0.42  |
| Provider  | Endpoint       | Cost   | Time  | Cached      |
| anthropic | /messages      | $0.38  | 12.3s | No          |
| ...       | ...            | ...    | ...   | ...         |
+----------------------------------------------------------+
```

### Admin Report Detail — Failed Kit

```
| Social Media Kit                              [Failed]    |
|                                                           |
| Attempted Mar 11, 2026 at 10:45am                        |
| Error: Claude API rate limit exceeded (429).              |
|        Retry after 60 seconds.                            |
+----------------------------------------------------------+
```

### Admin Report Detail — No Kit

```
| Social Media Kit                                          |
|                                                           |
| No kit generated                                          |
+----------------------------------------------------------+
```

### Analytics Overview — Kit Summary Card

```
/admin/analytics
+----------------------------------------------------------+
| Reports (30d)  | Users       | Error Rate  | Kit Adoption|
| 47 reports     | 12 active   | 4.3% (7d)   | 65% of     |
| up from 32     | 3 new       | 6.1% (30d)  | reports     |
|                |             |             | 15 kits     |
+----------------------------------------------------------+
```

---

## Component References

- ReportDetailPanel: `components/admin/report-detail-panel.tsx` (update — add kit section)
- AnalyticsDashboard: `app/admin/analytics/page.tsx` (update — add kit summary card)
- AdminSidebar: `components/layout/admin-sidebar.tsx` (no changes needed — analytics already listed)

---

## Data Sources

- **`social_media_kits` table**: Kit status, content JSONB, generatedAt, errorMessage
- **`reports` table**: Join for report-to-kit relationship, completed report count for generation rate
- **JSONB content counting**: Use `jsonb_array_length(content->'postIdeas')` etc. for content counts without loading full content

---

## Implementation Notes

- The admin report detail API already returns `report`, `user`, `market`, `sections`, `apiUsage`, `totalApiCost`. Adding `socialMediaKit` is a single left join on `social_media_kits` where `reportId` matches.
- Content counts should be computed server-side from JSONB — don't send the full kit content to admin (it could be large).
- The analytics overview endpoint (`GET /api/admin/analytics`) already aggregates report volume, user counts, error rates, and generation time. Adding kit metrics is additive — new queries against `social_media_kits`.
- The dedicated kit analytics endpoint (`GET /api/admin/analytics/kits`) follows the same pattern as existing analytics endpoints (period filtering, `requireAdmin()`, aggregate SQL queries).
- No changes needed to the admin sidebar — analytics is already listed.
