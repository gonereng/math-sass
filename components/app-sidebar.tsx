"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { SIDEBAR_WIDTH_CLASS } from "@/lib/ui/workspace";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/problems", label: "Problems", icon: Calculator },
  { href: "/templates", label: "Templates", icon: FileText },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside
      data-print-hide
      className={cn(
        "fixed top-0 left-0 z-50 flex h-full flex-col bg-sidebar py-8 shadow-[1px_0_0_rgba(0,0,0,0.05)]",
        SIDEBAR_WIDTH_CLASS,
      )}
    >
      <div className="mb-10 flex items-center gap-3 px-6">
        <Link
          href="/dashboard"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          MathSheets
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-bold text-sidebar-foreground"
                  : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 px-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-sidebar-accent font-bold text-sidebar-foreground"
              : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Settings className="size-5 shrink-0" aria-hidden />
          Settings
        </Link>
        <div className="rounded-xl bg-[var(--surface-container)] px-4 py-3">
          <p className="truncate text-xs font-medium tracking-wide text-foreground uppercase">
            Account
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
