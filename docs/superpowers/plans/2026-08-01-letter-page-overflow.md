# Letter Page Size & Overflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Templates editor canvas a fixed US Letter (8.5∶11) silhouette scaled to the center column, with a warn-only banner and red wash when content spills past one page.

**Architecture:** Pure helper decides overflow from two heights. `LetterShell` renders stage + absolute letter silhouette + in-flow content + optional spill wash; a small client hook (`usePageOverflow`) measures via `ResizeObserver` and reports overflow upward. `TemplatesEditor` shows the banner above the shell. No DB, print, or PDF work.

**Tech Stack:** Next.js App Router (client components), React, Tailwind CSS v4, Vitest, `react-dom/server` for smoke markup tests

## Global Constraints

- Banner copy (exact): **Content exceeds one page**
- Aspect ratio: **8.5 / 11**
- Warn only — never block save/edit/DnD
- Red wash: spill region only (~25% red), `pointer-events: none`
- Do not clip editor content (`overflow: hidden` on the page content)
- No print/`@page`/PDF in this change (future: real `8.5in × 11in`, separate from scaled editor)
- Spec: `docs/superpowers/specs/2026-08-01-letter-page-overflow-design.md`
- Measurement uses the **scaled editor** box, not physical inches

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `components/templates/page-overflow.ts` | Pure `isPageOverflowing(contentHeight, pageHeight)` |
| `components/templates/page-overflow.test.ts` | Unit tests for the helper |
| `components/templates/use-page-overflow.ts` | `ResizeObserver` hook → `{ overflowing, pageHeight }` |
| `components/templates/letter-shell.tsx` | Stage, silhouette, content, wash; reports overflow |
| `components/templates/letter-shell.test.ts` | Static markup: wash/banner hooks via props |
| `components/templates/templates-editor.tsx` | Banner above `LetterShell` when overflowing |

---

### Task 1: Overflow helper

**Files:**
- Create: `components/templates/page-overflow.ts`
- Create: `components/templates/page-overflow.test.ts`

**Interfaces:**
- Produces: `isPageOverflowing(contentHeight: number, pageHeight: number): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isPageOverflowing } from "./page-overflow";

describe("isPageOverflowing", () => {
  it("is true when content is taller than the page", () => {
    expect(isPageOverflowing(1200, 1000)).toBe(true);
  });

  it("is false when content fits exactly", () => {
    expect(isPageOverflowing(1000, 1000)).toBe(false);
  });

  it("is false when content is shorter than the page", () => {
    expect(isPageOverflowing(800, 1000)).toBe(false);
  });

  it("is false when page height is zero (not yet measured)", () => {
    expect(isPageOverflowing(500, 0)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/templates/page-overflow.test.ts`

Expected: FAIL (module not found or `isPageOverflowing` undefined)

- [ ] **Step 3: Write minimal implementation**

```ts
/** True when measured content exceeds the letter page box. */
export function isPageOverflowing(
  contentHeight: number,
  pageHeight: number,
): boolean {
  if (pageHeight <= 0) return false;
  return contentHeight > pageHeight;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/templates/page-overflow.test.ts`

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/templates/page-overflow.ts components/templates/page-overflow.test.ts
git commit -m "feat: add letter page overflow helper"
```

---

### Task 2: LetterShell page chrome (silhouette + wash via prop)

**Files:**
- Modify: `components/templates/letter-shell.tsx`
- Create: `components/templates/letter-shell.test.ts`

**Interfaces:**
- Consumes: none from Task 1 yet (prop-driven UI only)
- Produces: `LetterShell` props `{ children, className?, overflowing?: boolean, pageHeight?: number, contentRef?, pageRef?, onOverflowChange? }` — for this task only wire `overflowing` and optional `pageHeight` for wash/`minHeight`; refs/callback land in Task 3

- [ ] **Step 1: Write the failing smoke tests**

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LetterShell } from "./letter-shell";

describe("LetterShell", () => {
  it("renders Name/Class/Date blanks", () => {
    const html = renderToStaticMarkup(
      createElement(LetterShell, null, createElement("div", null, "body")),
    );
    expect(html).toContain("Name");
    expect(html).toContain("Class");
    expect(html).toContain("Date");
  });

  it("does not render overflow wash when not overflowing", () => {
    const html = renderToStaticMarkup(
      createElement(LetterShell, { overflowing: false }, "x"),
    );
    expect(html).not.toContain('data-overflow-wash="true"');
  });

  it("renders overflow wash when overflowing", () => {
    const html = renderToStaticMarkup(
      createElement(
        LetterShell,
        { overflowing: true, pageHeight: 400 },
        "x",
      ),
    );
    expect(html).toContain('data-overflow-wash="true"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/templates/letter-shell.test.ts`

Expected: FAIL on wash attribute (current shell has no wash)

- [ ] **Step 3: Rewrite `LetterShell` structure**

Replace `components/templates/letter-shell.tsx` with:

```tsx
import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * Editor letter page: fixed 8.5×11 silhouette (scaled to column width).
 * Print/PDF later should use real 8.5in×11in — do not treat this scaled box as print truth.
 */
export function LetterShell({
  children,
  className,
  overflowing = false,
  pageHeight = 0,
  contentRef,
  pageRef,
}: {
  children: ReactNode;
  className?: string;
  overflowing?: boolean;
  /** Measured silhouette height in px; used for content minHeight and wash top. */
  pageHeight?: number;
  contentRef?: Ref<HTMLDivElement>;
  pageRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={cn("relative mx-auto w-full max-w-[52rem]", className)}
    >
      {/* Visible one-page outline; does not grow with content */}
      <div
        ref={pageRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 aspect-[8.5/11] border-2 border-black bg-white"
      />

      {/* In-flow content; may extend below the silhouette */}
      <div
        ref={contentRef}
        className="relative z-10 p-8 text-black"
        style={pageHeight > 0 ? { minHeight: pageHeight } : undefined}
      >
        <header className="mb-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <ShellBlank label="Name" widthClass="min-w-[10rem]" />
          <ShellBlank label="Class" widthClass="min-w-[6rem]" />
          <ShellBlank label="Date" widthClass="min-w-[6rem]" />
        </header>
        <div>{children}</div>
      </div>

      {overflowing && pageHeight > 0 ? (
        <div
          data-overflow-wash="true"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-red-500/25"
          style={{ top: pageHeight }}
        />
      ) : null}
    </div>
  );
}

function ShellBlank({
  label,
  widthClass,
}: {
  label: string;
  widthClass: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span>{label}:</span>
      <span
        aria-hidden="true"
        className={cn("inline-block border-b border-black", widthClass)}
      >
        &nbsp;
      </span>
    </div>
  );
}
```

Notes:
- Stage height comes from in-flow content (`minHeight` floors to one page once measured).
- Silhouette is absolute with `aspect-[8.5/11]` — letter outline only.
- Until `pageHeight` is measured (Task 3), empty templates may look short in SSR/first paint; hook fills it in on mount.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/templates/letter-shell.test.ts`

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/templates/letter-shell.tsx components/templates/letter-shell.test.ts
git commit -m "feat: give LetterShell a fixed letter silhouette and spill wash"
```

---

### Task 3: `usePageOverflow` + wire measurement into `LetterShell`

**Files:**
- Create: `components/templates/use-page-overflow.ts`
- Modify: `components/templates/letter-shell.tsx` (own the hook; expose `onOverflowChange`)

**Interfaces:**
- Consumes: `isPageOverflowing` from `./page-overflow`
- Produces:
  - `usePageOverflow(pageRef, contentRef): { overflowing: boolean; pageHeight: number }`
  - `LetterShell` prop `onOverflowChange?: (overflowing: boolean) => void`

- [ ] **Step 1: Implement the hook**

Create `components/templates/use-page-overflow.ts`:

```tsx
"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { isPageOverflowing } from "@/components/templates/page-overflow";

export function usePageOverflow(
  pageRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
): { overflowing: boolean; pageHeight: number } {
  const [pageHeight, setPageHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const pageEl = pageRef.current;
    const contentEl = contentRef.current;
    if (!pageEl || !contentEl) return;

    const measure = () => {
      setPageHeight(pageEl.getBoundingClientRect().height);
      setContentHeight(contentEl.scrollHeight);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(pageEl);
    observer.observe(contentEl);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pageRef, contentRef]);

  return {
    pageHeight,
    overflowing: isPageOverflowing(contentHeight, pageHeight),
  };
}
```

- [ ] **Step 2: Wire hook inside `LetterShell` (client component)**

Make `letter-shell.tsx` a client module and own refs + overflow reporting:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePageOverflow } from "@/components/templates/use-page-overflow";
import { cn } from "@/lib/utils";

/**
 * Editor letter page: fixed 8.5×11 silhouette (scaled to column width).
 * Print/PDF later should use real 8.5in×11in — do not treat this scaled box as print truth.
 */
export function LetterShell({
  children,
  className,
  onOverflowChange,
}: {
  children: ReactNode;
  className?: string;
  onOverflowChange?: (overflowing: boolean) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { overflowing, pageHeight } = usePageOverflow(pageRef, contentRef);

  useEffect(() => {
    onOverflowChange?.(overflowing);
  }, [overflowing, onOverflowChange]);

  return (
    <div className={cn("relative mx-auto w-full max-w-[52rem]", className)}>
      <div
        ref={pageRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 aspect-[8.5/11] border-2 border-black bg-white"
      />

      <div
        ref={contentRef}
        className="relative z-10 p-8 text-black"
        style={pageHeight > 0 ? { minHeight: pageHeight } : undefined}
      >
        <header className="mb-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <ShellBlank label="Name" widthClass="min-w-[10rem]" />
          <ShellBlank label="Class" widthClass="min-w-[6rem]" />
          <ShellBlank label="Date" widthClass="min-w-[6rem]" />
        </header>
        <div>{children}</div>
      </div>

      {overflowing && pageHeight > 0 ? (
        <div
          data-overflow-wash="true"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-red-500/25"
          style={{ top: pageHeight }}
        />
      ) : null}
    </div>
  );
}

function ShellBlank({
  label,
  widthClass,
}: {
  label: string;
  widthClass: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span>{label}:</span>
      <span
        aria-hidden="true"
        className={cn("inline-block border-b border-black", widthClass)}
      >
        &nbsp;
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Update `letter-shell.test.ts` for the client API**

Static markup cannot run hooks. Keep smoke coverage on the **presentational** pieces by extracting a tiny pure view, **or** slim the test file to only what still works:

Preferred (YAGNI): delete prop-based wash tests that no longer apply; keep Name/Class/Date test by rendering through a thin non-hook export **only if needed**. Simplest path that stays green:

1. Keep `isPageOverflowing` tests (Task 1) as the unit of truth.
2. Change `letter-shell.test.ts` to assert Name/Class/Date via importing `ShellBlank` — **do not** export blanks.
3. Instead: leave `letter-shell.test.ts` covering only that the module exports `LetterShell` (type-level) is weak — **better:** extract presentational `LetterShellView` used by `LetterShell`.

Add `LetterShellView` in the same file (or bottom of `letter-shell.tsx`) with the prop API from Task 2; `LetterShell` wraps it with the hook. Point `letter-shell.test.ts` at `LetterShellView`.

```tsx
export function LetterShellView({
  children,
  className,
  overflowing = false,
  pageHeight = 0,
  contentRef,
  pageRef,
}: {
  children: ReactNode;
  className?: string;
  overflowing?: boolean;
  pageHeight?: number;
  contentRef?: Ref<HTMLDivElement>;
  pageRef?: Ref<HTMLDivElement>;
}) {
  // same JSX as Task 2
}

export function LetterShell({
  children,
  className,
  onOverflowChange,
}: {
  children: ReactNode;
  className?: string;
  onOverflowChange?: (overflowing: boolean) => void;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { overflowing, pageHeight } = usePageOverflow(pageRef, contentRef);

  useEffect(() => {
    onOverflowChange?.(overflowing);
  }, [overflowing, onOverflowChange]);

  return (
    <LetterShellView
      className={className}
      overflowing={overflowing}
      pageHeight={pageHeight}
      pageRef={pageRef}
      contentRef={contentRef}
    >
      {children}
    </LetterShellView>
  );
}
```

Update tests to import `LetterShellView` instead of `LetterShell`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/templates/page-overflow.test.ts components/templates/letter-shell.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/templates/use-page-overflow.ts components/templates/letter-shell.tsx components/templates/letter-shell.test.ts
git commit -m "feat: measure letter page overflow with ResizeObserver"
```

---

### Task 4: Banner in `TemplatesEditor`

**Files:**
- Modify: `components/templates/templates-editor.tsx` (center column around `LetterShell`)

**Interfaces:**
- Consumes: `LetterShell` `onOverflowChange?: (overflowing: boolean) => void`
- Produces: banner UI when overflowing

- [ ] **Step 1: Add overflow state and banner**

Near other `useState` calls:

```tsx
const [pageOverflowing, setPageOverflowing] = useState(false);
```

Reset when selection changes:

```tsx
useEffect(() => {
  setPageOverflowing(false);
}, [selectedId]);
```

In the center column, above `<LetterShell>` (still inside the `selected` branch, below the layout switcher):

```tsx
{pageOverflowing ? (
  <div
    role="status"
    className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
  >
    Content exceeds one page
  </div>
) : null}
<LetterShell onOverflowChange={setPageOverflowing}>
  <TemplateCanvas
    template={selected}
    onRemoveItem={handleRemoveItem}
  />
</LetterShell>
```

Exact banner string: `Content exceeds one page` (no period).

- [ ] **Step 2: Manual check in the browser**

With `npm run dev` already running:

1. Open Templates; confirm letter aspect outline (taller page frame) with short content and **no** banner/wash.
2. Add many `addition-blank` items until content spills below the black border → banner appears and red wash covers only the spill.
3. Remove items until content fits → banner and wash clear.
4. Switch Two columns ↔ 2×2 grid → remasure; DnD still works through the wash.

- [ ] **Step 3: Run full unit suite**

Run: `npm test`

Expected: all existing + new tests PASS

- [ ] **Step 4: Commit**

```bash
git add components/templates/templates-editor.tsx
git commit -m "feat: warn when template content exceeds one letter page"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Fixed 8.5∶11 silhouette, scaled to column | Task 2–3 |
| Stage grows; content not clipped | Task 2–3 |
| ResizeObserver overflow measure | Task 3 |
| Banner “Content exceeds one page” | Task 4 |
| Red wash on spill only, pointer-events none | Task 2–3 |
| Warn only / no save block | Task 4 (no save changes) |
| No print/PDF | All tasks (comment only in LetterShell) |
| Unit helper tests | Task 1 |
| Smoke wash markup | Task 2 via `LetterShellView` |
| Remeasure on resize/layout/items | Task 3 (`ResizeObserver` + content size changes) |

No placeholders remaining; names `isPageOverflowing`, `usePageOverflow`, `LetterShellView`, `onOverflowChange`, `pageOverflowing` are consistent across tasks.
