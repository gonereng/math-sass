"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/problems", label: "Problems" },
  { href: "/templates", label: "Templates" },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside data-print-hide className="flex h-screen w-60 flex-col border-r bg-background">
      <div className="border-b px-4 py-5">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          MathSheets
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
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
    </aside>
  );
}
