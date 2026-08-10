# Project page backgrounds — Design

**Date:** 2026-08-10  
**Status:** Approved for implementation planning  
**Scope:** Extensible worksheet page backgrounds on project detail (preview + PDF exports)

## 1. Purpose

Teachers can switch worksheet page look between a blank letter sheet and decorative full-page frames (starting with a “Kids frame” border art). Choice is saved on the project and appears in preview and exports.

## 2. Decisions (from brainstorming)

| Topic | Choice |
|-------|--------|
| Where applied | **Worksheet pages only** — answer keys stay blank |
| Persistence | **Saved on `Project`** and used for Export PDF, sections PDF, and cover PNG |
| Chrome with themed bg | **Hide black page outline**; keep **`0.5in` content padding** for v1 |
| Architecture | **Code registry + `Project.backgroundId`** (same spirit as sheet header locales) |

## 3. Registry

New module e.g. `lib/sheet-backgrounds.ts` (name flexible):

```ts
export const SHEET_BACKGROUNDS = {
  blank: {
    id: "blank",
    label: "Blank",
    src: null,
    showPageBorder: true,
  },
  "kids-frame": {
    id: "kids-frame",
    label: "Kids frame",
    src: "/backgrounds/kids-frame.png",
    showPageBorder: false,
  },
} as const;
```

**Extensibility (v1 contract):**

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Stable key; stored on project |
| `label` | yes | Dropdown label |
| `src` | yes | `null` = no image; otherwise public URL path |
| `showPageBorder` | yes | Whether black silhouette border is drawn |
| `contentPadding` | no (future) | Optional override of `0.5in` when frames need more inset |

Helpers: `DEFAULT_SHEET_BACKGROUND_ID = "blank"`, `getSheetBackground(id)`, `isSheetBackgroundId(id)`, `SHEET_BACKGROUND_OPTIONS` for the select.

Unknown / invalid stored ids → fall back to `blank`.

## 4. Asset

- Copy the provided kids-frame PNG to `public/backgrounds/kids-frame.png`.
- Image is letter portrait with an illustrated border and white center; rendered full-bleed on the 8.5×11in sheet (`background-size: 100% 100%` or equivalent so it matches the page box).

## 5. Data model

```prisma
model Project {
  // ...
  backgroundId String @default("blank")
}
```

- Migration adds the column with default `"blank"` for existing rows.
- Validation: Zod enum (or refine against registry keys) on update action.

## 6. Server

- Include `backgroundId` in `ProjectWithDetails` / `mapProject`.
- New action `updateProjectBackground({ projectId, backgroundId })` (owner-scoped), mirroring `updateProjectName`.
- No change to generate/page item generation — background is presentation only.

## 7. UI (project detail)

- Toolbar control labeled **Background** (beside Header language).
- Native `<select>` of registry options.
- On change: call `updateProjectBackground`, update local `project` state (toast on error).

## 8. LetterShell

- Optional prop `backgroundId` (default `blank`).
- Resolve via registry:
  - If `src`: set full-bleed background image on the letter sheet (behind content).
  - If `!showPageBorder`: do not show the black silhouette border (page remains white underneath).
- Padding stays `0.5in` in v1.

**Wiring in projects editor:**

- Worksheet print wrappers / `LetterShell`: pass `project.backgroundId`.
- Answer-key pages: omit / force `blank`.

Templates editor: unchanged (blank) in v1.

## 9. Export

No export-specific background logic. Capture uses rendered worksheet DOM, so:

- Full PDF (worksheet pages inherit background; answer-key pages stay blank)
- `{name}-sections.pdf` (first page per section — worksheets only)
- `{name}-cover.png` (first worksheet page)

all reflect the saved background.

## 10. Out of scope (v1)

- Per-section backgrounds
- Background picker on Templates
- Per-background `contentPadding` tuning (schema field reserved for later)
- Uploading custom backgrounds from the UI
- Changing answer-key chrome

## 11. Test plan (high level)

- Registry: default blank; kids-frame has `src` and `showPageBorder: false`; invalid id → blank
- `updateProjectBackground` persists and rejects unknown ids / other users’ projects
- LetterShell: blank shows border; kids-frame shows image and no black border
- Project editor: answer-key shells do not receive the themed background
