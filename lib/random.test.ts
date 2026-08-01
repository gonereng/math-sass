import { describe, expect, it } from "vitest";
import { randomIntInRange } from "./random";

describe("randomIntInRange", () => {
  it("returns values within inclusive range", () => {
    for (let i = 0; i < 50; i++) {
      const n = randomIntInRange(1, 5);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it("works when min === max", () => {
    expect(randomIntInRange(3, 3)).toBe(3);
  });
});
