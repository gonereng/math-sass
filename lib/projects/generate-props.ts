import { randomIntInRange } from "@/lib/random";

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
