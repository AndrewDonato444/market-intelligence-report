# ForgotPasswordForm

**Status**: Stub (pending implementation)

## Purpose
Email-only form on `/forgot-password` page. Submits to Supabase `resetPasswordForEmail()`. Shows success state inline (replaces form).

## Props
- TBD after implementation

## Variants
- Default (email input + submit)
- Success (confirmation message, masked email)
- Error (rate limit message)

## Design Tokens
- Uses same split-panel layout as sign-in page (BrandPanel + form panel)
- `--color-mkt-accent` for links
- `--radius-sm` for inputs and buttons
- `--font-body` for form text
