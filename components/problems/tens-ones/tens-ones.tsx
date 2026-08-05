import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { EqCell } from "@/components/problems/shared/equation-layout";
import { BaseTen } from "@/components/problems/visuals/base-ten";

export function TensOnes({
  tens,
  ones,
  fontSize = "1.25rem",
  className,
}: { tens: number; ones: number; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <BaseTen tens={tens} ones={ones} />
      <div
        data-equation-grid="tens-ones"
        className="inline-grid grid-cols-[auto_1.5ch_minmax(4rem,auto)] items-baseline gap-x-1.5 font-mono tabular-nums"
      >
        <span>
          {tens} tens {ones} ones
        </span>
        <EqCell />
        <AnswerBlank className="w-full" minWidthClass="min-w-0" />
      </div>
    </ProblemRow>
  );
}
