# MathSheets — Template Drop Count Design

**Date:** 2026-08-05  
**Status:** Approved for implementation planning  
**Scope:** Add a Count field to the post-drop min/max dialog so one drag-and-drop can place N problems with the same range. No Prisma schema change.

## 1. Purpose

When placing a problem type on a template via drag-and-drop, teachers often want several problems that share the same min/max range. Today each drop creates exactly one `TemplateItem`. This change lets them specify how many problems to place in one confirm action.

## 2. Decisions

| Decision | Choice |
|----------|--------|
| Placement model | Create **N separate** `TemplateItem` rows on the canvas immediately |
| Default count | `1` (preserves current single-place behavior) |
| Count bounds | Integer **1–50** |
| Persistence of count | Not stored; N rows are the source of truth |
| Server API | Batch create in one transaction (not N client round-trips) |

## 3. Goals & non-goals

### Goals
- Add **Count** to the existing min/max dialog after palette → box drop
- On confirm, create `count` items in the target box with the same `problemTypeId`, `rangeMin`, `rangeMax`
- Each item gets its own `props` from `propsFromRange` (preview numbers may differ)
- Assign consecutive `sortOrder` values after the current max in that box
- Validate count on client and server via Zod
- Update editor optimistic state with all created items

### Non-goals
- Prisma schema / `quantity` column on `TemplateItem`
- Editing “count” on already-placed items
- Changes to project snapshot or generate logic (1:1 item mapping already works)
- Cross-box multi-place or auto-fill across boxes
- Raising or removing the 50-item-per-drop cap in this change

## 4. Behavior & UI

After dropping a problem type onto a box, **Set number range** shows:

| Field | Default | Rules |
|-------|---------|--------|
| Min | 1 | integer |
| Max | 10 | integer, ≥ min |
| Count | 1 | integer, 1–50 |

Confirm creates **Count** items in that box. Reorder and remove remain per-item and unchanged.

Invalid count/min/max: show Zod message in the dialog; do not close. Server failure: toast; dialog stays open (same as today).

## 5. Data & API

### Validation (`lib/validations/template.ts`)

Extend `minMaxSchema`:

```ts
count: z.coerce.number().int().min(1).max(50)
```

Existing min ≤ max refine remains. Tests cover valid count, reject `0` and `51`.

### Server action (`addTemplateItem`)

- Accept `count` as a required field on the action input; validate with `minMaxSchema` (dialog always sends an explicit count; default `1` is UI-only)
- In one Prisma transaction:
  1. Resolve next `sortOrder` for `(templateId, boxId)`
  2. Create N rows with consecutive orders, each with fresh `propsFromRange`
  3. Return `{ ok: true, items: [...] }` (always an array)

Auth, template ownership, layout box checks, and problem-type lookup stay as today.

### Editor (`templates-editor.tsx`)

`handleConfirmMinMax` passes `{ min, max, count }`, then appends `result.items` to the selected template’s items.

### Dialog (`min-max-dialog.tsx`)

Third input for Count; reset to `"1"` when opened; include `count` in `onConfirm` payload.

## 6. Files to change

| File | Change |
|------|--------|
| `lib/validations/template.ts` | Add `count` to `minMaxSchema` |
| `lib/validations/template.test.ts` | Count bound tests |
| `components/templates/min-max-dialog.tsx` | Count field + confirm payload |
| `components/templates/templates-editor.tsx` | Pass count; append `items` |
| `lib/actions/templates.ts` | Batch create; return `items` |

## 7. Testing

- Unit: `minMaxSchema` accepts count 1 and 50; rejects 0 and 51; still rejects min > max
- Manual: drop with count 1 (unchanged feel); drop with count 5 → five stacked items in the box with shared ranges

## 8. Out of scope / follow-ups

- Per-item edit of range after place
- Soft warning when a box already has many items
- Higher batch limits if needed later
