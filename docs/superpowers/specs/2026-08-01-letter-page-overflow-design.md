# MathSheets — Letter Page Size & Overflow Design

**Date:** 2026-08-01  
**Status:** Approved for implementation planning  
**Scope:** Fixed letter-aspect template canvas in the editor, client-side overflow detection, warn-only banner + red wash on the spilling region. No print/PDF export in this change.

## 1. Purpose

Make the Templates editor canvas behave like a single **US Letter (8.5×11)** page: fixed aspect in the editor (scaled to fit the center column), with a clear warning when content no longer fits on one page. Editing and saving remain allowed.

Print/PDF later will use real physical inches; this work only locks the editor page model and overflow UX so that mapping is straightforward.

## 2. Goals & non-goals

### Goals
- `LetterShell` is a **fixed letter aspect** box (`8.5 / 11`), width capped to the center column — not height-grow-with-content
- Detect overflow by comparing content height to the page content box (`ResizeObserver`)
- On overflow (**warn only**):
  - Banner above the canvas: **“Content exceeds one page”**
  - Semi-transparent **red wash** only on the overflowing region (from page bottom downward), not the whole page
- Save, drag-drop, reorder, layout switch continue to work during overflow
- Remeasure after item/layout/window changes

### Non-goals
- Multi-page templates
- Hard block on save when overflowing
- Print/PDF export, `@page` CSS, or physical-inch rendering in this change
- Changing problem type components or the Problems catalog preview (already aspect-locked)
- Persisting overflow state in the database
- Clipping content in the editor (`overflow: hidden` on the page) — spilled content stays visible for editing

## 3. Approach

**Fixed letter viewport + measure content height.**

Editor uses a scaled letter frame. Content flows inside with margins and may extend below the frame. Overflow = `contentHeight > pageContentBoxHeight`. UI warns; no server involvement.

## 4. Architecture

### Page chrome (`LetterShell`)

Structure (normative):

1. **Stage** — `relative`, `w-full`, `max-w-*`; height grows with content so the center column can scroll
2. **Page silhouette** — `absolute` top/left/right, `aspect-ratio: 8.5 / 11`, white fill + black border; does **not** grow with content (this is the “one page” outline)
3. **Content layer** — `relative` above the silhouette; page margins; Name/Class/Date + layout children; `overflow` visible so items can extend below the silhouette onto the editor background
4. **Overflow wash** — absolute overlay from the silhouette’s bottom edge downward over spilled content

Content past the silhouette bottom is visually off-page (editor chrome behind it), still editable.

### Overflow measurement
- Client hook (e.g. `usePageOverflow`) on the content box
- `ResizeObserver` (and remount/update after items/layout) compares content scroll/offset height vs the fixed content area height
- Overflow flag is pure UI state — not stored in Prisma
- Measurement uses the **scaled editor** content box (what the user sees), not physical inches

### Banner
- Placed in the templates editor **center column**, above the letter page (outside the printable page chrome)
- Visible only while overflowing
- Not dismissible while overflow remains

### Red wash
- Absolute overlay relative to the page frame
- Starts at the page’s bottom content edge and covers content that spills below
- `pointer-events: none` so DnD/reorder still work
- Semi-transparent red (~20–30% opacity)

### Print/PDF (follow-up only)
- Separate stylesheet / export path with real `8.5in × 11in` and `@page`
- Do not reuse the editor’s scaled pixel height as print truth
- Document in code comments or a short “future print” note in this spec’s implementation plan; no implementation in this change

## 5. Edge cases

| Case | Behavior |
|------|----------|
| Empty / short template | No banner, no wash |
| Layout switch / orphan remap | Remeasure after remap |
| Tall stack in one box | Single page chrome; wash covers spill |
| Narrow center column | Page scales down; overflow uses scaled box |
| Window resize | Remeasure |

## 6. Testing

- **Unit:** overflow helper — `contentHeight > pageHeight` → overflow; equal or less → no overflow
- **Component/smoke:** force tall content → banner + wash present; shorten → both clear
- **Manual:** add problems until overflow; remove until clear; switch layouts and confirm remasure

## 7. Files (expected touchpoints)

| Area | Likely change |
|------|----------------|
| `components/templates/letter-shell.tsx` | Fixed aspect page + content box refs / overflow reporting |
| `components/templates/templates-editor.tsx` | Banner above canvas; pass overflow UI |
| New hook (e.g. `hooks/use-page-overflow.ts` or under `components/templates/`) | ResizeObserver measurement |
| Tests | Helper + optional component smoke |

Exact file names may shift slightly in the implementation plan; behavior above is normative.

## 8. Success criteria

- Letter page in the editor has a stable 8.5∶11 outline that scales with the center column
- Overflowing templates show the banner and a red wash only on the spill region
- Non-overflowing templates show neither
- User can still save and edit while overflowing
- No print/PDF work ships in this change
