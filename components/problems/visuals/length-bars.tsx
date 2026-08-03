import { cn } from "@/lib/utils";

export function LengthBars({
  aLength,
  bLength,
  className,
}: {
  aLength: number;
  bLength: number;
  className?: string;
}) {
  const max = Math.max(aLength, bLength, 1);
  return (
    <div className={cn("flex flex-col gap-1.5", className)} aria-hidden="true">
      <div className="flex items-center gap-2">
        <span className="w-4 text-xs font-semibold">A</span>
        <span
          className="h-2.5 rounded-sm border border-black bg-neutral-400"
          style={{ width: `${(aLength / max) * 6}rem` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 text-xs font-semibold">B</span>
        <span
          className="h-2.5 rounded-sm border border-black bg-neutral-400"
          style={{ width: `${(bLength / max) * 6}rem` }}
        />
      </div>
    </div>
  );
}
