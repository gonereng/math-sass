"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { minMaxSchema } from "@/lib/validations/template";

type MinMaxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: {
    min: number;
    max: number;
  }) => boolean | Promise<boolean>;
  problemTypeName?: string;
};

export function MinMaxDialog({
  open,
  onOpenChange,
  onConfirm,
  problemTypeName,
}: MinMaxDialogProps) {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setMin("1");
      setMax("10");
      setError(null);
    }
  }, [open]);

  async function handleConfirm() {
    const parsed = minMaxSchema.safeParse({ min, max });
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Enter valid min and max integers",
      );
      return;
    }
    setPending(true);
    try {
      const success = await onConfirm(parsed.data);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Set number range</DialogTitle>
          <DialogDescription>
            {problemTypeName
              ? `Choose min and max for ${problemTypeName}.`
              : "Choose min and max values for the problem."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="template-min">Min</Label>
            <Input
              id="template-min"
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              aria-invalid={Boolean(error)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="template-max">Max</Label>
            <Input
              id="template-max"
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              aria-invalid={Boolean(error)}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={handleConfirm}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
