import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LetterShellView } from "./letter-shell";

describe("LetterShellView", () => {
  it("renders Name/Class/Date blanks", () => {
    const html = renderToStaticMarkup(
      createElement(LetterShellView, null, createElement("div", null, "body")),
    );
    expect(html).toContain("Name");
    expect(html).toContain("Class");
    expect(html).toContain("Date");
  });

  it("does not render overflow wash when not overflowing", () => {
    const html = renderToStaticMarkup(
      createElement(LetterShellView, { overflowing: false }, "x"),
    );
    expect(html).not.toContain('data-overflow-wash="true"');
  });

  it("renders overflow wash when overflowing", () => {
    const html = renderToStaticMarkup(
      createElement(
        LetterShellView,
        { overflowing: true, pageHeight: 400 },
        "x",
      ),
    );
    expect(html).toContain('data-overflow-wash="true"');
  });
});
