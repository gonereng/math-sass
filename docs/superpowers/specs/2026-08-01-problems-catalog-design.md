# MathSheets — Problems Catalog (Addition Blank) Design

**Date:** 2026-08-01  
**Status:** Approved for implementation planning  
**Scope:** Developer-defined problem component registry + Problems browse UI with letter-frame preview. First type: `addition-blank`. No Templates UI, PDF export, or user-created problem types.

## 1. Purpose

Introduce a **problem type** system: print-oriented React components with typed props (shadcn-like, code-owned). Teachers/parents browse types on the Problems page to understand what they can later place on Templates. Users cannot create new problem types in v1 — developers add them in code.

Long-term product goal (context, not this slice): generate HTML letter pages for PDF export. The app itself has **no inputs for writing answers**; blanks are for handwriting on printouts.

## 2. Concepts

| Term | Meaning |
|------|---------|
| **Problem type** | Developer-authored React component + metadata, registered in code |
| **Template** | Full 8.5×11 page shell (name, class, date, …) that composes problem instances — **out of this slice** |
| **Problems page** | Browse-only catalog: left list of types, right live preview |

## 3. Goals & non-goals

### Goals
- Code registry of problem types (`id`, `name`, `description`, `demoProps`, `Component`)
- First type: **Addition blank** — `A + B =` with a horizontal answer line (no `<input>`)
- Problems page: left type list, right name/description + letter-sized preview with fixed demo props
- Remove empty state / “New problem” from Problems

### Non-goals
- Templates UI or real page shells (name/class/date)
- PDF export
- User-created problem types or DB tables for problems
- Editable prop playground in the preview
- Answer checking or interactive student mode

## 4. Approach

**Registry + print-oriented components.** Each type under `components/problems/<id>/`. Central `registry.ts` drives the Problems catalog. Preview uses fixed `demoProps` inside a scaled letter-sized frame (visual aid only — not a Template).

## 5. Architecture

### File layout

```
components/problems/
  registry.ts
  types.ts                    # ProblemType / registry entry types
  addition-blank/
    addition-blank.tsx
    meta.ts
  letter-preview-frame.tsx    # scaled 8.5×11 preview chrome
app/(app)/problems/
  page.tsx                    # catalog UI (client list + preview)
```

### Registry entry

```ts
type ProblemTypeEntry = {
  id: string;
  name: string;
  description: string;
  demoProps: Record<string, unknown>; // or typed per component via generics later
  Component: React.ComponentType<any>;
};
```

Adding a type = new folder + register in `registry.ts`. No database.

### `AdditionBlank` props

| Prop | Type | Notes |
|------|------|--------|
| `a` | `number` | Left addend |
| `b` | `number` | Right addend |
| `fontSize?` | `string \| number` | Default e.g. `1.25rem` |
| `className?` | `string` | Optional wrapper |

**Render:** `{a} + {b} =` then a horizontal blank (underline / border line). No form controls; no sum displayed.

**Demo meta:**
- `id: "addition-blank"`
- `name: "Addition blank"`
- `description: "A + B with a blank for the sum"`
- `demoProps: { a: 3, b: 5 }`

## 6. UI

### Problems page
- Replace current empty state
- **Left (~240px):** list of `name`s from registry; first entry selected by default; active styling
- **Right:** selected `name` + `description`; letter preview frame containing `<Component {...demoProps} />`
- Letter frame: aspect ratio for 8.5×11, scaled to fit pane (~50–70%), light border/shadow so it reads as a page

### Removed
- “New problem” button and empty-bank copy

## 7. Testing & verification

### Manual
1. Open Problems — catalog UI (not empty state); no “New problem”
2. Left list includes “Addition blank”; selection updates right pane
3. Preview shows `3 + 5 =` with an answer line inside a letter-sized frame
4. Blank is not an editable input

### Automated
- Unit test: registry exports ≥1 entry with `id`, `name`, `description`, `Component`, `demoProps`
- Optional: shallow render test that AdditionBlank shows `a`, `b`, and no `<input>`

## 8. Follow-on (out of this spec)

1. Templates catalog (letter shell + composed problem instances)
2. More problem types
3. PDF export of templates
4. Projects that collect templates/sheets

## 9. Resolved decisions

| Decision | Choice |
|----------|--------|
| Problem vs Template | Problem = component type; Template = full page (later) |
| Problems UI | Left list / right preview |
| Slice scope | Problems only (no Templates UI) |
| Preview props | Fixed demos only |
| Registration | Code registry (no DB) |
| Approach | Registry + print components + letter-frame preview |
