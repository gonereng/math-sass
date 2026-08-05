import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";
import { TenFrame } from "@/components/problems/visuals/ten-frame";

export function MakeTen({
  a,
  fontSize = "1.25rem",
  className,
}: { a: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <TenFrame filled={a} />
      <EquationGrid variant="missing-mid" fontSize={fontSize}>
        <DigitCell>{a}</DigitCell>
        <OpCell>+</OpCell>
        <AnswerBlank className="w-full" minWidthClass="min-w-0" />
        <EqCell />
        <DigitCell>10</DigitCell>
      </EquationGrid>
    </ProblemRow>
  );
}
