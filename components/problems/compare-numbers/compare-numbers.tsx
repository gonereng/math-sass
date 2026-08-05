import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EquationGrid,
} from "@/components/problems/shared/equation-layout";
import { solveProblem } from "@/lib/projects/solve-problem";

export function CompareNumbers({
  a,
  b,
  fontSize = "1.25rem",
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
    ? solveProblem("compare-numbers", { a, b })
    : undefined;
  return (
    <EquationGrid variant="compare" fontSize={fontSize} className={className}>
      <DigitCell>{a}</DigitCell>
      <AnswerBlank
        className="w-full"
        minWidthClass="min-w-0"
        answer={typeof answer === "string" ? answer : undefined}
      />
      <DigitCell>{b}</DigitCell>
    </EquationGrid>
  );
}
