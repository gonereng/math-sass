import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MissingAddend } from "./missing-addend";

describe("MissingAddend", () => {
  it("uses missing-mid equation grid", () => {
    const html = renderToStaticMarkup(
      createElement(MissingAddend, { a: 7, c: 12 }),
    );
    expect(html).toContain('data-equation-grid="missing-mid"');
    expect(html).toContain("7");
    expect(html).toContain("+");
    expect(html).toContain("12");
    expect(html).toContain("=");
  });
});
