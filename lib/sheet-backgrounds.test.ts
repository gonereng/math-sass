import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTENT_INSET_IN,
  DEFAULT_SHEET_BACKGROUND_ID,
  MAX_CONTENT_INSET_IN,
  MIN_CONTENT_INSET_IN,
  SHEET_BACKGROUNDS,
  clampContentInsetIn,
  getSheetBackground,
  isSheetBackgroundId,
} from "./sheet-backgrounds";

describe("sheet backgrounds", () => {
  it("defaults to blank", () => {
    expect(DEFAULT_SHEET_BACKGROUND_ID).toBe("blank");
    expect(getSheetBackground().src).toBeNull();
    expect(getSheetBackground().showPageBorder).toBe(true);
    expect(getSheetBackground().defaultContentInsetIn).toBe(
      DEFAULT_CONTENT_INSET_IN,
    );
  });

  it("includes kids-frame without page border and a larger inset default", () => {
    expect(SHEET_BACKGROUNDS["kids-frame"]).toMatchObject({
      id: "kids-frame",
      label: "Kids frame",
      src: "/backgrounds/kids-frame.jpg",
      showPageBorder: false,
      defaultContentInsetIn: 0.9,
    });
  });

  it("falls back to blank for unknown ids", () => {
    expect(getSheetBackground("nope").id).toBe("blank");
  });

  it("validates ids", () => {
    expect(isSheetBackgroundId("blank")).toBe(true);
    expect(isSheetBackgroundId("kids-frame")).toBe(true);
    expect(isSheetBackgroundId("x")).toBe(false);
  });

  it("clamps content inset inches", () => {
    expect(clampContentInsetIn(0.9)).toBe(0.9);
    expect(clampContentInsetIn(0)).toBe(MIN_CONTENT_INSET_IN);
    expect(clampContentInsetIn(99)).toBe(MAX_CONTENT_INSET_IN);
    expect(clampContentInsetIn(Number.NaN)).toBe(DEFAULT_CONTENT_INSET_IN);
  });
});
