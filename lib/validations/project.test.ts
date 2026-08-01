import { describe, expect, it } from "vitest";
import { pageCountSchema } from "./project";

describe("pageCountSchema", () => {
  it("accepts 1 and 50", () => {
    expect(pageCountSchema.parse(1)).toBe(1);
    expect(pageCountSchema.parse(50)).toBe(50);
  });

  it("rejects 0 and 51", () => {
    expect(() => pageCountSchema.parse(0)).toThrow();
    expect(() => pageCountSchema.parse(51)).toThrow();
  });
});
