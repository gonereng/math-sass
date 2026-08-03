import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function SubtractionBlank({
  a,
  b,
  fontSize = "1.25rem",
  className,
}: { a: number; b: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-2", className)}>
      <span>{a} − {b} =</span>
      <AnswerBlank />
    </ProblemRow>
  );
}
