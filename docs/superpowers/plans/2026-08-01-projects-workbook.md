# Projects Workbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Projects as workbooks: ordered template sections with page counts (frozen snapshots), Generate that persists letter-page previews with fresh random props from stored ranges, and in-app scroll preview. No PDF.

**Architecture:** Extend `TemplateItem` with `rangeMin`/`rangeMax`. Add `Project` → `ProjectSection` (JSON snapshot) → `GeneratedPage` (concrete items). Pure helpers build snapshots, fingerprints, and randomized page items. Server actions mirror Templates patterns. Client composer: list · accordion sections · Generate · scrollable `LetterShell` + read-only worksheet view.

**Tech Stack:** Next.js App Router, Prisma/Postgres, Zod, Vitest, Tailwind, existing `LetterShell` / problem registry / `randomIntInRange`

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-01-projects-workbook-design.md`
- Template as recipe; Generate uses **fresh** random props from snapshot ranges
- Snapshot frozen at **Add section** time (not live template)
- Persist last generation; regenerate **replaces** prior pages
- `pageCount` ∈ **[1, 50]** per section
- Banner/hint when composition changed since last generate (non-blocking)
- **Block Add section** if any template item lacks ranges; Generate also validates ranges
- Empty template (no items): **allow** section → blank letter pages
- No PDF export in this change (omit Export PDF button)
- Selection: client state on `/projects` (like Templates)
- Postgres on host port **5433** (existing)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | `rangeMin`/`rangeMax` on TemplateItem; Project, ProjectSection, GeneratedPage |
| `lib/projects/snapshot.ts` | `buildTemplateSnapshot`, types |
| `lib/projects/snapshot.test.ts` | Snapshot + range checks |
| `lib/projects/generate-props.ts` | `propsFromRange(problemTypeId, min, max)` |
| `lib/projects/generate-props.test.ts` | Props strategy tests |
| `lib/projects/fingerprint.ts` | `compositionFingerprint(sections)` |
| `lib/projects/fingerprint.test.ts` | Fingerprint stability |
| `lib/validations/project.ts` | Zod for create, pageCount, reorder, etc. |
| `lib/validations/project.test.ts` | Zod tests |
| `lib/actions/templates.ts` | Persist ranges on add item; expose ranges in map |
| `lib/actions/projects.ts` | CRUD sections, generate, delete project |
| `components/worksheets/worksheet-page-view.tsx` | Read-only layout + problems (no DnD) |
| `components/projects/projects-editor.tsx` | List + accordion + Generate + preview |
| `app/(app)/projects/page.tsx` | Load projects → editor |

---

### Task 1: Persist ranges on TemplateItem

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/actions/templates.ts` (`addTemplateItem`, `mapTemplate`, `TemplateWithItems`)
- Migration via `npx prisma migrate`

**Interfaces:**
- Produces: `TemplateItem.rangeMin Int?`, `rangeMax Int?`; `TemplateWithItems.items[].rangeMin/rangeMax: number | null`

- [ ] **Step 1: Update Prisma model**

On `TemplateItem` add:

```prisma
  rangeMin      Int?
  rangeMax      Int?
```

On `User` add:

```prisma
  projects      Project[]
```

(Do **not** add Project models yet — only User relation placeholder would fail. Skip User.projects until Task 3. **Only** add range fields in this task.)

- [ ] **Step 2: Migrate**

```bash
npx prisma migrate dev --name template_item_ranges
npx prisma generate
```

Expected: migration applied; client has `rangeMin`/`rangeMax`.

- [ ] **Step 3: Update `TemplateWithItems` and `mapTemplate`**

In `lib/actions/templates.ts`, extend item type and mapping:

```ts
items: {
  id: string;
  boxId: string;
  problemTypeId: string;
  props: unknown;
  sortOrder: number;
  rangeMin: number | null;
  rangeMax: number | null;
}[];
```

Map `rangeMin: item.rangeMin`, `rangeMax: item.rangeMax`.

- [ ] **Step 4: Persist ranges in `addTemplateItem`**

When creating the item, set:

```ts
rangeMin: min,
rangeMax: max,
```

alongside `props`.

- [ ] **Step 5: Run focused checks**

```bash
npx vitest run lib/validations/template.test.ts lib/random.test.ts
npx tsc --noEmit
```

Expected: pass (or fix type errors from TemplateWithItems consumers).

- [ ] **Step 6: Commit**

```bash
git add prisma lib/actions/templates.ts
git commit -m "feat: store min/max ranges on template items"
```

---

### Task 2: Snapshot + generate-props helpers

**Files:**
- Create: `lib/projects/snapshot.ts`
- Create: `lib/projects/snapshot.test.ts`
- Create: `lib/projects/generate-props.ts`
- Create: `lib/projects/generate-props.test.ts`

**Interfaces:**
- Produces:
  - `TemplateSnapshot` type
  - `buildTemplateSnapshot(template): TemplateSnapshot`
  - `assertSnapshotRanges(snapshot): { ok: true } | { ok: false; error: string }`
  - `propsFromRange(problemTypeId, rangeMin, rangeMax): Record<string, number>`

- [ ] **Step 1: Write failing tests**

`lib/projects/snapshot.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  assertSnapshotRanges,
  buildTemplateSnapshot,
} from "./snapshot";

describe("buildTemplateSnapshot", () => {
  it("copies name, layout, and item ranges without concrete props", () => {
    const snap = buildTemplateSnapshot({
      name: "Addition practice",
      layoutId: "two-columns",
      items: [
        {
          boxId: "col-left",
          problemTypeId: "addition-blank",
          sortOrder: 0,
          rangeMin: 1,
          rangeMax: 10,
          props: { a: 3, b: 5 },
        },
      ],
    });
    expect(snap).toEqual({
      templateName: "Addition practice",
      layoutId: "two-columns",
      items: [
        {
          boxId: "col-left",
          problemTypeId: "addition-blank",
          sortOrder: 0,
          rangeMin: 1,
          rangeMax: 10,
        },
      ],
    });
  });
});

describe("assertSnapshotRanges", () => {
  it("rejects missing ranges", () => {
    const result = assertSnapshotRanges({
      templateName: "T",
      layoutId: "two-columns",
      items: [
        {
          boxId: "col-left",
          problemTypeId: "addition-blank",
          sortOrder: 0,
          rangeMin: null as unknown as number,
          rangeMax: 10,
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("accepts empty items", () => {
    expect(
      assertSnapshotRanges({
        templateName: "Empty",
        layoutId: "two-columns",
        items: [],
      }).ok,
    ).toBe(true);
  });
});
```

`lib/projects/generate-props.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { propsFromRange } from "./generate-props";

describe("propsFromRange", () => {
  it("returns a and b within range for addition-blank", () => {
    for (let i = 0; i < 20; i++) {
      const props = propsFromRange("addition-blank", 2, 4);
      expect(props.a).toBeGreaterThanOrEqual(2);
      expect(props.a).toBeLessThanOrEqual(4);
      expect(props.b).toBeGreaterThanOrEqual(2);
      expect(props.b).toBeLessThanOrEqual(4);
    }
  });

  it("throws for unknown problem type", () => {
    expect(() => propsFromRange("nope", 1, 5)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run lib/projects/snapshot.test.ts lib/projects/generate-props.test.ts
```

- [ ] **Step 3: Implement**

`lib/projects/snapshot.ts`:

```ts
export type SnapshotItem = {
  boxId: string;
  problemTypeId: string;
  sortOrder: number;
  rangeMin: number;
  rangeMax: number;
};

export type TemplateSnapshot = {
  templateName: string;
  layoutId: string;
  items: SnapshotItem[];
};

export function buildTemplateSnapshot(template: {
  name: string;
  layoutId: string;
  items: {
    boxId: string;
    problemTypeId: string;
    sortOrder: number;
    rangeMin: number | null;
    rangeMax: number | null;
    props?: unknown;
  }[];
}): TemplateSnapshot {
  return {
    templateName: template.name,
    layoutId: template.layoutId,
    items: template.items
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        boxId: item.boxId,
        problemTypeId: item.problemTypeId,
        sortOrder: item.sortOrder,
        rangeMin: item.rangeMin as number,
        rangeMax: item.rangeMax as number,
      })),
  };
}

export function assertSnapshotRanges(
  snapshot: TemplateSnapshot,
): { ok: true } | { ok: false; error: string } {
  for (const item of snapshot.items) {
    if (
      typeof item.rangeMin !== "number" ||
      typeof item.rangeMax !== "number" ||
      !Number.isInteger(item.rangeMin) ||
      !Number.isInteger(item.rangeMax) ||
      item.rangeMin > item.rangeMax
    ) {
      return {
        ok: false,
        error: "Every problem needs a min/max range. Re-add problems on the template.",
      };
    }
  }
  return { ok: true };
}

/** True when every item has non-null integer ranges with min ≤ max. */
export function templateItemsHaveRanges(
  items: { rangeMin: number | null; rangeMax: number | null }[],
): boolean {
  return items.every(
    (item) =>
      typeof item.rangeMin === "number" &&
      typeof item.rangeMax === "number" &&
      Number.isInteger(item.rangeMin) &&
      Number.isInteger(item.rangeMax) &&
      item.rangeMin <= item.rangeMax,
  );
}
```

Note: `buildTemplateSnapshot` should only be called after `templateItemsHaveRanges` passes so casts are safe. Optionally filter/validate inside builder and throw — prefer validate before call in actions.

`lib/projects/generate-props.ts`:

```ts
import { randomIntInRange } from "@/lib/random";

export function propsFromRange(
  problemTypeId: string,
  rangeMin: number,
  rangeMax: number,
): Record<string, number> {
  if (problemTypeId === "addition-blank") {
    return {
      a: randomIntInRange(rangeMin, rangeMax),
      b: randomIntInRange(rangeMin, rangeMax),
    };
  }
  throw new Error(`Unsupported problem type: ${problemTypeId}`);
}
```

Fix snapshot builder to only include items that already have ranges — for the test with valid ranges, map without cast:

```ts
items: template.items
  .slice()
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((item) => {
    if (item.rangeMin == null || item.rangeMax == null) {
      throw new Error("Missing ranges");
    }
    return {
      boxId: item.boxId,
      problemTypeId: item.problemTypeId,
      sortOrder: item.sortOrder,
      rangeMin: item.rangeMin,
      rangeMax: item.rangeMax,
    };
  }),
```

Adjust `assertSnapshotRanges` test: build a valid snapshot then mutate, or pass a crafted object. For “missing ranges” test, use type assertion or a partial object cast to `TemplateSnapshot`.

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run lib/projects/snapshot.test.ts lib/projects/generate-props.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/projects
git commit -m "feat: add template snapshot and generate-props helpers"
```

---

### Task 3: Prisma Project models

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Project`, `ProjectSection`, `GeneratedPage`; `User.projects`

- [ ] **Step 1: Add models**

```prisma
model Project {
  id                     String           @id @default(cuid())
  userId                 String
  name                   String
  lastGeneratedFingerprint String?
  createdAt              DateTime         @default(now())
  updatedAt              DateTime         @updatedAt
  user                   User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  sections               ProjectSection[]
  pages                  GeneratedPage[]

  @@index([userId])
}

model ProjectSection {
  id               String   @id @default(cuid())
  projectId        String
  sortOrder        Int
  pageCount        Int
  templateSnapshot Json
  sourceTemplateId String?
  project          Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  pages            GeneratedPage[]

  @@index([projectId, sortOrder])
}

model GeneratedPage {
  id        String         @id @default(cuid())
  projectId String
  sectionId String
  pageIndex Int
  layoutId  String
  items     Json
  project   Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  section   ProjectSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)

  @@index([projectId, pageIndex])
}
```

Add `projects Project[]` on `User`.

`pageIndex` is **global** within the project (0-based), ordered by section `sortOrder` then page within section.

- [ ] **Step 2: Migrate**

```bash
npx prisma migrate dev --name add_projects
npx prisma generate
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add prisma
git commit -m "feat: add Project, ProjectSection, and GeneratedPage models"
```

---

### Task 4: Project validations + fingerprint

**Files:**
- Create: `lib/validations/project.ts`
- Create: `lib/validations/project.test.ts`
- Create: `lib/projects/fingerprint.ts`
- Create: `lib/projects/fingerprint.test.ts`

**Interfaces:**
- Produces:
  - `pageCountSchema`, `createProjectSchema`, `addSectionSchema`, `updateSectionPageCountSchema`, `reorderSectionsSchema`
  - `compositionFingerprint(sections: { id: string; pageCount: number; sortOrder: number }[]): string`

- [ ] **Step 1: Write failing tests**

```ts
// lib/validations/project.test.ts
import { describe, expect, it } from "vitest";
import { pageCountSchema } from "./project";

describe("pageCountSchema", () => {
  it("accepts 1 and 50", () => {
    expect(pageCountSchema.parse(1)).toBe(1);
    expect(pageCountSchema.parse(50)).toBe(50);
  });

  it("rejects 0 and 51", () => {
    expect(() => pageCountSchema.parse(0)).toThrow();
    expect(() => pageCountSchema.parse(51)).toThrow();
  });
});
```

```ts
// lib/projects/fingerprint.test.ts
import { describe, expect, it } from "vitest";
import { compositionFingerprint } from "./fingerprint";

describe("compositionFingerprint", () => {
  it("is stable for same composition", () => {
    const sections = [
      { id: "a", pageCount: 5, sortOrder: 0 },
      { id: "b", pageCount: 2, sortOrder: 1 },
    ];
    expect(compositionFingerprint(sections)).toBe(
      compositionFingerprint(sections),
    );
  });

  it("changes when pageCount changes", () => {
    const a = compositionFingerprint([
      { id: "a", pageCount: 5, sortOrder: 0 },
    ]);
    const b = compositionFingerprint([
      { id: "a", pageCount: 6, sortOrder: 0 },
    ]);
    expect(a).not.toBe(b);
  });

  it("changes when order changes", () => {
    const a = compositionFingerprint([
      { id: "x", pageCount: 1, sortOrder: 0 },
      { id: "y", pageCount: 1, sortOrder: 1 },
    ]);
    const b = compositionFingerprint([
      { id: "y", pageCount: 1, sortOrder: 0 },
      { id: "x", pageCount: 1, sortOrder: 1 },
    ]);
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run lib/validations/project.test.ts lib/projects/fingerprint.test.ts
```

- [ ] **Step 3: Implement**

```ts
// lib/validations/project.ts
import { z } from "zod";

export const pageCountSchema = z.coerce.number().int().min(1).max(50);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const addSectionSchema = z.object({
  projectId: z.string().min(1),
  templateId: z.string().min(1),
  pageCount: pageCountSchema.default(1),
});

export const updateSectionPageCountSchema = z.object({
  sectionId: z.string().min(1),
  pageCount: pageCountSchema,
});

export const reorderSectionsSchema = z.object({
  projectId: z.string().min(1),
  sectionIds: z.array(z.string().min(1)).min(1),
});

export const removeSectionSchema = z.object({
  sectionId: z.string().min(1),
});

export const generateProjectSchema = z.object({
  projectId: z.string().min(1),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().min(1),
});
```

```ts
// lib/projects/fingerprint.ts
export function compositionFingerprint(
  sections: { id: string; pageCount: number; sortOrder: number }[],
): string {
  const normalized = sections
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => `${s.id}:${s.pageCount}`)
    .join("|");
  return normalized;
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run lib/validations/project.test.ts lib/projects/fingerprint.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/validations/project.ts lib/validations/project.test.ts lib/projects/fingerprint.ts lib/projects/fingerprint.test.ts
git commit -m "feat: add project validations and composition fingerprint"
```

---

### Task 5: Project server actions

**Files:**
- Create: `lib/actions/projects.ts`

**Interfaces:**
- Consumes: snapshot helpers, fingerprint, validations, prisma, auth, `propsFromRange`
- Produces:
  - `ProjectWithDetails` type
  - `listProjects`, `createProject`, `deleteProject`
  - `addProjectSection`, `updateSectionPageCount`, `reorderProjectSections`, `removeProjectSection`
  - `generateProject`

- [ ] **Step 1: Implement `lib/actions/projects.ts`**

Follow Templates action patterns (`requireUserId`, `{ ok, error }` / `{ ok, ... }`).

```ts
"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compositionFingerprint } from "@/lib/projects/fingerprint";
import { propsFromRange } from "@/lib/projects/generate-props";
import {
  assertSnapshotRanges,
  buildTemplateSnapshot,
  templateItemsHaveRanges,
  type TemplateSnapshot,
} from "@/lib/projects/snapshot";
import {
  addSectionSchema,
  createProjectSchema,
  deleteProjectSchema,
  generateProjectSchema,
  removeSectionSchema,
  reorderSectionsSchema,
  updateSectionPageCountSchema,
} from "@/lib/validations/project";

export type GeneratedPageItem = {
  boxId: string;
  problemTypeId: string;
  sortOrder: number;
  props: Record<string, number>;
};

export type ProjectWithDetails = {
  id: string;
  name: string;
  lastGeneratedFingerprint: string | null;
  sections: {
    id: string;
    sortOrder: number;
    pageCount: number;
    templateSnapshot: TemplateSnapshot;
    sourceTemplateId: string | null;
  }[];
  pages: {
    id: string;
    sectionId: string;
    pageIndex: number;
    layoutId: string;
    items: GeneratedPageItem[];
  }[];
};

const UNEXPECTED = "Something went wrong";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function parseSnapshot(raw: unknown): TemplateSnapshot {
  return raw as TemplateSnapshot;
}

function mapProject(project: {
  id: string;
  name: string;
  lastGeneratedFingerprint: string | null;
  sections: {
    id: string;
    sortOrder: number;
    pageCount: number;
    templateSnapshot: unknown;
    sourceTemplateId: string | null;
  }[];
  pages: {
    id: string;
    sectionId: string;
    pageIndex: number;
    layoutId: string;
    items: unknown;
  }[];
}): ProjectWithDetails {
  return {
    id: project.id,
    name: project.name,
    lastGeneratedFingerprint: project.lastGeneratedFingerprint,
    sections: project.sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: s.id,
        sortOrder: s.sortOrder,
        pageCount: s.pageCount,
        templateSnapshot: parseSnapshot(s.templateSnapshot),
        sourceTemplateId: s.sourceTemplateId,
      })),
    pages: project.pages
      .slice()
      .sort((a, b) => a.pageIndex - b.pageIndex)
      .map((p) => ({
        id: p.id,
        sectionId: p.sectionId,
        pageIndex: p.pageIndex,
        layoutId: p.layoutId,
        items: p.items as GeneratedPageItem[],
      })),
  };
}

async function loadProjectForUser(
  projectId: string,
  userId: string,
): Promise<ProjectWithDetails | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: { sections: true, pages: true },
  });
  return project ? mapProject(project) : null;
}

export async function listProjects(): Promise<ProjectWithDetails[]> {
  const userId = await requireUserId();
  if (!userId) return [];
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { sections: true, pages: true },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map(mapProject);
}

export async function createProject(
  input?: { name?: string },
): Promise<{ ok: true; project: ProjectWithDetails } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = createProjectSchema.safeParse(input ?? {});
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  try {
    const project = await prisma.project.create({
      data: {
        userId,
        name: parsed.data.name ?? "Untitled project",
      },
      include: { sections: true, pages: true },
    });
    return { ok: true, project: mapProject(project) };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function deleteProject(
  input: { projectId: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = deleteProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  try {
    const result = await prisma.project.deleteMany({
      where: { id: parsed.data.projectId, userId },
    });
    if (result.count === 0) return { ok: false, error: UNEXPECTED };
    return { ok: true };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function addProjectSection(
  input: { projectId: string; templateId: string; pageCount?: number },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = addSectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      include: { sections: true },
    });
    if (!project) return { ok: false, error: UNEXPECTED };

    const template = await prisma.template.findFirst({
      where: { id: parsed.data.templateId, userId },
      include: { items: true },
    });
    if (!template) return { ok: false, error: "Template not found" };

    if (!templateItemsHaveRanges(template.items)) {
      return {
        ok: false,
        error:
          "This template has problems without min/max ranges. Re-add those problems on the Templates page.",
      };
    }

    const snapshot = buildTemplateSnapshot(template);
    const ranges = assertSnapshotRanges(snapshot);
    if (!ranges.ok) return { ok: false, error: ranges.error };

    const maxOrder = project.sections.reduce(
      (m, s) => Math.max(m, s.sortOrder),
      -1,
    );

    await prisma.projectSection.create({
      data: {
        projectId: project.id,
        sortOrder: maxOrder + 1,
        pageCount: parsed.data.pageCount,
        templateSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        sourceTemplateId: template.id,
      },
    });

    const updated = await loadProjectForUser(project.id, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function updateSectionPageCount(
  input: { sectionId: string; pageCount: number },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = updateSectionPageCountSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid page count" };

  try {
    const section = await prisma.projectSection.findFirst({
      where: { id: parsed.data.sectionId, project: { userId } },
    });
    if (!section) return { ok: false, error: UNEXPECTED };

    await prisma.projectSection.update({
      where: { id: section.id },
      data: { pageCount: parsed.data.pageCount },
    });

    const updated = await loadProjectForUser(section.projectId, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function reorderProjectSections(
  input: { projectId: string; sectionIds: string[] },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = reorderSectionsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      include: { sections: true },
    });
    if (!project) return { ok: false, error: UNEXPECTED };

    const ids = new Set(project.sections.map((s) => s.id));
    if (
      parsed.data.sectionIds.length !== ids.size ||
      !parsed.data.sectionIds.every((id) => ids.has(id))
    ) {
      return { ok: false, error: UNEXPECTED };
    }

    await prisma.$transaction(
      parsed.data.sectionIds.map((id, sortOrder) =>
        prisma.projectSection.update({
          where: { id },
          data: { sortOrder },
        }),
      ),
    );

    const updated = await loadProjectForUser(project.id, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function removeProjectSection(
  input: { sectionId: string },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = removeSectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: UNEXPECTED };

  try {
    const section = await prisma.projectSection.findFirst({
      where: { id: parsed.data.sectionId, project: { userId } },
    });
    if (!section) return { ok: false, error: UNEXPECTED };

    await prisma.projectSection.delete({ where: { id: section.id } });

    const updated = await loadProjectForUser(section.projectId, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}

export async function generateProject(
  input: { projectId: string },
): Promise<
  | { ok: true; project: ProjectWithDetails }
  | { ok: false; error: string }
> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: UNEXPECTED };
  const parsed = generateProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: UNEXPECTED };

  try {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      include: { sections: true },
    });
    if (!project) return { ok: false, error: UNEXPECTED };
    if (project.sections.length === 0) {
      return { ok: false, error: "Add at least one section before generating" };
    }

    const sections = project.sections
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const section of sections) {
      const snapshot = parseSnapshot(section.templateSnapshot);
      const check = assertSnapshotRanges(snapshot);
      if (!check.ok) return { ok: false, error: check.error };
    }

    const pagesData: {
      projectId: string;
      sectionId: string;
      pageIndex: number;
      layoutId: string;
      items: Prisma.InputJsonValue;
    }[] = [];

    let pageIndex = 0;
    for (const section of sections) {
      const snapshot = parseSnapshot(section.templateSnapshot);
      for (let n = 0; n < section.pageCount; n++) {
        const items = snapshot.items.map((item) => ({
          boxId: item.boxId,
          problemTypeId: item.problemTypeId,
          sortOrder: item.sortOrder,
          props: propsFromRange(
            item.problemTypeId,
            item.rangeMin,
            item.rangeMax,
          ),
        }));
        pagesData.push({
          projectId: project.id,
          sectionId: section.id,
          pageIndex,
          layoutId: snapshot.layoutId,
          items: items as unknown as Prisma.InputJsonValue,
        });
        pageIndex += 1;
      }
    }

    const fingerprint = compositionFingerprint(
      sections.map((s) => ({
        id: s.id,
        pageCount: s.pageCount,
        sortOrder: s.sortOrder,
      })),
    );

    await prisma.$transaction([
      prisma.generatedPage.deleteMany({ where: { projectId: project.id } }),
      prisma.generatedPage.createMany({ data: pagesData }),
      prisma.project.update({
        where: { id: project.id },
        data: { lastGeneratedFingerprint: fingerprint },
      }),
    ]);

    const updated = await loadProjectForUser(project.id, userId);
    if (!updated) return { ok: false, error: UNEXPECTED };
    return { ok: true, project: updated };
  } catch {
    return { ok: false, error: UNEXPECTED };
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/projects.ts
git commit -m "feat: add project server actions for sections and generate"
```

---

### Task 6: Read-only worksheet page view

**Files:**
- Create: `components/worksheets/worksheet-page-view.tsx`
- Create: `components/worksheets/worksheet-page-view.test.ts`

**Interfaces:**
- Consumes: `getLayout`, `getLayoutClassName`, `problemTypes`
- Produces: `WorksheetPageView({ layoutId, items })` — no DnD, no remove

- [ ] **Step 1: Write smoke test**

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorksheetPageView } from "./worksheet-page-view";

describe("WorksheetPageView", () => {
  it("renders addition problem without inputs or drag handles", () => {
    const html = renderToStaticMarkup(
      createElement(WorksheetPageView, {
        layoutId: "two-columns",
        items: [
          {
            boxId: "col-left",
            problemTypeId: "addition-blank",
            sortOrder: 0,
            props: { a: 2, b: 7 },
          },
        ],
      }),
    );
    expect(html).toContain("2");
    expect(html).toContain("7");
    expect(html.toLowerCase()).not.toContain("<input");
    expect(html).not.toContain("data-drag-handle");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run components/worksheets/worksheet-page-view.test.ts
```

- [ ] **Step 3: Implement**

```tsx
import { problemTypes } from "@/components/problems/registry";
import {
  getLayout,
  getLayoutClassName,
} from "@/components/templates/layouts";

export type WorksheetViewItem = {
  boxId: string;
  problemTypeId: string;
  sortOrder: number;
  props: Record<string, unknown>;
};

export function WorksheetPageView({
  layoutId,
  items,
}: {
  layoutId: string;
  items: WorksheetViewItem[];
}) {
  const layout = getLayout(layoutId);

  return (
    <div className={getLayoutClassName(layout.id)}>
      {layout.boxes.map((box) => {
        const boxItems = items
          .filter((item) => item.boxId === box.id)
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <div key={box.id} className="min-h-24 p-2">
            <ul className="flex flex-col gap-2">
              {boxItems.map((item, index) => {
                const problemType = problemTypes.find(
                  (p) => p.id === item.problemTypeId,
                );
                const Component = problemType?.Component;
                if (!Component) return null;
                return (
                  <li key={`${item.boxId}-${item.sortOrder}-${index}`}>
                    <Component {...(item.props as object)} />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
```

Use solid borders omitted (no dashed drop targets) — clean print-like cells.

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run components/worksheets/worksheet-page-view.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/worksheets
git commit -m "feat: add read-only worksheet page view"
```

---

### Task 7: Projects editor UI

**Files:**
- Create: `components/projects/projects-editor.tsx`
- Modify: `app/(app)/projects/page.tsx`

**Interfaces:**
- Consumes: all project actions, `LetterShell`, `WorksheetPageView`, `compositionFingerprint`, `list` of templates for Add section (pass `templates: { id, name }[]` from page)

- [ ] **Step 1: Replace projects page**

```tsx
// app/(app)/projects/page.tsx
import { ProjectsEditor } from "@/components/projects/projects-editor";
import { listProjects } from "@/lib/actions/projects";
import { ensureSampleTemplate } from "@/lib/actions/templates";

export default async function ProjectsPage() {
  const [projects, templates] = await Promise.all([
    listProjects(),
    ensureSampleTemplate(),
  ]);

  return (
    <ProjectsEditor
      initialProjects={projects}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
```

- [ ] **Step 2: Implement `ProjectsEditor`**

Client component structure (mirror TemplatesEditor patterns: local state, toast errors, busy flag):

1. **Left column (~220px):** project list + New project + Delete (optional on selected)
2. **Middle-left / accordion column (~260px):** when project selected — sections accordion:
   - Header: `templateSnapshot.templateName` + `×{pageCount}`
   - Expand: number input for page count (blur/change → `updateSectionPageCount`)
   - Up/Down buttons → `reorderProjectSections` with swapped order
   - Remove button → `removeProjectSection`
   - Add section: `<select>` of `templates` + Add button → `addProjectSection` (default pageCount 1)
3. **Center:** 
   - **Generate** button (disabled if no sections)
   - If `pages.length === 0`: empty message “Generate to preview pages”
   - Else: for each page in `pageIndex` order, wrap `LetterShell` + `WorksheetPageView`
   - Stale hint when:
     ```ts
     const current = compositionFingerprint(selected.sections);
     const stale =
       selected.pages.length > 0 &&
       selected.lastGeneratedFingerprint !== null &&
       selected.lastGeneratedFingerprint !== current;
     ```
     Copy: **Preview may be stale — generate again**
4. After each successful action, `setProjects` replacing the updated project by id

Use simple expand state: `expandedSectionId: string | null` (no new accordion package).

Do **not** add an Export PDF button.

Keep `LetterShell` without forcing overflow banner wiring unless trivial (`onOverflowChange` optional).

- [ ] **Step 3: Manual check**

With `npm run dev`:

1. Open Projects → New project  
2. Add section from “Addition practice” (template must have ranged items — create fresh drops if needed)  
3. Set page count 2, add another section or same again, reorder  
4. Generate → see letter pages with different numbers  
5. Change page count → stale hint → Generate again  

- [ ] **Step 4: Full test suite**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/(app)/projects/page.tsx components/projects/projects-editor.tsx
git commit -m "feat: add projects workbook composer with generate preview"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| rangeMin/rangeMax on template items | Task 1 |
| Snapshot at add; frozen | Tasks 2, 5 |
| Block add without ranges | Task 5 `addProjectSection` |
| Project / Section / GeneratedPage | Task 3 |
| pageCount 1–50 | Task 4 |
| Reorder / remove / add sections | Task 5–7 |
| Generate fresh props, replace pages | Task 5 |
| Global pageIndex order | Task 5 |
| Persist generation + preview | Tasks 5–7 |
| Stale fingerprint hint | Tasks 4, 7 |
| Empty template allowed | Task 2 assert + Task 5 |
| No PDF | Task 7 |
| Read-only letter pages | Task 6–7 |
| Delete project | Task 5–7 |

No TBD placeholders; names (`buildTemplateSnapshot`, `compositionFingerprint`, `generateProject`, `WorksheetPageView`, `lastGeneratedFingerprint`) are consistent across tasks.
