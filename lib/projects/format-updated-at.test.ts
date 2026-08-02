import { describe, expect, it } from "vitest";
import { formatUpdatedAt } from "./format-updated-at";

describe("formatUpdatedAt", () => {
  it("formats ISO date as short en-US date", () => {
    expect(formatUpdatedAt("2026-08-02T12:00:00.000Z")).toBe("Aug 2, 2026");
  });
});
