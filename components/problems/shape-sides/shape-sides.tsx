import { AnswerBlank, ProblemRow } from "@/components/problems/shared/answer-blank";
import { ShapeOutline, type ShapeKind } from "@/components/problems/visuals/shape-outline";

export function ShapeSides({
  shape,
  fontSize = "1.25rem",
  className,
}: { shape: ShapeKind; fontSize?: string | number; className?: string }) {
  return (
    <ProblemRow fontSize={fontSize} className={className}>
      <ShapeOutline shape={shape} />
      <div className="flex flex-row items-baseline gap-2">
        <span>How many sides?</span>
        <AnswerBlank />
      </div>
    </ProblemRow>
  );
}
