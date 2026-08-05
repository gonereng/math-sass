import { describe, expect, it } from "vitest";
import { solveProblem } from "./solve-problem";

describe("solveProblem", () => {
  it("solves addition-blank", () => {
    expect(solveProblem("addition-blank", { a: 3, b: 5 })).toBe("8");
  });

  it("solves vertical-addition", () => {
    expect(solveProblem("vertical-addition", { a: 12, b: 8 })).toBe("20");
  });

  it("solves subtraction-blank", () => {
    expect(solveProblem("subtraction-blank", { a: 9, b: 4 })).toBe("5");
  });

  it("solves doubles-addition", () => {
    expect(solveProblem("doubles-addition", { a: 6 })).toBe("12");
  });

  it("solves missing-addend", () => {
    expect(solveProblem("missing-addend", { a: 7, c: 12 })).toBe("5");
  });

  it("solves missing-subtrahend", () => {
    expect(solveProblem("missing-subtrahend", { a: 10, c: 3 })).toBe("7");
  });

  it("solves make-ten", () => {
    expect(solveProblem("make-ten", { a: 4 })).toBe("6");
  });

  it("solves compare-numbers", () => {
    expect(solveProblem("compare-numbers", { a: 3, b: 5 })).toBe("<");
    expect(solveProblem("compare-numbers", { a: 5, b: 5 })).toBe("=");
    expect(solveProblem("compare-numbers", { a: 9, b: 2 })).toBe(">");
  });

  it("solves ten-more and ten-less", () => {
    expect(solveProblem("ten-more", { n: 34 })).toBe("44");
    expect(solveProblem("ten-less", { n: 52 })).toBe("42");
  });

  it("solves tens-ones", () => {
    expect(solveProblem("tens-ones", { tens: 3, ones: 4 })).toBe("34");
  });

  it("solves before-after as two answers", () => {
    expect(solveProblem("before-after", { n: 10 })).toEqual(["9", "11"]);
  });

  it("solves number-sequence", () => {
    expect(solveProblem("number-sequence", { start: 4, blankIndex: 2 })).toBe(
      "6",
    );
  });

  it("solves skip counts", () => {
    expect(solveProblem("skip-count-2", { start: 2 })).toBe("8");
    expect(solveProblem("skip-count-5", { start: 5 })).toBe("20");
    expect(solveProblem("skip-count-10", { start: 10 })).toBe("40");
  });

  it("solves ten-frame-count", () => {
    expect(solveProblem("ten-frame-count", { count: 7 })).toBe("7");
  });

  it("solves analog-time-hour", () => {
    expect(solveProblem("analog-time-hour", { hour: 3 })).toBe("3:00");
  });

  it("solves shape-sides", () => {
    expect(solveProblem("shape-sides", { shape: "triangle" })).toBe("3");
  });

  it("solves longer-shorter", () => {
    expect(solveProblem("longer-shorter", { aLength: 3, bLength: 5 })).toBe(
      "B",
    );
    expect(solveProblem("longer-shorter", { aLength: 7, bLength: 2 })).toBe(
      "A",
    );
  });

  it("throws on unknown type", () => {
    expect(() => solveProblem("nope", {})).toThrow();
  });
});
