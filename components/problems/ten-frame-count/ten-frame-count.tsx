import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { TenFrame } from "@/components/problems/visuals/ten-frame";

export function TenFrameCount({
  count,
  fontSize = "1.25rem",
  className,
}: { count: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <TenFrame filled={count} />
      <div className="flex flex-row items-baseline gap-2">
        <span>How many?</span>
        <AnswerBlank />
      </div>
    </ProblemRow>
  );
}
