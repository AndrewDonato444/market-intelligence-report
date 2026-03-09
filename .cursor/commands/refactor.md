# Refactor Mode

Refactor code while ensuring tests still pass. Behavior should NOT change.

## Key Principle

**Tests define behavior.** If you need to change test assertions, that's NOT a refactor—it's a behavior change. Use the normal workflow instead.

## Workflow

### Before Changing Anything
1. Identify which tests cover the code being refactored
2. Run those tests to confirm they pass
3. Note the test IDs for reference

### During Refactoring
1. Make incremental changes
2. Do NOT change test assertions
3. If tests fail, the refactor broke something—fix it
4. Keep commits small and focused

### After Refactoring
1. Run tests again to verify all pass
2. Update test docs ONLY if test names/organization changed
3. Do NOT update feature specs (behavior didn't change)

## Safe Refactoring Examples

✅ **Good refactors** (tests stay the same):
- Extract function/class/module
- Rename variables (not public API)
- Simplify conditionals
- Remove dead code
- Improve performance
- Add type annotations

❌ **Not refactors** (need behavior change workflow):
- Change function return values
- Modify public API signatures
- Change validation rules
- Alter data structures

## Red Flags

Stop and reassess if:
- You need to change test assertions
- You're adding new test cases
- The feature spec seems wrong
- You're "fixing" a test to make it pass

These indicate behavior changes, not refactoring.

## Example Usage

User: "/refactor extract date formatting into a utility"

I will:
1. Find tests covering date formatting
2. Extract the logic to a new utility function/module
3. Update imports in original location
4. Verify all tests still pass
5. NOT change any test assertions

