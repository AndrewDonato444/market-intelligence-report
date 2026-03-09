---
feature: Usage Dashboard
domain: account
source: app/(protected)/settings/usage/page.tsx
tests:
  - __tests__/account/usage-dashboard.test.tsx
components:
  - UsageDashboard
  - UsageSummaryCards
  - UsageByProvider
  - UsageLog
personas:
  - established-practitioner
  - rising-star-agent
status: specced
created: 2026-03-09
updated: 2026-03-09
---

# Usage Dashboard

**Source File**: app/(protected)/settings/usage/page.tsx
**Design System**: .specs/design-system/tokens.md

## Feature: Usage Dashboard

Provides agents with visibility into their API costs, report generation count, and billing summary. Uses the existing api-usage service for data and the subscription service for billing context.

### Scenario: Usage tab in settings navigation
Given an agent is on any settings page
When the settings layout renders
Then a "Usage" tab appears in the settings navigation alongside Profile and Account

### Scenario: Usage summary cards display top-level metrics
Given an agent navigates to /settings/usage
When the page loads
Then they see total API cost, total API calls, and cache hit rate as summary cards

### Scenario: Usage breakdown by provider
Given an agent has made API calls
When they view the usage dashboard
Then they see a breakdown of costs per provider (e.g., RealEstateAPI, ScrapingDog)
And each provider shows call count, total cost, and cache hits

### Scenario: Usage log shows recent API calls
Given an agent has usage history
When they view the usage log section
Then they see a table of recent API calls with provider, endpoint, cost, and time

### Scenario: Empty state for no usage
Given an agent has no API usage
When they view the usage dashboard
Then they see a message indicating no usage data yet

## User Journey

1. Agent views account settings (Feature #70)
2. Agent manages subscription (Feature #71)
3. **Agent views usage and costs** (this feature)

## UI Mockup

```
┌──────────────────────────────────────────────┐
│  Settings                                    │
│                                              │
│  [Profile]  [Account]  [Usage]    ← nav      │
│  ─────────────────────────────────────────── │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ $12.34   │  │  247     │  │  68%     │   │
│  │ Total    │  │ API      │  │ Cache    │   │
│  │ Cost     │  │ Calls    │  │ Hit Rate │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Usage by Provider                     │  │
│  │  ─── gold accent line ───              │  │
│  │                                        │  │
│  │  RealEstateAPI  $8.50  180 calls  62%  │  │
│  │  ScrapingDog    $3.84   67 calls  78%  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Recent API Calls                      │  │
│  │  ─── gold accent line ───              │  │
│  │                                        │  │
│  │  Provider    Endpoint    Cost   Time   │  │
│  │  RealEst..  /PropSearch  $0.05  234ms  │  │
│  │  Scraping.  /google_lo.  $0.02  189ms  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```
