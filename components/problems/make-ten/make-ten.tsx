import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { TenFrame } from "@/components/problems/visuals/ten-frame";

export function MakeTen({
  a,
  fontSize = "1.25rem",
  className,
}: { a: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <TenFrame filled={a} />
      <div className="flex flex-row items-baseline gap-2">
        <span>{a} +</span>
        <AnswerBlank minWidthClass="min-w-[2.5rem]" />
        <span>= 10</span>
      </div>
    </ProblemRow>
  );
}
