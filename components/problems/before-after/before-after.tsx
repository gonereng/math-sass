import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";
import { solveProblem } from "@/lib/projects/solve-problem";

export function BeforeAfter({
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
  const answers = showAnswer ? solveProblem("before-after", { n }) : undefined;
  const before = Array.isArray(answers) ? answers[0] : undefined;
  const after = Array.isArray(answers) ? answers[1] : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-2", className)}>
      <AnswerBlank minWidthClass="min-w-[2.5rem]" answer={before} />
      <span>, {n} ,</span>
      <AnswerBlank minWidthClass="min-w-[2.5rem]" answer={after} />
    </ProblemRow>
  );
}
