import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function DoublesAddition({
  a,
  fontSize = "1.25rem",
  className,
}: { a: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-2", className)}>
      <span>{a} + {a} =</span>
      <AnswerBlank />
    </ProblemRow>
  );
}
