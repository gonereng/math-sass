import { SHAPE_KINDS } from "@/components/problems/visuals/shape-outline";
import { randomIntInRange } from "@/lib/random";
import { problemTypes } from "@/components/problems/registry";

const SUPPORTED_PROBLEM_TYPES = new Set(problemTypes.map((p) => p.id));

export function isSupportedProblemType(problemTypeId: string): boolean {
  return SUPPORTED_PROBLEM_TYPES.has(problemTypeId);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function orderedPair(
  rangeMin: number,
  rangeMax: number,
): { lo: number; hi: number } {
  const a = randomIntInRange(rangeMin, rangeMax);
  const b = randomIntInRange(rangeMin, rangeMax);
  return a >= b ? { hi: a, lo: b } : { hi: b, lo: a };
}

export type GeneratedProps = Record<string, number | string>;

export function propsFromRange(
  problemTypeId: string,
  rangeMin: number,
  rangeMax: number,
): GeneratedProps {
  const min = rangeMin;
  const max = rangeMax;

  switch (problemTypeId) {
    case "addition-blank":
    case "vertical-addition":
    case "compare-numbers":
      return {
        a: randomIntInRange(min, max),
        b: randomIntInRange(min, max),
      };
    case "subtraction-blank":
    case "vertical-subtraction": {
      const { hi, lo } = orderedPair(min, max);
      return { a: hi, b: lo };
    }
    case "missing-addend": {
      const a = randomIntInRange(min, max);
      const addend = randomIntInRange(min, max);
      return { a, c: a + addend };
    }
    case "missing-subtrahend": {
      const { hi, lo } = orderedPair(min, max);
      return { a: hi, c: lo };
    }
    case "doubles-addition":
      return { a: randomIntInRange(min, max) };
    case "make-ten": {
      const lo = clamp(min, 0, 10);
      const hi = clamp(max, 0, 10);
      const a = randomIntInRange(Math.min(lo, hi), Math.max(lo, hi));
      return { a };
    }
    case "ten-more": {
      const hi = Math.max(min, Math.min(max, 90));
      const lo = Math.min(min, hi);
      return { n: randomIntInRange(lo, hi) };
    }
    case "ten-less": {
      const lo = Math.max(min, 10);
      const hi = Math.max(lo, max);
      return { n: randomIntInRange(lo, hi) };
    }
    case "tens-ones": {
      const value = randomIntInRange(clamp(min, 10, 99), clamp(max, 10, 99));
      return { tens: Math.floor(value / 10), ones: value % 10 };
    }
    case "before-after":
      return { n: randomIntInRange(Math.max(min, 1), max) };
    case "number-sequence": {
      const start = randomIntInRange(min, max);
      return { start, blankIndex: randomIntInRange(0, 3) };
    }
    case "skip-count-2": {
      const start = randomIntInRange(min, max);
      return { start: start % 2 === 0 ? start : start + 1 };
    }
    case "skip-count-5": {
      const raw = randomIntInRange(min, max);
      const start = Math.max(0, Math.round(raw / 5) * 5) || 5;
      return { start };
    }
    case "skip-count-10": {
      const raw = randomIntInRange(min, max);
      const start = Math.max(10, Math.round(raw / 10) * 10);
      return { start };
    }
    case "ten-frame-count": {
      const lo = clamp(min, 0, 10);
      const hi = clamp(max, 0, 10);
      return { count: randomIntInRange(Math.min(lo, hi), Math.max(lo, hi)) };
    }
    case "analog-time-hour":
      return { hour: randomIntInRange(1, 12) };
    case "shape-sides": {
      const shape = SHAPE_KINDS[randomIntInRange(0, SHAPE_KINDS.length - 1)]!;
      return { shape };
    }
    case "longer-shorter": {
      let aLength = randomIntInRange(1, 8);
      let bLength = randomIntInRange(1, 8);
      if (aLength === bLength) {
        bLength = aLength === 8 ? 7 : aLength + 1;
      }
      return { aLength, bLength };
    }
    default:
      throw new Error(`Unsupported problem type: ${problemTypeId}`);
  }
}
