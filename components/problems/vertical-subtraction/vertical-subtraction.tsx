import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function VerticalSubtraction({
  a,
  b,
  fontSize = "1.25rem",
  className,
}: { a: number; b: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={cn("font-mono tabular-nums", className)}>
      <div className="inline-flex flex-col items-end gap-0.5">
        <span className="px-1">{a}</span>
        <span className="border-b-2 border-black px-1">− {b}</span>
        <AnswerBlank className="mt-1 w-full" minWidthClass="min-w-[3rem]" />
      </div>
    </ProblemRow>
  );
}
