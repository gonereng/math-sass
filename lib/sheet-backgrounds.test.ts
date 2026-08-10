import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHEET_BACKGROUND_ID,
  SHEET_BACKGROUNDS,
  getSheetBackground,
  isSheetBackgroundId,
} from "./sheet-backgrounds";

describe("sheet backgrounds", () => {
  it("defaults to blank", () => {
    expect(DEFAULT_SHEET_BACKGROUND_ID).toBe("blank");
    expect(getSheetBackground().src).toBeNull();
    expect(getSheetBackground().showPageBorder).toBe(true);
  });

  it("includes kids-frame without page border", () => {
    expect(SHEET_BACKGROUNDS["kids-frame"]).toMatchObject({
      id: "kids-frame",
      label: "Kids frame",
      src: "/backgrounds/kids-frame.png",
      showPageBorder: false,
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
});
