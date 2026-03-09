---
feature: Peer Market Selection
domain: user-setup
source: app/(protected)/markets/[id]/peers/page.tsx, app/api/markets/[id]/peers/route.ts, lib/services/market.ts
tests:
  - __tests__/markets/peers.test.tsx
components:
  - PeerMarketForm
personas:
  - established-practitioner
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Peer Market Selection

**Source Files**: `app/(protected)/markets/[id]/peers/page.tsx`, `app/api/markets/[id]/peers/route.ts`
**Design System**: `.specs/design-system/tokens.md`

## Feature: Peer Market Selection

Agents select peer luxury markets for competitive analysis. Given a primary market (e.g., Naples), they add comparable markets (e.g., Palm Beach, Aspen, Hamptons) to compare against in the Competitive Market Analysis section of the report.

### Scenario: Agent adds peer markets
Given an agent has a defined market
When they navigate to the peer markets page
Then they can add peer markets by entering city + state pairs

### Scenario: Peer markets are persisted
Given an agent adds peer markets
When they save
Then the peer_markets JSONB column is updated on the market record

### Scenario: Agent removes a peer market
Given a market has peer markets
When the agent removes one
Then it is removed from the list and saved

### Scenario: Validation requires city and state for each peer
Given the agent is adding a peer market
When they leave city or state empty
Then an inline error appears
