# Equation Column Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor in-scope problem components to fixed-slot CSS grids so operators and `=` align down a column of same-shape problems on templates and worksheets.

**Architecture:** Add shared `EquationGrid` / cell helpers under `components/problems/shared/`. Each problem family uses a fixed `grid-template-columns` recipe with `font-mono tabular-nums` and right-aligned digit cells. Templates/worksheets inherit via the same components; no page-level subgrid.

**Tech Stack:** React 19, Tailwind v4, Vitest, `react-dom/server` `renderToStaticMarkup` (existing pattern)

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-05-equation-column-alignment-design.md`
- Surfaces: templates **and** worksheets (shared components only)
- Mixed boxes: same-family alignment only — no parent shared grid
- Digit slots: default **2ch** horizontal; **3ch** vertical
- Operands **right-aligned**; `font-mono` + `tabular-nums`
- No Prisma / registry / props / generate changes
- Tests: `renderToStaticMarkup` + string assertions (match `addition-blank.test.ts`)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `components/problems/shared/equation-layout.tsx` | `EquationGrid`, `DigitCell`, `OpCell`, `EqCell`, column template constants |
| `components/problems/shared/equation-layout.test.ts` | Helper structure tests |
| Binary / missing / vertical / compare / tens-ones components | Compose helpers instead of concatenated equation strings |
| Existing `*.test.ts` next to components | Assert grid markers + digits/ops still present |

---

### Task 1: Shared equation layout helpers

**Files:**
- Create: `components/problems/shared/equation-layout.tsx`
- Create: `components/problems/shared/equation-layout.test.ts`

**Interfaces:**
- Produces:
  - `DIGIT_COLS_HORIZONTAL = "2.5ch"` (use as CSS length in templates)
  - `DIGIT_COLS_VERTICAL = "3ch"`
  - `EquationGrid({ variant, fontSize?, className?, children })` where `variant` is `"binary-eq" | "missing-mid" | "vertical" | "compare"`
  - `DigitCell({ children, className? })`
  - `OpCell({ children, className? })`
  - `EqCell({ className? })` renders `=`
  - Column templates (exact):
    - `binary-eq`: `2.5ch 1.5ch 2.5ch 1.5ch minmax(4rem, auto)` → a | op | b | = | blank
    - `missing-mid`: `2.5ch 1.5ch minmax(2.5rem, auto) 1.5ch 2.5ch` → a | op | blank | = | c
    - `vertical`: `1.5ch 3ch` → op | digits
    - `compare`: `2.5ch minmax(2rem, auto) 2.5ch` → a | blank | b

- [ ] **Step 1: Write the failing test**

Create `components/problems/shared/equation-layout.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/problems/shared/equation-layout.test.ts`

Expected: FAIL — module `./equation-layout` not found.

- [ ] **Step 3: Implement helpers**

Create `components/problems/shared/equation-layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT_COLUMNS: Record<
  "binary-eq" | "missing-mid" | "vertical" | "compare",
  string
> = {
  "binary-eq": "2.5ch 1.5ch 2.5ch 1.5ch minmax(4rem, auto)",
  "missing-mid": "2.5ch 1.5ch minmax(2.5rem, auto) 1.5ch 2.5ch",
  vertical: "1.5ch 3ch",
  compare: "2.5ch minmax(2rem, auto) 2.5ch",
};

export function EquationGrid({
  variant,
  fontSize = "1.25rem",
  className,
  children,
}: {
  variant: keyof typeof VARIANT_COLUMNS;
  fontSize?: string | number;
  className?: string;
  children: ReactNode;
}) {
  const size = typeof fontSize === "number" ? `${fontSize}px` : fontSize;
  return (
    <div
      data-equation-grid={variant}
      className={cn(
        "inline-grid items-baseline gap-x-1.5 font-mono font-medium tabular-nums text-black",
        className,
      )}
      style={{
        fontSize: size,
        gridTemplateColumns: VARIANT_COLUMNS[variant],
      }}
    >
      {children}
    </div>
  );
}

export function DigitCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("text-right", className)}>{children}</span>
  );
}

export function OpCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("text-center", className)}>{children}</span>;
}

export function EqCell({ className }: { className?: string }) {
  return <span className={cn("text-center", className)}>=</span>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/problems/shared/equation-layout.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/problems/shared/equation-layout.tsx components/problems/shared/equation-layout.test.ts
git commit -m "feat: add shared equation grid layout helpers"
```

---

### Task 2: Binary-eq family

**Files:**
- Modify: `components/problems/addition-blank/addition-blank.tsx`
- Modify: `components/problems/addition-blank/addition-blank.test.ts`
- Modify: `components/problems/subtraction-blank/subtraction-blank.tsx`
- Modify: `components/problems/doubles-addition/doubles-addition.tsx`

**Interfaces:**
- Consumes: `EquationGrid`, `DigitCell`, `OpCell`, `EqCell`, `AnswerBlank`
- Produces: same public props as today; markup uses `data-equation-grid="binary-eq"`

- [ ] **Step 1: Strengthen AdditionBlank test (failing until refactor)**

Update `addition-blank.test.ts` to also require the grid marker:

```ts
expect(html).toContain('data-equation-grid="binary-eq"');
```

Run: `npm test -- components/problems/addition-blank/addition-blank.test.ts`

Expected: FAIL — marker missing.

- [ ] **Step 2: Implement AdditionBlank**

Replace body with:

```tsx
import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";
import { cn } from "@/lib/utils";
import type { AdditionBlankProps } from "@/components/problems/types";

export function AdditionBlank({
  a,
  b,
  fontSize = "1.25rem",
  className,
}: AdditionBlankProps) {
  return (
    <EquationGrid
      variant="binary-eq"
      fontSize={fontSize}
      className={className}
    >
      <DigitCell>{a}</DigitCell>
      <OpCell>+</OpCell>
      <DigitCell>{b}</DigitCell>
      <EqCell />
      <AnswerBlank className={cn("w-full")} minWidthClass="min-w-0" />
    </EquationGrid>
  );
}
```

- [ ] **Step 3: Refactor subtraction-blank and doubles-addition the same way**

`SubtractionBlank`: `OpCell` children `−` (U+2212, keep current glyph).

`DoublesAddition`: both digit cells use `{a}`; same `binary-eq` grid.

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- components/problems/addition-blank/addition-blank.test.ts components/problems/shared/equation-layout.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/problems/addition-blank components/problems/subtraction-blank components/problems/doubles-addition
git commit -m "feat: align binary equation operators in fixed columns"
```

---

### Task 3: Missing-mid family

**Files:**
- Modify: `components/problems/missing-addend/missing-addend.tsx`
- Modify: `components/problems/missing-subtrahend/missing-subtrahend.tsx`
- Modify: `components/problems/make-ten/make-ten.tsx`
- Create: `components/problems/missing-addend/missing-addend.test.ts`

**Interfaces:**
- Consumes: `EquationGrid` variant `"missing-mid"`, cells, `AnswerBlank`, existing `ProblemRow` + `TenFrame` for make-ten wrapper

- [ ] **Step 1: Write failing MissingAddend test**

```ts
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
```

Run: `npm test -- components/problems/missing-addend/missing-addend.test.ts`

Expected: FAIL.

- [ ] **Step 2: Implement MissingAddend**

```tsx
import { AnswerBlank } from "@/components/problems/shared/answer-blank";
import {
  DigitCell,
  EqCell,
  EquationGrid,
  OpCell,
} from "@/components/problems/shared/equation-layout";

export function MissingAddend({
  a,
  c,
  fontSize = "1.25rem",
  className,
}: {
  a: number;
  c: number;
  fontSize?: string | number;
  className?: string;
}) {
  return (
    <EquationGrid
      variant="missing-mid"
      fontSize={fontSize}
      className={className}
    >
      <DigitCell>{a}</DigitCell>
      <OpCell>+</OpCell>
      <AnswerBlank className="w-full" minWidthClass="min-w-0" />
      <EqCell />
      <DigitCell>{c}</DigitCell>
    </EquationGrid>
  );
}
```

- [ ] **Step 3: Mirror for MissingSubtrahend (`−`) and MakeTen equation row**

`MakeTen`: keep `ProblemRow` + `TenFrame`; replace the inner flex row with `EquationGrid` `missing-mid` where last digit cell is `10` (literal).

- [ ] **Step 4: Run tests**

Run: `npm test -- components/problems/missing-addend/missing-addend.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/problems/missing-addend components/problems/missing-subtrahend components/problems/make-ten
git commit -m "feat: align missing-operand equations in fixed columns"
```

---

### Task 4: Vertical family

**Files:**
- Modify: `components/problems/vertical-addition/vertical-addition.tsx`
- Modify: `components/problems/vertical-subtraction/vertical-subtraction.tsx`
- Create: `components/problems/vertical-addition/vertical-addition.test.ts`

**Interfaces:**
- Consumes: `EquationGrid` variant `"vertical"` used as a 2-column stack via nested rows **or** a small local structure that still places operator in column 1 and digits in column 2

Preferred structure (matches approved mockup):

```tsx
<ProblemRow fontSize={fontSize} className={cn("font-mono tabular-nums", className)}>
  <div
    data-equation-grid="vertical"
    className="inline-grid grid-cols-[1.5ch_3ch] items-end justify-items-end gap-x-1 gap-y-0.5"
  >
    <span />
    <span>{a}</span>
    <span className="justify-self-center">+</span>
    <span>{b}</span>
    <span className="col-span-2 border-b-2 border-black" />
    <span />
    <AnswerBlank className="w-full" minWidthClass="min-w-0" />
  </div>
</ProblemRow>
```

(Alternatively export a `VerticalStack` from `equation-layout.tsx` if duplication between add/sub is noisy — prefer extracting if both files would copy >10 lines.)

- [ ] **Step 1: Write failing vertical-addition test**

```ts
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
```

Run: `npm test -- components/problems/vertical-addition/vertical-addition.test.ts`

Expected: FAIL.

- [ ] **Step 2: Implement both vertical components**

Use the structure above; subtraction uses `−`.

- [ ] **Step 3: Run tests**

Run: `npm test -- components/problems/vertical-addition/vertical-addition.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/problems/vertical-addition components/problems/vertical-subtraction
git commit -m "feat: column-align vertical addition and subtraction"
```

---

### Task 5: Compare + tens-ones best-effort

**Files:**
- Modify: `components/problems/compare-numbers/compare-numbers.tsx`
- Modify: `components/problems/tens-ones/tens-ones.tsx`

**Interfaces:**
- `compare`: `EquationGrid` variant `"compare"`
- `tens-ones`: keep `BaseTen` above; equation row becomes a compact grid `auto 1.5ch minmax(4rem,auto)` for label | `=` | blank (or reuse binary with a spanning label — simplest: custom inline-grid with `data-equation-grid="tens-ones"`)

- [ ] **Step 1: Implement CompareNumbers**

```tsx
<EquationGrid variant="compare" fontSize={fontSize} className={className}>
  <DigitCell>{a}</DigitCell>
  <AnswerBlank className="w-full" minWidthClass="min-w-0" />
  <DigitCell>{b}</DigitCell>
</EquationGrid>
```

- [ ] **Step 2: Implement TensOnes equation row**

Replace the string `{tens} tens {ones} ones =` + blank with:

```tsx
<div
  data-equation-grid="tens-ones"
  className="inline-grid grid-cols-[auto_1.5ch_minmax(4rem,auto)] items-baseline gap-x-1.5 font-mono tabular-nums"
>
  <span>
    {tens} tens {ones} ones
  </span>
  <EqCell />
  <AnswerBlank className="w-full" minWidthClass="min-w-0" />
</div>
```

Leave `ten-more` / `ten-less` / sequences / visual-only types unchanged (no operator/`=` columns to align).

- [ ] **Step 3: Full suite**

Run: `npm test`

Expected: all existing + new tests PASS.

- [ ] **Step 4: Manual smoke**

With `npm run dev`: open `/templates`, place several `addition-blank` with mixed 1–2 digit ranges — confirm `+` and `=` columns; spot-check missing-addend, vertical, compare; open a generated worksheet page and confirm the same.

- [ ] **Step 5: Commit**

```bash
git add components/problems/compare-numbers components/problems/tens-ones
git commit -m "feat: align compare and tens-ones equation columns"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Shared EquationGrid / cells | Task 1 |
| Binary eq family | Task 2 |
| Missing mid (+ make-ten row) | Task 3 |
| Vertical family | Task 4 |
| Compare + tens-ones best-effort | Task 5 |
| Templates + worksheets via shared components | Tasks 2–5 (no page changes) |
| No parent subgrid / no generate changes | (none) |
| Structure tests | Tasks 1–4 |
