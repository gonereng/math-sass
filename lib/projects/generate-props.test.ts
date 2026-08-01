import { describe, expect, it } from "vitest";
import { propsFromRange } from "./generate-props";

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

  it("throws for unknown problem type", () => {
    expect(() => propsFromRange("nope", 1, 5)).toThrow();
  });
});
