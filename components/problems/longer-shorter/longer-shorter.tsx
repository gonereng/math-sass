import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { LengthBars } from "@/components/problems/visuals/length-bars";

export function LongerShorter({
  aLength,
  bLength,
  fontSize = "1.25rem",
  className,
}: { aLength: number; bLength: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <LengthBars aLength={aLength} bLength={bLength} />
      <div className="flex flex-row items-baseline gap-2">
        <span>Which is longer?</span>
        <AnswerBlank minWidthClass="min-w-[2rem]" />
      </div>
    </ProblemRow>
  );
}
