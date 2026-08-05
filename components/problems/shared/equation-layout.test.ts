import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "./equation-layout";
import { AnswerBlank } from "./answer-blank";

describe("EquationGrid", () => {
  it("renders binary-eq cells in order with grid class", () => {
    const html = renderToStaticMarkup(
      createElement(
        EquationGrid,
        { variant: "binary-eq" },
        createElement(DigitCell, null, "3"),
        createElement(OpCell, null, "+"),
        createElement(DigitCell, null, "5"),
        createElement(EqCell),
        createElement(AnswerBlank),
      ),
    );
    expect(html).toContain('data-equation-grid="binary-eq"');
    expect(html).toContain("3");
    expect(html).toContain("+");
    expect(html).toContain("5");
    expect(html).toContain("=");
    expect(html.toLowerCase()).not.toContain("<input");
  });
});
