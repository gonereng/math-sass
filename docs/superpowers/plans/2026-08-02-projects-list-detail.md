# Projects List & Detail Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split Projects into `/projects` (table) and `/projects/[id]` (composer with preview); New Workbook / New project open the new project’s detail URL.

**Architecture:** Export `getProject(id)` from server actions (wrap existing `loadProjectForUser`). Index page renders a table; detail page loads one project and a refactored `ProjectsEditor` that takes a single project (no left switcher). Create flows navigate to `/projects/${id}`.

**Tech Stack:** Next.js App Router, existing Prisma actions, Vitest for formatting helper

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-02-projects-list-detail-design.md`
- `/projects` = table; `/projects/[id]` = sections + preview + Generate / Export / Delete
- Name column links to detail; create → `/projects/[id]`; delete → `/projects`
- Invalid / non-owned id → `notFound()`
- No rename, search, pagination, bulk delete; do not change Generate/PDF math

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/actions/projects.ts` | Export `getProject`; include `updatedAt` on `ProjectWithDetails` |
| `lib/projects/format-updated-at.ts` | Short date string for table |
| `lib/projects/format-updated-at.test.ts` | Unit tests |
| `components/projects/projects-table.tsx` | Index table + New project |
| `components/projects/projects-editor.tsx` | Single-project composer |
| `components/new-workbook-button.tsx` | Navigate to `/projects/${id}` |
| `app/(app)/projects/page.tsx` | List page |
| `app/(app)/projects/[id]/page.tsx` | Detail page |

---

### Task 1: `getProject` + `updatedAt` on project type

**Files:**
- Modify: `lib/actions/projects.ts`
- Create: `lib/projects/format-updated-at.ts`
- Create: `lib/projects/format-updated-at.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // on ProjectWithDetails:
  updatedAt: string; // ISO string from Date

  export async function getProject(projectId: string): Promise<ProjectWithDetails | null>

  export function formatUpdatedAt(iso: string, now?: Date): string
  // e.g. "Aug 2, 2026" via toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  ```

- [ ] **Step 1: Write formatUpdatedAt tests**

```ts
import { describe, expect, it } from "vitest";
import { formatUpdatedAt } from "./format-updated-at";

describe("formatUpdatedAt", () => {
  it("formats ISO date as short en-US date", () => {
    expect(formatUpdatedAt("2026-08-02T12:00:00.000Z")).toBe("Aug 2, 2026");
  });
});
```

- [ ] **Step 2: Run — expect FAIL** then implement `formatUpdatedAt` and pass

- [ ] **Step 3: Extend `mapProject` / `ProjectWithDetails` with `updatedAt: string` (ISO)** and export:

```ts
export async function getProject(
  projectId: string,
): Promise<ProjectWithDetails | null> {
  const userId = await requireUserId();
  if (!userId) return null;
  return loadProjectForUser(projectId, userId);
}
```

Ensure `listProjects` / create / generate paths still map `updatedAt` from Prisma `updatedAt.toISOString()`.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/projects.ts lib/projects/format-updated-at.ts lib/projects/format-updated-at.test.ts
git commit -m "feat: add getProject and project updatedAt for list view"
```

---

### Task 2: Projects table + index page

**Files:**
- Create: `components/projects/projects-table.tsx`
- Modify: `app/(app)/projects/page.tsx`

**Interfaces:**
- Consumes: `ProjectWithDetails[]`, `createProject`, `formatUpdatedAt`
- Produces: table UI; New project → `/projects/${id}`

- [ ] **Step 1: Implement `ProjectsTable`** — native `<table>` with columns Name (Link), Sections, Pages, Updated; toolbar New project; empty state

- [ ] **Step 2: Index page** — `listProjects()` only (no need for templates); render `ProjectsTable`

- [ ] **Step 3: Manual / smoke** — `/projects` shows rows; empty CTA works

- [ ] **Step 4: Commit** `feat: add projects index table page`

---

### Task 3: Detail editor + `/projects/[id]`

**Files:**
- Modify: `components/projects/projects-editor.tsx`
- Create: `app/(app)/projects/[id]/page.tsx`

**Interfaces:**
- Consumes: `initialProject: ProjectWithDetails`, `templates`
- On delete: `router.push("/projects"); router.refresh()`
- Props change from `initialProjects[]` to single `initialProject`

- [ ] **Step 1: Refactor `ProjectsEditor`**
  - State: `project` (single), not list
  - Remove left project switcher / New project in that column
  - Header: back Link “All projects” + project name + Delete
  - Keep sections + preview + generate/export + print scale effect
  - Mutations update local `project` from action results

- [ ] **Step 2: Detail page**

```tsx
import { notFound } from "next/navigation";
import { ProjectsEditor } from "@/components/projects/projects-editor";
import { getProject } from "@/lib/actions/projects";
import { ensureSampleTemplate } from "@/lib/actions/templates";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, templates] = await Promise.all([
    getProject(id),
    ensureSampleTemplate(),
  ]);
  if (!project) notFound();
  return (
    <ProjectsEditor
      initialProject={project}
      templates={templates.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
```

(Confirm Next.js version params Promise pattern used elsewhere in repo.)

- [ ] **Step 3: Commit** `feat: add project detail route and single-project editor`

---

### Task 4: Wire New Workbook + verify

**Files:**
- Modify: `components/new-workbook-button.tsx`

- [ ] **Step 1:** `router.push(\`/projects/${result.project.id}\`)`

- [ ] **Step 2:** End-to-end checklist — table link, create from header/table, delete → list, bad id 404, generate/export still work

- [ ] **Step 3:** `npx vitest run` — all pass

- [ ] **Step 4: Commit** `feat: open new workbook on project detail page`

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| Table index | 2 |
| Detail composer | 3 |
| Name link / create → detail | 2, 4 |
| getProject + 404 | 1, 3 |
| Delete → list | 3 |
| updatedAt column | 1, 2 |
| New Workbook URL | 4 |
