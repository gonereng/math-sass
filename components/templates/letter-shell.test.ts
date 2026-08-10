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

  it("renders French header labels when locale is fr", () => {
    const html = renderToStaticMarkup(
      createElement(
        LetterShellView,
        { headerLocale: "fr" },
        createElement("div", null, "body"),
      ),
    );
    expect(html).toContain("Nom");
    expect(html).toContain("Classe");
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
        { overflowing: true, pageHeight: 400, scale: 1, stageHeight: 400 },
        "x",
      ),
    );
    expect(html).toContain('data-overflow-wash="true"');
    expect(html).toContain("letter-shell-viewport");
  });

  it("applies kids-frame background and hides black border", () => {
    const html = renderToStaticMarkup(
      createElement(LetterShellView, { backgroundId: "kids-frame" }, "x"),
    );
    expect(html).toContain('data-sheet-background="kids-frame"');
    expect(html).toContain("/backgrounds/kids-frame.jpg");
    expect(html).not.toContain("border-2 border-black");
  });

  it("keeps black border for blank", () => {
    const html = renderToStaticMarkup(
      createElement(LetterShellView, { backgroundId: "blank" }, "x"),
    );
    expect(html).toContain('data-sheet-background="blank"');
    expect(html).toContain("border-2 border-black");
  });
});
