# Feature ↔ Test ↔ Component Mapping

_Auto-generated from feature specs. Do not edit directly._
_Regenerate with: `./scripts/generate-mapping.sh`_

## Legend

| Status | Meaning |
|--------|---------|
| stub | Spec created, not yet tested |
| specced | Spec complete with scenarios |
| tested | Tests written |
| implemented | Feature complete |

---

## Features

| Domain | Feature | Source | Tests | Components | Status |
|--------|---------|--------|-------|------------|--------|
| agent-pipeline | [Agent Orchestration Framework](.specs/features/agent-pipeline/agent-orchestration.feature.md) | `lib/agents/orchestrator.ts` | see spec | see spec | implemented |
| agent-pipeline | [Agent Output Schema + Validation](.specs/features/agent-pipeline/agent-output-schema.feature.md) | `lib/agents/schema.ts` | see spec | see spec | implemented |
| agent-pipeline | [Competitive Analyst Agent](.specs/features/agent-pipeline/competitive-analyst-agent.feature.md) | `lib/agents/competitive-analyst.ts` | see spec | see spec | specced |
| agent-pipeline | [Data Analyst Agent](.specs/features/agent-pipeline/data-analyst-agent.feature.md) | `lib/agents/data-analyst.ts` | see spec | see spec | implemented |
| agent-pipeline | [Forecast Modeler Agent](.specs/features/agent-pipeline/forecast-modeler-agent.feature.md) | `lib/agents/forecast-modeler.ts` | see spec | see spec | specced |
| agent-pipeline | [Insight Generator Agent](.specs/features/agent-pipeline/insight-generator-agent.feature.md) | `lib/agents/insight-generator.ts` | see spec | see spec | specced |
| agent-pipeline | [Polish Agent](.specs/features/agent-pipeline/polish-agent.feature.md) | `lib/agents/polish-agent.ts` | see spec | see spec | specced |
| data-infrastructure | [API Cost Tracking + Usage Logging](.specs/features/data-infrastructure/api-cost-tracking.feature.md) | `app/api/usage/route.ts, lib/services/api-usage.ts` | see spec | see spec | implemented |
| data-infrastructure | [Cache Layer — DB-backed with TTL by Data Type](.specs/features/data-infrastructure/cache-layer.feature.md) | `lib/services/cache.ts, lib/services/api-usage.ts` | see spec | see spec | implemented |
| data-infrastructure | [Data Freshness Indicators + Staleness Fallback](.specs/features/data-infrastructure/data-freshness.feature.md) | `lib/services/data-freshness.ts` | see spec | see spec | implemented |
| data-infrastructure | [RealEstateAPI Connector](.specs/features/data-infrastructure/realestateapi-connector.feature.md) | `lib/connectors/realestateapi.ts` | see spec | see spec | implemented |
| data-infrastructure | [ScrapingDog Connector](.specs/features/data-infrastructure/scrapingdog-connector.feature.md) | `lib/connectors/scrapingdog.ts` | see spec | see spec | implemented |
| foundation | [Authentication with Supabase](.specs/features/foundation/authentication.feature.md) | `middleware.ts, app/(auth)/sign-in/[[...sign-in]]/page.tsx, app/(auth)/sign-up/[[...sign-up]]/page.tsx` | see spec | see spec | implemented |
| foundation | [Base App Layout](.specs/features/foundation/base-layout.feature.md) | `components/layout/top-nav.tsx, components/layout/sidebar.tsx, components/layout/page-shell.tsx, app/(protected)/layout.tsx` | see spec | see spec | implemented |
| foundation | [Database Schema + Supabase Setup](.specs/features/foundation/database-schema.feature.md) | `lib/db/schema.ts, lib/db/index.ts, lib/db/migrations/` | see spec | see spec | implemented |
| foundation | [Environment Config + API Key Management](.specs/features/foundation/env-config.feature.md) | `lib/config/env.ts, .env.local.example` | see spec | see spec | implemented |
| foundation | [Next.js Project Scaffold + Tailwind + Design Tokens](.specs/features/foundation/project-scaffold.feature.md) | `app/layout.tsx, app/page.tsx, tailwind.config.ts, app/globals.css` | see spec | see spec | implemented |
| report-builder | [Pipeline Status Dashboard](.specs/features/report-builder/pipeline-status-dashboard.feature.md) | `app/(protected)/reports/[id]/page.tsx` | see spec | see spec | implemented |
| report-builder | [Report Builder Wizard](.specs/features/report-builder/report-builder-wizard.feature.md) | `components/reports/report-wizard.tsx` | see spec | see spec | implemented |
| report-builder | [Report Preview](.specs/features/report-builder/report-preview.feature.md) | `components/reports/report-preview.tsx` | see spec | see spec | implemented |
| report-template | [Report Cover, TOC, and Market Overview + Insights Index](.specs/features/report-template/report-cover-toc-overview.feature.md) | `lib/pdf/templates/cover-page.tsx` | see spec | see spec | implemented |
| report-template | [Report Template Engine](.specs/features/report-template/report-template-engine.feature.md) | `lib/pdf/document.tsx` | see spec | see spec | implemented |
| user-setup | [Agent Profile + Branding](.specs/features/user-setup/agent-profile.feature.md) | `app/(protected)/settings/profile/page.tsx, app/api/profile/route.ts, lib/services/profile.ts, lib/services/profile-validation.ts` | see spec | see spec | implemented |
| user-setup | [Market Definition Wizard](.specs/features/user-setup/market-definition.feature.md) | `app/(protected)/markets/new/page.tsx, app/api/markets/route.ts, lib/services/market.ts, lib/services/market-validation.ts` | see spec | see spec | implemented |
| user-setup | [Market Configuration Persistence + Edit](.specs/features/user-setup/market-edit.feature.md) | `app/(protected)/markets/[id]/edit/page.tsx, app/api/markets/[id]/route.ts, lib/services/market.ts` | see spec | see spec | implemented |
| user-setup | [Peer Market Selection](.specs/features/user-setup/peer-markets.feature.md) | `app/(protected)/markets/[id]/peers/page.tsx, app/api/markets/[id]/peers/route.ts, lib/services/market.ts` | see spec | see spec | implemented |

---

## Summary

| Status | Count |
|--------|-------|
| stub | 0 |
| specced | 4 |
| tested | 0 |
| implemented | 22 |
| **Total** | **26** |

---

## By Status

### Stub

_None_

### Specced

- [Competitive Analyst Agent](.specs/features/agent-pipeline/competitive-analyst-agent.feature.md)
- [Forecast Modeler Agent](.specs/features/agent-pipeline/forecast-modeler-agent.feature.md)
- [Insight Generator Agent](.specs/features/agent-pipeline/insight-generator-agent.feature.md)
- [Polish Agent](.specs/features/agent-pipeline/polish-agent.feature.md)

### Tested

_None_

### Implemented

- [Agent Orchestration Framework](.specs/features/agent-pipeline/agent-orchestration.feature.md)
- [Agent Output Schema + Validation](.specs/features/agent-pipeline/agent-output-schema.feature.md)
- [Data Analyst Agent](.specs/features/agent-pipeline/data-analyst-agent.feature.md)
- [API Cost Tracking + Usage Logging](.specs/features/data-infrastructure/api-cost-tracking.feature.md)
- [Cache Layer — DB-backed with TTL by Data Type](.specs/features/data-infrastructure/cache-layer.feature.md)
- [Data Freshness Indicators + Staleness Fallback](.specs/features/data-infrastructure/data-freshness.feature.md)
- [RealEstateAPI Connector](.specs/features/data-infrastructure/realestateapi-connector.feature.md)
- [ScrapingDog Connector](.specs/features/data-infrastructure/scrapingdog-connector.feature.md)
- [Authentication with Supabase](.specs/features/foundation/authentication.feature.md)
- [Base App Layout](.specs/features/foundation/base-layout.feature.md)
- [Database Schema + Supabase Setup](.specs/features/foundation/database-schema.feature.md)
- [Environment Config + API Key Management](.specs/features/foundation/env-config.feature.md)
- [Next.js Project Scaffold + Tailwind + Design Tokens](.specs/features/foundation/project-scaffold.feature.md)
- [Pipeline Status Dashboard](.specs/features/report-builder/pipeline-status-dashboard.feature.md)
- [Report Builder Wizard](.specs/features/report-builder/report-builder-wizard.feature.md)
- [Report Preview](.specs/features/report-builder/report-preview.feature.md)
- [Report Cover, TOC, and Market Overview + Insights Index](.specs/features/report-template/report-cover-toc-overview.feature.md)
- [Report Template Engine](.specs/features/report-template/report-template-engine.feature.md)
- [Agent Profile + Branding](.specs/features/user-setup/agent-profile.feature.md)
- [Market Definition Wizard](.specs/features/user-setup/market-definition.feature.md)
- [Market Configuration Persistence + Edit](.specs/features/user-setup/market-edit.feature.md)
- [Peer Market Selection](.specs/features/user-setup/peer-markets.feature.md)

---

## Design System

See `.specs/design-system/tokens.md` for token reference.

### Documented Components

| Component | Status | Source |
|-----------|--------|--------|

---

## How This File Works

This file is **auto-generated** from feature spec YAML frontmatter.

**Do not edit this file directly.** Instead:
1. Update the feature spec's YAML frontmatter
2. Run `./scripts/generate-mapping.sh` (or it runs automatically via Cursor hook)

### Frontmatter Format

```yaml
---
feature: Feature Name
domain: domain-name
source: path/to/source.tsx
tests:
  - path/to/test.ts
components:
  - ComponentName
status: stub | specced | tested | implemented
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```
