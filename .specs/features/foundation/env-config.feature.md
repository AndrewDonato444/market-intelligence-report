---
feature: Environment Config + API Key Management
domain: foundation
source: lib/config/env.ts, .env.local.example
tests:
  - __tests__/config/env.test.ts
components: []
personas:
  - rising-star-agent
  - legacy-agent
status: implemented
created: 2026-03-09
updated: 2026-03-09
---

# Environment Config + API Key Management

**Source Files**: `lib/config/env.ts`

## Feature: Environment Configuration

Type-safe environment variable management with validation. All API keys, database credentials, and service configs are validated at startup. Missing required vars throw clear errors.

### Scenario: All required environment variables are validated
Given the app starts
When environment variables are loaded
Then all required variables are validated
And missing variables throw descriptive errors

### Scenario: Environment config exports typed values
Given the env module is imported
When accessing config values
Then they are typed correctly (string, not string | undefined)

### Scenario: .env.local.example documents all variables
Given a developer clones the repo
When they look at .env.local.example
Then they see every required and optional environment variable with descriptions
