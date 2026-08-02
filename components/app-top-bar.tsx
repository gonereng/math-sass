"use client";

import { Bell, CircleHelp } from "lucide-react";
import { NewWorkbookButton } from "@/components/new-workbook-button";
import {
  SIDEBAR_OFFSET_CLASS,
  TOP_BAR_HEIGHT_CLASS,
  WORKSPACE_LABEL,
} from "@/lib/ui/workspace";
import { cn } from "@/lib/utils";

export function AppTopBar() {
  return (
    <header
      data-print-hide
      className={cn(
        "fixed top-0 right-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl",
        SIDEBAR_OFFSET_CLASS,
        TOP_BAR_HEIGHT_CLASS,
      )}
    >
      <p className="text-sm text-muted-foreground">{WORKSPACE_LABEL}</p>
      <div className="flex items-center gap-4">
        <NewWorkbookButton />
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Help"
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          >
            <CircleHelp className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
