import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";
import { solveProblem } from "@/lib/projects/solve-problem";

export function VerticalSubtraction({
  a,
  b,
  fontSize = "1.1rem",
  className,
  showAnswer = false,
}: {
  a: number;
  b: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("vertical-subtraction", { a, b })
    : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={cn("font-mono tabular-nums", className)}>
      <div
        data-equation-grid="vertical"
        className="grid w-full grid-cols-[1.5ch_minmax(3ch,1fr)] items-end justify-items-end gap-x-1 gap-y-0.5"
      >
        <span />
        <span>{a}</span>
        <span className="justify-self-center">−</span>
        <span>{b}</span>
        <span className="col-span-2 border-b-2 border-black" />
        <span />
        <AnswerBlank
          className="w-full"
          minWidthClass="min-w-0"
          answer={typeof answer === "string" ? answer : undefined}
        />
      </div>
    </ProblemRow>
  );
}
