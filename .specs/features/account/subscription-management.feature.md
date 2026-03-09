---
feature: Subscription Management + Stripe Integration
domain: account
source: app/(protected)/settings/account/page.tsx
tests:
  - __tests__/account/subscription.test.tsx
components:
  - SubscriptionManagement
personas:
  - established-practitioner
  - rising-star-agent
status: specced
created: 2026-03-09
updated: 2026-03-09
---

# Subscription Management + Stripe Integration

**Source File**: app/(protected)/settings/account/page.tsx
**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/established-practitioner.md

## Feature: Subscription Management

Enables agents to manage their subscription via Stripe. Includes plan display, checkout for upgrades, and Stripe Customer Portal for billing management. Gracefully handles the case where Stripe is not yet configured.

### Scenario: Subscriptions table exists in schema
Given the database schema
When I check for subscription tracking
Then a subscriptions table exists with userId, stripeCustomerId, stripeSubscriptionId, plan, status, and period dates

### Scenario: Stripe client wrapper exists
Given the Stripe integration
When Stripe env vars are configured (STRIPE_SECRET_KEY)
Then a Stripe client is initialized
And plan configuration defines available plans with price IDs

### Scenario: Subscription service provides management functions
Given the subscription service
When called with a user ID
Then it can get the current subscription
And it can create a checkout session
And it can create a billing portal session

### Scenario: Agent views current subscription
Given an agent has a subscription
When they view the account settings page
Then they see their current plan name and status
And they see the current period dates
And they see a "Manage Billing" button

### Scenario: Agent without subscription sees free tier
Given an agent has no subscription
When they view the account settings page
Then they see "Free" as their current plan
And they see an "Upgrade" button

### Scenario: Stripe not configured shows setup message
Given Stripe API keys are not configured
When the subscription component renders
Then it shows a message that billing is not yet set up

### Scenario: Checkout and portal API routes exist
Given the Stripe API routes
Then POST /api/stripe/checkout creates a checkout session
And POST /api/stripe/portal creates a billing portal session
And POST /api/stripe/webhook handles Stripe webhook events

## User Journey

1. Agent views account settings (Feature #70)
2. **Agent sees subscription status and manages billing** (this feature)
3. Agent views usage dashboard (Feature #72)

## UI Mockup

```
┌────────────────────────────────────────┐
│  Subscription                          │
│  ─── gold accent line ───              │
│                                        │
│  Current Plan:  Professional           │
│  Status:        Active                 │
│  Period:        Mar 1 - Mar 31, 2026   │
│                                        │
│  [Manage Billing]                      │
└────────────────────────────────────────┘

--- OR (no subscription) ---

┌────────────────────────────────────────┐
│  Subscription                          │
│  ─── gold accent line ───              │
│                                        │
│  Current Plan:  Free                   │
│                                        │
│  Upgrade to unlock unlimited reports   │
│  and premium data sources.             │
│                                        │
│  [Upgrade]                             │
└────────────────────────────────────────┘
```
