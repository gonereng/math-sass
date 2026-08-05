import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";
import { solveProblem } from "@/lib/projects/solve-problem";

export function TenLess({
  n,
  fontSize = "1.1rem",
  className,
  showAnswer = false,
}: {
  n: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer ? solveProblem("ten-less", { n }) : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-2", className)}>
      <span>10 less than {n} is</span>
      <AnswerBlank answer={typeof answer === "string" ? answer : undefined} />
    </ProblemRow>
  );
}
