import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { ShapeOutline, type ShapeKind } from "@/components/problems/visuals/shape-outline";
import { solveProblem } from "@/lib/projects/solve-problem";

export function ShapeSides({
  shape,
  fontSize = "1.25rem",
  className,
  showAnswer = false,
}: {
  shape: ShapeKind;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("shape-sides", { shape })
    : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <ShapeOutline shape={shape} />
      <div className="flex flex-row items-baseline gap-2">
        <span>How many sides?</span>
        <AnswerBlank answer={typeof answer === "string" ? answer : undefined} />
      </div>
    </ProblemRow>
  );
}
