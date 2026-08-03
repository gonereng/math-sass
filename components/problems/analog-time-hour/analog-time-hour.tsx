import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { ClockHour } from "@/components/problems/visuals/clock-hour";

export function AnalogTimeHour({
  hour,
  fontSize = "1.25rem",
  className,
}: { hour: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <ClockHour hour={hour} />
      <div className="flex flex-row items-baseline gap-2">
        <span>Time:</span>
        <AnswerBlank minWidthClass="min-w-[3rem]" />
        <span>:00</span>
      </div>
    </ProblemRow>
  );
}
