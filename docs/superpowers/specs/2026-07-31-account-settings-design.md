# MathSheets — Account Settings Design

**Date:** 2026-07-31  
**Status:** Approved for implementation planning  
**Scope:** Settings nav link + change password + delete account (confirm with current password)

## 1. Purpose

Give signed-in users a Settings screen to change their password and permanently delete their account, reachable from the app sidebar footer.

## 2. Goals & non-goals

### Goals
- Add a **Settings** link in the sidebar footer, above the email address
- `/settings` page inside the existing `(app)` shell
- Change password: current + new + confirm new
- Delete account: require current password, then hard-delete user and sign out
- Protect `/settings` like other app routes

### Non-goals
- Profile/name/email editing
- Email verification / password-reset-by-email
- Soft-delete or account recovery
- Two-factor authentication
- Billing or notification preferences

## 3. Approach

**Single Settings page** at `/settings` with two sections (Change password, Danger zone). No sub-routes.

## 4. UI

### Sidebar footer (top → bottom)
1. **Settings** → `/settings` (active state when on `/settings`)
2. User email
3. Log out

### Settings page
- Title: **Settings**
- Subtitle: Manage your account

#### Change password
- Fields: Current password, New password, Confirm new password
- Button: Update password
- On success: toast **Password updated**, clear form fields

#### Danger zone
- Short warning that deletion is permanent
- Field: Current password
- Button: Delete account (destructive styling)
- On success: delete user → clear session → redirect `/login`

## 5. Behavior & data

### Auth gate
- Middleware matcher includes `/settings`
- `(app)` layout already requires a session
- Server actions call `auth()` and refuse if no `session.user.id`

### Change password
1. Validate with Zod: current required; new min 8 chars; confirm must equal new
2. Load user by session id; verify current via `verifyPassword`
3. On failure: `"Current password is incorrect"` or `"Passwords do not match"` (client/schema)
4. Hash new password with `hashPassword`; update `User.password`
5. Unexpected errors: `"Something went wrong"`

### Delete account
1. Validate current password present
2. Verify current password; wrong → `"Current password is incorrect"`
3. `prisma.user.delete({ where: { id } })` — cascades `Account` / `Session`
4. Sign out and redirect to `/login`
5. Unexpected errors: `"Something went wrong"`

No schema migration required (`User.password` already exists; cascade deletes already defined).

## 6. Files (expected)

| Path | Role |
|------|------|
| `components/app-sidebar.tsx` | Settings link above email |
| `app/(app)/settings/page.tsx` | Settings page shell |
| `components/change-password-form.tsx` | Change password UI |
| `components/delete-account-form.tsx` | Delete account UI |
| `lib/validations/settings.ts` | Zod schemas |
| `lib/actions/change-password.ts` | Server action |
| `lib/actions/delete-account.ts` | Server action |
| `middleware.ts` / `lib/auth.config.ts` | Protect `/settings` |
| `lib/validations/settings.test.ts` | Schema unit tests |

## 7. Testing

### Manual
1. Settings appears above email and opens `/settings`
2. Wrong current password on change → error; account password unchanged
3. Valid change → toast; login works with new password
4. Wrong password on delete → account remains
5. Correct password on delete → cannot log in; redirected to login

### Automated
- Zod tests: match, mismatch, short new password

## 8. Resolved decisions

| Decision | Choice |
|----------|--------|
| Delete confirmation | Current password only |
| Change password fields | Current + new + confirm |
| Structure | Single `/settings` page |
