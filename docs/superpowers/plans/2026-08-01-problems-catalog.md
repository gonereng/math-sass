# Problems Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a code-owned problem-type registry with `AdditionBlank` and a Problems catalog UI (left list / right letter-frame preview).

**Architecture:** Print-oriented React components under `components/problems/`, registered in `registry.ts`. Problems page is a client catalog that selects a type and renders `Component` with fixed `demoProps` inside a scaled 8.5×11 preview frame. No DB, no Templates UI, no user-created types.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind, Vitest (`react-dom/server` for markup assertions)

## Global Constraints

- Product: **MathSheets**
- First type id/name/description exactly: `addition-blank` / `Addition blank` / `A + B with a blank for the sum`
- Demo props exactly: `{ a: 3, b: 5 }`
- Answer blank is **not** an `<input>` (handwriting line only)
- No “New problem” button on Problems
- No Templates UI, PDF export, or Prisma models for problems
- Spec: `docs/superpowers/specs/2026-08-01-problems-catalog-design.md`
- Follow existing app patterns (`cn`, Tailwind, `(app)` shell)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `components/problems/types.ts` | `ProblemTypeEntry`, `AdditionBlankProps` |
| `components/problems/addition-blank/addition-blank.tsx` | Print component |
| `components/problems/addition-blank/meta.ts` | Meta + demoProps |
| `components/problems/registry.ts` | Catalog array export |
| `components/problems/registry.test.ts` | Registry unit tests |
| `components/problems/addition-blank/addition-blank.test.ts` | Markup tests (no input) |
| `components/problems/letter-preview-frame.tsx` | Scaled letter chrome |
| `components/problems/problems-catalog.tsx` | Left list + right preview (client) |
| `app/(app)/problems/page.tsx` | Renders catalog |

---

### Task 1: Types + AdditionBlank + registry (TDD)

**Files:**
- Create: `components/problems/types.ts`
- Create: `components/problems/addition-blank/addition-blank.tsx`
- Create: `components/problems/addition-blank/meta.ts`
- Create: `components/problems/registry.ts`
- Create: `components/problems/registry.test.ts`
- Create: `components/problems/addition-blank/addition-blank.test.ts`

**Interfaces:**
- Consumes: React, Vitest, `react-dom/server`
- Produces:
  - `AdditionBlankProps`: `{ a: number; b: number; fontSize?: string | number; className?: string }`
  - `ProblemTypeEntry`: `{ id: string; name: string; description: string; demoProps: Record<string, unknown>; Component: React.ComponentType<any> }`
  - `problemTypes: ProblemTypeEntry[]` from `@/components/problems/registry`
  - `AdditionBlank` component
  - `additionBlankMeta` from meta

- [ ] **Step 1: Write failing registry test**

Create `components/problems/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { problemTypes } from "./registry";

describe("problemTypes registry", () => {
  it("exports at least one entry with required fields", () => {
    expect(problemTypes.length).toBeGreaterThanOrEqual(1);
    const entry = problemTypes[0];
    expect(entry).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      description: expect.any(String),
      demoProps: expect.any(Object),
    });
    expect(typeof entry.Component).toBe("function");
  });

  it("includes addition-blank with exact demo meta", () => {
    const addition = problemTypes.find((p) => p.id === "addition-blank");
    expect(addition).toBeDefined();
    expect(addition?.name).toBe("Addition blank");
    expect(addition?.description).toBe("A + B with a blank for the sum");
    expect(addition?.demoProps).toEqual({ a: 3, b: 5 });
  });
});
```

- [ ] **Step 2: Write failing AdditionBlank markup test**

Create `components/problems/addition-blank/addition-blank.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { AdditionBlank } from "./addition-blank";

describe("AdditionBlank", () => {
  it("renders addends and has no input element", () => {
    const html = renderToStaticMarkup(
      createElement(AdditionBlank, { a: 3, b: 5 }),
    );
    expect(html).toContain("3");
    expect(html).toContain("5");
    expect(html).toContain("+");
    expect(html).toContain("=");
    expect(html.toLowerCase()).not.toContain("<input");
  });
});
```

- [ ] **Step 3: Run tests — expect fail**

```bash
npm test -- components/problems
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement types**

Create `components/problems/types.ts`:

```ts
import type { ComponentType } from "react";

export type AdditionBlankProps = {
  a: number;
  b: number;
  fontSize?: string | number;
  className?: string;
};

export type ProblemTypeEntry = {
  id: string;
  name: string;
  description: string;
  demoProps: Record<string, unknown>;
  Component: ComponentType<any>;
};
```

- [ ] **Step 5: Implement AdditionBlank**

Create `components/problems/addition-blank/addition-blank.tsx`:

```tsx
import { cn } from "@/lib/utils";
import type { AdditionBlankProps } from "@/components/problems/types";

export function AdditionBlank({
  a,
  b,
  fontSize = "1.25rem",
  className,
}: AdditionBlankProps) {
  const size = typeof fontSize === "number" ? `${fontSize}px` : fontSize;

  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-2 font-medium text-foreground",
        className,
      )}
      style={{ fontSize: size }}
    >
      <span>
        {a} + {b} =
      </span>
      <span
        aria-hidden="true"
        className="inline-block min-w-[4rem] border-b-2 border-foreground align-baseline"
      />
    </div>
  );
}
```

- [ ] **Step 6: Implement meta + registry**

Create `components/problems/addition-blank/meta.ts`:

```ts
import { AdditionBlank } from "./addition-blank";
import type { ProblemTypeEntry } from "@/components/problems/types";

export const additionBlankMeta: ProblemTypeEntry = {
  id: "addition-blank",
  name: "Addition blank",
  description: "A + B with a blank for the sum",
  demoProps: { a: 3, b: 5 },
  Component: AdditionBlank,
};
```

Create `components/problems/registry.ts`:

```ts
import { additionBlankMeta } from "./addition-blank/meta";
import type { ProblemTypeEntry } from "./types";

export const problemTypes: ProblemTypeEntry[] = [additionBlankMeta];
```

- [ ] **Step 7: Run tests — expect pass**

```bash
npm test -- components/problems
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add components/problems
git commit -m "feat: add addition-blank problem type and registry"
```

---

### Task 2: Letter preview frame + Problems catalog UI

**Files:**
- Create: `components/problems/letter-preview-frame.tsx`
- Create: `components/problems/problems-catalog.tsx`
- Modify: `app/(app)/problems/page.tsx`

**Interfaces:**
- Consumes: `problemTypes` from registry
- Produces: browse UI with selection + letter-frame preview

- [ ] **Step 1: Letter preview frame**

Create `components/problems/letter-preview-frame.tsx`:

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Visual 8.5×11 preview chrome (not a real Template). */
export function LetterPreviewFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-center", className)}>
      <div
        className="relative w-full max-w-md origin-top bg-white text-black shadow-md ring-1 ring-black/10"
        style={{ aspectRatio: "8.5 / 11" }}
      >
        <div className="absolute inset-0 overflow-hidden p-[8%]">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Problems catalog (client)**

Create `components/problems/problems-catalog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { LetterPreviewFrame } from "@/components/problems/letter-preview-frame";
import { problemTypes } from "@/components/problems/registry";
import { cn } from "@/lib/utils";

export function ProblemsCatalog() {
  const [selectedId, setSelectedId] = useState(
    problemTypes[0]?.id ?? "",
  );
  const selected =
    problemTypes.find((p) => p.id === selectedId) ?? problemTypes[0];

  if (!selected) {
    return (
      <p className="text-sm text-muted-foreground">No problem types yet</p>
    );
  }

  const { Component, demoProps } = selected;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[28rem] gap-0 overflow-hidden rounded-lg border">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/20">
        <div className="border-b px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Problems</h1>
          <p className="text-xs text-muted-foreground">
            Browse problem types
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {problemTypes.map((entry) => {
            const active = entry.id === selected.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {entry.name}
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col gap-6 overflow-auto p-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {selected.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selected.description}
          </p>
        </div>
        <LetterPreviewFrame>
          <Component {...demoProps} />
        </LetterPreviewFrame>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Replace Problems page**

Replace `app/(app)/problems/page.tsx`:

```tsx
import { ProblemsCatalog } from "@/components/problems/problems-catalog";

export default function ProblemsPage() {
  return <ProblemsCatalog />;
}
```

- [ ] **Step 4: Verify build/tests**

```bash
npm test
npx tsc --noEmit
```

Expected: tests pass; no TS errors. Fix any `Component {...demoProps}` typing issues by casting if needed:

```tsx
<Component {...(demoProps as any)} />
```

(Only if required for `tsc`.)

- [ ] **Step 5: Commit**

```bash
git add components/problems/letter-preview-frame.tsx components/problems/problems-catalog.tsx app/(app)/problems/page.tsx
git commit -m "feat: add problems catalog with letter-frame preview"
```

---

### Task 3: Manual verification

**Files:** none unless bugs found

- [ ] **Step 1: Checklist**

With `npm run dev` (logged in):

1. Open **Problems** — catalog UI; **no** “New problem”
2. Left list shows **Addition blank**; selection updates right pane
3. Preview shows `3 + 5 =` with answer line inside letter-sized frame
4. Blank is not an editable input (inspect / no typing)

- [ ] **Step 2: Commit only if fixes were needed**

---

## Self-review (plan vs spec)

| Spec item | Task |
|-----------|------|
| Registry + AdditionBlank | 1 |
| Exact meta / demoProps | 1 |
| No `<input>` blank | 1 |
| Letter preview frame | 2 |
| Left list / right preview | 2 |
| Remove empty / New problem | 2 |
| Manual checklist | 3 |
| Registry unit tests | 1 |

No TBD placeholders. Types consistent across tasks.
