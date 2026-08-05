import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT_COLUMNS: Record<
  "binary-eq" | "missing-mid" | "vertical" | "compare",
  string
> = {
  "binary-eq": "auto auto auto auto minmax(3rem, 1fr)",
  "missing-mid": "auto auto minmax(2.5rem, 1fr) auto auto",
  vertical: "auto minmax(3ch, 1fr)",
  compare: "auto minmax(2rem, 1fr) auto",
};

export function EquationGrid({
  variant,
  fontSize = "1.1rem",
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
        "grid w-full items-end gap-x-1.5 font-mono font-medium tabular-nums text-black",
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
    <span className={cn("justify-self-start text-right tabular-nums", className)}>
      {children}
    </span>
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
