---
feature: Admin Create User
domain: admin
source: app/admin/users/create/page.tsx
tests:
  - __tests__/app/admin/create-user.test.tsx
components:
  - CreateUserForm
personas:
  - established-practitioner
  - rising-star-agent
status: specced
created: 2026-03-18
updated: 2026-03-18
---

# Admin Create User

**Source File**: `app/admin/users/create/page.tsx`
**Design System**: `.specs/design-system/tokens.md`
**Personas**: `.specs/personas/established-practitioner.md`, `.specs/personas/rising-star-agent.md`

## Feature: Admin-Created User Accounts

Admins can create new user accounts directly from the admin dashboard without going through Supabase or the self-service signup flow. This creates both the Supabase auth user and the local profile in one step, assigns a subscription tier, and optionally sends an invite email with a password-reset link so the new user can set their own password.

### Scenario: Admin navigates to create user page
Given the admin is on the User Management page
When they click "Add User"
Then they see a form with these fields:
  | Field           | Type     | Required |
  |-----------------|----------|----------|
  | First Name      | text     | no       |
  | Last Name       | text     | no       |
  | Email           | email    | yes      |
  | Company         | text     | no       |
  | Phone           | text     | no       |
  | Title           | text     | no       |
  | Role            | select   | yes      |
  | Subscription Tier | select | yes      |
  | Send Invite Email | toggle | no       |
And the Role dropdown shows "User" (default) and "Admin"
And the Subscription Tier dropdown is populated from the `subscriptionTiers` table
And "Send Invite Email" defaults to checked

### Scenario: Admin creates a user successfully
Given the admin fills in at least the email field
And selects a role and subscription tier
When they click "Create User"
Then a Supabase auth account is created with a random temporary password
And a profile row is created in the `users` table with:
  - `authId` linked to the new Supabase auth user
  - `email` from the form
  - `name` from first + last name (or email prefix if blank)
  - `role` from the form
  - `status` set to "active"
  - `company`, `phone`, `title` from the form (if provided)
And a subscription is created linking the user to the selected tier
And an activity log entry is created recording the admin who created the account
And the admin sees a success message with the new user's name/email
And the admin is redirected to the user detail page

### Scenario: Send invite email is checked
Given the admin creates a user with "Send Invite Email" checked
When the account is created
Then Supabase sends a password-reset email to the new user's email address
And the new user can click the link to set their own password
And the admin sees "Invite email sent" in the success message

### Scenario: Send invite email is unchecked
Given the admin creates a user with "Send Invite Email" unchecked
When the account is created
Then no email is sent
And the admin sees the success message without invite email mention
And the admin can trigger the invite email later from the user detail page

### Scenario: Duplicate email
Given a user with email "existing@example.com" already exists
When the admin tries to create a user with the same email
Then the API returns a 409 error
And the admin sees "A user with this email already exists"
And the form remains editable with data preserved

### Scenario: Validation errors
Given the admin submits the form without an email
Then they see a client-side validation error
And the form is not submitted

### Scenario: Supabase auth creation fails
Given the admin submits valid form data
When the Supabase auth API returns an error
Then the API returns a 500 error
And no profile row or subscription is created (atomic operation)
And the admin sees "Failed to create user. Please try again."

## User Journey

1. Admin clicks "User Management" in sidebar
2. Admin clicks "Add User" button on the user list page
3. **Admin fills out create user form**
4. Admin is redirected to the new user's detail page
5. New user receives invite email (if enabled) and sets password

## UI Mockup

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Users                                    │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │  Add New User                                 │  │
│  │  ─────────────────────────────                │  │
│  │                                               │  │
│  │  ┌─────────────────┐ ┌─────────────────┐      │  │
│  │  │ First Name      │ │ Last Name       │      │  │
│  │  └─────────────────┘ └─────────────────┘      │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────┐      │  │
│  │  │ Email *                             │      │  │
│  │  └─────────────────────────────────────┘      │  │
│  │                                               │  │
│  │  ┌─────────────────┐ ┌─────────────────┐      │  │
│  │  │ Company         │ │ Phone           │      │  │
│  │  └─────────────────┘ └─────────────────┘      │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────┐      │  │
│  │  │ Title                               │      │  │
│  │  └─────────────────────────────────────┘      │  │
│  │                                               │  │
│  │  ┌─────────────────┐ ┌─────────────────┐      │  │
│  │  │ Role        [▾] │ │ Tier        [▾] │      │  │
│  │  └─────────────────┘ └─────────────────┘      │  │
│  │                                               │  │
│  │  ☑ Send invite email to set password          │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────┐      │  │
│  │  │          Create User                │      │  │
│  │  └─────────────────────────────────────┘      │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Token usage:**
- Page background: `color-background`
- Card: `color-surface`, `shadow-sm`, `radius-md`
- Inputs: `color-border`, `radius-sm`, focus ring `color-border-strong`
- Button: `color-primary` bg, white text, `radius-sm`
- Labels: `text-sm`, `font-medium`, `color-text`
- "Back to Users" link: `text-sm`, `color-text-secondary`
- Error messages: `color-error`
- Success message: `color-success`

## API Design

### POST /api/admin/users/create

**Request body:**
```json
{
  "email": "agent@example.com",
  "firstName": "Jordan",
  "lastName": "Ellis",
  "company": "Ellis Luxury Group",
  "phone": "555-123-4567",
  "title": "Managing Broker",
  "role": "user",
  "tierId": "uuid-of-tier",
  "sendInvite": true
}
```

**Success response (201):**
```json
{
  "success": true,
  "userId": "uuid",
  "message": "User created successfully. Invite email sent."
}
```

**Error responses:**
- 400: Missing required fields
- 403: Not admin
- 409: Email already exists
- 500: Supabase or DB error

### Implementation Notes

- Use Supabase Admin API (`supabase.auth.admin.createUser()`) to create auth user server-side
- Generate a random password (user will reset via invite email)
- Use `supabase.auth.admin.generateLink({ type: 'magiclink' })` or password reset flow for invite
- Wrap profile + subscription creation in a transaction
- If profile creation fails after auth user is created, clean up the auth user
- Log activity via existing `userActivity` table pattern

## Component References

- Input styles: match existing admin dashboard patterns (see `user-list-dashboard.tsx`)
- Button: `color-primary` bg, consistent with admin UI
- Form layout: 2-column grid on desktop, stacked on mobile
