import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { ClockHour } from "@/components/problems/visuals/clock-hour";
import { solveProblem } from "@/lib/projects/solve-problem";

export function AnalogTimeHour({
  hour,
  fontSize = "1.25rem",
  className,
  showAnswer = false,
}: {
  hour: number;
  fontSize?: string | number;
  className?: string;
  showAnswer?: boolean;
}) {
  const answer = showAnswer
    ? solveProblem("analog-time-hour", { hour })
    : undefined;
  const hourPart =
    typeof answer === "string" ? answer.replace(/:00$/, "") : undefined;
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <ClockHour hour={hour} />
      <div className="flex flex-row items-baseline gap-2">
        <span>Time:</span>
        <AnswerBlank
          minWidthClass="min-w-[3rem]"
          answer={hourPart}
        />
        <span>:00</span>
      </div>
    </ProblemRow>
  );
}
