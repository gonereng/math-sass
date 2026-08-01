import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorksheetPageView } from "./worksheet-page-view";

describe("WorksheetPageView", () => {
  it("renders addition problem without inputs or drag handles", () => {
    const html = renderToStaticMarkup(
      createElement(WorksheetPageView, {
        layoutId: "two-columns",
        items: [
          {
            boxId: "col-left",
            problemTypeId: "addition-blank",
            sortOrder: 0,
            props: { a: 2, b: 7 },
          },
        ],
      }),
    );
    expect(html).toContain("2");
    expect(html).toContain("7");
    expect(html.toLowerCase()).not.toContain("<input");
    expect(html).not.toContain("data-drag-handle");
  });
});
