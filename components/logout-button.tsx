"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 rounded-xl px-4 py-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="size-5" aria-hidden />
      Logout
    </Button>
  );
}
