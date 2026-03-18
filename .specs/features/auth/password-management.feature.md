---
feature: Password Management
domain: auth
source: app/(auth)/sign-in/[[...sign-in]]/page.tsx
tests:
  - __tests__/auth/forgot-password-api.test.ts
  - __tests__/auth/reset-password-api.test.ts
  - __tests__/auth/verify-password-api.test.ts
  - __tests__/auth/password-management-ui.test.ts
  - __tests__/admin/admin-reset-password-api.test.ts
components:
  - ForgotPasswordForm
  - ResetPasswordForm
  - ChangePasswordSection
  - AdminResetPasswordButton
personas:
  - established-practitioner
  - team-leader
status: implemented
created: 2026-03-18
updated: 2026-03-18
---

# Password Management

**Source Files**:
- `app/(auth)/sign-in/[[...sign-in]]/page.tsx` (forgot password link)
- `app/(auth)/forgot-password/page.tsx` (forgot password form — NEW)
- `app/(auth)/reset-password/page.tsx` (set new password — NEW)
- `components/account/change-password-section.tsx` (dashboard password change — NEW)
- `components/auth/brand-panel.tsx` (shared brand panel — NEW)
- `app/api/auth/forgot-password/route.ts` (API — NEW)
- `app/api/auth/reset-password/route.ts` (API — NEW)
- `app/api/auth/verify-password/route.ts` (API — NEW)
- `app/api/admin/users/[id]/reset-password/route.ts` (admin API — NEW)

**Design System**: .specs/design-system/tokens.md
**Personas**: .specs/personas/established-practitioner.md

Three password flows built on Supabase Auth:

1. **Forgot Password** — public, from sign-in page
2. **Change Password** — authenticated, from account settings
3. **Admin Force Reset** — admin panel, sends reset email to user

---

## Feature: Forgot Password (Sign-In Page)

User forgot their password and needs to reset it from the sign-in page.

### Scenario: User requests password reset
Given the user is on the sign-in page
When they click "Forgot your password?"
Then they are taken to `/forgot-password`
And they see an email input and a "Send Reset Link" button

### Scenario: Valid email submitted
Given the user is on the forgot password page
When they enter a valid email and submit
Then the system calls `supabase.auth.resetPasswordForEmail(email)`
And a success message is shown: "Check your email for a reset link"
And the form is replaced with the success message (no re-submit)

### Scenario: Email not found (silent success)
Given the user enters an email not in the system
When they submit
Then the same success message is shown (no email enumeration)

### Scenario: Rate limiting
Given the user has submitted the form 3 times in 60 seconds
When they try again
Then they see "Too many requests. Please wait a moment."

### Scenario: User clicks reset link from email
Given the user received a reset email from Supabase
When they click the link
Then they are redirected to `/auth/callback` with `type=recovery`
And the callback exchanges the code for a session
And they are redirected to `/reset-password`

### Scenario: User sets new password
Given the user is on the reset password page with a valid session
When they enter a new password (min 8 characters) and confirm it
And the passwords match
And they click "Set New Password"
Then the system calls `supabase.auth.updateUser({ password })`
And they see a success message
And they are redirected to `/dashboard` after 2 seconds

### Scenario: Passwords don't match
Given the user is on the reset password page
When they enter mismatched passwords
Then they see "Passwords do not match" inline error
And the submit button remains disabled

### Scenario: Password too short
Given the user enters a password shorter than 8 characters
Then they see "Password must be at least 8 characters" inline error reactively
And the submit button remains disabled

### Scenario: Reset link expired or invalid
Given the user arrives at `/reset-password` without a valid session
When the page loads
Then they see "This reset link has expired or is invalid"
And a link to "Request a new reset link" pointing to `/forgot-password`

---

## Feature: Change Password (Account Settings)

Authenticated user changes their password from their dashboard.

### Scenario: User navigates to account settings
Given the user is signed in
When they go to `/settings/account`
Then they see a "Change Password" section below their account info

### Scenario: User changes password successfully
Given the user is on the account settings page
When they enter their current password, new password (min 8 chars), and confirm
And all fields are valid
And they click "Update Password"
Then the system verifies the current password via `POST /api/auth/verify-password`
And updates the password via `POST /api/auth/reset-password`
And they see an inline success banner: "Password updated"
And the form fields are cleared

### Scenario: Current password is wrong
Given the user enters an incorrect current password
When they submit
Then they see "Current password is incorrect"

### Scenario: New password same as current
Given the user enters the same password as their current one
Then they see "New password must be different from current password" inline error reactively
And the submit button remains disabled

### Scenario: Validation errors
Given the user enters a new password shorter than 8 characters
Or the confirm field doesn't match
Then inline errors are shown and submit is disabled

---

## Feature: Admin Force Reset Password

Admin sends a password reset email to any user from the admin panel.

### Scenario: Admin sees reset button on user detail
Given an admin is viewing a user at `/admin/users/[id]`
Then they see a "Send Password Reset" button in the actions area

### Scenario: Admin triggers password reset
Given an admin clicks "Send Password Reset"
Then a confirmation dialog appears: "Send a password reset email to {email}?"
When the admin confirms
Then the system calls `POST /api/admin/users/[id]/reset-password`
And the API calls `resetPasswordForEmail(email)` via admin client
And an inline success message shows: "Reset email sent to {email}"

### Scenario: Admin reset is logged
Given the admin triggers a password reset
Then an entry is added to the activity log:
  - action: "password_reset_sent"
  - userId: target user ID
  - metadata.triggeredBy: admin user ID

### Scenario: User email doesn't exist in auth
Given the user's auth record is somehow missing
When the admin clicks reset
Then they see an error: "Could not send reset email. User may not have an auth account."

---

## User Journey

1. **Forgot Password**: Sign-in → "Forgot?" link → Enter email → Check inbox → Click link → Set new password → Dashboard
2. **Change Password**: Dashboard → Settings → Account → Change Password section → Enter current + new → Success toast
3. **Admin Reset**: Admin panel → Users → User detail → "Send Password Reset" → Confirm → User gets email

---

## UI Mockup

### Forgot Password Page (`/forgot-password`)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────┐ ┌──────────────────────────────────────┐ │
│ │                     │ │                                      │ │
│ │   Modern Signal     │ │  Reset your password                 │ │
│ │     Advisory        │ │  Enter your email to receive a link  │ │
│ │                     │ │                                      │ │
│ │   ─── accent ───    │ │  ┌──────────────────────────────┐    │ │
│ │                     │ │  │ you@example.com              │    │ │
│ │   The Intelligence  │ │  └──────────────────────────────┘    │ │
│ │   Era of Real       │ │                                      │ │
│ │   Estate            │ │  ┌──────────────────────────────┐    │ │
│ │                     │ │  │     Send Reset Link          │    │ │
│ │                     │ │  └──────────────────────────────┘    │ │
│ │                     │ │                                      │ │
│ │                     │ │  ──────────────────────────────────  │ │
│ │                     │ │  Remember your password?             │ │
│ │                     │ │  Back to Sign In →                   │ │
│ └─────────────────────┘ └──────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Success State (replaces form)

```
┌──────────────────────────────────────┐
│                                      │
│  ✓ Check your email                  │
│                                      │
│  We sent a reset link to             │
│  j***n@example.com                   │
│                                      │
│  Didn't receive it?                  │
│  Check spam or try again →           │
│                                      │
│  ──────────────────────────────────  │
│  Back to Sign In →                   │
└──────────────────────────────────────┘
```

### Reset Password Page (`/reset-password`)

```
┌──────────────────────────────────────┐
│                                      │
│  Set new password                    │
│                                      │
│  New password                        │
│  ┌──────────────────────────────┐    │
│  │ ••••••••             [eye]  │    │
│  └──────────────────────────────┘    │
│  Min 8 characters                    │
│                                      │
│  Confirm password                    │
│  ┌──────────────────────────────┐    │
│  │ ••••••••             [eye]  │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │       Set New Password       │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Change Password (in Account Settings)

```
┌──────────────────────────────────────────┐
│ Change Password                          │
│                                          │
│ Current password                         │
│ ┌──────────────────────────────────┐     │
│ │ ••••••••                 [eye]  │     │
│ └──────────────────────────────────┘     │
│                                          │
│ New password                             │
│ ┌──────────────────────────────────┐     │
│ │ ••••••••                 [eye]  │     │
│ └──────────────────────────────────┘     │
│ Min 8 characters                         │
│                                          │
│ Confirm new password                     │
│ ┌──────────────────────────────────┐     │
│ │ ••••••••                 [eye]  │     │
│ └──────────────────────────────────┘     │
│                                          │
│              [ Update Password ]         │
└──────────────────────────────────────────┘
```

### Admin User Detail — Reset Button

```
┌──────────────────────────────────────────┐
│ User: Jordan Ellis                       │
│ jordan@example.com  •  Active            │
│                                          │
│ ┌────────────┐  ┌──────────────────────┐ │
│ │  Suspend   │  │ Send Password Reset  │ │
│ └────────────┘  └──────────────────────┘ │
│                                          │
│ ...rest of user detail panel...          │
└──────────────────────────────────────────┘
```

---

## Technical Notes

- **Supabase handles email delivery** — no custom email service needed for password reset
- **Auth callback** at `/auth/callback` already handles `type=recovery` but currently redirects to `next` param; needs to detect recovery and redirect to `/reset-password`
- **Admin reset** uses `supabase.auth.admin` (service role) — already have admin client in `lib/supabase/admin-client.ts`
- **No password storage** — all password operations go through Supabase Auth, app never sees plaintext
- **Existing `PasswordInput` component** at `components/ui/password-input.tsx` — reuse for all password fields

## Component References

- PasswordInput: `components/ui/password-input.tsx` (existing)
- ForgotPasswordForm: NEW — `.specs/design-system/components/forgot-password-form.md`
- ResetPasswordForm: NEW — `.specs/design-system/components/reset-password-form.md`
- ChangePasswordSection: NEW — `.specs/design-system/components/change-password-section.md`
- AdminResetPasswordButton: NEW — `.specs/design-system/components/admin-reset-password-button.md`

## Learnings

(empty — will be filled after implementation)
