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
      <div
        data-equation-grid="vertical"
        className="inline-grid grid-cols-[1.5ch_3ch] items-end justify-items-end gap-x-1 gap-y-0.5"
      >
        <span />
        <span>{a}</span>
        <span className="justify-self-center">−</span>
        <span>{b}</span>
        <span className="col-span-2 border-b-2 border-black" />
        <span />
        <AnswerBlank className="w-full" minWidthClass="min-w-0" />
      </div>
    </ProblemRow>
  );
}
