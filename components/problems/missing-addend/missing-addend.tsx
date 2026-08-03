import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function MissingAddend({
  a,
  c,
  fontSize = "1.25rem",
  className,
}: { a: number; c: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-2", className)}>
      <span>{a} +</span>
      <AnswerBlank minWidthClass="min-w-[2.5rem]" />
      <span>= {c}</span>
    </ProblemRow>
  );
}
