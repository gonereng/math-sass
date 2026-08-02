# MathSheets — Projects List & Detail Routes Design

**Date:** 2026-08-02  
**Status:** Approved for implementation planning  
**Scope:** Split Projects into a table index and a per-project detail composer. Wire New Workbook / New project to open the new project’s detail URL. No rename, search, pagination, or Generate/PDF behavior changes.

## 1. Purpose

Teachers/parents browse all workbooks in a table, then open one project for sections + letter preview + generate/export. Today `/projects` is a single three-column editor with an in-page project switcher; that switcher becomes real routes.

## 2. Goals & non-goals

### Goals
- `/projects` — table of the signed-in user’s projects
- `/projects/[id]` — detail: sections, preview, Generate, Export PDF, Delete
- Project **name** in the table links to `/projects/[id]`
- Sidebar Projects → `/projects`
- **New Workbook** (top bar) and **New project** (table) → `createProject()` → navigate to `/projects/[id]`
- Detail page: back link to All projects; drop left project-switcher list
- Ownership: missing or non-owned id → not found (or safe redirect to `/projects`)

### Non-goals
- Rename project UI
- Bulk delete, search, filters, pagination
- Changing Generate, fingerprints, snapshots, or print/PDF math
- Dashboard copy changes beyond any incidental New Workbook redirect

## 3. Approach

**List route + detail route (Approach 1).** Reuse existing `ProjectsEditor` logic on the detail page without the project list column. New lightweight table component for the index. Shared create helper updates to push `/projects/${id}` instead of `/projects`.

## 4. Routes & data

| Route | Data | UI |
|-------|------|-----|
| `/projects` | `listProjects()` (summary fields enough) | Table + New project |
| `/projects/[id]` | Load one project by id for current user + template options | Composer (sections + preview) |

**Server load for detail:** Prefer a dedicated `getProject(id)` (or equivalent) that returns `null` when not found / wrong user → `notFound()`.

**Table columns**

| Column | Source |
|--------|--------|
| Name | `project.name` (link) |
| Sections | `sections.length` |
| Pages | `pages.length` (generated) |
| Updated | `updatedAt` (short / relative) |

Sort: `updatedAt` desc (match current `listProjects` order).

## 5. Navigation & create

- `NewWorkbookButton`: after successful `createProject()`, `router.push(\`/projects/${result.project.id}\`)` + `router.refresh()`
- Table **New project**: same
- After **Delete** on detail: redirect to `/projects`
- Middleware / auth: protect `/projects/:path*` (already covered)

## 6. Detail UI

- Header: project name + “All projects” → `/projects`
- Sections column + center preview + Generate / Export PDF — same behavior as today
- Delete project control remains on detail only
- No left list of other projects

## 7. Empty & edge cases

| Case | Behavior |
|------|----------|
| No projects | Empty table state + New project CTA |
| Invalid id | `notFound()` |
| Delete last project | Land on empty `/projects` |
| Stale generate / export gating | Unchanged (`canExportPdf`) |

## 8. Files (expected)

| Area | Change |
|------|--------|
| `app/(app)/projects/page.tsx` | Table index |
| `app/(app)/projects/[id]/page.tsx` | Detail page |
| `components/projects/projects-table.tsx` (or similar) | Table UI |
| `components/projects/projects-editor.tsx` | Detail-only (no project switcher); accept single project |
| `components/new-workbook-button.tsx` | Navigate to `/projects/[id]` |
| `lib/actions/projects.ts` | Optional `getProject` |

## 9. Testing / verification

- `/projects` lists projects; name opens detail
- New Workbook / New project lands on new detail URL
- Generate / Export / sections CRUD still work on detail
- Delete returns to table
- Bad id → 404
- Existing vitest suite still passes

## 10. Open decisions for the plan (non-blocking)

- Exact date formatting for Updated column
- Whether table uses native `<table>` or a simple grid styled as a table
