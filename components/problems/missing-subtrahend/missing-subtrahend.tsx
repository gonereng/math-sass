import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";

export function MissingSubtrahend({
  a,
  c,
  fontSize = "1.25rem",
  className,
}: {
  a: number;
  c: number;
  fontSize?: string | number;
  className?: string;
}) {
  return (
    <EquationGrid
      variant="missing-mid"
      fontSize={fontSize}
      className={className}
    >
      <DigitCell>{a}</DigitCell>
      <OpCell>−</OpCell>
      <AnswerBlank className="w-full" minWidthClass="min-w-0" />
      <EqCell />
      <DigitCell>{c}</DigitCell>
    </EquationGrid>
  );
}
