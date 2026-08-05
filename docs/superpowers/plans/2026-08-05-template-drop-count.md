# Template Drop Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let teachers set a Count (1–50, default 1) in the post-drop min/max dialog so one palette drop creates N `TemplateItem` rows with the same range.

**Architecture:** Extend `minMaxSchema` with required `count`. Batch-create N items in one Prisma `$transaction` inside `addTemplateItem`, each with fresh `propsFromRange` and consecutive `sortOrder`. Return `{ ok: true, items: [...] }`. Dialog and editor pass/append count. No schema migration.

**Tech Stack:** Next.js App Router, Prisma 6, Zod 4, Vitest, existing shadcn Dialog/Input

## Global Constraints

- Default count in UI: **1**
- Count bounds: integer **1–50** (inclusive)
- Create **N separate** `TemplateItem` rows immediately (not a stored quantity field)
- No Prisma schema / migration changes
- Spec: `docs/superpowers/specs/2026-08-05-template-drop-count-design.md`
- `count` is required on `minMaxSchema`; UI always sends it (default is UI-only)
- Action return shape: always `{ ok: true, items: [...] }` (replace single `item`)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/validations/template.ts` | Zod `minMaxSchema` including `count` |
| `lib/validations/template.test.ts` | Count + existing range tests |
| `lib/actions/templates.ts` | Batch `addTemplateItem` |
| `components/templates/min-max-dialog.tsx` | Count input + confirm payload |
| `components/templates/templates-editor.tsx` | Pass count; append `items` |

---

### Task 1: Extend `minMaxSchema` with count

**Files:**
- Modify: `lib/validations/template.ts`
- Modify: `lib/validations/template.test.ts`

**Interfaces:**
- Produces: `minMaxSchema` parses `{ min: number, max: number, count: number }` with `count` in `[1, 50]`; `MinMaxInput` includes `count`

- [ ] **Step 1: Write the failing tests**

Replace the `minMaxSchema` describe block in `lib/validations/template.test.ts` with:

```ts
describe("minMaxSchema", () => {
  it("accepts valid range with count", () => {
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 1 }).success,
    ).toBe(true);
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 50 }).success,
    ).toBe(true);
  });

  it("rejects min > max", () => {
    expect(
      minMaxSchema.safeParse({ min: 5, max: 2, count: 1 }).success,
    ).toBe(false);
  });

  it("rejects count below 1", () => {
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 0 }).success,
    ).toBe(false);
  });

  it("rejects count above 50", () => {
    expect(
      minMaxSchema.safeParse({ min: 1, max: 10, count: 51 }).success,
    ).toBe(false);
  });

  it("rejects missing count", () => {
    expect(minMaxSchema.safeParse({ min: 1, max: 10 }).success).toBe(false);
  });
});
```

Leave the `updateTemplateNameSchema` describe block unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/validations/template.test.ts`

Expected: FAIL — existing “accepts valid range” / new count cases fail because `count` is not on the schema yet (or missing-count test may fail for the opposite reason until schema is updated).

- [ ] **Step 3: Implement schema**

In `lib/validations/template.ts`, change `minMaxSchema` to:

```ts
export const minMaxSchema = z
  .object({
    min: z.coerce.number().int(),
    max: z.coerce.number().int(),
    count: z.coerce.number().int().min(1).max(50),
  })
  .refine((d) => d.min <= d.max, {
    message: "Min must be less than or equal to max",
    path: ["max"],
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/validations/template.test.ts`

Expected: PASS (all tests in that file green).

- [ ] **Step 5: Commit**

```bash
git add lib/validations/template.ts lib/validations/template.test.ts
git commit -m "feat: require count 1-50 on template min/max schema"
```

---

### Task 2: Batch-create in `addTemplateItem`

**Files:**
- Modify: `lib/actions/templates.ts` (function `addTemplateItem`, ~lines 220–313)

**Interfaces:**
- Consumes: `minMaxSchema` with `count` from Task 1
- Produces: `addTemplateItem(input: { templateId: string; boxId: string; problemTypeId: string; min: number; max: number; count: number }): Promise<{ ok: true; items: Array<{ id: string; boxId: string; problemTypeId: string; props: unknown; sortOrder: number; rangeMin: number | null; rangeMax: number | null }> } | ActionError>`

- [ ] **Step 1: Update the action signature and parse**

Change the function signature and Zod parse so `count` is required and included in `safeParse`:

```ts
export async function addTemplateItem(input: {
  templateId: string;
  boxId: string;
  problemTypeId: string;
  min: number;
  max: number;
  count: number;
}): Promise<
  | {
      ok: true;
      items: {
        id: string;
        boxId: string;
        problemTypeId: string;
        props: unknown;
        sortOrder: number;
        rangeMin: number | null;
        rangeMax: number | null;
      }[];
    }
  | ActionError
> {
  // ... requireUserId unchanged ...

  const parsed = minMaxSchema.safeParse({
    min: input.min,
    max: input.max,
    count: input.count,
  });
  if (!parsed.success) {
    return { ok: false, error: UNEXPECTED };
  }
```

Keep problem-type lookup and template/layout ownership checks as they are today.

- [ ] **Step 2: Create N items in a transaction**

Replace the single `props` + `create` + return `item` block with:

```ts
    const { min, max, count } = parsed.data;

    const maxExisting = await prisma.templateItem.findFirst({
      where: { templateId: input.templateId, boxId: input.boxId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const baseOrder = (maxExisting?.sortOrder ?? -1) + 1;

    const created = await prisma.$transaction(
      Array.from({ length: count }, (_, i) => {
        const props = propsFromRange(
          input.problemTypeId,
          min,
          max,
        ) as Prisma.InputJsonValue;
        return prisma.templateItem.create({
          data: {
            templateId: input.templateId,
            boxId: input.boxId,
            problemTypeId: input.problemTypeId,
            props,
            sortOrder: baseOrder + i,
            rangeMin: min,
            rangeMax: max,
          },
        });
      }),
    );

    return {
      ok: true,
      items: created.map((item) => ({
        id: item.id,
        boxId: item.boxId,
        problemTypeId: item.problemTypeId,
        props: item.props,
        sortOrder: item.sortOrder,
        rangeMin: item.rangeMin,
        rangeMax: item.rangeMax,
      })),
    };
```

Keep the outer `try/catch` that returns `{ ok: false, error: UNEXPECTED }`.

- [ ] **Step 3: Typecheck call sites**

Run: `npx tsc --noEmit`

Expected: FAIL on `templates-editor.tsx` (still passes no `count` / reads `result.item`). That is fixed in Task 3–4; if only those errors appear, proceed. Do not change the editor yet in this task.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/templates.ts
git commit -m "feat: batch-create template items by count"
```

---

### Task 3: Count field in `MinMaxDialog`

**Files:**
- Modify: `components/templates/min-max-dialog.tsx`

**Interfaces:**
- Consumes: `minMaxSchema` with `count` from Task 1
- Produces: `onConfirm: (values: { min: number; max: number; count: number }) => boolean | Promise<boolean>`

- [ ] **Step 1: Extend state and confirm payload**

Update props and state:

```ts
type MinMaxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: {
    min: number;
    max: number;
    count: number;
  }) => boolean | Promise<boolean>;
  problemTypeName?: string;
};

// inside component:
const [min, setMin] = useState("1");
const [max, setMax] = useState("10");
const [count, setCount] = useState("1");
```

In the `useEffect` when `open` becomes true, also reset:

```ts
setCount("1");
```

In `handleConfirm`:

```ts
const parsed = minMaxSchema.safeParse({ min, max, count });
```

- [ ] **Step 2: Add Count input UI**

After the Max field block (before the error paragraph), add:

```tsx
<div className="grid gap-1.5">
  <Label htmlFor="template-count">Count</Label>
  <Input
    id="template-count"
    type="number"
    min={1}
    max={50}
    value={count}
    onChange={(e) => setCount(e.target.value)}
    aria-invalid={Boolean(error)}
  />
</div>
```

Optionally update `DialogDescription` to mention count, e.g. `Choose min, max, and how many problems to place.` — keep short.

- [ ] **Step 3: Commit**

```bash
git add components/templates/min-max-dialog.tsx
git commit -m "feat: add count field to template min/max dialog"
```

---

### Task 4: Wire editor to count + `items`

**Files:**
- Modify: `components/templates/templates-editor.tsx` (`handleConfirmMinMax`, ~lines 185–218)

**Interfaces:**
- Consumes: `addTemplateItem` returning `items`; dialog `onConfirm` with `count`
- Produces: editor appends all created items to local template state

- [ ] **Step 1: Update confirm handler**

Replace `handleConfirmMinMax` with:

```ts
  async function handleConfirmMinMax({
    min,
    max,
    count,
  }: {
    min: number;
    max: number;
    count: number;
  }): Promise<boolean> {
    if (!selected || !pendingDrop) return false;
    setBusy(true);
    try {
      const result = await addTemplateItem({
        templateId: selected.id,
        boxId: pendingDrop.boxId,
        problemTypeId: pendingDrop.problemTypeId,
        min,
        max,
        count,
      });
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, items: [...t.items, ...result.items] }
            : t,
        ),
      );
      setPendingDrop(null);
      return true;
    } finally {
      setBusy(false);
    }
  }
```

- [ ] **Step 2: Verify typecheck and unit tests**

Run:

```bash
npx tsc --noEmit
npm test -- lib/validations/template.test.ts
```

Expected: both PASS (no remaining `result.item` / missing `count` errors).

- [ ] **Step 3: Manual smoke (dev server)**

With `npm run dev` running:

1. Open `/templates`
2. Drag a problem type onto a box; leave Count = 1 → one item appears
3. Drag again; set Count = 5 → five items appear in that box with the same min/max
4. Confirm reorder/remove still work on individual items

- [ ] **Step 4: Commit**

```bash
git add components/templates/templates-editor.tsx
git commit -m "feat: place N template items from drop count"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Count field default 1 | Task 3 |
| Count 1–50 validation | Task 1 |
| N separate TemplateItems on confirm | Task 2 |
| Fresh props per item + consecutive sortOrder | Task 2 |
| Return / append `items` array | Tasks 2, 4 |
| No Prisma migration | (none) |
| Dialog errors stay in dialog; server toast | Tasks 3–4 (existing patterns) |
| Unit tests for count bounds | Task 1 |
