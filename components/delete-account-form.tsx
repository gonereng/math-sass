"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { deleteAccount } from "@/lib/actions/delete-account";
import { Button } from "@/components/ui/button";
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
    <div className="panel-ruled border-destructive/35 p-5 sm:p-6">
      <div className="mb-4 border-b border-border pb-3">
        <h2 className="text-base font-semibold tracking-tight text-destructive">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This cannot
          be undone.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deleteCurrentPassword">Current password</Label>
          <Input
            id="deleteCurrentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="destructive"
          className="rounded-lg"
          disabled={pending}
        >
          {pending ? "Deleting…" : "Delete account"}
        </Button>
      </form>
    </div>
  );
}
