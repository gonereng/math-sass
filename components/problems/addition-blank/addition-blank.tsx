import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";
import { cn } from "@/lib/utils";
import type { AdditionBlankProps } from "@/components/problems/types";
import { solveProblem } from "@/lib/projects/solve-problem";

export function AdditionBlank({
  a,
  b,
  fontSize = "1.25rem",
  className,
  showAnswer = false,
}: AdditionBlankProps & { showAnswer?: boolean }) {
  const answer = showAnswer
    ? solveProblem("addition-blank", { a, b })
    : undefined;
  return (
    <EquationGrid
      variant="binary-eq"
      fontSize={fontSize}
      className={className}
    >
      <DigitCell>{a}</DigitCell>
      <OpCell>+</OpCell>
      <DigitCell>{b}</DigitCell>
      <EqCell />
      <AnswerBlank
        className={cn("w-full")}
        minWidthClass="min-w-0"
        answer={typeof answer === "string" ? answer : undefined}
      />
    </EquationGrid>
  );
}
