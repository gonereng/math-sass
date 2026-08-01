import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Visual 8.5×11 preview chrome (not a real Template). */
export function LetterPreviewFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      <div
        className="relative w-full max-w-md origin-top bg-white text-black shadow-md ring-1 ring-black/10"
        style={{ aspectRatio: "8.5 / 11" }}
      >
        <div className="absolute inset-0 overflow-hidden p-[8%]">
          {children}
        </div>
      </div>
    </div>
  );
}
