import { cn } from "@/lib/utils";
import type { AdditionBlankProps } from "@/components/problems/types";

export function AdditionBlank({
  a,
  b,
  fontSize = "1.25rem",
  className,
}: AdditionBlankProps) {
  const size = typeof fontSize === "number" ? `${fontSize}px` : fontSize;

  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-2 font-medium text-foreground",
        className,
      )}
      style={{ fontSize: size }}
    >
      <span>
        {a} + {b} =
      </span>
      <span
        aria-hidden="true"
        className="inline-block min-w-[4rem] border-b-2 border-foreground align-baseline"
      />
    </div>
  );
}
