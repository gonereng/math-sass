import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdditionBlank } from "./addition-blank";

describe("AdditionBlank", () => {
  it("renders addends and has no input element", () => {
    const html = renderToStaticMarkup(
      createElement(AdditionBlank, { a: 3, b: 5 }),
    );
    expect(html).toContain('data-equation-grid="binary-eq"');
    expect(html).toContain("3");
    expect(html).toContain("5");
    expect(html).toContain("+");
    expect(html).toContain("=");
    expect(html.toLowerCase()).not.toContain("<input");
  });
});
