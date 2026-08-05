import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { TenFrame } from "@/components/problems/visuals/ten-frame";
import { solveProblem } from "@/lib/projects/solve-problem";

export function TenFrameCount({
  count,
  fontSize = "1.1rem",
  className,
  showAnswer = false,
}: {
  count: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("ten-frame-count", { count })
    : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <TenFrame filled={count} />
      <div className="flex flex-row items-baseline gap-2">
        <span>How many?</span>
        <AnswerBlank answer={typeof answer === "string" ? answer : undefined} />
      </div>
    </ProblemRow>
  );
}
