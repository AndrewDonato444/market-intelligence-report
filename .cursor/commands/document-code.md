# Document Existing Code (Reverse TDD)

Generate specs and tests from existing code. Use when code was written first and needs documentation.

```
CODE → SPEC → TEST
 │      ▲      ▲
 │      │      │
 └──────┴──────┘ (document what exists)
```

## When to Use

- Code was written without specs (vibe coding, prototyping, legacy code)
- Quick iteration happened after initial implementation
- Onboarding existing features into spec-driven workflow
- After `/prototype` when you want to skip `/formalize` and just document

## Behavior

### 1. Read the Code
- Analyze the specified component/module
- Understand what it does, not what it should do
- Identify all behaviors, edge cases handled, error states

### 2. Generate Feature Spec
- Create Gherkin scenarios that describe **actual current behavior**
- Document edge cases the code handles
- Note any implicit business rules
- Flag any behaviors that seem unintentional

### 3. Write Passing Tests
- Write tests that **pass against current implementation**
- Cover all identified behaviors
- These are not aspirational—they document reality

### 4. Update Documentation
- Create/update `.specs/test-suites/*.tests.md`
- Update `.specs/mapping.md`
- Add change log entries

## Key Difference from `/spec-first`

| Aspect | `/spec-first` | `/document-code` |
|--------|---------------|------------------|
| Flow | Spec → Test → Code | Code → Spec → Test |
| Tests | Written to fail first | Written to pass |
| Spec | Defines desired behavior | Documents actual behavior |
| Use | New features | Existing code |

## Output Format

```markdown
## Code Documentation: [Component/Feature]

**Source File(s)**: [paths]
**Analyzed**: [date]

### Behaviors Documented

| Behavior | Spec Scenario | Test ID |
|----------|---------------|---------|
| Renders user name | Display user info | USR-001 |
| Shows loading state | Loading indicator | USR-002 |
| Handles empty data | Empty state | USR-003 |

### Files Created/Updated

- `.specs/features/{domain}/{feature}.feature.md` - Feature spec
- `.specs/test-suites/{path}.tests.md` - Test documentation
- `tests/frontend/{path}.test.tsx` - Actual tests

### Potential Issues Found

⚠️ These behaviors might be unintentional:
- Returns `undefined` instead of `null` for missing users
- No error handling for network failures

### Suggested Follow-ups

- [ ] Verify edge case X is intentional
- [ ] Consider adding error boundary
- [ ] Review with team: should Y behavior change?

---

**Tests written and passing. Documentation complete.**
```

## Prompts for Clarification

When documenting code, I may ask:

1. "This component does X—is that intentional or a bug?"
2. "I see no error handling for Y. Should I document current behavior or add handling?"
3. "This code has multiple modes. Want me to document all, or focus on primary use?"

## Example Usage

### Single Component
```
/document-code the DealCard component
```
I will:
1. Read `components/deal-card.tsx`
2. Analyze props, state, renders, handlers
3. Create `.specs/features/deals/deal-card.feature.md`
4. Write tests covering all behaviors
5. Create `.specs/test-suites/components/DealCard.tests.md`
6. Update `mapping.md`

### Utility Module
```
/document-code lib/formatters
```
I will:
1. Read all exports from the module
2. Document each function's behavior
3. Write unit tests for each
4. Note any edge cases handled

### Recent Changes
```
/document-code the changes I just made
```
I will:
1. Look at recent edits in the session
2. Document the new/changed behavior
3. Update existing specs if modifying documented code
4. Write tests for new functionality

### After Prototyping
```
/document-code the prototype chart component
```
Lighter version of `/formalize`—documents without refactoring to production standards.

## Important Notes

1. **This is not TDD** - We're documenting reality, not defining desired behavior
2. **Tests should pass** - Unlike `/spec-first`, tests are written to pass immediately
3. **Be honest in specs** - Document what code does, even if it seems wrong
4. **Flag issues** - Note potential bugs or unintentional behaviors for review
5. **Maintain mapping** - Always update `mapping.md` with new relationships

