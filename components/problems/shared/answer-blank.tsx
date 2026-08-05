import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnswerBlank({
  className,
  minWidthClass = "min-w-[4rem]",
  answer,
}: {
  className?: string;
  minWidthClass?: string;
  answer?: string | number | null;
}) {
  const filled = answer != null && String(answer) !== "";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block w-full border-b-2 border-black text-center leading-tight",
        minWidthClass,
        className,
      )}
    >
      {filled ? String(answer) : "\u00a0"}
    </span>
  );
}

export function ProblemRow({
  children,
  fontSize = "1.1rem",
  className,
}: {
  children: ReactNode;
  fontSize?: string | number;
  className?: string;
}) {
  const size = typeof fontSize === "number" ? `${fontSize}px` : fontSize;
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 font-medium text-black",
        className,
      )}
      style={{ fontSize: size }}
    >
      {children}
    </div>
  );
}
