import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function BeforeAfter({
  n,
  fontSize = "1.25rem",
  className,
}: { n: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-2", className)}>
      <AnswerBlank minWidthClass="min-w-[2.5rem]" />
      <span>, {n} ,</span>
      <AnswerBlank minWidthClass="min-w-[2.5rem]" />
    </ProblemRow>
  );
}
