# PDF Answer Keys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append answer-key pages to project PDF export: 4 worksheet pages of filled answers per letter sheet in a 2×2 grid, covering all problem types.

**Architecture:** Central `solveProblem(problemTypeId, props)` returns answer string(s). `AnswerBlank` can display a filled value. Each problem component accepts `showAnswer?: boolean`. `WorksheetPageView` passes `showAnswer` + optional dense `fontSize`. `ProjectsEditor` chunks generated pages by 4 and renders answer-key `LetterShell` pages after worksheets in `[data-print-root]`.

**Tech Stack:** React 19, Tailwind, Vitest, existing print.css / `window.print()` flow

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-05-pdf-answer-keys-design.md`
- **4** worksheet pages per answer-key page; **2×2** mini grid
- **All** registry problem types
- Worksheets first, then answer keys in the same print root
- Leftover groups of 1–3 still get a page
- No DB persistence of keys; derive from generated page `items`/`props`
- Dense mini font for eval (e.g. `0.75rem` or `0.85rem` base)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/projects/solve-problem.ts` | Pure answer computation |
| `lib/projects/solve-problem.test.ts` | Solver unit tests |
| `lib/projects/chunk-pages.ts` | Chunk pages into groups of 4 |
| `lib/projects/chunk-pages.test.ts` | Chunk tests |
| `components/problems/shared/answer-blank.tsx` | Optional filled answer |
| Problem components (all types) | `showAnswer` wiring |
| `components/worksheets/worksheet-page-view.tsx` | Pass `showAnswer` / `fontSize` |
| `components/projects/answer-key-page.tsx` | 2×2 answer-key letter content |
| `components/projects/projects-editor.tsx` | Render answer-key pages |

---

### Task 1: `solveProblem` + `chunkPages`

**Files:**
- Create: `lib/projects/solve-problem.ts`
- Create: `lib/projects/solve-problem.test.ts`
- Create: `lib/projects/chunk-pages.ts`
- Create: `lib/projects/chunk-pages.test.ts`

**Interfaces:**
- Produces:
  - `solveProblem(problemTypeId: string, props: Record<string, unknown>): string | string[]`
  - `chunkPages<T>(pages: T[], size?: number): T[][]` — default `size = 4`

- [ ] **Step 1: Write failing solver tests**

```ts
import { describe, expect, it } from "vitest";
import { solveProblem } from "./solve-problem";

describe("solveProblem", () => {
  it("solves addition-blank", () => {
    expect(solveProblem("addition-blank", { a: 3, b: 5 })).toBe("8");
  });
  it("solves missing-addend", () => {
    expect(solveProblem("missing-addend", { a: 7, c: 12 })).toBe("5");
  });
  it("solves compare-numbers", () => {
    expect(solveProblem("compare-numbers", { a: 3, b: 5 })).toBe("<");
    expect(solveProblem("compare-numbers", { a: 5, b: 5 })).toBe("=");
    expect(solveProblem("compare-numbers", { a: 9, b: 2 })).toBe(">");
  });
  it("solves before-after as two answers", () => {
    expect(solveProblem("before-after", { n: 10 })).toEqual(["9", "11"]);
  });
  it("solves longer-shorter", () => {
    expect(solveProblem("longer-shorter", { aLength: 3, bLength: 5 })).toBe("B");
    expect(solveProblem("longer-shorter", { aLength: 7, bLength: 2 })).toBe("A");
  });
  it("solves shape-sides", () => {
    expect(solveProblem("shape-sides", { shape: "triangle" })).toBe("3");
  });
  it("solves number-sequence", () => {
    expect(solveProblem("number-sequence", { start: 4, blankIndex: 2 })).toBe("6");
  });
  it("throws on unknown type", () => {
    expect(() => solveProblem("nope", {})).toThrow();
  });
});
```

Also add a few more cases in the same file: `subtraction-blank`, `make-ten`, `ten-more`, `skip-count-2`, `analog-time-hour` (`"3:00"` for hour 3), `tens-ones`.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- lib/projects/solve-problem.test.ts`

- [ ] **Step 3: Implement `solveProblem`**

Implement a switch covering every id in `components/problems/registry.ts`:

```ts
export function solveProblem(
  problemTypeId: string,
  props: Record<string, unknown>,
): string | string[] {
  const n = (k: string) => Number(props[k]);
  switch (problemTypeId) {
    case "addition-blank":
    case "vertical-addition":
      return String(n("a") + n("b"));
    case "subtraction-blank":
    case "vertical-subtraction":
      return String(n("a") - n("b"));
    case "doubles-addition":
      return String(n("a") + n("a"));
    case "missing-addend":
      return String(n("c") - n("a"));
    case "missing-subtrahend":
      return String(n("a") - n("c"));
    case "make-ten":
      return String(10 - n("a"));
    case "compare-numbers": {
      const a = n("a");
      const b = n("b");
      return a < b ? "<" : a > b ? ">" : "=";
    }
    case "ten-more":
      return String(n("n") + 10);
    case "ten-less":
      return String(n("n") - 10);
    case "tens-ones":
      return String(10 * n("tens") + n("ones"));
    case "before-after":
      return [String(n("n") - 1), String(n("n") + 1)];
    case "number-sequence":
      return String(n("start") + n("blankIndex"));
    case "skip-count-2":
      return String(n("start") + 6);
    case "skip-count-5":
      return String(n("start") + 15);
    case "skip-count-10":
      return String(n("start") + 30);
    case "ten-frame-count":
      return String(n("count"));
    case "analog-time-hour":
      return `${n("hour")}:00`;
    case "shape-sides": {
      const { SHAPE_SIDES } = require("@/components/problems/visuals/shape-outline");
      // Prefer static import of SHAPE_SIDES at top of file instead of require
      return String(SHAPE_SIDES[props.shape as keyof typeof SHAPE_SIDES]);
    }
    case "longer-shorter":
      return n("aLength") > n("bLength") ? "A" : "B";
    default:
      throw new Error(`Unsupported problem type: ${problemTypeId}`);
  }
}
```

Use a proper ESM import for `SHAPE_SIDES`. Skip-count: three shown terms then blank → next after `start+2*3` etc. (`start`, `start+step`, `start+2*step`, blank = `start+3*step`).

- [ ] **Step 4: Chunk helper**

```ts
// lib/projects/chunk-pages.ts
export function chunkPages<T>(pages: T[], size = 4): T[][] {
  if (size < 1) throw new Error("size must be >= 1");
  const out: T[][] = [];
  for (let i = 0; i < pages.length; i += size) {
    out.push(pages.slice(i, i + size));
  }
  return out;
}
```

Test: `chunkPages([1,2,3,4,5], 4)` → `[[1,2,3,4],[5]]`; empty → `[]`.

- [ ] **Step 5: Run all new tests — PASS, then commit**

```bash
npm test -- lib/projects/solve-problem.test.ts lib/projects/chunk-pages.test.ts
git add lib/projects/solve-problem.ts lib/projects/solve-problem.test.ts lib/projects/chunk-pages.ts lib/projects/chunk-pages.test.ts
git commit -m "feat: add solveProblem and page chunking for answer keys"
```

---

### Task 2: Filled `AnswerBlank`

**Files:**
- Modify: `components/problems/shared/answer-blank.tsx`
- Create: `components/problems/shared/answer-blank.test.ts`

**Interfaces:**
- Produces: `AnswerBlank({ answer?: string | number | null, className?, minWidthClass? })` — when `answer != null && answer !== ""`, render the value inside the blank span; otherwise empty underline as today

- [ ] **Step 1: Failing test**

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerBlank } from "./answer-blank";

describe("AnswerBlank", () => {
  it("renders empty underline without answer", () => {
    const html = renderToStaticMarkup(createElement(AnswerBlank));
    expect(html).toContain("border-b-2");
    expect(html).not.toContain("8");
  });
  it("renders filled answer text", () => {
    const html = renderToStaticMarkup(
      createElement(AnswerBlank, { answer: "8" }),
    );
    expect(html).toContain("8");
  });
});
```

- [ ] **Step 2: Implement**

```tsx
export function AnswerBlank({
  className,
  minWidthClass = "min-w-[4rem]",
  answer,
}: {
  className?: string;
  minWidthClass?: string;
  answer?: string | number | null;
}) {
  const filled = answer != null && String(answer) !== "";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block border-b-2 border-black align-baseline text-center",
        minWidthClass,
        className,
      )}
    >
      {filled ? String(answer) : "\u00a0"}
    </span>
  );
}
```

- [ ] **Step 3: Tests pass + commit**

```bash
npm test -- components/problems/shared/answer-blank.test.ts
git add components/problems/shared/answer-blank.tsx components/problems/shared/answer-blank.test.ts
git commit -m "feat: allow AnswerBlank to show filled answers"
```

---

### Task 3: Wire `showAnswer` on all problem components

**Files:** Modify every problem component under `components/problems/*/` that uses blanks (all registry types). Update `addition-blank.test.ts` (and add one more type test if useful) to assert filled answer when `showAnswer`.

**Interfaces:**
- Consumes: `solveProblem`, `AnswerBlank` with `answer`
- Each component: `showAnswer?: boolean` — when true, call `solveProblem(id, props)` and pass result(s) to blank(s)

**Pattern (binary):**

```tsx
const answer = showAnswer
  ? solveProblem("addition-blank", { a, b })
  : undefined;
// ...
<AnswerBlank answer={typeof answer === "string" ? answer : undefined} ... />
```

**before-after:** `solveProblem` returns `[before, after]` — pass to the two blanks.

**compare-numbers:** fill middle blank with `<` / `>` / `=`.

**vertical-***: fill bottom `AnswerBlank` with sum/difference.

**Visual types** (ten-frame, clock, shape, longer-shorter, tens-ones): keep visuals; only fill the answer blank.

- [ ] **Step 1:** Update `AdditionBlank` + test with `showAnswer: true` expects `"8"` for `{a:3,b:5}`

- [ ] **Step 2:** Apply the same pattern to all remaining types listed in the registry (batch in one commit is OK if tests cover addition + before-after + compare)

- [ ] **Step 3:**

```bash
npm test
git add components/problems
git commit -m "feat: showAnswer mode for all problem types"
```

---

### Task 4: Dense worksheet view + answer-key page

**Files:**
- Modify: `components/worksheets/worksheet-page-view.tsx`
- Create: `components/projects/answer-key-page.tsx`

**Interfaces:**
- `WorksheetPageView({ layoutId, items, showAnswer?, fontSize? })` — pass `showAnswer` and `fontSize` into each `Component`
- `AnswerKeyPage({ pages: { pageIndex/label, layoutId, items }[] })` — 2×2 grid, up to 4 cells

- [ ] **Step 1: Extend WorksheetPageView**

```tsx
export function WorksheetPageView({
  layoutId,
  items,
  showAnswer = false,
  fontSize,
}: {
  layoutId: string;
  items: WorksheetViewItem[];
  showAnswer?: boolean;
  fontSize?: string | number;
}) {
  // ...
  <Component
    {...(item.props as object)}
    showAnswer={showAnswer}
    fontSize={fontSize}
  />
}
```

- [ ] **Step 2: AnswerKeyPage**

```tsx
export function AnswerKeyPage({
  cells,
}: {
  cells: {
    label: string;
    layoutId: string;
    items: WorksheetViewItem[];
  }[];
}) {
  return (
    <div className="flex h-full flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        Answer Key
      </h2>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
        {Array.from({ length: 4 }, (_, i) => {
          const cell = cells[i];
          return (
            <div
              key={i}
              className="min-h-0 overflow-hidden border border-black/30 p-1"
            >
              {cell ? (
                <>
                  <p className="mb-1 text-[0.65rem] font-medium">{cell.label}</p>
                  <WorksheetPageView
                    layoutId={cell.layoutId}
                    items={cell.items}
                    showAnswer
                    fontSize="0.7rem"
                  />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Tune `0.7rem` after manual PDF check if needed.

- [ ] **Step 3: Commit**

```bash
git add components/worksheets/worksheet-page-view.tsx components/projects/answer-key-page.tsx
git commit -m "feat: add AnswerKeyPage 2x2 dense layout"
```

---

### Task 5: Wire into ProjectsEditor print root

**Files:**
- Modify: `components/projects/projects-editor.tsx`

**Interfaces:**
- Consumes: `chunkPages`, `AnswerKeyPage`
- After worksheet pages, map `chunkPages(pages, 4)` to extra `LetterShell className="print-page"`

- [ ] **Step 1: Render answer keys**

Inside `data-print-root`, after the worksheet map:

```tsx
{chunkPages(pages, 4).map((group, groupIndex) => (
  <LetterShell key={`answer-key-${groupIndex}`} className="print-page">
    <AnswerKeyPage
      cells={group.map((page, i) => ({
        label: `Page ${page.pageIndex + 1}`,
        layoutId: page.layoutId,
        items: page.items,
      }))}
    />
  </LetterShell>
))}
```

Confirm `pageIndex` is 0-based in `ProjectWithDetails` — labels use `pageIndex + 1`. If pages are global ordered list, use `(groupIndex * 4) + i + 1` when `pageIndex` is per-section; check generate code and use a stable human page number (1-based index in the printed worksheet list is fine):

```tsx
label: `Page ${groupIndex * 4 + i + 1}`,
```

- [ ] **Step 2: Ensure answer-key pages participate in `beforeprint` scale** (they already have `.print-page` + `.letter-shell__content`)

- [ ] **Step 3: Manual smoke**

1. Generate a project with ≥5 pages  
2. Confirm screen shows worksheets then answer-key sheets (2×2)  
3. Export PDF — keys at end; leftover page works  
4. Judge whether `0.7rem` is too small; adjust constant if needed  

- [ ] **Step 4: Full test suite + commit**

```bash
npm test
git add components/projects/projects-editor.tsx
git commit -m "feat: include answer key pages in project PDF export"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| solve all types | Task 1 + 3 |
| Filled blanks | Task 2–3 |
| 4 per page, 2×2 | Task 4–5 |
| Worksheets then keys | Task 5 |
| Dense font for eval | Task 4 |
| Leftover 1–3 pages | Task 1 chunk + Task 5 |
| No DB | (none) |
