# Account Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Settings page (sidebar link above email) where users can change their password and delete their account after confirming with the current password.

**Architecture:** Extend the existing `(app)` shell with `/settings`. Zod schemas + server actions (`changePassword`, `deleteAccount`) reuse `hashPassword` / `verifyPassword` and session `auth()`. Protect `/settings` via middleware matcher and `auth.config` app-route list.

**Tech Stack:** Next.js App Router, Auth.js, Prisma, Zod, Vitest, shadcn/ui, sonner

## Global Constraints

- Product name: **MathSheets**
- Page title: **Settings**; subtitle: **Manage your account**
- Change password fields: Current password, New password, Confirm new password; button **Update password**
- Success toast: **Password updated**
- Delete: current password only; button **Delete account** (destructive); then sign out → `/login`
- Error strings exactly: `"Current password is incorrect"`, `"Passwords do not match"`, `"Something went wrong"`
- New password min length: **8**
- Spec: `docs/superpowers/specs/2026-07-31-account-settings-design.md`
- Follow existing patterns in `lib/actions/register.ts`, `components/login-form.tsx`
- No schema migration; no profile/email editing

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/validations/settings.ts` | `changePasswordSchema`, `deleteAccountSchema` |
| `lib/validations/settings.test.ts` | Zod unit tests |
| `lib/actions/change-password.ts` | `changePassword` server action |
| `lib/actions/delete-account.ts` | `deleteAccount` server action |
| `components/change-password-form.tsx` | Change password form UI |
| `components/delete-account-form.tsx` | Delete account form UI |
| `app/(app)/settings/page.tsx` | Settings page composition |
| `components/app-sidebar.tsx` | Settings link above email |
| `lib/auth.config.ts` | Treat `/settings` as app route |
| `middleware.ts` | Matcher includes `/settings` |

---

### Task 1: Settings Zod schemas (TDD)

**Files:**
- Create: `lib/validations/settings.ts`
- Create: `lib/validations/settings.test.ts`

**Interfaces:**
- Consumes: `zod`
- Produces:
  - `changePasswordSchema` / `ChangePasswordInput`
  - `deleteAccountSchema` / `DeleteAccountInput`

- [ ] **Step 1: Write failing tests**

Create `lib/validations/settings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { changePasswordSchema, deleteAccountSchema } from "./settings";

describe("changePasswordSchema", () => {
  it("accepts valid input", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "newpass12",
      confirmPassword: "newpass12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirm", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass12",
      newPassword: "newpass12",
      confirmPassword: "different1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Passwords do not match");
    }
  });
});

describe("deleteAccountSchema", () => {
  it("accepts current password", () => {
    const result = deleteAccountSchema.safeParse({
      currentPassword: "oldpass12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const result = deleteAccountSchema.safeParse({ currentPassword: "" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect fail**

```bash
npm test -- lib/validations/settings.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement schemas**

Create `lib/validations/settings.ts`:

```ts
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test -- lib/validations/settings.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/validations/settings.ts lib/validations/settings.test.ts
git commit -m "feat: add settings password validation schemas"
```

---

### Task 2: Change password + delete account server actions

**Files:**
- Create: `lib/actions/change-password.ts`
- Create: `lib/actions/delete-account.ts`

**Interfaces:**
- Consumes: `auth` from `@/lib/auth`, `prisma`, `hashPassword`, `verifyPassword`, settings schemas
- Produces:
  - `changePassword(input: ChangePasswordInput): Promise<{ ok: true } | { ok: false; error: string }>`
  - `deleteAccount(input: DeleteAccountInput): Promise<{ ok: true } | { ok: false; error: string }>`

- [ ] **Step 1: Implement changePassword**

Create `lib/actions/change-password.ts`:

```ts
"use server";

import { auth } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/settings";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePassword(
  input: ChangePasswordInput,
): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Something went wrong" };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const mismatch = parsed.error.issues.find(
      (i) => i.message === "Passwords do not match",
    );
    return {
      ok: false,
      error: mismatch ? "Passwords do not match" : "Something went wrong",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.password) {
      return { ok: false, error: "Something went wrong" };
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      user.password,
    );
    if (!valid) {
      return { ok: false, error: "Current password is incorrect" };
    }

    const password = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong" };
  }
}
```

- [ ] **Step 2: Implement deleteAccount**

Create `lib/actions/delete-account.ts`:

```ts
"use server";

import { auth } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  deleteAccountSchema,
  type DeleteAccountInput,
} from "@/lib/validations/settings";

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteAccount(
  input: DeleteAccountInput,
): Promise<DeleteAccountResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Something went wrong" };
  }

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Something went wrong" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user?.password) {
      return { ok: false, error: "Something went wrong" };
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      user.password,
    );
    if (!valid) {
      return { ok: false, error: "Current password is incorrect" };
    }

    await prisma.user.delete({ where: { id: user.id } });
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong" };
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors related to these files.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/change-password.ts lib/actions/delete-account.ts
git commit -m "feat: add change-password and delete-account actions"
```

---

### Task 3: Settings page UI + sidebar link + route protection

**Files:**
- Create: `components/change-password-form.tsx`
- Create: `components/delete-account-form.tsx`
- Create: `app/(app)/settings/page.tsx`
- Modify: `components/app-sidebar.tsx`
- Modify: `lib/auth.config.ts`
- Modify: `middleware.ts`

**Interfaces:**
- Consumes: `changePassword`, `deleteAccount`, sonner `toast`, `signOut` from `next-auth/react`
- Produces: working `/settings` UI and nav entry

- [ ] **Step 1: Protect `/settings`**

In `lib/auth.config.ts`, add `pathname.startsWith("/settings")` to `isAppRoute`.

In `middleware.ts` matcher, add `"/settings/:path*"`.

- [ ] **Step 2: Change password form**

Create `components/change-password-form.tsx` (client):

- Fields: `currentPassword`, `newPassword`, `confirmPassword` (password inputs)
- On submit: call `changePassword`; on `{ ok: false }` show `error`; on success `toast("Password updated")` and reset form via `e.currentTarget.reset()` or controlled clear
- Button label: **Update password**
- Use shadcn Card / Input / Label / Button like login form

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changePassword } from "@/lib/actions/change-password";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    const result = await changePassword({
      currentPassword: String(data.get("currentPassword") ?? ""),
      newPassword: String(data.get("newPassword") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    });

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }

    toast("Password updated");
    form.reset();
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Choose a new password for your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 3: Delete account form**

Create `components/delete-account-form.tsx` (client):

- Warning copy: deleting is permanent and cannot be undone
- Field: current password
- Destructive button **Delete account** (`variant="destructive"`)
- On success: `await signOut({ callbackUrl: "/login" })` (action already deleted user)
- On error: show `result.error`

```tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { deleteAccount } from "@/lib/actions/delete-account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const data = new FormData(e.currentTarget);

    const result = await deleteAccount({
      currentPassword: String(data.get("currentPassword") ?? ""),
    });

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }

    await signOut({ callbackUrl: "/login" });
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Danger zone</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This cannot
          be undone.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deleteCurrentPassword">Current password</Label>
            <Input
              id="deleteCurrentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button type="submit" variant="destructive" disabled={pending}>
            {pending ? "Deleting…" : "Delete account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 4: Settings page**

Create `app/(app)/settings/page.tsx`:

```tsx
import { ChangePasswordForm } from "@/components/change-password-form";
import { DeleteAccountForm } from "@/components/delete-account-form";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account
        </p>
      </div>
      <ChangePasswordForm />
      <DeleteAccountForm />
    </div>
  );
}
```

- [ ] **Step 5: Sidebar — Settings above email**

Modify `components/app-sidebar.tsx` footer to:

```tsx
<div className="space-y-2 border-t p-3">
  <Link
    href="/settings"
    className={cn(
      "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
      pathname === "/settings"
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    )}
  >
    Settings
  </Link>
  <p className="truncate px-1 text-xs text-muted-foreground">{email}</p>
  <LogoutButton />
</div>
```

Do **not** add Settings to the main `links` array (footer only).

- [ ] **Step 6: Smoke build**

```bash
npm test
npx tsc --noEmit
```

Expected: tests pass; no TS errors.

- [ ] **Step 7: Commit**

```bash
git add components/change-password-form.tsx components/delete-account-form.tsx app/(app)/settings/page.tsx components/app-sidebar.tsx lib/auth.config.ts middleware.ts
git commit -m "feat: add settings page with password change and account deletion"
```

---

### Task 4: Manual verification

**Files:** none required unless bugs found

- [ ] **Step 1: Manual checklist**

With `docker compose up -d`, DB on **5433**, and `npm run dev`:

1. Settings appears above email; opens `/settings`
2. Wrong current password on change → `"Current password is incorrect"`
3. Valid change → toast **Password updated**; login works with new password
4. Wrong password on delete → account remains
5. Correct password on delete → redirected to `/login`; cannot log in with old credentials
6. Logged out visit to `/settings` → redirect `/login`

- [ ] **Step 2: Commit only if fixes were needed**

Otherwise no commit.

---

## Self-review (plan vs spec)

| Spec item | Task |
|-----------|------|
| Settings above email | 3 |
| `/settings` single page | 3 |
| Change password 3 fields + toast | 2, 3 |
| Delete with current password | 2, 3 |
| Exact error strings | 1, 2 |
| Protect `/settings` | 3 |
| Zod unit tests | 1 |
| Manual checklist | 4 |

No TBD placeholders. Signatures consistent (`ChangePasswordResult` / `DeleteAccountResult`).
