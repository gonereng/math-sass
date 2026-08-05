import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";
import { TenFrame } from "@/components/problems/visuals/ten-frame";
import { solveProblem } from "@/lib/projects/solve-problem";

export function MakeTen({
  a,
  fontSize = "1.1rem",
  className,
  showAnswer = false,
}: {
  a: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer ? solveProblem("make-ten", { a }) : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <TenFrame filled={a} />
      <EquationGrid variant="missing-mid" fontSize={fontSize}>
        <DigitCell>{a}</DigitCell>
        <OpCell>+</OpCell>
        <AnswerBlank
          className="w-full"
          minWidthClass="min-w-0"
          answer={typeof answer === "string" ? answer : undefined}
        />
        <EqCell />
        <DigitCell>10</DigitCell>
      </EquationGrid>
    </ProblemRow>
  );
}
