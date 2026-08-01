import { describe, expect, it } from "vitest";
import { minMaxSchema } from "./template";

describe("minMaxSchema", () => {
  it("accepts valid range", () => {
    expect(minMaxSchema.safeParse({ min: 1, max: 10 }).success).toBe(true);
  });

  it("rejects min > max", () => {
    expect(minMaxSchema.safeParse({ min: 5, max: 2 }).success).toBe(false);
  });
});
