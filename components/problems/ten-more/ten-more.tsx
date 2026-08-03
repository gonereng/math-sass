import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function TenMore({
  n,
  fontSize = "1.25rem",
  className,
}: { n: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row items-baseline gap-2", className)}>
      <span>10 more than {n} is</span>
      <AnswerBlank />
    </ProblemRow>
  );
}
