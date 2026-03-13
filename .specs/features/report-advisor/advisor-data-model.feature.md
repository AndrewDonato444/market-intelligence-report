---
feature: Advisor Data Model
domain: report-advisor
source: lib/db/schema.ts
tests:
  - __tests__/db/schema.test.ts
components: []
personas: [primary]
status: implemented
created: 2026-03-13
updated: 2026-03-13
---

# Advisor Data Model

**Source File**: lib/db/schema.ts
**Design System**: N/A (data model only)

## Feature: Advisor Conversations Table

The `advisor_conversations` table stores chat conversations between agents and the Report Advisor AI. Each conversation is tied to a specific report and user, storing messages as JSONB and tracking turn count for entitlement enforcement.

### Scenario: Create advisor conversation record
Given a user has a completed report
When they start an advisor chat session
Then a new row is inserted into `advisor_conversations` with reportId, userId, empty messages array, turnCount=0

### Scenario: Store conversation messages
Given an active advisor conversation
When the user sends a message and receives a response
Then the messages JSONB array is updated with both user and assistant messages
And turnCount is incremented

### Scenario: Enforce turn limits
Given an advisor conversation with turnCount at the entitlement cap
When the system checks turnCount before allowing a new turn
Then the conversation is blocked if turnCount >= cap

### Scenario: Multiple conversations per report
Given a user has an existing conversation for a report
When they start a new conversation for the same report
Then a new conversation row is created (multiple conversations per report allowed)

### Scenario: Cascade delete on user removal
Given a user with advisor conversations
When the user is deleted
Then all their advisor conversations are cascade-deleted

### Scenario: Cascade delete on report removal
Given a report with advisor conversations
When the report is deleted
Then all associated advisor conversations are cascade-deleted

## Schema Definition

```
advisor_conversations
├── id: UUID (PK, auto-generated)
├── reportId: UUID (FK → reports.id, CASCADE)
├── userId: UUID (FK → users.id, CASCADE)
├── messages: JSONB (array of {role, content, timestamp})
├── turnCount: INTEGER (default 0)
├── createdAt: TIMESTAMPTZ (default NOW)
└── updatedAt: TIMESTAMPTZ (default NOW)

Indexes:
├── advisor_conversations_report_id_idx (reportId)
└── advisor_conversations_user_id_idx (userId)
```

## Message JSONB Structure

```typescript
type AdvisorMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO 8601
};
```
