import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { LengthBars } from "@/components/problems/visuals/length-bars";
import { solveProblem } from "@/lib/projects/solve-problem";

export function LongerShorter({
  aLength,
  bLength,
  fontSize = "1.25rem",
  className,
  showAnswer = false,
}: {
  aLength: number;
  bLength: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("longer-shorter", { aLength, bLength })
    : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <LengthBars aLength={aLength} bLength={bLength} />
      <div className="flex flex-row items-baseline gap-2">
        <span>Which is longer?</span>
        <AnswerBlank
          minWidthClass="min-w-[2rem]"
          answer={typeof answer === "string" ? answer : undefined}
        />
      </div>
    </ProblemRow>
  );
}
