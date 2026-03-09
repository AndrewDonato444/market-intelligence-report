---
description: Refactor code while ensuring tests still pass
---

Refactor: $ARGUMENTS

## Key Principle

**Tests define behavior.** If you need to change test assertions, that's NOT a refactor—use normal workflow instead.

## Before Changing

1. Identify which tests cover the code
2. Run those tests (confirm they pass)
3. Note test IDs for reference

## During Refactoring

1. Make incremental changes
2. Do NOT change test assertions
3. If tests fail, the refactor broke something—fix it
4. Keep commits small and focused

## After Refactoring

1. Run tests again (verify all pass)
2. Update test docs ONLY if test names/organization changed
3. Do NOT update feature specs (behavior didn't change)

## Safe Refactors

✅ Extract function/class, rename variables, simplify conditionals, remove dead code, improve performance, add types

❌ NOT refactors (need behavior change workflow): Change return values, modify public API, change validation rules, alter data structures

## Red Flags

Stop and reassess if:
- Need to change test assertions
- Adding new test cases
- Feature spec seems wrong
- "Fixing" a test to make it pass
