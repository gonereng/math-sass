import { describe, expect, it } from "vitest";
import {
  pageCountSchema,
  updateProjectBackgroundSchema,
  updateProjectNameSchema,
} from "./project";

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

describe("updateProjectNameSchema", () => {
  it("trims and accepts a non-empty name", () => {
    expect(
      updateProjectNameSchema.parse({
        projectId: "p1",
        name: "  My workbook  ",
      }),
    ).toEqual({ projectId: "p1", name: "My workbook" });
  });

  it("rejects blank names", () => {
    expect(() =>
      updateProjectNameSchema.parse({ projectId: "p1", name: "   " }),
    ).toThrow();
  });
});

describe("updateProjectBackgroundSchema", () => {
  it("accepts blank and kids-frame", () => {
    for (const backgroundId of ["blank", "kids-frame"]) {
      expect(
        updateProjectBackgroundSchema.safeParse({
          projectId: "p1",
          backgroundId,
        }).success,
      ).toBe(true);
    }
  });

  it("rejects unknown background", () => {
    expect(
      updateProjectBackgroundSchema.safeParse({
        projectId: "p1",
        backgroundId: "neon",
      }).success,
    ).toBe(false);
  });
});
