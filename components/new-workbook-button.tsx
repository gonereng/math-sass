"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createProject } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";

export function NewWorkbookButton({
  className,
  label = "New Workbook",
  size = "sm",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "default" | "lg";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const result = await createProject();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push("/projects");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      disabled={pending}
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <Plus className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
