# MathSheets — Templates Editor Design

**Date:** 2026-08-01  
**Status:** Approved for implementation planning  
**Scope:** Three-column Templates UI with letter shell, layout drop-boxes, drag-from-palette + min/max random props, Prisma persistence. No PDF export.

## 1. Purpose

Let teachers/parents compose **letter-sized worksheet templates** by dragging problem types from a palette into **layout-defined boxes** (columns / grid cells). Each box holds a vertical stack of problem instances. Layout persists per user in Postgres. Problem *types* remain developer-owned (existing registry).

Long-term: HTML pages for PDF export. Answers are handwriting blanks only — no in-app answer inputs.

## 2. Concepts

| Term | Meaning |
|------|---------|
| **Problem type** | Registry component (e.g. `addition-blank`) |
| **Template** | Named user document: shell + `layoutId` + ordered items in boxes |
| **Layout preset** | Code-defined arrangement of drop boxes (`single-column`, `two-columns`, `grid-2x2`) |
| **Box** | Drop target in a layout; contains a vertical stack of items |
| **Template item** | One placed problem: `problemTypeId` + concrete `props` + `boxId` + `sortOrder` |

## 3. Goals & non-goals

### Goals
- Templates page: **left** template list · **center** letter canvas · **right** problem palette
- Letter shell: black border, padding, Name/Class/Date **blanks** (no teacher-filled text in v1)
- Layout presets with visible drop boxes; stacks **inside** each box
- Drag problem type onto a box → min/max dialog → random integer props → persist
- Reorder within a box; remove item; persist
- Seed one sample template on first visit; **New template** creates an empty shell (default layout)
- Use existing `problemTypes` registry

### Non-goals
- PDF export
- Freeform x/y placement
- Custom layout builder in the UI (presets only)
- Editing props after drop
- Shell field text overrides (blanks only)
- User-created problem types
- Projects integration

## 4. Approach

**Prisma Template + TemplateItem + @dnd-kit flow editor.** Layout presets in code declare `boxId`s. Items store `boxId`, `problemTypeId`, `props` JSON, `sortOrder`.

## 5. Architecture

### UI columns

| Column | Content |
|--------|---------|
| Left (~220–240px) | Template names; New template; active selection |
| Center | Letter page preview/editor |
| Right (~220–240px) | Palette of problem types (drag sources) |

### Letter page
- White page, **black border**, inner **padding**
- Header: `Name: ______` · `Class: ______` · `Date: ______`
- Body: layout of **boxes** (dashed when empty/accepting drop)
- Each box: stacked instances; remove control; reorder handle

### Layout presets (code)

| `layoutId` | Boxes (example ids) |
|------------|---------------------|
| `single-column` | `main` |
| `two-columns` | `col-left`, `col-right` |
| `grid-2x2` | `cell-0`, `cell-1`, `cell-2`, `cell-3` |

Seed sample + New template default: **`two-columns`** (boxes clearly visible).

### Drop flow (addition-blank)
1. Drag type from palette → drop on a box  
2. Dialog: Min, Max (integers; require min ≤ max)  
3. Generate random integers `a`, `b` each in `[min, max]`  
4. Create `TemplateItem` with `props: { a, b }`, append `sortOrder` in that box  
5. Persist via server action  

Other problem types later: type-specific min/max (or shared numeric range) via a small strategy map keyed by `problemTypeId`.

### Data model (Prisma)

```prisma
model Template {
  id        String         @id @default(cuid())
  userId    String
  name      String
  layoutId  String
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  user      User           @relation(...)
  items     TemplateItem[]
}

model TemplateItem {
  id            String   @id @default(cuid())
  templateId    String
  boxId         String
  problemTypeId String
  props         Json
  sortOrder     Int
  template      Template @relation(..., onDelete: Cascade)

  @@index([templateId, boxId, sortOrder])
}
```

Add `templates Template[]` on `User`.

### Seed
On first Templates visit (or first list load): if user has zero templates, create **“Addition practice”** with `layoutId: "two-columns"` and no items (empty boxes).

### Server actions (indicative)
- `listTemplates` / `ensureSampleTemplate`
- `createTemplate({ name?, layoutId? })`
- `addTemplateItem({ templateId, boxId, problemTypeId, min, max })` — validates, randomizes, inserts
- `reorderTemplateItems({ templateId, boxId, orderedIds })`
- `removeTemplateItem({ id })`
- Optional: `renameTemplate`

Auth: all scoped to `session.user.id`.

### DnD
- **@dnd-kit** (or equivalent): palette → box; sortable within box
- Dropping onto page chrome (outside boxes) does nothing

## 6. Testing & verification

### Manual
1. Templates opens three-column UI; sample selected  
2. Shell: black border, padding, Name/Class/Date blanks, drop boxes visible  
3. Drag Addition blank → min/max → Add → random values in range appear in that box  
4. Second drop into same box stacks; reorder works  
5. Remove item; survives refresh  
6. New template appears in list (empty boxes)  
7. Switching templates shows correct items  

### Automated
- Layout registry: each preset’s `boxId`s  
- `randomIntInRange(min, max)` always in range when min ≤ max  
- Zod (or equivalent) for min/max dialog input  

## 7. Follow-on
- More layouts; prop edit after drop; shell text overrides  
- PDF export  
- Projects linking templates  

## 8. Resolved decisions

| Decision | Choice |
|----------|--------|
| Browse + edit layout | Three columns always |
| Placement | Layout-defined boxes; stack inside each box |
| Persistence | Seeded sample + Postgres save |
| Shell fields | Blanks only (v1) |
| On drop | Min/max dialog → random props |
| Architecture | Prisma items + dnd-kit + layout presets |
| Default layout | `two-columns` |
| New template | Yes — empty shell with default layout |
