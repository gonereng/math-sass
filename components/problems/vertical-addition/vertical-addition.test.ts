import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VerticalAddition } from "./vertical-addition";

describe("VerticalAddition", () => {
  it("uses vertical equation grid with operator column", () => {
    const html = renderToStaticMarkup(
      createElement(VerticalAddition, { a: 12, b: 8 }),
    );
    expect(html).toContain('data-equation-grid="vertical"');
    expect(html).toContain("12");
    expect(html).toContain("8");
    expect(html).toContain("+");
  });
});
