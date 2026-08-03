import { cn } from "@/lib/utils";

/** 2×5 ten-frame; `filled` cells 0–10. */
export function TenFrame({
  filled,
  className,
}: {
  filled: number;
  className?: string;
}) {
  const n = Math.max(0, Math.min(10, Math.round(filled)));
  return (
    <div
      className={cn("inline-grid grid-cols-5 gap-0.5", className)}
      aria-hidden="true"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-3 rounded-full border border-black sm:size-3.5",
            i < n ? "bg-black" : "bg-transparent",
          )}
        />
      ))}
    </div>
  );
}
