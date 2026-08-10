# Project Page Backgrounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let teachers pick a worksheet page background (Blank or Kids frame) on project detail, persist it on the project, and show it in preview and PDF/PNG exports (worksheets only).

**Architecture:** Code registry (`SHEET_BACKGROUNDS`) mirrors sheet-header locales. `Project.backgroundId` stores the choice. `LetterShell` applies image + optional border hiding. Answer-key pages force blank. Exports inherit via DOM capture.

**Tech Stack:** Next.js App Router, Prisma/Postgres, Zod, Vitest, existing `LetterShell` / projects editor patterns.

## Global Constraints

- Worksheet pages only; answer keys always blank background
- Persist on project; used for full PDF, sections PDF, cover PNG
- Themed bg: hide black page outline; keep `0.5in` content padding in v1
- Unknown `backgroundId` → fall back to `blank`
- Asset path: `/backgrounds/kids-frame.png` under `public/`

## File map

| File | Responsibility |
|------|----------------|
| `lib/sheet-backgrounds.ts` | Registry + helpers |
| `lib/sheet-backgrounds.test.ts` | Registry tests |
| `public/backgrounds/kids-frame.png` | Kids frame asset |
| `prisma/schema.prisma` | `Project.backgroundId` |
| `lib/validations/project.ts` | `updateProjectBackgroundSchema` |
| `lib/actions/projects.ts` | Map field + `updateProjectBackground` |
| `components/templates/letter-shell.tsx` | Apply background visually |
| `components/templates/letter-shell.test.ts` | Border / image assertions |
| `components/projects/projects-editor.tsx` | Dropdown + pass prop on worksheets |

---

### Task 1: Background registry + asset

**Files:**
- Create: `lib/sheet-backgrounds.ts`
- Create: `lib/sheet-backgrounds.test.ts`
- Create: `public/backgrounds/kids-frame.png` (copy from chat attachment `math_background-….png`; if missing, ask user to re-attach)

**Interfaces:**
- Produces: `SHEET_BACKGROUNDS`, `SheetBackgroundId`, `DEFAULT_SHEET_BACKGROUND_ID`, `SHEET_BACKGROUND_OPTIONS`, `isSheetBackgroundId`, `getSheetBackground`

- [ ] **Step 1: Write the failing test**

```ts
// lib/sheet-backgrounds.test.ts
import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHEET_BACKGROUND_ID,
  SHEET_BACKGROUNDS,
  getSheetBackground,
  isSheetBackgroundId,
} from "./sheet-backgrounds";

describe("sheet backgrounds", () => {
  it("defaults to blank", () => {
    expect(DEFAULT_SHEET_BACKGROUND_ID).toBe("blank");
    expect(getSheetBackground().src).toBeNull();
    expect(getSheetBackground().showPageBorder).toBe(true);
  });

  it("includes kids-frame without page border", () => {
    expect(SHEET_BACKGROUNDS["kids-frame"]).toMatchObject({
      id: "kids-frame",
      label: "Kids frame",
      src: "/backgrounds/kids-frame.png",
      showPageBorder: false,
    });
  });

  it("falls back to blank for unknown ids", () => {
    expect(getSheetBackground("nope" as "blank").id).toBe("blank");
  });

  it("validates ids", () => {
    expect(isSheetBackgroundId("blank")).toBe(true);
    expect(isSheetBackgroundId("kids-frame")).toBe(true);
    expect(isSheetBackgroundId("x")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/sheet-backgrounds.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement registry**

```ts
// lib/sheet-backgrounds.ts
export const SHEET_BACKGROUNDS = {
  blank: {
    id: "blank",
    label: "Blank",
    src: null as string | null,
    showPageBorder: true,
  },
  "kids-frame": {
    id: "kids-frame",
    label: "Kids frame",
    src: "/backgrounds/kids-frame.png",
    showPageBorder: false,
  },
} as const;

export type SheetBackgroundId = keyof typeof SHEET_BACKGROUNDS;
export type SheetBackground = (typeof SHEET_BACKGROUNDS)[SheetBackgroundId];

export const DEFAULT_SHEET_BACKGROUND_ID: SheetBackgroundId = "blank";

export const SHEET_BACKGROUND_OPTIONS = Object.values(
  SHEET_BACKGROUNDS,
) as SheetBackground[];

export function isSheetBackgroundId(value: string): value is SheetBackgroundId {
  return value in SHEET_BACKGROUNDS;
}

export function getSheetBackground(
  id: SheetBackgroundId | string = DEFAULT_SHEET_BACKGROUND_ID,
): SheetBackground {
  if (isSheetBackgroundId(id)) return SHEET_BACKGROUNDS[id];
  return SHEET_BACKGROUNDS.blank;
}
```

Fix the fallback test to call `getSheetBackground("nope")` with a `string` param (signature above accepts `string`).

- [ ] **Step 4: Copy asset**

```powershell
New-Item -ItemType Directory -Force -Path public/backgrounds
# Copy from Cursor assets path if present; otherwise ask user to drop the PNG again
Copy-Item "<source-math_background.png>" public/backgrounds/kids-frame.png
```

Confirm: `Test-Path public/backgrounds/kids-frame.png` → `True`

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/sheet-backgrounds.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/sheet-backgrounds.ts lib/sheet-backgrounds.test.ts public/backgrounds/kids-frame.png
git commit -m "feat: add sheet background registry and kids-frame asset"
```

---

### Task 2: Prisma field + validation + update action

**Files:**
- Modify: `prisma/schema.prisma` (`Project` model)
- Modify: `lib/validations/project.ts`
- Modify: `lib/validations/project.test.ts` (if present; else add cases)
- Modify: `lib/actions/projects.ts` (`ProjectWithDetails`, `mapProject`, `updateProjectBackground`)

**Interfaces:**
- Consumes: `isSheetBackgroundId` / `SheetBackgroundId` from Task 1
- Produces: `updateProjectBackground({ projectId, backgroundId })` → `{ ok: true, project } | { ok: false, error }`
- Produces: `ProjectWithDetails.backgroundId: string`

- [ ] **Step 1: Add schema field**

In `Project` model add:

```prisma
backgroundId String @default("blank")
```

- [ ] **Step 2: Migrate**

Run: `npx prisma migrate dev --name project_background_id`  
Expected: migration applied; client generated

- [ ] **Step 3: Add Zod schema**

```ts
// lib/validations/project.ts
import { isSheetBackgroundId } from "@/lib/sheet-backgrounds";

export const updateProjectBackgroundSchema = z.object({
  projectId: z.string().min(1),
  backgroundId: z.string().refine(isSheetBackgroundId, {
    message: "Unknown background",
  }),
});
```

- [ ] **Step 4: Extend `ProjectWithDetails` and `mapProject`**

Add `backgroundId: string` to the type and return `{ …, backgroundId: project.backgroundId }` from `mapProject` (ensure Prisma include/select already returns all scalar fields).

- [ ] **Step 5: Implement action** (mirror `updateProjectName`)

```ts
export async function updateProjectBackground(
  input: { projectId: string; backgroundId: string },
): Promise<{ ok: true; project: ProjectWithDetails } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = updateProjectBackgroundSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid background" };
  try {
    const result = await prisma.project.updateMany({
      where: { id: parsed.data.projectId, userId },
      data: { backgroundId: parsed.data.backgroundId },
    });
    if (result.count === 0) return { ok: false, error: UNEXPECTED };
    const project = await loadProjectForUser(parsed.data.projectId, userId);
    if (!project) return { ok: false, error: UNEXPECTED };
    revalidatePath("/projects");
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, project };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}
```

- [ ] **Step 6: Validation unit test**

```ts
import { updateProjectBackgroundSchema } from "./project";

it("accepts blank and kids-frame", () => {
  expect(
    updateProjectBackgroundSchema.safeParse({
      projectId: "p1",
      backgroundId: "kids-frame",
    }).success,
  ).toBe(true);
});

it("rejects unknown background", () => {
  expect(
    updateProjectBackgroundSchema.safeParse({
      projectId: "p1",
      backgroundId: "neon",
    }).success,
  ).toBe(false);
});
```

Run: `npx vitest run lib/validations/project.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add prisma lib/validations/project.ts lib/validations/project.test.ts lib/actions/projects.ts
git commit -m "feat: persist project worksheet backgroundId"
```

---

### Task 3: LetterShell applies background

**Files:**
- Modify: `components/templates/letter-shell.tsx`
- Modify: `components/templates/letter-shell.test.ts`

**Interfaces:**
- Consumes: `getSheetBackground`, `DEFAULT_SHEET_BACKGROUND_ID`, `SheetBackgroundId`
- Produces: `LetterShell` / `LetterShellView` accept optional `backgroundId?: SheetBackgroundId | string`

- [ ] **Step 1: Failing test for kids-frame**

```ts
it("applies kids-frame background and hides black border", () => {
  const html = renderToStaticMarkup(
    createElement(LetterShellView, { backgroundId: "kids-frame" }, "x"),
  );
  expect(html).toContain("/backgrounds/kids-frame.png");
  expect(html).not.toContain("border-2 border-black");
});

it("keeps black border for blank", () => {
  const html = renderToStaticMarkup(
    createElement(LetterShellView, { backgroundId: "blank" }, "x"),
  );
  expect(html).toContain("border-2 border-black");
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run components/templates/letter-shell.test.ts`

- [ ] **Step 3: Implement in `LetterShellView` / `LetterShell`**

- Import `getSheetBackground`, `DEFAULT_SHEET_BACKGROUND_ID`
- Add prop `backgroundId = DEFAULT_SHEET_BACKGROUND_ID`
- `const bg = getSheetBackground(backgroundId)`
- On `.letter-shell` (the scaled sheet): if `bg.src`, set style  
  `backgroundImage: url(...)`, `backgroundSize: "100% 100%"`, `backgroundRepeat: "no-repeat"`
- On silhouette: omit `border-2 border-black` when `!bg.showPageBorder` (keep positioning/`bg-white`)
- Pass `backgroundId` from `LetterShell` → `LetterShellView`
- Keep content `padding: 0.5in`

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run components/templates/letter-shell.test.ts`

- [ ] **Step 5: Commit**

```bash
git add components/templates/letter-shell.tsx components/templates/letter-shell.test.ts
git commit -m "feat: render sheet backgrounds in LetterShell"
```

---

### Task 4: Project detail dropdown + wiring

**Files:**
- Modify: `components/projects/projects-editor.tsx`

**Interfaces:**
- Consumes: `updateProjectBackground`, `SHEET_BACKGROUND_OPTIONS`, `isSheetBackgroundId`, `project.backgroundId`

- [ ] **Step 1: Import action + registry**

```ts
import { updateProjectBackground, … } from "@/lib/actions/projects";
import {
  SHEET_BACKGROUND_OPTIONS,
  isSheetBackgroundId,
} from "@/lib/sheet-backgrounds";
```

- [ ] **Step 2: Add Background `<select>` next to Header**

Same pattern as header locale: label “Background”, options from `SHEET_BACKGROUND_OPTIONS`, `value={project.backgroundId}` (fallback via `getSheetBackground` if needed).

On change:

```ts
async function handleBackgroundChange(next: string) {
  if (!isSheetBackgroundId(next)) return;
  setBusy(true);
  try {
    const result = await updateProjectBackground({
      projectId: project.id,
      backgroundId: next,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setProject(result.project);
  } finally {
    setBusy(false);
  }
}
```

- [ ] **Step 3: Pass background only on worksheets**

```tsx
<LetterShell
  headerLocale={headerLocale}
  backgroundId={project.backgroundId}
>
```

Answer-key `LetterShell`: do **not** pass `backgroundId` (defaults blank).

- [ ] **Step 4: Manual check**

Run: `npm run dev`  
- Open a project → Background → Kids frame → worksheet preview shows frame, no black outline  
- Answer key page stays blank  
- Generate / Export: cover + PDFs show frame on worksheet pages only  

- [ ] **Step 5: Commit**

```bash
git add components/projects/projects-editor.tsx
git commit -m "feat: project background dropdown for worksheets"
```

---

## Spec coverage check

| Spec section | Task |
|--------------|------|
| Registry + helpers | Task 1 |
| Asset `public/backgrounds/kids-frame.png` | Task 1 |
| `Project.backgroundId` + validation | Task 2 |
| `updateProjectBackground` + mapProject | Task 2 |
| LetterShell image + hide border + 0.5in pad | Task 3 |
| Project UI dropdown | Task 4 |
| Worksheets only / answer keys blank | Task 4 |
| Export inherits via DOM | Task 4 (no extra code; verify manually) |
| Templates unchanged | Task 4 (no change) |

## Placeholder / consistency scan

- No TBD steps
- Ids: `blank`, `kids-frame` consistent across registry, Zod, tests, asset path
- Action name `updateProjectBackground` consistent
