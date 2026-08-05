import { SHAPE_SIDES, type ShapeKind } from "@/components/problems/visuals/shape-outline";

function num(props: Record<string, unknown>, key: string): number {
  return Number(props[key]);
}

export function solveProblem(
  problemTypeId: string,
  props: Record<string, unknown>,
): string | string[] {
  switch (problemTypeId) {
    case "addition-blank":
    case "vertical-addition":
      return String(num(props, "a") + num(props, "b"));
    case "subtraction-blank":
    case "vertical-subtraction":
      return String(num(props, "a") - num(props, "b"));
    case "doubles-addition":
      return String(num(props, "a") + num(props, "a"));
    case "missing-addend":
      return String(num(props, "c") - num(props, "a"));
    case "missing-subtrahend":
      return String(num(props, "a") - num(props, "c"));
    case "make-ten":
      return String(10 - num(props, "a"));
    case "compare-numbers": {
      const a = num(props, "a");
      const b = num(props, "b");
      return a < b ? "<" : a > b ? ">" : "=";
    }
    case "ten-more":
      return String(num(props, "n") + 10);
    case "ten-less":
      return String(num(props, "n") - 10);
    case "tens-ones":
      return String(10 * num(props, "tens") + num(props, "ones"));
    case "before-after": {
      const n = num(props, "n");
      return [String(n - 1), String(n + 1)];
    }
    case "number-sequence":
      return String(num(props, "start") + num(props, "blankIndex"));
    case "skip-count-2":
      return String(num(props, "start") + 6);
    case "skip-count-5":
      return String(num(props, "start") + 15);
    case "skip-count-10":
      return String(num(props, "start") + 30);
    case "ten-frame-count":
      return String(num(props, "count"));
    case "analog-time-hour":
      return `${num(props, "hour")}:00`;
    case "shape-sides": {
      const shape = props.shape as ShapeKind;
      return String(SHAPE_SIDES[shape]);
    }
    case "longer-shorter":
      return num(props, "aLength") > num(props, "bLength") ? "A" : "B";
    default:
      throw new Error(`Unsupported problem type: ${problemTypeId}`);
  }
}
