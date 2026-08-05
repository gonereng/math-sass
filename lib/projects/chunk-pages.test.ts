import { describe, expect, it } from "vitest";
import { chunkPages } from "./chunk-pages";

describe("chunkPages", () => {
  it("chunks into groups of 4 with leftover", () => {
    expect(chunkPages([1, 2, 3, 4, 5], 4)).toEqual([[1, 2, 3, 4], [5]]);
  });

  it("returns empty for empty input", () => {
    expect(chunkPages([], 4)).toEqual([]);
  });

  it("defaults size to 4", () => {
    expect(chunkPages([1, 2, 3, 4, 5, 6, 7, 8])).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]);
  });
});
