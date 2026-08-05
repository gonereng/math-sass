# MathSheets — PDF Answer Keys Design

**Date:** 2026-08-05  
**Status:** Approved for implementation planning  
**Scope:** Automatically append answer-key pages when exporting a project PDF. Pack **4 worksheet pages** of answers per letter page in a **2×2** grid. Cover **all** problem types. No change to how worksheet pages themselves look.

## 1. Purpose

Teachers export workbooks via browser Print → Save as PDF. Today the PDF only contains blank student worksheets. They need matching **answer keys** in the same export, dense enough to evaluate font size when four worksheet pages’ answers share one letter sheet.

## 2. Decisions

| Decision | Choice |
|----------|--------|
| Density | **4 worksheet pages** of answers per answer-key page |
| Layout | **2×2 grid** of mini blocks (one mini = one worksheet page) |
| Problem coverage | **All** registry problem types |
| Rendering approach | `showAnswer` on existing problem components (Approach 1) |
| Placement in PDF | Worksheet pages first, then answer-key pages |
| Leftover pages | Groups of 1–3 still get a page; unused cells empty |

## 3. Goals & non-goals

### Goals
- On Export PDF / print, include answer-key pages derived from the same generated `pages` + `items` / `props`
- Each mini block mirrors that worksheet page’s layout with blanks filled
- Smaller base font / tighter gaps in minis so four fit without relying only on `--print-scale`
- Correct answers for every problem type from existing props

### Non-goals
- Separate download or toggle for “keys only”
- Persisting answer keys in the database
- Changing Generate / fingerprint / export gate logic beyond rendering extra print pages
- Perfect visual parity of decorative visuals (clocks, ten-frames) at mini scale — prefer readable filled answers; visuals may shrink with the mini

## 4. Print flow

`ProjectsEditor` already renders `pages` inside `[data-print-root]` and calls `window.print()`.

After the worksheet `LetterShell` list, render additional `LetterShell` / `print-page` nodes for answer keys:

1. Chunk `pages` into arrays of length ≤ 4 (preserve order / `pageIndex`)
2. For each chunk, one answer-key page:
   - Header: **Answer Key** (and optional page range label)
   - CSS grid `grid-cols-2 grid-rows-2`
   - Cell *i*: label “Page {n}” + compact worksheet view of that page with `showAnswer`

Screen preview should show these answer-key pages below worksheets so teachers can judge font size before printing.

## 5. Component model

### `AnswerBlank`
When given optional `answer` (string | number) **or** when parent passes filled content, render the value instead of an empty underline (keep underline or replace with solid text — prefer **filled text on the blank line** for clarity).

### Problem components
Add optional `showAnswer?: boolean` (default `false`). When true, compute answer(s) and pass into blank(s).

Examples:

| Type | Answer |
|------|--------|
| `addition-blank`, `vertical-addition`, `doubles-addition` | `a + b` / `a + a` |
| `subtraction-blank`, `vertical-subtraction` | `a − b` |
| `missing-addend` | `c − a` |
| `missing-subtrahend` | `a − c` |
| `make-ten` | `10 − a` |
| `compare-numbers` | `<`, `>`, or `=` |
| `ten-more` / `ten-less` | `n ± 10` |
| `tens-ones` | `10*tens + ones` |
| `before-after` | `n−1`, `n+1` |
| `number-sequence` | value at `blankIndex` |
| `skip-count-2/5/10` | next term |
| `ten-frame-count` | `count` |
| `analog-time-hour` | `hour` (display as `H:00`) |
| `shape-sides` | `SHAPE_SIDES[shape]` |
| `longer-shorter` | `"A"` or `"B"` (longer bar) |

Optional: central `solveProblem(problemTypeId, props): string | string[]` used by components or by a thin wrapper — either is fine if tests cover correctness.

### Compact view
`WorksheetPageView` gains `showAnswer?: boolean` and optional `dense?: boolean` (or a sibling `AnswerKeyMiniView`) that passes smaller `fontSize` into each `Component`.

## 6. Files (expected)

| Area | Change |
|------|--------|
| `components/problems/shared/answer-blank.tsx` | Support filled answer display |
| Each problem component (+ tests where useful) | `showAnswer` |
| `components/worksheets/worksheet-page-view.tsx` | Pass `showAnswer` / dense font |
| New: answer-key page / chunk helper | `chunkPages(pages, 4)`, layout component |
| `components/projects/projects-editor.tsx` | Render answer-key pages in print root |
| `lib/projects/` (optional) | `solve-problem.ts` + unit tests |

## 7. Testing

- Unit: `solveProblem` (or per-type) for representative types including edge cases (equal compare, before-after at boundaries)
- Render: one problem with `showAnswer` includes the numeric/text answer and no empty-only blank
- Manual: project with ≥5 generated pages → Export PDF → worksheets then answer keys; 2×2 density; leftover page; font readable enough for teacher use

## 8. Follow-ups

- User-tunable keys-per-page (2 / 4 / 6)
- Hide answer keys on screen, print-only
- Dedicated “Answer Key” section title styling / project name on each key page
