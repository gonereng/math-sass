import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
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
      <div className="flex flex-row items-baseline gap-2">
        <span>
          {tens} tens {ones} ones =
        </span>
        <AnswerBlank />
      </div>
    </ProblemRow>
  );
}
