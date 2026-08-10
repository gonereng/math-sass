import { describe, expect, it } from "vitest";
import {
  assertSnapshotRanges,
  buildTemplateSnapshot,
} from "./snapshot";

describe("buildTemplateSnapshot", () => {
  it("copies name, layout, and item ranges without concrete props", () => {
    const snap = buildTemplateSnapshot({
      name: "Addition practice",
      layoutId: "two-columns",
      items: [
        {
          boxId: "col-left",
          problemTypeId: "addition-blank",
          sortOrder: 0,
          rangeMin: 1,
          rangeMax: 10,
          props: { a: 3, b: 5 },
        },
      ],
    });
    expect(snap).toEqual({
      templateName: "Addition practice",
      layoutId: "two-columns",
      backgroundId: "blank",
      contentInsetIn: 0.5,
      items: [
        {
          boxId: "col-left",
          problemTypeId: "addition-blank",
          sortOrder: 0,
          rangeMin: 1,
          rangeMax: 10,
        },
      ],
    });
  });

  it("copies background and inset from the template", () => {
    const snap = buildTemplateSnapshot({
      name: "Framed",
      layoutId: "two-columns",
      backgroundId: "kids-frame",
      contentInsetIn: 1.1,
      items: [],
    });
    expect(snap.backgroundId).toBe("kids-frame");
    expect(snap.contentInsetIn).toBe(1.1);
  });
});

describe("assertSnapshotRanges", () => {
  it("rejects missing ranges", () => {
    const result = assertSnapshotRanges({
      templateName: "T",
      layoutId: "two-columns",
      backgroundId: "blank",
      contentInsetIn: 0.5,
      items: [
        {
          boxId: "col-left",
          problemTypeId: "addition-blank",
          sortOrder: 0,
          rangeMin: null as unknown as number,
          rangeMax: 10,
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts empty items", () => {
    expect(
      assertSnapshotRanges({
        templateName: "Empty",
        layoutId: "two-columns",
        backgroundId: "blank",
        contentInsetIn: 0.5,
        items: [],
      }).ok,
    ).toBe(true);
  });
});
