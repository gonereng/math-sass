import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";

export function NumberSequence({
  start,
  blankIndex,
  fontSize = "1.25rem",
  className,
}: { start: number; blankIndex: number; fontSize?: string | number; className?: string }) {
  const idx = Math.max(0, Math.min(3, blankIndex));
  const terms = [0, 1, 2, 3].map((i) => start + i);
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row flex-wrap items-baseline gap-1", className)}>
      {terms.map((value, i) => (
        <span key={i} className="inline-flex items-baseline gap-1">
          {i === idx ? <AnswerBlank minWidthClass="min-w-[2.5rem]" /> : <span>{value}</span>}
          {i < terms.length - 1 ? <span>,</span> : null}
        </span>
      ))}
    </ProblemRow>
  );
}
