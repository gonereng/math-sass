import { describe, expect, it } from "vitest";
import { isPageOverflowing } from "./page-overflow";

describe("isPageOverflowing", () => {
  it("is true when content is taller than the page", () => {
    expect(isPageOverflowing(1200, 1000)).toBe(true);
  });

  it("is false when content fits exactly", () => {
    expect(isPageOverflowing(1000, 1000)).toBe(false);
  });

  it("is false when content is shorter than the page", () => {
    expect(isPageOverflowing(800, 1000)).toBe(false);
  });

  it("is false when page height is zero (not yet measured)", () => {
    expect(isPageOverflowing(500, 0)).toBe(false);
  });
});
