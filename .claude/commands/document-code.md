---
description: Generate specs and tests from existing code (reverse TDD)
---

Document existing code: $ARGUMENTS

## Flow

```
CODE → SPEC → TEST (all passing)
```

## When to Use

- Code written without specs (prototyping, legacy)
- Quick iteration skipped documentation
- After `/prototype` when you want to document without full formalization

## Steps

1. **Read the Code**: Analyze the component/module. Understand what it DOES, not what it SHOULD do.

2. **Generate Feature Spec**: Create Gherkin scenarios describing ACTUAL current behavior. Flag behaviors that seem unintentional.

3. **Write Passing Tests**: Tests that PASS against current implementation. Cover all identified behaviors.

4. **Update Documentation**: Create/update test suite docs, mapping.md.

## Key Difference from /spec-first

| Aspect | /spec-first | /document-code |
|--------|-------------|----------------|
| Tests | Written to fail first | Written to pass |
| Spec | Defines desired behavior | Documents actual behavior |
| Use | New features | Existing code |

## Output

- Behaviors documented
- Files created/updated
- Potential issues found (unintentional behaviors)
- Suggested follow-ups
