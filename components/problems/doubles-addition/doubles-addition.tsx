import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";
import { cn } from "@/lib/utils";
import { solveProblem } from "@/lib/projects/solve-problem";

export function DoublesAddition({
  a,
  fontSize = "1.25rem",
  className,
  showAnswer = false,
}: {
  a: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("doubles-addition", { a })
    : undefined;
  return (
    <EquationGrid
      variant="binary-eq"
      fontSize={fontSize}
      className={className}
    >
      <DigitCell>{a}</DigitCell>
      <OpCell>+</OpCell>
      <DigitCell>{a}</DigitCell>
      <EqCell />
      <AnswerBlank
        className={cn("w-full")}
        minWidthClass="min-w-0"
        answer={typeof answer === "string" ? answer : undefined}
      />
    </EquationGrid>
  );
}
