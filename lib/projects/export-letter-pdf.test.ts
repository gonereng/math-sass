import { describe, expect, it } from "vitest";
import { pickFirstPagePerSection } from "./export-letter-pdf";

describe("pickFirstPagePerSection", () => {
  it("keeps only the first page of each section in order", () => {
    const pages = [
      { id: "a1", sectionId: "a" },
      { id: "a2", sectionId: "a" },
      { id: "b1", sectionId: "b" },
      { id: "a3", sectionId: "a" },
      { id: "c1", sectionId: "c" },
    ];
    expect(pickFirstPagePerSection(pages).map((p) => p.id)).toEqual([
      "a1",
      "b1",
      "c1",
    ]);
  });
});
