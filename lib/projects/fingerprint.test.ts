import { describe, expect, it } from "vitest";
import { compositionFingerprint } from "./fingerprint";

describe("compositionFingerprint", () => {
  it("is stable for same composition", () => {
    const sections = [
      { id: "a", pageCount: 5, sortOrder: 0 },
      { id: "b", pageCount: 2, sortOrder: 1 },
    ];
    expect(compositionFingerprint(sections)).toBe(
      compositionFingerprint(sections),
    );
  });

  it("changes when pageCount changes", () => {
    const a = compositionFingerprint([
      { id: "a", pageCount: 5, sortOrder: 0 },
    ]);
    const b = compositionFingerprint([
      { id: "a", pageCount: 6, sortOrder: 0 },
    ]);
    expect(a).not.toBe(b);
  });

  it("changes when order changes", () => {
    const a = compositionFingerprint([
      { id: "x", pageCount: 1, sortOrder: 0 },
      { id: "y", pageCount: 1, sortOrder: 1 },
    ]);
    const b = compositionFingerprint([
      { id: "y", pageCount: 1, sortOrder: 0 },
      { id: "x", pageCount: 1, sortOrder: 1 },
    ]);
    expect(a).not.toBe(b);
  });
});
