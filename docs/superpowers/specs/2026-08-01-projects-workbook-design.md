# MathSheets — Projects Workbook Design

**Date:** 2026-08-01  
**Status:** Approved for implementation planning  
**Scope:** Projects as ordered template sections with page counts; frozen template snapshots; generate persisted letter-page preview with fresh random props. PDF export deferred. Requires persisting min/max ranges on template items.

## 1. Purpose

Let teachers/parents assemble a **workbook (project)** from their templates: each **section** is one template used N times. **Generate** expands sections into concrete letter pages (new random problem values each page) and saves that run for in-app preview. PDF download is a follow-on.

Templates remain the editable recipes. Projects consume a **snapshot** of a template at the moment it is added as a section.

## 2. Concepts

| Term | Meaning |
|------|---------|
| **Project** | User-owned workbook: name + ordered sections + last generation |
| **Section** | One slot in a project: frozen template snapshot + `pageCount` + `sortOrder` |
| **Template snapshot** | Deep copy of layout + items (including ranges) taken when the section is added |
| **Generation** | Latest expand of the project into concrete pages (replaces prior generation) |
| **Generated page** | One letter page: layout + items with concrete props for that instance |
| **Range** | Per template item `min`/`max` used when randomizing props on generate |

## 3. Goals & non-goals

### Goals
- Replace Projects stub with list + **New project** + composer
- Left **accordion** of sections: show template name (from snapshot), edit **page count**, **reorder**, remove; **Add section** from user’s templates (creates snapshot)
- **Generate** → wipe previous generated pages → create pages in section order (`pageCount` each) with **fresh random props** from snapshot ranges → persist → show scrollable letter preview in center
- Persist **min/max** on each `TemplateItem` at drop time (Templates change required for regenerate)
- Hint when composition changed since last generate (“preview may be stale”)
- Project delete (recommended)

### Non-goals
- PDF export / print stylesheet (follow-on; UI may show disabled “Export PDF — soon” or omit)
- Live link to templates after add (no auto re-sync of snapshot)
- Editing problem props or layout inside a project
- Per-section or per-page min/max overrides in the accordion (ranges come from snapshot only)
- Answer keys / solution sheets
- URL routing per project id (v1 may keep selection in client state like Templates)

## 4. Approach

**Relational workbook (Approach 1):** `Project` → `ProjectSection` (snapshot JSON + pageCount + sortOrder) → generated pages stored as rows (or pages under a generation run). Templates gain stored ranges on items. Generate is a server action that materializes pages from snapshots.

## 5. Architecture

### Template item ranges

On drop (min/max dialog), persist range with the item so future project snapshots and regenerate have bounds.

Normative fields (implementation may use dedicated columns or JSON; prefer clear typed fields):

- Keep `props` as concrete values for the template editor preview (e.g. `{ a, b }` for `addition-blank`)
- Store `rangeMin` and `rangeMax` (integers) on `TemplateItem`

Existing items without ranges: **cannot** be added to a project / **block Generate** for sections whose snapshot items lack ranges, with a clear error. Prefer not inventing silent defaults.

### Prisma (conceptual)

```
Project
  id, userId, name, createdAt, updatedAt
  sections ProjectSection[]
  pages    GeneratedPage[]   // last generation only; cleared on regenerate

ProjectSection
  id, projectId, sortOrder, pageCount
  templateSnapshot Json   // see shape below
  sourceTemplateId String?  // optional audit only; not used for generate
  // display name = snapshot.templateName

GeneratedPage
  id, projectId, sectionId, pageIndex  // pageIndex global or per-section; document in plan
  layoutId String
  items Json   // concrete items for this page: boxId, problemTypeId, props, sortOrder
```

Exact indexing and whether `pageIndex` is global across the workbook or per-section is left to the implementation plan; behavior must preserve **section order**, then pages 1…N within each section.

### Template snapshot JSON (normative)

```json
{
  "templateName": "Addition practice",
  "layoutId": "two-columns",
  "items": [
    {
      "boxId": "col-left",
      "problemTypeId": "addition-blank",
      "sortOrder": 0,
      "rangeMin": 1,
      "rangeMax": 10
    }
  ]
}
```

Concrete template preview props need not be in the snapshot for generate; ranges + type + box + order are enough. Including them is optional and unused by Generate.

### Generate algorithm

1. Authz: project belongs to session user  
2. Validate: ≥1 section; each `pageCount` in `[1, MAX]` (MAX = 50); every snapshot item has valid `rangeMin`/`rangeMax` with min ≤ max; problem types known  
3. Delete existing `GeneratedPage` rows for the project  
4. For each section in `sortOrder`, for `i in 1…pageCount`: create a page whose items mirror snapshot items with **new** `randomIntInRange(rangeMin, rangeMax)` props per type strategy (same as template drop for `addition-blank`)  
5. Return project with pages for UI  

Changing sections / counts / order does **not** auto-generate.

### UI

| Area | Content |
|------|---------|
| List | Project names; New project; select active |
| Left accordion | Section header: snapshot template name + page count; expand: page count control; reorder; remove; Add section → pick template |
| Center | Scrollable letter pages from last generation; empty: prompt to Generate |
| Actions | **Generate** primary; PDF deferred |

Reuse `LetterShell` / layout rendering in **read-only** mode (no DnD on generated pages). Overflow warn UX may apply if shell is reused.

Selection: client state on `/projects` for v1 (same pattern as Templates).

### Stale preview

If sections (identity, order, or page counts) change after the last successful generate, show a non-blocking hint that the preview may be stale until Generate is run again. Exact fingerprint (e.g. hash of section ids + counts + order + updatedAt) is an implementation detail.

## 6. Edge cases

| Case | Behavior |
|------|----------|
| Source template deleted after snapshot | Section unchanged; Generate still works |
| Template item missing ranges | **Block Add section** with a clear error; Generate also rejects any snapshot item lacking ranges (defense in depth) |
| pageCount out of range | Zod validation; reject |
| No sections | Generate disabled |
| Empty template (no items) | Allow section; generates blank letter pages (header only) — or reject Add; prefer **allow** blank pages |
| Huge projects | Cap pageCount per section at 50; no hard total page cap beyond that in v1 |

## 7. Testing

- Unit: snapshot builder from template; prop randomization from ranges; pageCount validation; section reorder helpers  
- Server actions: add section freezes snapshot; generate replaces pages; order respected; auth scoping  
- Manual: two sections with different counts → Generate → change count → stale hint → Generate again → new numbers  

## 8. Success criteria

- User can create a project, add templates as sections with page counts, reorder, and remove sections  
- Generate produces and persists a preview of letter pages with fresh random props from snapshotted ranges  
- Editing a template after add does not change existing project sections  
- No PDF export ships in this change  
- Template drops persist min/max for use by Projects  

## 9. Follow-ons

- Export PDF (real multi-page letter PDF from generated pages)  
- Optional `/projects/[id]` URLs  
- Re-snapshot / “update from template” action  
- Answer key generation  
