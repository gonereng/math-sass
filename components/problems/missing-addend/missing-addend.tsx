import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";
import { solveProblem } from "@/lib/projects/solve-problem";

export function MissingAddend({
  a,
  c,
  fontSize = "1.1rem",
  className,
  showAnswer = false,
}: {
  a: number;
  c: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("missing-addend", { a, c })
    : undefined;
  return (
    <EquationGrid
      variant="missing-mid"
      fontSize={fontSize}
      className={className}
    >
      <DigitCell>{a}</DigitCell>
      <OpCell>+</OpCell>
      <AnswerBlank
        className="w-full"
        minWidthClass="min-w-0"
        answer={typeof answer === "string" ? answer : undefined}
      />
      <EqCell />
      <DigitCell>{c}</DigitCell>
    </EquationGrid>
  );
}
