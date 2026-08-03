import { cn } from "@/lib/utils";

/** Simple tens rods + ones dots. */
export function BaseTen({
  tens,
  ones,
  className,
}: {
  tens: number;
  ones: number;
  className?: string;
}) {
  const t = Math.max(0, Math.min(9, Math.round(tens)));
  const o = Math.max(0, Math.min(9, Math.round(ones)));
  return (
    <div
      className={cn("inline-flex items-end gap-2", className)}
      aria-hidden="true"
    >
      <div className="flex items-end gap-0.5">
        {Array.from({ length: t }, (_, i) => (
          <span
            key={i}
            className="h-8 w-1.5 rounded-[1px] border border-black bg-neutral-300"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-0.5" style={{ maxWidth: "2.5rem" }}>
        {Array.from({ length: o }, (_, i) => (
          <span
            key={i}
            className="size-2 rounded-full border border-black bg-black"
          />
        ))}
      </div>
    </div>
  );
}
