import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";
import { solveProblem } from "@/lib/projects/solve-problem";

export function SkipCount5({
  start,
  fontSize = "1.25rem",
  className,
  showAnswer = false,
}: {
  start: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("skip-count-5", { start })
    : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-1", className)}>
      <span>{start}, {start + 5}, {start + 10},</span>
      <AnswerBlank
        minWidthClass="min-w-[2.5rem]"
        answer={typeof answer === "string" ? answer : undefined}
      />
    </ProblemRow>
  );
}
