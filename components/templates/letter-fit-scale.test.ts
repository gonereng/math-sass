import { describe, expect, it } from "vitest";
import { fitLetterScale } from "./letter-fit-scale";

describe("fitLetterScale", () => {
  it("returns 1 when viewport is wider than the letter page", () => {
    expect(fitLetterScale(900, 816)).toBe(1);
  });

  it("scales down when viewport is narrower", () => {
    expect(fitLetterScale(408, 816)).toBe(0.5);
  });

  it("returns 1 for invalid sizes", () => {
    expect(fitLetterScale(0, 816)).toBe(1);
    expect(fitLetterScale(400, 0)).toBe(1);
  });
});
