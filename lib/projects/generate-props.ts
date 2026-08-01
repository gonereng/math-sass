import { randomIntInRange } from "@/lib/random";

const SUPPORTED_PROBLEM_TYPES = new Set(["addition-blank"]);

export function isSupportedProblemType(problemTypeId: string): boolean {
  return SUPPORTED_PROBLEM_TYPES.has(problemTypeId);
}

export function propsFromRange(
  problemTypeId: string,
  rangeMin: number,
  rangeMax: number,
): Record<string, number> {
  if (problemTypeId === "addition-blank") {
    return {
      a: randomIntInRange(rangeMin, rangeMax),
      b: randomIntInRange(rangeMin, rangeMax),
    };
  }
  throw new Error(`Unsupported problem type: ${problemTypeId}`);
}
