# ResetPasswordForm

**Status**: Stub (pending implementation)

## Purpose
New password + confirm password form shown after clicking reset link from email. Lives at `/reset-password`. Requires valid Supabase session (recovery type).

## Props
- TBD after implementation

## Variants
- Default (two password fields + submit)
- Validation error (mismatch, too short)
- Success (redirect to dashboard)
- Expired/invalid session (error + link to forgot-password)

## Design Tokens
- Uses same split-panel layout as sign-in page
- Reuses `PasswordInput` component
- `--color-error` for validation errors
