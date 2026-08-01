# MathSheets — Features

Current capabilities of the app as of the latest `master` branch.

## Auth & account

- Register with name, email, and password
- Log in / log out (credentials + JWT session)
- Protected app routes (middleware + layout)
- Change password (requires current password)
- Delete account (requires current password; cascades user data)

## App shell

- Left sidebar navigation: Dashboard, Projects, Problems, Templates, Settings
- Shows signed-in email and logout
- Print-aware chrome (sidebar/controls hidden when exporting PDF)

## Dashboard

- Stub empty state only (“Create a project to get started”)
- “New project” CTA is not wired (real creation lives under Projects)

## Templates (`/templates`)

- Auto-seeds **Addition practice** on first visit if the user has no templates
- Create and select templates
- Letter-sized page chrome with Name / Class / Date blanks
- Layout presets: **Two columns** and **2×2 grid** (switchable; orphaned items remapped)
- Drag problem types from the palette into layout drop boxes
- Min/max dialog → random integer props stored with each item (plus ranges for later generate)
- Reorder items within a box; remove items
- Overflow warning when content exceeds one letter page (banner + red wash on the spill)

Not included: template rename/delete, template PDF export.

## Problems catalog (`/problems`)

- Browse developer-defined problem types
- Live letter-frame preview for the selected type
- Currently one type: **Addition blank** (`a + b = _____`, handwriting line, no input)

## Projects (`/projects`)

- Create, list, select, and delete projects
- Build ordered **sections** from existing templates (snapshot frozen at add time)
- Per section: page count (1–50), reorder, remove
- **Generate** — expands sections into persisted letter pages with fresh random props from snapshotted ranges
- Scrollable in-app preview of generated pages
- Stale-preview hint when the composition changed after the last generate
- **Export PDF** — browser Print → Save as PDF (letter pages, one sheet per generated page; UI chrome hidden; tall content scaled to fit)

Not included: project rename, live re-sync of sections when a template changes later, server-built PDF files.

## Settings (`/settings`)

- Change password
- Delete account

## Stack (for context)

Next.js App Router, Auth.js, Prisma + Postgres, Tailwind, shadcn/ui, Vitest.
