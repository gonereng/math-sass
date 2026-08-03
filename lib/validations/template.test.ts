import { describe, expect, it } from "vitest";
import {
  minMaxSchema,
  updateTemplateNameSchema,
} from "./template";

describe("minMaxSchema", () => {
  it("accepts valid range", () => {
    expect(minMaxSchema.safeParse({ min: 1, max: 10 }).success).toBe(true);
  });

  it("rejects min > max", () => {
    expect(minMaxSchema.safeParse({ min: 5, max: 2 }).success).toBe(false);
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
