"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type EmptyStatePageProps = {
  title: string;
  description: string;
  emptyMessage: string;
  actionLabel: string;
};

export function EmptyStatePage({
  title,
  description,
  emptyMessage,
  actionLabel,
}: EmptyStatePageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" onClick={() => toast("Coming soon")}>
          {actionLabel}
        </Button>
      </div>
      <div className="panel-ruled flex min-h-64 items-center justify-center border-dashed">
        <p className="font-mono text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    </div>
  );
}
