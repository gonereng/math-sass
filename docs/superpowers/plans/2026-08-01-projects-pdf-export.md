# Projects PDF Export (Browser Print) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Projects **Export PDF** that opens the browser print dialog with letter-sized `@media print` CSS—one generated page per sheet, gated on a fresh non-stale generation.

**Architecture:** Pure `canExportPdf` helper for button state. Dedicated `app/print.css` (imported from root layout) hides chrome and forces `8.5in × 11in` sheets. Projects editor wraps generated pages in `data-print-root`, adds Export PDF beside Generate, and applies a modest per-page fit scale on `beforeprint` when content exceeds the sheet.

**Tech Stack:** Next.js App Router, existing `LetterShell` / `WorksheetPageView`, Vitest, CSS `@page` / `@media print` (no PDF libraries)

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-01-projects-pdf-export-design.md`
- Projects only — no Templates Export button
- `window.print()` only — no server PDF, no jsPDF/html2canvas
- Export enabled only when `pages.length > 0` **and** preview is not stale
- One generated page → one printed sheet; do not split a page across sheets
- `@page { size: letter; margin: 0.4in; }`
- Stale / empty: button **disabled** with short helper text
- Do not change Generate / Prisma / snapshots

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/projects/can-export-pdf.ts` | `canExportPdf` + reason string |
| `lib/projects/can-export-pdf.test.ts` | Unit tests |
| `app/print.css` | `@page` + `@media print` rules |
| `app/layout.tsx` | Import `print.css` |
| `components/templates/letter-shell.tsx` | Print-friendly class hooks on stage/silhouette/content |
| `components/projects/projects-editor.tsx` | Export button, print root, beforeprint fit-scale |
| `components/app-sidebar.tsx` | Optional `data-print-hide` for reliable hide (or hide via layout structure in CSS) |

---

### Task 1: `canExportPdf` helper

**Files:**
- Create: `lib/projects/can-export-pdf.ts`
- Create: `lib/projects/can-export-pdf.test.ts`

**Interfaces:**
- Produces:
  ```ts
  canExportPdf(input: {
    pageCount: number;
    fingerprint: string;
    lastGeneratedFingerprint: string | null;
  }): { ok: true } | { ok: false; reason: string }
  ```

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { canExportPdf } from "./can-export-pdf";

describe("canExportPdf", () => {
  it("allows export when pages exist and fingerprint matches", () => {
    expect(
      canExportPdf({
        pageCount: 3,
        fingerprint: "a:1|b:2",
        lastGeneratedFingerprint: "a:1|b:2",
      }),
    ).toEqual({ ok: true });
  });

  it("rejects when there are no pages", () => {
    expect(
      canExportPdf({
        pageCount: 0,
        fingerprint: "a:1",
        lastGeneratedFingerprint: "a:1",
      }),
    ).toEqual({ ok: false, reason: "Generate first" });
  });

  it("rejects when never generated (null fingerprint)", () => {
    expect(
      canExportPdf({
        pageCount: 2,
        fingerprint: "a:1",
        lastGeneratedFingerprint: null,
      }),
    ).toEqual({ ok: false, reason: "Generate first" });
  });

  it("rejects when preview is stale", () => {
    expect(
      canExportPdf({
        pageCount: 2,
        fingerprint: "a:2",
        lastGeneratedFingerprint: "a:1",
      }),
    ).toEqual({
      ok: false,
      reason: "Generate again — preview is stale",
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run lib/projects/can-export-pdf.test.ts
```

- [ ] **Step 3: Implement**

```ts
export function canExportPdf(input: {
  pageCount: number;
  fingerprint: string;
  lastGeneratedFingerprint: string | null;
}): { ok: true } | { ok: false; reason: string } {
  if (input.pageCount <= 0 || input.lastGeneratedFingerprint == null) {
    return { ok: false, reason: "Generate first" };
  }
  if (input.lastGeneratedFingerprint !== input.fingerprint) {
    return { ok: false, reason: "Generate again — preview is stale" };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run lib/projects/can-export-pdf.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/projects/can-export-pdf.ts lib/projects/can-export-pdf.test.ts
git commit -m "feat: add canExportPdf gating helper"
```

---

### Task 2: Print stylesheet + LetterShell print hooks

**Files:**
- Create: `app/print.css`
- Modify: `app/layout.tsx` (import print.css next to globals)
- Modify: `components/templates/letter-shell.tsx` (add stable classes for print overrides)
- Modify: `components/app-sidebar.tsx` — add `data-print-hide` on the root sidebar element (or `className` including a known token)

**Interfaces:**
- Produces: print CSS using selectors:
  - `[data-print-hide]` — hidden in print
  - `[data-print-root]` — print container
  - `.print-page` — one sheet
  - `.letter-shell` / `.letter-shell__silhouette` / `.letter-shell__content` — inch layout under print

- [ ] **Step 1: Add classes to `LetterShellView`**

On the outer stage div add `letter-shell`.  
On the absolute silhouette div add `letter-shell__silhouette`.  
On the content div add `letter-shell__content`.  
Keep existing Tailwind classes for screen.

- [ ] **Step 2: Mark sidebar for print hide**

On the outermost element of `AppSidebar`, add `data-print-hide`.

- [ ] **Step 3: Create `app/print.css`**

```css
@page {
  size: letter;
  margin: 0.4in;
}

@media print {
  [data-print-hide] {
    display: none !important;
  }

  /* App chrome: padding/scroll that fights pagination */
  body {
    background: white !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  main {
    padding: 0 !important;
    overflow: visible !important;
  }

  /* Non-print UI inside projects editor (wired in Task 3 via data-print-hide) */
  [data-print-root] {
    display: block !important;
    gap: 0 !important;
  }

  .print-page {
    width: 8.5in;
    height: 11in;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
    box-shadow: none !important;
  }

  .print-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  /* Override screen LetterShell scaling with physical letter box */
  .print-page.letter-shell,
  .print-page .letter-shell {
    width: 8.5in !important;
    max-width: none !important;
    height: 11in !important;
  }

  .print-page .letter-shell__silhouette {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    aspect-ratio: auto !important;
    border-width: 2px !important;
    border-color: black !important;
    background: white !important;
  }

  .print-page .letter-shell__content {
    min-height: 0 !important;
    height: 100% !important;
    box-sizing: border-box;
    padding: 0.5in !important;
    transform-origin: top left;
    /* --print-scale set by JS on beforeprint when needed; default 1 */
    transform: scale(var(--print-scale, 1));
  }

  /* Hide overflow wash in print */
  [data-overflow-wash] {
    display: none !important;
  }
}
```

Note: `.print-page` will be applied on the `LetterShell` wrapper in Task 3. If `LetterShell` root already has `letter-shell`, use `className="print-page"` on the same root via prop/`className` pass-through (LetterShell already accepts `className`).

- [ ] **Step 4: Import in root layout**

In `app/layout.tsx`, after `globals.css`:

```ts
import "./print.css";
```

- [ ] **Step 5: Smoke — screen still looks normal**

```bash
npm test
```

Expected: pass (no visual regression tests; CSS-only).

- [ ] **Step 6: Commit**

```bash
git add app/print.css app/layout.tsx components/templates/letter-shell.tsx components/app-sidebar.tsx
git commit -m "feat: add letter print stylesheet and LetterShell print hooks"
```

---

### Task 3: Wire Export PDF in Projects editor

**Files:**
- Modify: `components/projects/projects-editor.tsx`

**Interfaces:**
- Consumes: `canExportPdf`, `compositionFingerprint` (already used), `window.print`
- Produces: Export button + print root markup + beforeprint fit-scale

- [ ] **Step 1: Compute export gate beside existing `stale`**

```ts
import { canExportPdf } from "@/lib/projects/can-export-pdf";

// after currentFingerprint / stale:
const exportGate = selected
  ? canExportPdf({
      pageCount: selected.pages.length,
      fingerprint: currentFingerprint,
      lastGeneratedFingerprint: selected.lastGeneratedFingerprint,
    })
  : { ok: false as const, reason: "Generate first" };
```

- [ ] **Step 2: Mark non-print UI with `data-print-hide`**

Add `data-print-hide` to:
- The left project list `<aside>`
- The middle sections accordion `<aside>`
- The action row that contains Generate / Export / stale text (the controls themselves — not the pages)

Keep the pages stack **without** `data-print-hide`.

- [ ] **Step 3: Wrap pages in print root; add `print-page` class**

Replace the pages list block with:

```tsx
<div className="flex flex-col gap-8 pb-8" data-print-root>
  {selected.pages.map((page) => (
    <LetterShell key={page.id} className="print-page">
      <WorksheetPageView
        layoutId={page.layoutId}
        items={page.items}
      />
    </LetterShell>
  ))}
</div>
```

Empty state (“Generate to preview pages”) stays outside `data-print-root` and should have `data-print-hide` or simply not exist when printing is possible.

- [ ] **Step 4: Export PDF button + helper text**

Next to Generate:

```tsx
<Button
  type="button"
  variant="outline"
  disabled={busy || !exportGate.ok}
  onClick={() => window.print()}
>
  Export PDF
</Button>
{!exportGate.ok && selected ? (
  <p className="text-sm text-muted-foreground">{exportGate.reason}</p>
) : null}
```

When `stale` is true, prefer showing the existing amber stale banner; Export remains disabled via `exportGate`. Avoid duplicating two conflicting messages—if stale, the amber banner is enough and the muted reason can be omitted when `stale` is true:

```tsx
{!exportGate.ok && selected && !stale ? (
  <p className="text-sm text-muted-foreground">{exportGate.reason}</p>
) : null}
```

- [ ] **Step 5: Fit-scale on `beforeprint`**

Add an effect (only when `selected?.pages.length`):

```ts
useEffect(() => {
  function applyPrintScale() {
    const root = document.querySelector("[data-print-root]");
    if (!root) return;
    const pages = root.querySelectorAll<HTMLElement>(".print-page");
    pages.forEach((page) => {
      const content = page.querySelector<HTMLElement>(".letter-shell__content");
      if (!content) return;
      content.style.removeProperty("--print-scale");
      // Use layout sizes before print CSS fully applies: compare scrollHeight to client box.
      const pageBox = page.getBoundingClientRect().height || page.clientHeight;
      const contentHeight = content.scrollHeight;
      if (pageBox > 0 && contentHeight > pageBox) {
        const scale = Math.min(1, (pageBox * 0.96) / contentHeight);
        content.style.setProperty("--print-scale", String(scale));
      } else {
        content.style.setProperty("--print-scale", "1");
      }
    });
  }

  function clearPrintScale() {
    document
      .querySelectorAll<HTMLElement>(".letter-shell__content")
      .forEach((el) => el.style.removeProperty("--print-scale"));
  }

  window.addEventListener("beforeprint", applyPrintScale);
  window.addEventListener("afterprint", clearPrintScale);
  return () => {
    window.removeEventListener("beforeprint", applyPrintScale);
    window.removeEventListener("afterprint", clearPrintScale);
  };
}, [selected?.id, selected?.pages.length, selected?.lastGeneratedFingerprint]);
```

**Note:** Screen preview may still use scaled LetterShell aspect boxes; `beforeprint` runs when the user opens the dialog. If measurements are off because print CSS isn’t applied yet, prefer measuring content against a constant letter content height in inches converted via `96` CSS px heuristic:

```ts
const LETTER_CONTENT_PX = 11 * 96 - 2 * 0.4 * 96 - 2 * 0.5 * 96;
// page height minus @page margins minus content padding (approx)
const scale = Math.min(1, LETTER_CONTENT_PX / content.scrollHeight);
```

Use this **letter-constant** approach in the implementation if `getBoundingClientRect` on screen is unreliable—document which one you chose in the commit/report. Prefer the letter-constant formula for predictability.

Replace the forEach body with the letter-constant approach:

```ts
const LETTER_CONTENT_PX = 11 * 96 - 2 * 0.4 * 96 - 2 * 0.5 * 96;
pages.forEach((page) => {
  const content = page.querySelector<HTMLElement>(".letter-shell__content");
  if (!content) return;
  const contentHeight = content.scrollHeight;
  const scale =
    contentHeight > LETTER_CONTENT_PX
      ? Math.min(1, (LETTER_CONTENT_PX * 0.98) / contentHeight)
      : 1;
  content.style.setProperty("--print-scale", String(scale));
});
```

- [ ] **Step 6: Manual check**

With `npm run dev`:

1. Open Projects → Generate pages → **Export PDF** enabled  
2. Print preview / Save as PDF → sheet count matches pages; letter size  
3. Change a section page count → Export disabled + stale banner  
4. Generate again → Export enabled  

- [ ] **Step 7: Full suite**

```bash
npm test
```

Expected: all pass including `can-export-pdf` tests.

- [ ] **Step 8: Commit**

```bash
git add components/projects/projects-editor.tsx
git commit -m "feat: add projects Export PDF via browser print"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| canExportPdf gating + reasons | Task 1 |
| Export button beside Generate | Task 3 |
| Disabled empty/stale | Tasks 1, 3 |
| `window.print()` | Task 3 |
| `@page` letter 0.4in | Task 2 |
| Hide chrome | Tasks 2–3 (`data-print-hide`) |
| One page per sheet | Task 2 `.print-page` break-after |
| Inch LetterShell override | Task 2 |
| Fit-scale tall content | Task 3 beforeprint |
| Reuse LetterShell + WorksheetPageView | Task 3 |
| No server PDF / no Templates button | All tasks |
| Shared print.css for later Templates | Task 2 |

Reason strings (exact): **Generate first** · **Generate again — preview is stale**
