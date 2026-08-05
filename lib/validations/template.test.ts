import { describe, expect, it } from "vitest";
import {
  minMaxSchema,
  updateTemplateNameSchema,
} from "./template";

describe("minMaxSchema", () => {
  it("accepts valid range with count", () => {
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 1 }).success,
    ).toBe(true);
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 50 }).success,
    ).toBe(true);
  });

  it("rejects min > max", () => {
    expect(
      minMaxSchema.safeParse({ min: 5, max: 2, count: 1 }).success,
    ).toBe(false);
  });

  it("rejects count below 1", () => {
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 0 }).success,
    ).toBe(false);
  });

  it("rejects count above 50", () => {
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 51 }).success,
    ).toBe(false);
  });

  it("rejects missing count", () => {
    expect(minMaxSchema.safeParse({ min: 1, max: 10 }).success).toBe(false);
  });
});

describe("updateTemplateNameSchema", () => {
  it("trims and accepts a non-empty name", () => {
    expect(
      updateTemplateNameSchema.parse({
        templateId: "t1",
        name: "  Practice  ",
      }),
    ).toEqual({ templateId: "t1", name: "Practice" });
  });

  it("rejects blank names", () => {
    expect(() =>
      updateTemplateNameSchema.parse({ templateId: "t1", name: "   " }),
    ).toThrow();
  });
});
