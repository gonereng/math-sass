# MathSheets — Projects PDF Export (Browser Print) Design

**Date:** 2026-08-01  
**Status:** Approved for implementation planning  
**Scope:** Projects-only Export PDF via `window.print()` and letter `@media print` CSS. One generated page per printed sheet; tighter margins; fit-to-page when content is tall. No server-built PDF files. No Templates export UI in this slice.

## 1. Purpose

Let teachers/parents turn a project’s **last generation** into a printable multi-page PDF using the browser’s Print → Save as PDF flow, at real US Letter size—not the scaled on-screen editor box.

## 2. Goals & non-goals

### Goals
- **Export PDF** button on the Projects composer (beside Generate)
- Enabled only when the selected project has generated pages **and** the preview is **not** stale
- Click → `window.print()`
- Print stylesheet: hide app chrome; `@page { size: letter; … }`; **one generated letter page = one printed sheet**
- Tighter printable margins than the editor; if a page’s content is tall, **scale to fit** that sheet (do not split one generated page across two sheets)
- Reuse existing `LetterShell` + `WorksheetPageView` markup for print content
- Place print CSS so Templates can reuse it later without redesign

### Non-goals
- Server-side / headless PDF file generation (Puppeteer, etc.)
- Client PDF libraries (jsPDF, html2canvas bundles)
- Templates-page Export PDF UI (stylesheet may be shared; button not in this slice)
- Auto-generate on export
- Answer keys / solution sheets
- Changing Generate, snapshots, or Prisma models

## 3. Approach

**Same-page `@media print` (Approach 1).** Mark the generated-pages stack as the print root. On Export, call `window.print()`. Screen layout stays unchanged; print media rules hide chrome and force physical letter geometry.

## 4. Architecture

### UX gating

| Condition | Export PDF |
|-----------|------------|
| No selected project | Hidden or disabled |
| `pages.length === 0` | Disabled — reason: generate first |
| Stale (`lastGeneratedFingerprint` ≠ current composition fingerprint) | Disabled — reason: generate again (preview stale) |
| Fresh generation with ≥1 page | **Enabled** |

Helper (pure, testable): e.g. `canExportPdf({ pageCount, fingerprint, lastGeneratedFingerprint }) → boolean` plus optional reason string for UI.

Click when enabled: `window.print()` only (no navigation).

### Markup

- Wrap the center-column generated pages list in a print root, e.g. `data-print-root` or class `print-pages`
- Each child remains one `LetterShell` + `WorksheetPageView` (same as screen preview)
- App shell, project list, sections accordion, Generate/Export controls, and stale banner live **outside** the print root so print CSS can hide them

### Print CSS (normative behavior)

```css
@page {
  size: letter; /* 8.5in × 11in */
  margin: 0.4in; /* tighter than editor; exact value tunable in plan */
}

@media print {
  /* Hide non-print UI */
  /* Force each print page sheet to one letter page */
  /* Override LetterShell screen max-width / aspect scaling with inch-based box */
  /* break-after: page on each sheet except optionally the last */
  /* print-color-adjust: exact where borders/ink matter */
}
```

**Fit-to-page:** Within each sheet, constrain content height to the printable area. If content would overflow, apply a modest scale (or equivalent CSS) so that **one generated page stays on one sheet**. Do not use continuous multi-sheet flow for a single generated page.

Screen `LetterShell` comments already warn that scaled preview is not print truth; print rules are the physical path.

### Files (expected)

| Area | Change |
|------|--------|
| `components/projects/projects-editor.tsx` | Export button, gating, print root wrapper, `window.print()` |
| Print helper (e.g. `lib/projects/can-export-pdf.ts`) | Pure enablement logic + tests |
| Global or dedicated print CSS (`app/globals.css` or `app/print.css` imported from layout) | `@page` + `@media print` rules |
| Possibly small print-mode class on `LetterShell` / page wrapper | Inch sizing under print only |

Exact class names are left to the implementation plan; behavior above is normative.

## 5. Edge cases

| Case | Behavior |
|------|----------|
| Empty / stale | Button disabled + short helper text |
| Large page counts | Print all pages; may be slow — OK for v1 |
| Browser headers/footers | User printer setting; we do not inject URL/date |
| Overflowing worksheet content | Fit-scale on that sheet; editor overflow UX unchanged |
| Backgrounds | Prefer borders/ink visible (`print-color-adjust` as needed) |

## 6. Testing

- **Unit:** `canExportPdf` — empty → false; stale → false; fresh with pages → true  
- **Manual:** Generate → Export → Save as PDF → sheet count matches pages; change section count → Export disabled until Generate again; spot-check letter size in PDF viewer  

## 7. Success criteria

- User can Export PDF from a freshly generated project via browser print  
- Export is blocked when there is nothing to print or preview is stale  
- Printed output is one sheet per generated page at letter size with tighter margins  
- Tall content attempts to fit on its sheet rather than spilling to a second sheet  
- No server PDF pipeline and no Templates export button in this change  

## 8. Follow-ons

- Templates Export PDF using the same print CSS  
- True downloadable `.pdf` blob (server or client library) if print dialog proves insufficient  
- Optional “fit” quality controls / user-selectable margins  
