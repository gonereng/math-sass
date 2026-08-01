import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LetterShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[52rem] border-2 border-black bg-white p-8 text-black",
        className,
      )}
    >
      <header className="mb-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <ShellBlank label="Name" widthClass="min-w-[10rem]" />
        <ShellBlank label="Class" widthClass="min-w-[6rem]" />
        <ShellBlank label="Date" widthClass="min-w-[6rem]" />
      </header>
      <div>{children}</div>
    </div>
  );
}

function ShellBlank({
  label,
  widthClass,
}: {
  label: string;
  widthClass: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span>{label}:</span>
      <span
        aria-hidden="true"
        className={cn("inline-block border-b border-black", widthClass)}
      >
        &nbsp;
      </span>
    </div>
  );
}
