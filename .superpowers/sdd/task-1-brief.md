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

