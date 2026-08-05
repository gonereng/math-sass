import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT_COLUMNS: Record<
  "binary-eq" | "missing-mid" | "vertical" | "compare",
  string
> = {
  "binary-eq": "2.5ch 1.5ch 2.5ch 1.5ch minmax(4rem, auto)",
  "missing-mid": "2.5ch 1.5ch minmax(2.5rem, auto) 1.5ch 2.5ch",
  vertical: "1.5ch 3ch",
  compare: "2.5ch minmax(2rem, auto) 2.5ch",
};

export function EquationGrid({
  variant,
  fontSize = "1.25rem",
  className,
  children,
}: {
  variant: keyof typeof VARIANT_COLUMNS;
  fontSize?: string | number;
  className?: string;
  children: ReactNode;
}) {
  const size = typeof fontSize === "number" ? `${fontSize}px` : fontSize;
  return (
    <div
      data-equation-grid={variant}
      className={cn(
        "inline-grid items-baseline gap-x-1.5 font-mono font-medium tabular-nums text-black",
        className,
      )}
      style={{
        fontSize: size,
        gridTemplateColumns: VARIANT_COLUMNS[variant],
      }}
    >
      {children}
    </div>
  );
}

export function DigitCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-right", className)}>{children}</span>
  );
}

export function OpCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("text-center", className)}>{children}</span>;
}

export function EqCell({ className }: { className?: string }) {
  return <span className={cn("text-center", className)}>=</span>;
}
