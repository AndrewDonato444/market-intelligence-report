# ChangePasswordSection

**Status**: Stub (pending implementation)

## Purpose
Inline section within `/settings/account` page. Allows authenticated user to change password by providing current + new + confirm.

## Props
- TBD after implementation

## Variants
- Default (three password fields + submit button)
- Validation errors (inline)
- Success (toast notification, fields cleared)
- Wrong current password error

## Design Tokens
- Matches existing account settings card styling
- `--color-mkt-surface` background
- `--color-mkt-border` dividers
- Uses `PasswordInput` component for all fields
