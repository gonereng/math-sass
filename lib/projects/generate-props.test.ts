import { describe, expect, it } from "vitest";
import { problemTypes } from "@/components/problems/registry";
import {
  isSupportedProblemType,
  propsFromRange,
} from "./generate-props";

describe("propsFromRange", () => {
  it("returns a and b within range for addition-blank", () => {
    for (let i = 0; i < 20; i++) {
      const props = propsFromRange("addition-blank", 2, 4);
      expect(props.a).toBeGreaterThanOrEqual(2);
      expect(props.a).toBeLessThanOrEqual(4);
      expect(props.b).toBeGreaterThanOrEqual(2);
      expect(props.b).toBeLessThanOrEqual(4);
    }
  });

  it("keeps minuend >= subtrahend for subtraction-blank", () => {
    for (let i = 0; i < 20; i++) {
      const props = propsFromRange("subtraction-blank", 1, 10);
      expect(Number(props.a)).toBeGreaterThanOrEqual(Number(props.b));
    }
  });

  it("supports every registered problem type", () => {
    for (const entry of problemTypes) {
      expect(isSupportedProblemType(entry.id)).toBe(true);
      const props = propsFromRange(entry.id, 1, 10);
      expect(Object.keys(props).length).toBeGreaterThan(0);
    }
  });

  it("throws for unknown problem type", () => {
    expect(() => propsFromRange("nope", 1, 5)).toThrow();
  });
});
