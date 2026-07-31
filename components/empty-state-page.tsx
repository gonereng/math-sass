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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" onClick={() => toast("Coming soon")}>
          {actionLabel}
        </Button>
      </div>
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    </div>
  );
}
