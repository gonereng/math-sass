import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerBlank } from "./answer-blank";

describe("AnswerBlank", () => {
  it("renders empty underline without answer", () => {
    const html = renderToStaticMarkup(createElement(AnswerBlank));
    expect(html).toContain("border-b-2");
    expect(html).not.toMatch(/>8</);
  });

  it("renders filled answer text", () => {
    const html = renderToStaticMarkup(
      createElement(AnswerBlank, { answer: "8" }),
    );
    expect(html).toContain("8");
  });
});
