"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Log out
    </Button>
  );
}
