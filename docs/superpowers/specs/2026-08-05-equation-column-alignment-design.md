# MathSheets — Equation Column Alignment Design

**Date:** 2026-08-05  
**Status:** Approved for implementation planning  
**Scope:** Align operators and `=` (and comparable blanks) in vertical columns across stacked same-shape problems on templates and worksheets. No Prisma / generate / registry API changes.

## 1. Purpose

On worksheets, stacked problems like `3 + 5 = ___` and `12 + 8 = ___` currently render operators and equals as characters inside variable-width text, so `+` and `=` drift horizontally. Teachers want a classic worksheet look: **operators in one vertical column, equals in another**, across problems of the same shape.

## 2. Decisions

| Decision | Choice |
|----------|--------|
| Alignment target | Across problems in a column (not only within one problem) |
| Scope of types | Everything with an operator and/or `=` (plus best-effort for blank-between forms) |
| Surfaces | Templates **and** worksheets/PDFs (shared problem components) |
| Mixed boxes | Align only within the **same shape family**; no shared parent grid across families |
| Technique | Fixed-slot CSS grid per family (not parent subgrid, not monospace padding of a single string) |
| Digit alignment | Right-aligned operands in fixed `ch` slots; `font-mono` + `tabular-nums` |

Visual companion confirmed: fixed-slot columns (not today’s inline strings); missing-operand and vertical family mockups accepted.

## 3. Goals & non-goals

### Goals
- Split equation markup into cells so same-family problems share identical column templates
- Shared helpers for grids/cells reused by problem components
- Templates and worksheets pick up the look automatically
- Preserve answer blanks, accessibility of structure, and existing props APIs

### Non-goals
- CSS subgrid on the page/box for one global column track
- Runtime measuring of sibling widths
- UI for teachers to configure column widths
- Changing problem generation, ranges, or registry metadata
- Forcing heterogeneous types in one box into a single grid
- Redesigning worded-only or pure-visual problems beyond best-effort blank/`=` alignment

## 4. Layout families

Shared helpers live under `components/problems/shared/` (new `equation-layout.tsx` preferred over bloating `answer-blank.tsx`).

| Family | Column recipe | Types |
|--------|---------------|--------|
| **Binary eq** | `a \| op \| b \| = \| blank` | `addition-blank`, `subtraction-blank`, `doubles-addition` |
| **Missing mid** | `a \| op \| blank \| = \| c` | `missing-addend`, `missing-subtrahend`, `make-ten` (equation row; ten-frame above unchanged) |
| **Vertical** | `op-col \| digits` (digits right-aligned; rule + answer blank below) | `vertical-addition`, `vertical-subtraction` |
| **Compare** | `a \| blank \| b` | `compare-numbers` |
| **Best-effort / optional** | Align blanks or `=` where present; otherwise leave structure | `tens-ones`, `ten-more`, `ten-less`, `before-after`, sequences, visual-heavy types |

Digit slot width: fixed per family (default **2ch** for horizontal grade-1 binary/missing; **3ch** for vertical if needed). Document constants next to the helpers.

## 5. Implementation sketch

### Helpers (examples)

- `EquationGrid` — root with family-specific `grid-template-columns`, mono + tabular nums, baseline alignment
- `DigitCell` — right-aligned numeric cell
- `OpCell` / `EqCell` — operator / equals
- Reuse existing `AnswerBlank` in blank cells

### Per-type

Refactor each in-scope component from string interpolation (e.g. `{a} + {b} =`) to composing cells. Props, meta, registry, `propsFromRange`, snapshot/generate unchanged.

### Surfaces

No changes to `template-canvas.tsx` / `worksheet-page-view.tsx` list wrappers beyond what falls out of component markup. Sortable chrome on templates must not break grid alignment.

## 6. Testing

- Unit/structure tests (or lightweight render assertions) for binary, missing-mid, and vertical components: assert grid/cell structure rather than a single concatenated text node
- Manual: template box with several addition-blank items (1- and 2-digit mixes) — `+` and `=` line up; same for missing-addend and vertical; worksheet page matches

## 7. Out of scope / follow-ups

- Dynamic digit width from `rangeMax` digits
- Parent-level subgrid for mixed-type boxes
- Teacher-facing density / column-width controls
