import { describe, expect, it } from "vitest";
import { problemTypes } from "./registry";

describe("problemTypes registry", () => {
  it("exports at least one entry with required fields", () => {
    expect(problemTypes.length).toBeGreaterThanOrEqual(1);
    const entry = problemTypes[0];
    expect(entry).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      demoProps: expect.any(Object),
    });
    expect(typeof entry.Component).toBe("function");
  });

  it("includes addition-blank with exact demo meta", () => {
    const addition = problemTypes.find((p) => p.id === "addition-blank");
    expect(addition).toBeDefined();
    expect(addition?.name).toBe("Addition blank");
    expect(addition?.description).toBe("A + B with a blank for the sum");
    expect(addition?.demoProps).toEqual({ a: 3, b: 5 });
  });

  it("registers 21 grade-1 problem types with unique ids", () => {
    expect(problemTypes).toHaveLength(21);
    const ids = problemTypes.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
