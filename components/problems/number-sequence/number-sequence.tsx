import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { cn } from "@/lib/utils";
import { solveProblem } from "@/lib/projects/solve-problem";

export function NumberSequence({
  start,
  blankIndex,
  fontSize = "1.25rem",
  className,
  showAnswer = false,
}: {
  start: number;
  blankIndex: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const idx = Math.max(0, Math.min(3, blankIndex));
  const terms = [0, 1, 2, 3].map((i) => start + i);
  const answer = showAnswer
    ? solveProblem("number-sequence", { start, blankIndex: idx })
    : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={cn("flex-row flex-wrap items-baseline gap-1", className)}>
      {terms.map((value, i) => (
        <span key={i} className="inline-flex items-baseline gap-1">
          {i === idx ? (
            <AnswerBlank
              minWidthClass="min-w-[2.5rem]"
              answer={typeof answer === "string" ? answer : undefined}
            />
          ) : (
            <span>{value}</span>
          )}
          {i < terms.length - 1 ? <span>,</span> : null}
        </span>
      ))}
    </ProblemRow>
  );
}
