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
| account | [Account Settings Page](.specs/features/account/account-settings.feature.md) | `app/(protected)/settings/account/page.tsx` | see spec | see spec | specced |
| account | [Subscription Management + Stripe Integration](.specs/features/account/subscription-management.feature.md) | `app/(protected)/settings/account/page.tsx` | see spec | see spec | specced |
| account | [Usage Dashboard](.specs/features/account/usage-dashboard.feature.md) | `app/(protected)/settings/usage/page.tsx` | see spec | see spec | specced |
| admin | [Activity Log Schema](.specs/features/admin/activity-log-schema.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| admin | [Admin Dashboard](.specs/features/admin/admin-dashboard.feature.md) | `app/admin/layout.tsx, app/admin/eval/page.tsx, components/layout/admin-sidebar.tsx, lib/supabase/admin-auth.ts` | see spec | see spec | implemented |
| admin | [Admin Report Detail](.specs/features/admin/admin-report-detail.feature.md) | `app/admin/reports/[id]/page.tsx, components/admin/report-detail-panel.tsx, app/api/admin/reports/[id]/route.ts` | see spec | see spec | implemented |
| admin | [Admin Report List](.specs/features/admin/admin-report-list.feature.md) | `app/admin/reports/page.tsx, components/admin/report-list-dashboard.tsx, app/api/admin/reports/route.ts` | see spec | see spec | implemented |
| admin | [Admin Sidebar — Report Registry & Error Triage Nav](.specs/features/admin/admin-sidebar-report-registry.feature.md) | `components/layout/admin-sidebar.tsx` | see spec | see spec | implemented |
| admin | [Admin Sidebar Update](.specs/features/admin/admin-sidebar-update.feature.md) | `components/layout/admin-sidebar.tsx, components/layout/sidebar.tsx` | see spec | see spec | implemented |
| admin | [Admin Subscription Tier Management](.specs/features/admin/admin-tier-management.feature.md) | `app/admin/tiers/page.tsx` | see spec | see spec | implemented |
| admin | [Admin User Detail](.specs/features/admin/admin-user-detail.feature.md) | `app/admin/users/[id]/page.tsx` | see spec | see spec | implemented |
| admin | [Admin User List](.specs/features/admin/admin-user-list.feature.md) | `app/admin/users/page.tsx, components/admin/user-list-dashboard.tsx, app/api/admin/users/route.ts, components/layout/admin-sidebar.tsx` | see spec | see spec | implemented |
| admin | [Analytics API Endpoints](.specs/features/admin/analytics-api-endpoints.feature.md) | `app/api/admin/analytics/route.ts, app/api/admin/analytics/volume/route.ts, app/api/admin/analytics/users/route.ts, app/api/admin/analytics/errors/route.ts` | see spec | see spec | implemented |
| admin | [Analytics Data Export](.specs/features/admin/analytics-data-export.feature.md) | `lib/utils/analytics-export.ts, components/admin/export-button.tsx` | see spec | see spec | implemented |
| admin | [Delete Account](.specs/features/admin/delete-account.feature.md) | `app/api/admin/users/[id]/delete/route.ts` | see spec | see spec | implemented |
| admin | [Error Triage View](.specs/features/admin/error-triage-view.feature.md) | `app/admin/error-triage/page.tsx, components/admin/error-triage-dashboard.tsx, app/api/admin/reports/errors/route.ts` | see spec | see spec | implemented |
| admin | [Eval Regression Tracking](.specs/features/admin/eval-regression-tracking.feature.md) | `app/admin/eval/report/page.tsx, components/eval/report-eval-dashboard.tsx, lib/eval/report-eval/history.ts` | see spec | see spec | implemented |
| admin | [Geographic Analytics](.specs/features/admin/geographic-analytics.feature.md) | `app/api/admin/analytics/geographic/route.ts, components/admin/geographic-analytics-dashboard.tsx, app/admin/analytics/geographic/page.tsx, components/admin/analytics-nav.tsx, app/admin/analytics/layout.tsx` | see spec | see spec | implemented |
| admin | [Pipeline Performance Metrics](.specs/features/admin/pipeline-performance.feature.md) | `app/admin/analytics/performance/page.tsx, components/admin/pipeline-performance-dashboard.tsx, app/api/admin/analytics/performance/route.ts` | see spec | see spec | implemented |
| admin | [Pipeline Re-trigger](.specs/features/admin/pipeline-re-trigger.feature.md) | `app/api/admin/reports/[id]/retry/route.ts` | see spec | see spec | implemented |
| admin | [Report Error Tracking Schema](.specs/features/admin/report-error-tracking-schema.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| admin | [Report Eval Dashboard](.specs/features/admin/report-eval-dashboard.feature.md) | `app/admin/eval/report/page.tsx, components/eval/report-eval-dashboard.tsx` | see spec | see spec | implemented |
| admin | [Report Eval Runner](.specs/features/admin/report-eval-runner.feature.md) | `lib/eval/report-eval/runner.ts, lib/eval/report-eval/judge.ts` | see spec | see spec | implemented |
| admin | [Report Eval Test Cases](.specs/features/admin/report-eval-test-cases.feature.md) | `lib/eval/report-eval/types.ts, lib/eval/report-eval/test-cases.ts, lib/eval/report-eval/fixtures.ts` | see spec | see spec | implemented |
| admin | [Social Media Kit in Admin](.specs/features/admin/social-media-kit-admin.feature.md) | `app/api/admin/reports/[id]/route.ts, app/api/admin/analytics/route.ts, app/api/admin/analytics/kits/route.ts, components/admin/report-detail-panel.tsx, components/admin/analytics-nav.tsx, components/admin/kit-analytics-dashboard.tsx, app/admin/analytics/kits/page.tsx` | see spec | see spec | implemented |
| admin | [Suspend/Unsuspend Account](.specs/features/admin/suspend-unsuspend.feature.md) | `app/api/admin/users/[id]/status/route.ts` | see spec | see spec | implemented |
| admin | [System Monitoring Dashboard](.specs/features/admin/system-monitoring-dashboard.feature.md) | `app/admin/monitoring/page.tsx, components/admin/system-monitoring-dashboard.tsx, app/api/admin/monitoring/route.ts` | see spec | see spec | implemented |
| admin | [User Analytics](.specs/features/admin/user-analytics.feature.md) | `app/admin/analytics/users/page.tsx, components/admin/user-analytics-dashboard.tsx, app/api/admin/analytics/users/route.ts` | see spec | see spec | implemented |
| admin | [User Status Schema](.specs/features/admin/user-status-schema.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| admin | [Volume Metrics Dashboard](.specs/features/admin/volume-metrics-dashboard.feature.md) | `app/admin/analytics/page.tsx, components/admin/volume-metrics-dashboard.tsx` | see spec | see spec | implemented |
| agent-pipeline | [Agent Orchestration Framework](.specs/features/agent-pipeline/agent-orchestration.feature.md) | `lib/agents/orchestrator.ts` | see spec | see spec | implemented |
| agent-pipeline | [Agent Output Schema + Validation](.specs/features/agent-pipeline/agent-output-schema.feature.md) | `lib/agents/schema.ts` | see spec | see spec | implemented |
| agent-pipeline | [Competitive Analyst Agent](.specs/features/agent-pipeline/competitive-analyst-agent.feature.md) | `lib/agents/competitive-analyst.ts` | see spec | see spec | deprecated |
| agent-pipeline | [Data Analyst Agent](.specs/features/agent-pipeline/data-analyst-agent.feature.md) | `lib/agents/data-analyst.ts` | see spec | see spec | implemented |
| agent-pipeline | [Forecast Modeler Agent](.specs/features/agent-pipeline/forecast-modeler-agent.feature.md) | `lib/agents/forecast-modeler.ts` | see spec | see spec | implemented |
| agent-pipeline | [Insight Generator Agent](.specs/features/agent-pipeline/insight-generator-agent.feature.md) | `lib/agents/insight-generator.ts` | see spec | see spec | implemented |
| agent-pipeline | [Pipeline Evaluation Suite](.specs/features/agent-pipeline/pipeline-eval-suite.feature.md) | `app/admin/eval/page.tsx, components/eval/eval-dashboard.tsx, app/api/eval/run/route.ts, app/api/eval/test-cases/route.ts, lib/eval/runner.ts, lib/eval/judge.ts, lib/eval/test-cases.ts, lib/eval/fixtures.ts, lib/eval/types.ts` | see spec | see spec | implemented |
| agent-pipeline | [Polish Agent](.specs/features/agent-pipeline/polish-agent.feature.md) | `lib/agents/polish-agent.ts` | see spec | see spec | implemented |
| buyer-personas | [Buyer Persona Data Model](.specs/features/buyer-personas/buyer-persona-data-model.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| buyer-personas | [Market Calibration Engine](.specs/features/buyer-personas/market-calibration-engine.feature.md) | `lib/services/market-calibration.ts` | see spec | see spec | implemented |
| buyer-personas | [Multi-Persona Output Strategy](.specs/features/buyer-personas/multi-persona-output-strategy.feature.md) | `lib/agents/report-assembler.ts` | see spec | see spec | implemented |
| buyer-personas | [Persona Content in PDF Template](.specs/features/buyer-personas/persona-content-pdf-template.feature.md) | `lib/pdf/templates/renderers.tsx` | see spec | see spec | implemented |
| buyer-personas | [Persona Intelligence Agent](.specs/features/buyer-personas/persona-intelligence-agent.feature.md) | `lib/agents/persona-intelligence.ts` | see spec | see spec | implemented |
| buyer-personas | [Persona Selection UI](.specs/features/buyer-personas/persona-selection-ui.feature.md) | `components/reports/report-wizard.tsx` | see spec | see spec | implemented |
| dashboard | [How To Guide](.specs/features/dashboard/how-to-guide.feature.md) | `app/(protected)/how-to/page.tsx` | see spec | see spec | implemented |
| data-infrastructure | [Agent Output Cache](.specs/features/data-infrastructure/agent-output-cache.feature.md) | `lib/services/agent-cache.ts` | see spec | see spec | implemented |
| data-infrastructure | [API Cost Tracking + Usage Logging](.specs/features/data-infrastructure/api-cost-tracking.feature.md) | `app/api/usage/route.ts, lib/services/api-usage.ts` | see spec | see spec | implemented |
| data-infrastructure | [Cache Layer — DB-backed with TTL by Data Type](.specs/features/data-infrastructure/cache-layer.feature.md) | `lib/services/cache.ts, lib/services/api-usage.ts` | see spec | see spec | implemented |
| data-infrastructure | [Data Freshness Indicators + Staleness Fallback](.specs/features/data-infrastructure/data-freshness.feature.md) | `lib/services/data-freshness.ts` | see spec | see spec | implemented |
| data-infrastructure | [Grok x_search Connector](.specs/features/data-infrastructure/grok-connector.feature.md) | `lib/connectors/grok.ts` | see spec | see spec | implemented |
| data-infrastructure | [RealEstateAPI Connector](.specs/features/data-infrastructure/realestateapi-connector.feature.md) | `lib/connectors/realestateapi.ts` | see spec | see spec | implemented |
| data-infrastructure | [ScrapingDog Connector](.specs/features/data-infrastructure/scrapingdog-connector.feature.md) | `lib/connectors/scrapingdog.ts` | see spec | see spec | implemented |
| email-campaigns | [Bulk Email Campaign Agent](.specs/features/email-campaigns/bulk-email-campaign-agent.feature.md) | `lib/agents/email-campaign.ts` | see spec | see spec | implemented |
| email-campaigns | [Bulk Email Campaign Viewer](.specs/features/email-campaigns/email-campaign-viewer.feature.md) | `app/(protected)/reports/[id]/emails/page.tsx` | see spec | see spec | implemented |
| foundation | [Authentication with Supabase](.specs/features/foundation/authentication.feature.md) | `middleware.ts, app/(auth)/sign-in/[[...sign-in]]/page.tsx, app/(auth)/sign-up/[[...sign-up]]/page.tsx, app/(auth)/layout.tsx, app/auth/callback/route.ts, app/auth/verified/page.tsx` | see spec | see spec | implemented |
| foundation | [Base App Layout](.specs/features/foundation/base-layout.feature.md) | `components/layout/top-nav.tsx, components/layout/sidebar.tsx, components/layout/page-shell.tsx, app/(protected)/layout.tsx` | see spec | see spec | implemented |
| foundation | [Database Schema + Supabase Setup](.specs/features/foundation/database-schema.feature.md) | `lib/db/schema.ts, lib/db/index.ts, lib/db/migrations/` | see spec | see spec | implemented |
| foundation | [Environment Config + API Key Management](.specs/features/foundation/env-config.feature.md) | `lib/config/env.ts, .env.local.example` | see spec | see spec | implemented |
| foundation | [Next.js Project Scaffold + Tailwind + Design Tokens](.specs/features/foundation/project-scaffold.feature.md) | `app/layout.tsx, app/page.tsx, tailwind.config.ts, app/globals.css` | see spec | see spec | implemented |
| marketing | [Marketing Landing Page](.specs/features/marketing/landing-page.feature.md) | `app/page.tsx` | see spec | see spec | implemented |
| pipeline | [Data Source Registry](.specs/features/pipeline/data-source-registry.feature.md) | `lib/services/data-source-registry.ts` | see spec | see spec | implemented |
| pipeline | [Pipeline Execution Service](.specs/features/pipeline/pipeline-execution.feature.md) | `lib/services/pipeline-executor.ts` | see spec | see spec | implemented |
| report-builder | [Pipeline Status Dashboard](.specs/features/report-builder/pipeline-status-dashboard.feature.md) | `app/(protected)/reports/[id]/page.tsx` | see spec | see spec | implemented |
| report-builder | [Report Builder Wizard](.specs/features/report-builder/report-builder-wizard.feature.md) | `(deleted — replaced by unified-report-entry)` | see spec | see spec | archived |
| report-builder | [Report Preview](.specs/features/report-builder/report-preview.feature.md) | `components/reports/report-preview.tsx` | see spec | see spec | implemented |
| report-builder | [Unified Report Generation Entry Point](.specs/features/report-builder/unified-report-entry.feature.md) | `app/(protected)/reports/page.tsx` | see spec | see spec | implemented |
| report-editor | [Report Editor](.specs/features/report-editor/report-editor.feature.md) | `components/reports/section-editor.tsx` | see spec | see spec | implemented |
| report-editor | [Report History + Versioning](.specs/features/report-editor/report-history.feature.md) | `lib/services/report-history.ts` | see spec | see spec | implemented |
| report-editor | [Report Templates](.specs/features/report-editor/report-templates.feature.md) | `lib/services/report-templates.ts` | see spec | see spec | implemented |
| report-output-v2 | [Cover Page Redesign](.specs/features/report-output-v2/cover-page-redesign.feature.md) | `lib/pdf/templates/cover-page.tsx` | see spec | see spec | implemented |
| report-output-v2 | [Executive Brief Improvements](.specs/features/report-output-v2/executive-brief-improvements.feature.md) | `lib/pdf/templates/renderers.tsx` | see spec | see spec | implemented |
| report-output-v2 | [Market Intelligence Summary](.specs/features/report-output-v2/market-intelligence-summary.feature.md) | `lib/pdf/templates/insights-index.tsx` | see spec | see spec | implemented |
| report-template | [Agent Branding Injection](.specs/features/report-template/agent-branding.feature.md) | `lib/pdf/document.tsx` | see spec | see spec | implemented |
| report-template | [Data Visualization Components](.specs/features/report-template/data-visualization.feature.md) | `lib/pdf/components/data-viz.tsx` | see spec | see spec | implemented |
| report-template | [Executive Summary + Market Analysis Matrix](.specs/features/report-template/executive-summary-matrix.feature.md) | `lib/pdf/templates/renderers.tsx` | see spec | see spec | implemented |
| report-template | [Trending Insights + Forecasts + Methodology + Strategic Summary](.specs/features/report-template/forecasts-methodology-strategic.feature.md) | `lib/pdf/templates/renderers.tsx` | see spec | see spec | implemented |
| report-template | [Key Drivers + Second Homes + Competitive Analysis Sections](.specs/features/report-template/key-drivers-competitive.feature.md) | `lib/pdf/templates/renderers.tsx` | see spec | see spec | implemented |
| report-template | [PDF Export + Digital Sharing Links](.specs/features/report-template/pdf-export-sharing.feature.md) | `lib/services/report-sharing.ts` | see spec | see spec | implemented |
| report-template | [Report Cover, TOC, and Market Overview + Insights Index](.specs/features/report-template/report-cover-toc-overview.feature.md) | `lib/pdf/templates/cover-page.tsx` | see spec | see spec | implemented |
| report-template | [Report Template Engine](.specs/features/report-template/report-template-engine.feature.md) | `lib/pdf/document.tsx` | see spec | see spec | implemented |
| reports | [View Report Read-Only](.specs/features/reports/view-report-readonly.feature.md) | `app/(protected)/reports/[id]/page.tsx` | see spec | see spec | implemented |
| social-media-kit | [Social Media Kit Data Model](.specs/features/social-media-kit/data-model.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| social-media-kit | [Social Media Kit Generation Trigger](.specs/features/social-media-kit/generation-trigger.feature.md) | `app/api/reports/[id]/kit/generate/route.ts` | see spec | see spec | implemented |
| social-media-kit | [Social Media Kit Regeneration](.specs/features/social-media-kit/kit-regeneration.feature.md) | `app/api/reports/[id]/kit/regenerate/route.ts, lib/services/social-media-kit.ts, lib/agents/social-media.ts, components/reports/kit-viewer.tsx` | see spec | see spec | implemented |
| social-media-kit | [Social Media Kit Viewer](.specs/features/social-media-kit/kit-viewer.feature.md) | `app/(protected)/reports/[id]/kit/page.tsx` | see spec | see spec | implemented |
| social-media-kit | [Social Media Agent](.specs/features/social-media-kit/social-media-agent.feature.md) | `lib/agents/social-media.ts` | see spec | see spec | implemented |
| subscription | [Account & Billing Page](.specs/features/subscription/account-billing-page.feature.md) | `app/(protected)/settings/account/page.tsx` | see spec | see spec | implemented |
| subscription | [Admin Entitlement Overrides](.specs/features/subscription/admin-entitlement-overrides.feature.md) | `app/admin/users/[id]/overrides/page.tsx` | see spec | see spec | implemented |
| subscription | [Default Tier Assignment on Signup](.specs/features/subscription/default-tier-assignment-on-signup.feature.md) | `lib/services/profile.ts` | see spec | see spec | implemented |
| subscription | [Entitlement Check Utility](.specs/features/subscription/entitlement-check-utility.feature.md) | `lib/services/entitlement-check.ts` | see spec | see spec | implemented |
| subscription | [Entitlement Gating for Bulk Email Campaigns](.specs/features/subscription/entitlement-gating-bulk-email-campaigns.feature.md) | `components/reports/generate-email-button.tsx` | see spec | see spec | implemented |
| subscription | [Entitlement Gating for Expanded Transaction Scope](.specs/features/subscription/entitlement-gating-expanded-transaction-scope.feature.md) | `lib/services/pipeline-executor.ts` | see spec | see spec | implemented |
| subscription | [Entitlement Gating in Market Creation](.specs/features/subscription/entitlement-gating-market-creation.feature.md) | `app/api/markets/route.ts` | see spec | see spec | implemented |
| subscription | [Entitlement Gating in Report Creation](.specs/features/subscription/entitlement-gating-report-creation.feature.md) | `app/api/reports/route.ts` | see spec | see spec | implemented |
| subscription | [Entitlement Gating for Social Media Kit as Pro Feature](.specs/features/subscription/entitlement-gating-social-media-kit-pro.feature.md) | `components/reports/generate-kit-button.tsx` | see spec | see spec | implemented |
| subscription | [Entitlement Gating in Social Media Kit](.specs/features/subscription/entitlement-gating-social-media-kit.feature.md) | `app/api/reports/[id]/kit/generate/route.ts` | see spec | see spec | implemented |
| subscription | [Subscription Tier Data Model](.specs/features/subscription/subscription-tier-data-model.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| subscription | [Usage Tracking](.specs/features/subscription/usage-tracking.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| subscription | [User Entitlement Model](.specs/features/subscription/user-entitlement-model.feature.md) | `lib/db/schema.ts` | see spec | see spec | implemented |
| user-setup | [Agent Profile + Branding](.specs/features/user-setup/agent-profile.feature.md) | `app/(protected)/settings/profile/page.tsx, app/api/profile/route.ts, lib/services/profile.ts, lib/services/profile-validation.ts` | see spec | see spec | implemented |
| user-setup | [Market Definition Wizard](.specs/features/user-setup/market-definition.feature.md) | `app/(protected)/markets/new/page.tsx, app/api/markets/route.ts, lib/services/market.ts, lib/services/market-validation.ts` | see spec | see spec | implemented |
| user-setup | [Market Configuration Persistence + Edit](.specs/features/user-setup/market-edit.feature.md) | `app/(protected)/markets/[id]/edit/page.tsx, app/api/markets/[id]/route.ts, lib/services/market.ts` | see spec | see spec | implemented |
| user-setup | [Peer Market Selection](.specs/features/user-setup/peer-markets.feature.md) | `app/(protected)/markets/[id]/peers/page.tsx, app/api/markets/[id]/peers/route.ts, lib/services/market.ts` | see spec | see spec | implemented |
| user-setup | [Unified Market Creation](.specs/features/user-setup/unified-market-creation.feature.md) | `app/(protected)/markets/new/page.tsx, components/markets/market-creation-shell.tsx` | see spec | see spec | implemented |
| ux-redesign | [Animation & UX Infrastructure](.specs/features/ux-redesign/animation-ux-infrastructure.feature.md) | `components/ui/tooltip.tsx, lib/animations.ts` | see spec | see spec | implemented |
| ux-redesign | [Dashboard Redesign](.specs/features/ux-redesign/dashboard-redesign.feature.md) | `app/(protected)/dashboard/page.tsx` | see spec | see spec | implemented |
| ux-redesign | [Flow Persistence & Returning User Shortcuts](.specs/features/ux-redesign/flow-persistence.feature.md) | `components/reports/creation-flow-shell.tsx` | see spec | see spec | implemented |
| ux-redesign | [Step 1: Your Market](.specs/features/ux-redesign/step-1-your-market.feature.md) | `components/reports/steps/step-your-market.tsx` | see spec | see spec | implemented |
| ux-redesign | [Step 2: Your Tier](.specs/features/ux-redesign/step-2-your-tier.feature.md) | `components/reports/steps/step-your-tier.tsx` | see spec | see spec | implemented |
| ux-redesign | [Step 3: Your Focus](.specs/features/ux-redesign/step-3-your-focus.feature.md) | `components/reports/steps/step-your-focus.tsx` | see spec | see spec | implemented |
| ux-redesign | [Step 4: Your Audience](.specs/features/ux-redesign/step-4-your-audience.feature.md) | `components/reports/steps/step-your-audience.tsx` | see spec | see spec | implemented |
| ux-redesign | [Step 5: Review & Generate](.specs/features/ux-redesign/step-5-review-and-generate.feature.md) | `components/reports/steps/step-your-review.tsx` | see spec | see spec | implemented |
| ux-redesign | [Step 6: Generating](.specs/features/ux-redesign/step-6-generating.feature.md) | `components/reports/steps/step-generating.tsx` | see spec | see spec | implemented |
| ux-redesign | [Unified Creation Flow Shell](.specs/features/ux-redesign/unified-creation-flow-shell.feature.md) | `app/(protected)/reports/create/page.tsx` | see spec | see spec | implemented |

---

## Summary

| Status | Count |
|--------|-------|
| stub | 0 |
| specced | 3 |
| tested | 0 |
| implemented | 109 |
| **Total** | **114** |

---

## By Status

### Stub

_None_

### Specced

- [Account Settings Page](.specs/features/account/account-settings.feature.md)
- [Subscription Management + Stripe Integration](.specs/features/account/subscription-management.feature.md)
- [Usage Dashboard](.specs/features/account/usage-dashboard.feature.md)

### Tested

_None_

### Implemented

- [Activity Log Schema](.specs/features/admin/activity-log-schema.feature.md)
- [Admin Dashboard](.specs/features/admin/admin-dashboard.feature.md)
- [Admin Report Detail](.specs/features/admin/admin-report-detail.feature.md)
- [Admin Report List](.specs/features/admin/admin-report-list.feature.md)
- [Admin Sidebar — Report Registry & Error Triage Nav](.specs/features/admin/admin-sidebar-report-registry.feature.md)
- [Admin Sidebar Update](.specs/features/admin/admin-sidebar-update.feature.md)
- [Admin Subscription Tier Management](.specs/features/admin/admin-tier-management.feature.md)
- [Admin User Detail](.specs/features/admin/admin-user-detail.feature.md)
- [Admin User List](.specs/features/admin/admin-user-list.feature.md)
- [Analytics API Endpoints](.specs/features/admin/analytics-api-endpoints.feature.md)
- [Analytics Data Export](.specs/features/admin/analytics-data-export.feature.md)
- [Delete Account](.specs/features/admin/delete-account.feature.md)
- [Error Triage View](.specs/features/admin/error-triage-view.feature.md)
- [Eval Regression Tracking](.specs/features/admin/eval-regression-tracking.feature.md)
- [Geographic Analytics](.specs/features/admin/geographic-analytics.feature.md)
- [Pipeline Performance Metrics](.specs/features/admin/pipeline-performance.feature.md)
- [Pipeline Re-trigger](.specs/features/admin/pipeline-re-trigger.feature.md)
- [Report Error Tracking Schema](.specs/features/admin/report-error-tracking-schema.feature.md)
- [Report Eval Dashboard](.specs/features/admin/report-eval-dashboard.feature.md)
- [Report Eval Runner](.specs/features/admin/report-eval-runner.feature.md)
- [Report Eval Test Cases](.specs/features/admin/report-eval-test-cases.feature.md)
- [Social Media Kit in Admin](.specs/features/admin/social-media-kit-admin.feature.md)
- [Suspend/Unsuspend Account](.specs/features/admin/suspend-unsuspend.feature.md)
- [System Monitoring Dashboard](.specs/features/admin/system-monitoring-dashboard.feature.md)
- [User Analytics](.specs/features/admin/user-analytics.feature.md)
- [User Status Schema](.specs/features/admin/user-status-schema.feature.md)
- [Volume Metrics Dashboard](.specs/features/admin/volume-metrics-dashboard.feature.md)
- [Agent Orchestration Framework](.specs/features/agent-pipeline/agent-orchestration.feature.md)
- [Agent Output Schema + Validation](.specs/features/agent-pipeline/agent-output-schema.feature.md)
- [Data Analyst Agent](.specs/features/agent-pipeline/data-analyst-agent.feature.md)
- [Forecast Modeler Agent](.specs/features/agent-pipeline/forecast-modeler-agent.feature.md)
- [Insight Generator Agent](.specs/features/agent-pipeline/insight-generator-agent.feature.md)
- [Pipeline Evaluation Suite](.specs/features/agent-pipeline/pipeline-eval-suite.feature.md)
- [Polish Agent](.specs/features/agent-pipeline/polish-agent.feature.md)
- [Buyer Persona Data Model](.specs/features/buyer-personas/buyer-persona-data-model.feature.md)
- [Market Calibration Engine](.specs/features/buyer-personas/market-calibration-engine.feature.md)
- [Multi-Persona Output Strategy](.specs/features/buyer-personas/multi-persona-output-strategy.feature.md)
- [Persona Content in PDF Template](.specs/features/buyer-personas/persona-content-pdf-template.feature.md)
- [Persona Intelligence Agent](.specs/features/buyer-personas/persona-intelligence-agent.feature.md)
- [Persona Selection UI](.specs/features/buyer-personas/persona-selection-ui.feature.md)
- [How To Guide](.specs/features/dashboard/how-to-guide.feature.md)
- [Agent Output Cache](.specs/features/data-infrastructure/agent-output-cache.feature.md)
- [API Cost Tracking + Usage Logging](.specs/features/data-infrastructure/api-cost-tracking.feature.md)
- [Cache Layer — DB-backed with TTL by Data Type](.specs/features/data-infrastructure/cache-layer.feature.md)
- [Data Freshness Indicators + Staleness Fallback](.specs/features/data-infrastructure/data-freshness.feature.md)
- [Grok x_search Connector](.specs/features/data-infrastructure/grok-connector.feature.md)
- [RealEstateAPI Connector](.specs/features/data-infrastructure/realestateapi-connector.feature.md)
- [ScrapingDog Connector](.specs/features/data-infrastructure/scrapingdog-connector.feature.md)
- [Bulk Email Campaign Agent](.specs/features/email-campaigns/bulk-email-campaign-agent.feature.md)
- [Bulk Email Campaign Viewer](.specs/features/email-campaigns/email-campaign-viewer.feature.md)
- [Authentication with Supabase](.specs/features/foundation/authentication.feature.md)
- [Base App Layout](.specs/features/foundation/base-layout.feature.md)
- [Database Schema + Supabase Setup](.specs/features/foundation/database-schema.feature.md)
- [Environment Config + API Key Management](.specs/features/foundation/env-config.feature.md)
- [Next.js Project Scaffold + Tailwind + Design Tokens](.specs/features/foundation/project-scaffold.feature.md)
- [Marketing Landing Page](.specs/features/marketing/landing-page.feature.md)
- [Data Source Registry](.specs/features/pipeline/data-source-registry.feature.md)
- [Pipeline Execution Service](.specs/features/pipeline/pipeline-execution.feature.md)
- [Pipeline Status Dashboard](.specs/features/report-builder/pipeline-status-dashboard.feature.md)
- [Report Preview](.specs/features/report-builder/report-preview.feature.md)
- [Unified Report Generation Entry Point](.specs/features/report-builder/unified-report-entry.feature.md)
- [Report Editor](.specs/features/report-editor/report-editor.feature.md)
- [Report History + Versioning](.specs/features/report-editor/report-history.feature.md)
- [Report Templates](.specs/features/report-editor/report-templates.feature.md)
- [Cover Page Redesign](.specs/features/report-output-v2/cover-page-redesign.feature.md)
- [Executive Brief Improvements](.specs/features/report-output-v2/executive-brief-improvements.feature.md)
- [Market Intelligence Summary](.specs/features/report-output-v2/market-intelligence-summary.feature.md)
- [Agent Branding Injection](.specs/features/report-template/agent-branding.feature.md)
- [Data Visualization Components](.specs/features/report-template/data-visualization.feature.md)
- [Executive Summary + Market Analysis Matrix](.specs/features/report-template/executive-summary-matrix.feature.md)
- [Trending Insights + Forecasts + Methodology + Strategic Summary](.specs/features/report-template/forecasts-methodology-strategic.feature.md)
- [Key Drivers + Second Homes + Competitive Analysis Sections](.specs/features/report-template/key-drivers-competitive.feature.md)
- [PDF Export + Digital Sharing Links](.specs/features/report-template/pdf-export-sharing.feature.md)
- [Report Cover, TOC, and Market Overview + Insights Index](.specs/features/report-template/report-cover-toc-overview.feature.md)
- [Report Template Engine](.specs/features/report-template/report-template-engine.feature.md)
- [View Report Read-Only](.specs/features/reports/view-report-readonly.feature.md)
- [Social Media Kit Data Model](.specs/features/social-media-kit/data-model.feature.md)
- [Social Media Kit Generation Trigger](.specs/features/social-media-kit/generation-trigger.feature.md)
- [Social Media Kit Regeneration](.specs/features/social-media-kit/kit-regeneration.feature.md)
- [Social Media Kit Viewer](.specs/features/social-media-kit/kit-viewer.feature.md)
- [Social Media Agent](.specs/features/social-media-kit/social-media-agent.feature.md)
- [Account & Billing Page](.specs/features/subscription/account-billing-page.feature.md)
- [Admin Entitlement Overrides](.specs/features/subscription/admin-entitlement-overrides.feature.md)
- [Default Tier Assignment on Signup](.specs/features/subscription/default-tier-assignment-on-signup.feature.md)
- [Entitlement Check Utility](.specs/features/subscription/entitlement-check-utility.feature.md)
- [Entitlement Gating for Bulk Email Campaigns](.specs/features/subscription/entitlement-gating-bulk-email-campaigns.feature.md)
- [Entitlement Gating for Expanded Transaction Scope](.specs/features/subscription/entitlement-gating-expanded-transaction-scope.feature.md)
- [Entitlement Gating in Market Creation](.specs/features/subscription/entitlement-gating-market-creation.feature.md)
- [Entitlement Gating in Report Creation](.specs/features/subscription/entitlement-gating-report-creation.feature.md)
- [Entitlement Gating for Social Media Kit as Pro Feature](.specs/features/subscription/entitlement-gating-social-media-kit-pro.feature.md)
- [Entitlement Gating in Social Media Kit](.specs/features/subscription/entitlement-gating-social-media-kit.feature.md)
- [Subscription Tier Data Model](.specs/features/subscription/subscription-tier-data-model.feature.md)
- [Usage Tracking](.specs/features/subscription/usage-tracking.feature.md)
- [User Entitlement Model](.specs/features/subscription/user-entitlement-model.feature.md)
- [Agent Profile + Branding](.specs/features/user-setup/agent-profile.feature.md)
- [Market Definition Wizard](.specs/features/user-setup/market-definition.feature.md)
- [Market Configuration Persistence + Edit](.specs/features/user-setup/market-edit.feature.md)
- [Peer Market Selection](.specs/features/user-setup/peer-markets.feature.md)
- [Unified Market Creation](.specs/features/user-setup/unified-market-creation.feature.md)
- [Animation & UX Infrastructure](.specs/features/ux-redesign/animation-ux-infrastructure.feature.md)
- [Dashboard Redesign](.specs/features/ux-redesign/dashboard-redesign.feature.md)
- [Flow Persistence & Returning User Shortcuts](.specs/features/ux-redesign/flow-persistence.feature.md)
- [Step 1: Your Market](.specs/features/ux-redesign/step-1-your-market.feature.md)
- [Step 2: Your Tier](.specs/features/ux-redesign/step-2-your-tier.feature.md)
- [Step 3: Your Focus](.specs/features/ux-redesign/step-3-your-focus.feature.md)
- [Step 4: Your Audience](.specs/features/ux-redesign/step-4-your-audience.feature.md)
- [Step 5: Review & Generate](.specs/features/ux-redesign/step-5-review-and-generate.feature.md)
- [Step 6: Generating](.specs/features/ux-redesign/step-6-generating.feature.md)
- [Unified Creation Flow Shell](.specs/features/ux-redesign/unified-creation-flow-shell.feature.md)

---

## Design System

See `.specs/design-system/tokens.md` for token reference.

### Documented Components

| Component | Status | Source |
|-----------|--------|--------|
| accordion | stub | [doc](.specs/design-system/components/accordion.md) |
| animated-container | documented | [doc](.specs/design-system/components/animated-container.md) |
| closing-statement | stub | [doc](.specs/design-system/components/closing-statement.md) |
| data-callout | stub | [doc](.specs/design-system/components/data-callout.md) |
| editorial-showcase | stub | [doc](.specs/design-system/components/editorial-showcase.md) |
| hero-section | stub | [doc](.specs/design-system/components/hero-section.md) |
| horizontal-bar-chart | stub | [doc](.specs/design-system/components/horizontal-bar-chart.md) |
| intelligence-pillars | stub | [doc](.specs/design-system/components/intelligence-pillars.md) |
| landing-nav | stub | [doc](.specs/design-system/components/landing-nav.md) |
| market-autocomplete | stub | [doc](.specs/design-system/components/market-autocomplete.md) |
| market-preview-card | stub | [doc](.specs/design-system/components/market-preview-card.md) |
| persona-card | stub | [doc](.specs/design-system/components/persona-card.md) |
| persona-preview-panel | stub | [doc](.specs/design-system/components/persona-preview-panel.md) |
| process-narrative | stub | [doc](.specs/design-system/components/process-narrative.md) |
| quick-start-checklist | stub | [doc](.specs/design-system/components/quick-start-checklist.md) |
| report-breakdown | stub | [doc](.specs/design-system/components/report-breakdown.md) |
| segment-distribution-bar | stub | [doc](.specs/design-system/components/segment-distribution-bar.md) |
| step-card | stub | [doc](.specs/design-system/components/step-card.md) |
| toggle-card | stub | [doc](.specs/design-system/components/toggle-card.md) |
| tooltip | documented | [doc](.specs/design-system/components/tooltip.md) |
| trend-indicator | stub | [doc](.specs/design-system/components/trend-indicator.md) |

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
