import { describe, expect, it } from "vitest";
import {
  SIDEBAR_OFFSET_CLASS,
  SIDEBAR_WIDTH_CLASS,
  TOP_BAR_HEIGHT_CLASS,
  WORKSPACE_LABEL,
} from "./workspace";

describe("workspace chrome constants", () => {
  it("uses Academic Workspace label", () => {
    expect(WORKSPACE_LABEL).toBe("Academic Workspace");
  });

  it("uses 320px sidebar width utilities", () => {
    expect(SIDEBAR_WIDTH_CLASS).toBe("w-80");
    expect(SIDEBAR_OFFSET_CLASS).toBe("pl-80");
    expect(TOP_BAR_HEIGHT_CLASS).toBe("h-16");
  });
});
