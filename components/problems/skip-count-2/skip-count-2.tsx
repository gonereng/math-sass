import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function SkipCount2({
  start,
  fontSize = "1.25rem",
  className,
}: { start: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-1", className)}>
      <span>{start}, {start + 2}, {start + 4},</span>
      <AnswerBlank minWidthClass="min-w-[2.5rem]" />
    </ProblemRow>
  );
}
