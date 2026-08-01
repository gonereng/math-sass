# Templates Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a three-column Templates editor: letter shell with layout drop-boxes, drag problem types from a palette, min/max → random props, persist per user in Postgres.

**Architecture:** Prisma `Template` + `TemplateItem`; code layout presets declare `boxId`s; `@dnd-kit` for palette→box drops and within-box reorder; server actions scoped to `session.user.id`. Default layout `two-columns`. Seed “Addition practice” on first visit.

**Tech Stack:** Next.js App Router, Prisma, Zod, Vitest, Tailwind, shadcn Dialog, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Global Constraints

- Sample template name: **Addition practice**; `layoutId`: **two-columns**
- Shell: black border, padding, Name/Class/Date blanks only
- Boxes stack multiple items; reorder within box
- Drop → min/max dialog → random ints in `[min, max]` for `addition-blank` props `{ a, b }`
- New template: empty shell, default `two-columns`
- No PDF, freeform x/y, prop re-edit, custom layout UI
- Spec: `docs/superpowers/specs/2026-08-01-templates-editor-design.md`
- Reuse `problemTypes` from `@/components/problems/registry`
- Postgres on host port **5433** (existing docker-compose)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | Template, TemplateItem, User.templates |
| `components/templates/layouts.ts` | Layout presets + box ids |
| `components/templates/layouts.test.ts` | Preset box coverage |
| `lib/random.ts` | `randomIntInRange` |
| `lib/random.test.ts` | Range tests |
| `lib/validations/template.ts` | Zod for min/max, create, etc. |
| `lib/validations/template.test.ts` | Zod tests |
| `lib/actions/templates.ts` | Server actions |
| `components/templates/letter-shell.tsx` | Border, padding, header blanks |
| `components/templates/template-canvas.tsx` | Layout boxes + items + DnD |
| `components/templates/problem-palette.tsx` | Drag sources |
| `components/templates/min-max-dialog.tsx` | Min/max form |
| `components/templates/templates-editor.tsx` | Three-column shell |
| `app/(app)/templates/page.tsx` | Load templates + editor |

---

### Task 1: Prisma models + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration via `prisma migrate`

**Interfaces:**
- Produces: `Template`, `TemplateItem` models; `User.templates`

- [ ] **Step 1: Update schema**

Add to `User`:

```prisma
templates Template[]
```

Add models:

```prisma
model Template {
  id        String         @id @default(cuid())
  userId    String
  name      String
  layoutId  String
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     TemplateItem[]

  @@index([userId])
}

model TemplateItem {
  id            String   @id @default(cuid())
  templateId    String
  boxId         String
  problemTypeId String
  props         Json
  sortOrder     Int
  template      Template @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@index([templateId, boxId, sortOrder])
}
```

- [ ] **Step 2: Migrate**

```bash
npx prisma migrate dev --name add_templates
npx prisma generate
```

Expected: migration applied; client generated.

- [ ] **Step 3: Commit**

```bash
git add prisma
git commit -m "feat: add Template and TemplateItem Prisma models"
```

---

### Task 2: Layouts + random + Zod (TDD)

**Files:**
- Create: `components/templates/layouts.ts`
- Create: `components/templates/layouts.test.ts`
- Create: `lib/random.ts`
- Create: `lib/random.test.ts`
- Create: `lib/validations/template.ts`
- Create: `lib/validations/template.test.ts`

**Interfaces:**
- Produces:
  - `DEFAULT_LAYOUT_ID = "two-columns"`
  - `getLayout(layoutId): { id, name, boxes: { id: string }[] }`
  - `layoutPresets` map/array
  - `randomIntInRange(min: number, max: number): number`
  - `minMaxSchema`, `createTemplateSchema`

- [ ] **Step 1: Failing tests**

`components/templates/layouts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT_ID, getLayout, layoutPresets } from "./layouts";

describe("layouts", () => {
  it("defaults to two-columns with two boxes", () => {
    expect(DEFAULT_LAYOUT_ID).toBe("two-columns");
    const layout = getLayout(DEFAULT_LAYOUT_ID);
    expect(layout.boxes.map((b) => b.id)).toEqual(["col-left", "col-right"]);
  });

  it("includes single-column and grid-2x2", () => {
    expect(getLayout("single-column").boxes.map((b) => b.id)).toEqual(["main"]);
    expect(getLayout("grid-2x2").boxes).toHaveLength(4);
  });

  it("lists all presets", () => {
    expect(layoutPresets.map((l) => l.id).sort()).toEqual(
      ["grid-2x2", "single-column", "two-columns"].sort(),
    );
  });
});
```

`lib/random.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { randomIntInRange } from "./random";

describe("randomIntInRange", () => {
  it("returns values within inclusive range", () => {
    for (let i = 0; i < 50; i++) {
      const n = randomIntInRange(1, 5);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
    }
  });

  it("works when min === max", () => {
    expect(randomIntInRange(3, 3)).toBe(3);
  });
});
```

`lib/validations/template.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { minMaxSchema } from "./template";

describe("minMaxSchema", () => {
  it("accepts valid range", () => {
    expect(minMaxSchema.safeParse({ min: 1, max: 10 }).success).toBe(true);
  });

  it("rejects min > max", () => {
    expect(minMaxSchema.safeParse({ min: 5, max: 2 }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm test -- components/templates/layouts.test.ts lib/random.test.ts lib/validations/template.test.ts
```

- [ ] **Step 3: Implement**

`components/templates/layouts.ts`:

```ts
export const DEFAULT_LAYOUT_ID = "two-columns" as const;

export type LayoutBox = { id: string };
export type LayoutPreset = {
  id: string;
  name: string;
  boxes: LayoutBox[];
};

export const layoutPresets: LayoutPreset[] = [
  {
    id: "single-column",
    name: "Single column",
    boxes: [{ id: "main" }],
  },
  {
    id: "two-columns",
    name: "Two columns",
    boxes: [{ id: "col-left" }, { id: "col-right" }],
  },
  {
    id: "grid-2x2",
    name: "2×2 grid",
    boxes: [
      { id: "cell-0" },
      { id: "cell-1" },
      { id: "cell-2" },
      { id: "cell-3" },
    ],
  },
];

export function getLayout(layoutId: string): LayoutPreset {
  const found = layoutPresets.find((l) => l.id === layoutId);
  if (!found) {
    return layoutPresets.find((l) => l.id === DEFAULT_LAYOUT_ID)!;
  }
  return found;
}
```

`lib/random.ts`:

```ts
export function randomIntInRange(min: number, max: number): number {
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
```

`lib/validations/template.ts`:

```ts
import { z } from "zod";

export const minMaxSchema = z
  .object({
    min: z.coerce.number().int(),
    max: z.coerce.number().int(),
  })
  .refine((d) => d.min <= d.max, {
    message: "Min must be less than or equal to max",
    path: ["max"],
  });

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  layoutId: z.string().optional(),
});

export type MinMaxInput = z.infer<typeof minMaxSchema>;
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- components/templates/layouts.test.ts lib/random.test.ts lib/validations/template.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/templates/layouts.ts components/templates/layouts.test.ts lib/random.ts lib/random.test.ts lib/validations/template.ts lib/validations/template.test.ts
git commit -m "feat: add template layouts, random helper, and min/max validation"
```

---

### Task 3: Template server actions

**Files:**
- Create: `lib/actions/templates.ts`

**Interfaces:**
- Consumes: `auth`, `prisma`, `randomIntInRange`, `minMaxSchema`, `DEFAULT_LAYOUT_ID`, `getLayout`
- Produces:
  - `ensureSampleTemplate(): Promise<TemplateWithItems[]>` — list after seed
  - `createTemplate(input?): Promise<{ ok: true; template } | { ok: false; error }>`
  - `addTemplateItem({ templateId, boxId, problemTypeId, min, max })`
  - `reorderTemplateItems({ templateId, boxId, orderedIds: string[] })`
  - `removeTemplateItem({ id })`

- [ ] **Step 1: Implement actions**

Create `lib/actions/templates.ts` with `"use server"`:

Patterns:
- `auth()` → require `session.user.id` or return error / throw redirect
- Ownership: every query/update filters `template.userId === session.user.id`
- `ensureSampleTemplate`: `findMany` for user; if empty, `create` `{ name: "Addition practice", layoutId: DEFAULT_LAYOUT_ID, userId }`; return templates with `items` ordered by `sortOrder`
- `createTemplate`: name default `"Untitled template"`, layoutId default `DEFAULT_LAYOUT_ID`; validate layout exists via `getLayout`
- `addTemplateItem`:
  - Parse min/max with `minMaxSchema`
  - Verify template ownership + `boxId` is in layout boxes
  - Verify `problemTypeId` exists in `problemTypes` registry
  - For `addition-blank`: `props = { a: randomIntInRange(min,max), b: randomIntInRange(min,max) }`
  - `sortOrder` = max existing in box + 1 (or count)
  - Create item; return item
- `reorderTemplateItems`: verify all ids belong to template+box; update `sortOrder` in a transaction
- `removeTemplateItem`: delete if owned

Error string for unexpected: `"Something went wrong"`.

Include type:

```ts
export type TemplateWithItems = {
  id: string;
  name: string;
  layoutId: string;
  items: {
    id: string;
    boxId: string;
    problemTypeId: string;
    props: unknown;
    sortOrder: number;
  }[];
};
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/actions/templates.ts
git commit -m "feat: add template server actions for seed, create, items"
```

---

### Task 4: Templates UI + DnD editor

**Files:**
- Install: `@dnd-kit/core` `@dnd-kit/sortable` `@dnd-kit/utilities`
- Add shadcn: `dialog` (if missing)
- Create: letter shell, canvas, palette, min-max dialog, editor
- Modify: `app/(app)/templates/page.tsx`

**Interfaces:**
- Consumes: actions + `problemTypes` + layouts
- Produces: working Templates page

- [ ] **Step 1: Install deps**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npx shadcn@latest add dialog
```

- [ ] **Step 2: Letter shell**

`components/templates/letter-shell.tsx` — white page, `border-2 border-black`, padding, header blanks, `children` for body.

- [ ] **Step 3: Min/max dialog**

`components/templates/min-max-dialog.tsx` — controlled open; fields min/max; Cancel / Add; calls `onConfirm({ min, max })`.

- [ ] **Step 4: Palette**

`components/templates/problem-palette.tsx` — list `problemTypes`; each item `useDraggable` with `id: palette-${type.id}`, `data: { from: "palette", problemTypeId }`.

- [ ] **Step 5: Canvas with boxes + sortable**

`components/templates/template-canvas.tsx`:
- `getLayout(template.layoutId)` → render grid/flex of boxes
- Each box: `useDroppable({ id: box.id, data: { boxId } })`
- Items in box: `SortableContext` + sortable items rendering registry `Component` with `props`
- Remove button → `removeTemplateItem`
- On drag end (handled in parent preferred): if from palette and over box → open min/max dialog with pending `{ boxId, problemTypeId }`; if reorder within box → `reorderTemplateItems`

CSS for layouts:
- `two-columns`: `grid grid-cols-2 gap-4`
- `grid-2x2`: `grid grid-cols-2 grid-rows-2 gap-4`
- `single-column`: one column

Box chrome: `min-h-24 border border-dashed border-black/40 p-2` (highlight when `isOver`).

- [ ] **Step 6: Editor shell**

`components/templates/templates-editor.tsx` (client):
- Props: initial `templates: TemplateWithItems[]`
- State: selectedId, templates (optimistic refresh via `router.refresh()` or local update after actions)
- Left: list + **New template** button → `createTemplate` → select new
- Center: `LetterShell` + `TemplateCanvas`
- Right: `ProblemPalette`
- Wrap with `DndContext`
- Pending drop state drives `MinMaxDialog`; on confirm → `addTemplateItem` → refresh

- [ ] **Step 7: Page**

`app/(app)/templates/page.tsx` (server):

```tsx
import { ensureSampleTemplate } from "@/lib/actions/templates";
import { TemplatesEditor } from "@/components/templates/templates-editor";

export default async function TemplatesPage() {
  const templates = await ensureSampleTemplate();
  return <TemplatesEditor initialTemplates={templates} />;
}
```

Remove `EmptyStatePage` usage.

- [ ] **Step 8: Verify**

```bash
npm test
npx tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
git add components/templates app/(app)/templates package.json package-lock.json components/ui/dialog.tsx
git commit -m "feat: add templates editor with drag-and-drop drop boxes"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Checklist** (dev server, logged in, DB on 5433)

1. Templates → three columns; “Addition practice” selected  
2. Shell border/padding/blanks; two drop boxes  
3. Drag Addition blank → min/max → Add → values in range  
4. Stack + reorder in same box  
5. Remove + refresh persists  
6. New template empty  
7. Switch templates shows correct items  

- [ ] **Step 2: Commit only if fixes needed**

---

## Self-review (plan vs spec)

| Spec item | Task |
|-----------|------|
| Prisma models | 1 |
| Layout presets + default two-columns | 2 |
| Random + min/max validation | 2 |
| Seed + CRUD actions | 3 |
| Three-column DnD UI | 4 |
| Manual checklist | 5 |

No TBD placeholders. `addition-blank` is the only props strategy in v1 (extend via switch later).
