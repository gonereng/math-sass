import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYOUT_ID,
  SWITCHABLE_LAYOUT_IDS,
  getLayout,
  getLayoutClassName,
  isSwitchableLayoutId,
  layoutPresets,
} from "./layouts";

describe("layouts", () => {
  it("defaults to two-columns with two boxes", () => {
    expect(DEFAULT_LAYOUT_ID).toBe("two-columns");
    const layout = getLayout(DEFAULT_LAYOUT_ID);
    expect(layout.boxes.map((b) => b.id)).toEqual(["col-left", "col-right"]);
  });

  it("includes single-column, three/four columns, and grid-2x2", () => {
    expect(getLayout("single-column").boxes.map((b) => b.id)).toEqual(["main"]);
    expect(getLayout("three-columns").boxes).toHaveLength(3);
    expect(getLayout("four-columns").boxes).toHaveLength(4);
    expect(getLayout("grid-2x2").boxes).toHaveLength(4);
  });

  it("lists all presets", () => {
    expect(layoutPresets.map((l) => l.id).sort()).toEqual(
      [
        "four-columns",
        "grid-2x2",
        "single-column",
        "three-columns",
        "two-columns",
      ].sort(),
    );
  });

  it("exposes switchable layouts for the editor", () => {
    expect([...SWITCHABLE_LAYOUT_IDS]).toEqual([
      "two-columns",
      "three-columns",
      "four-columns",
      "grid-2x2",
    ]);
    expect(isSwitchableLayoutId("two-columns")).toBe(true);
    expect(isSwitchableLayoutId("three-columns")).toBe(true);
    expect(isSwitchableLayoutId("four-columns")).toBe(true);
    expect(isSwitchableLayoutId("grid-2x2")).toBe(true);
    expect(isSwitchableLayoutId("single-column")).toBe(false);
  });

  it("maps layout ids to grid/flex classes", () => {
    expect(getLayoutClassName("two-columns")).toBe(
      "grid grid-cols-2 items-start gap-4",
    );
    expect(getLayoutClassName("three-columns")).toBe(
      "grid grid-cols-3 items-start gap-3",
    );
    expect(getLayoutClassName("four-columns")).toBe(
      "grid grid-cols-4 items-start gap-2",
    );
    expect(getLayoutClassName("grid-2x2")).toBe(
      "grid grid-cols-2 items-start gap-4",
    );
    expect(getLayoutClassName("single-column")).toBe("flex flex-col gap-4");
    expect(getLayoutClassName("unknown")).toBe(
      "grid grid-cols-2 items-start gap-4",
    );
  });
});
