import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EquationGrid,
} from "@/components/problems/shared/equation-layout";

export function CompareNumbers({
  a,
  b,
  fontSize = "1.25rem",
  className,
}: { a: number; b: number; fontSize?: string | number; className?: string }) {
  return (
    <EquationGrid variant="compare" fontSize={fontSize} className={className}>
      <DigitCell>{a}</DigitCell>
      <AnswerBlank className="w-full" minWidthClass="min-w-0" />
      <DigitCell>{b}</DigitCell>
    </EquationGrid>
  );
}
