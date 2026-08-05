import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";
import { cn } from "@/lib/utils";
import type { AdditionBlankProps } from "@/components/problems/types";

export function AdditionBlank({
  a,
  b,
  fontSize = "1.25rem",
  className,
}: AdditionBlankProps) {
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
      <AnswerBlank className={cn("w-full")} minWidthClass="min-w-0" />
    </EquationGrid>
  );
}
