# MathSheets — Dashboard Template UI Restyle Design

**Date:** 2026-08-02  
**Status:** Approved for implementation planning  
**Scope:** Apply the visual language from `docs/templates/dashboard.html` across the authenticated app shell, Dashboard, Projects/Templates/Problems/Settings, and auth pages—adapted to MathSheets product truth. No new product features beyond wiring **New Workbook** to existing project creation.

## 1. Purpose

Replace the current graph-paper / cool-gray studio look with the Material-ish blue surface system from the provided dashboard mock, so every app page feels like one product. Brand remains **MathSheets**. Strip mock fluff (Auto-solve, LaTeX, collaborators, fake system IDs).

## 2. Goals & non-goals

### Goals
- Global design tokens and typography aligned to the mock (blue surfaces, Inter UI, IBM Plex Mono for math/numbers)
- Shared shell: ~320px sidebar + fixed top bar + main content; print CSS continues to hide chrome
- Top bar: **New Workbook** (wired), notifications + help **visible but inert**
- Dashboard: split empty-state composition adapted from the mock with honest teasers
- Restyle Projects, Templates, Problems, Settings, and auth pages to the new tokens without changing CRUD/DnD/generate/PDF behavior
- Letter worksheets stay black ink for print fidelity

### Non-goals
- Auto-solve, LaTeX editing, live collaborators, notification or help backends
- Redesigning problem component internals or changing PDF/print math beyond chrome hide
- Mobile hamburger / new collapsing-sidebar system
- Data model or domain CRUD behavior changes
- Renaming the product or inventing features shown only in the HTML mock

## 3. Approach

**Shell + tokens everywhere (Approach C / Approach 1).** Map mock colors/spacing into CSS variables (and shadcn theme mappings). Rebuild app chrome (`AppSidebar` + header) once; Dashboard gets a bespoke empty layout; other pages keep structure and gain retokened surfaces/buttons. Reference mock: `docs/templates/dashboard.html`.

## 4. Tokens & typography

### Color & surface system
Port the mock’s semantic palette into app CSS variables (exact hex/oklch mapping in the implementation plan). Core roles:

| Token role (from mock) | Use |
|------------------------|-----|
| `background` / `surface` (`#f8f9ff`) | App canvas |
| `surface-container-low` / `high` / `highest` | Sidebar, panels, active nav |
| `secondary` / `secondary-container` (blues) | Primary CTAs, accents |
| `on-surface` / `on-surface-variant` | Body / muted text |
| `outline` / `outline-variant` | Borders, dividers |
| `error` / `error-container` | Destructive (logout, delete) |

Remove or replace graph-paper background utilities on chrome. Do **not** apply decorative blue washes or surface grids to printable letter worksheet ink areas.

### Typography
- **UI:** Inter (replace current display stack for chrome/auth)
- **Math / monospace numbers in UI chrome:** IBM Plex Mono (agreed substitute for mock’s JetBrains Mono)
- Letter worksheet problem typography: keep print-safe black ink; do not force Inter into printed problem bodies if existing problem components already define print fonts

### Spacing / shell geometry
- Sidebar width ≈ **320px** (`sidebar-width`)
- Top bar height ≈ **64px**, frosted `surface` with light shadow
- Gutter / stack spacing from mock where practical

### Icons
- Prefer existing Lucide (or current icon set) mapped to mock intent; do not require Material Symbols CDN unless already planned elsewhere

## 5. App shell

### Sidebar
- Fixed left, full height, `surface-container-low`, light edge shadow
- Brand: text **MathSheets** (no MathGen; no remote mock logo dependency—use existing mark or text-only)
- Nav: Dashboard, Projects, Problems, Templates; active = `surface-container-highest` + bold; hover = `surface-container-high`
- **Settings** placement: keep in footer region above account (current product pattern), styled like mock nav items—not a fifth primary nav item unless already duplicated; single Settings entry only
- Footer: user email (and name if available); Logout with error-tint hover

### Top bar
- Fixed under viewport top, offset by sidebar width
- Left: short workspace label (e.g. “Academic Workspace” or page-contextual title—implementation may use a simple static label)
- Right:
  1. **New Workbook** — secondary blue CTA; creates a project via existing create-project flow, then navigates to **Projects** (same outcome as today’s “New project” where applicable)
  2. Notifications icon — visible, non-functional (no badge backend)
  3. Help icon — visible, non-functional

### Main
- `pt` clears fixed header; `background` fill; content pages own their layout

### Print
- Existing `app/print.css` / `@media print` rules continue to hide sidebar, top bar, and non-print UI
- No change to letter `@page` sizing or fit-scale behavior from the PDF export design

## 6. Dashboard

### Layout
Split composition (desktop): left copy + two teaser cards; right letter-ratio empty canvas with primary CTA. Stack on smaller breakpoints (right/canvas first or left-then-right—prefer readable single column without breaking the shell).

### Copy (adapted)
- Brand/product voice for MathSheets (not MathGen)
- Headline/supporting sentence invite starting a workbook/project
- No “Ready for calculation” fluff that implies solvers; optional quiet status line only if it stays honest (e.g. empty workspace)

### Teasers (honest, shipped product only)
Examples (final wording in implementation):
1. **Templates** — compose letter layouts from problem types
2. **Print-ready export** — browser Print → Save as PDF from projects

No Auto-solve / LaTeX-quality claims / collaborator avatars / fake footer metadata (`LATEX_V…`, `SYSTEM_ID…`).

### Empty canvas
- Approximate 8.5∶11 page card on `surface-container-lowest`
- Subtle grid pattern allowed on this **decorative** empty card only
- CTA: **New Project** / equivalent — same action as New Workbook
- **Omit** floating Auto-solve / Latex Support badges and mouse-parallax gimmicks from the mock

## 7. Other pages

### Projects, Templates, Problems, Settings
- Same shell; retoken lists, panels, primary/secondary buttons, borders, empty states
- Preserve three-column editors, DnD, accordion sections, Generate, Export PDF, overflow banner/wash behavior
- Do **not** force the Dashboard split layout onto these routes

### Auth (login / register)
- Same token + Inter system; cleaner surface panels (no graph-paper)
- Brand MathSheets; keep existing auth flows

### Letter worksheets
- Screen preview chrome may sit on the new app background; **page ink stays black** for print fidelity
- Overflow red wash and print fit-scale unchanged functionally

## 8. Edge cases

| Case | Behavior |
|------|----------|
| Empty vs populated lists | Same shell; existing empty states retokened |
| New Workbook with no name UX | Follow existing create-project defaults (name prompt or default name)—no new naming product |
| Notifications / Help click | No-op or `button` without navigation; do not fake toasts that imply a system |
| Narrow viewports | Keep current responsive behavior; no new mobile nav system in this slice |
| Active route | Highlight matching sidebar item |
| Print from Projects | Chrome hidden; worksheets print as today |

## 9. Files (expected)

| Area | Change |
|------|--------|
| `app/globals.css` (+ theme) | Tokens; remove/replace graph-paper chrome |
| Font loading (layout / next/font) | Inter + IBM Plex Mono |
| `components/app-sidebar.tsx` (+ related) | Mock-aligned sidebar |
| App header component / `(app)/layout.tsx` | Fixed top bar + New Workbook |
| `app/(app)/dashboard/page.tsx` (+ components) | Split empty dashboard |
| Projects/Templates/Problems/Settings/auth UI | Surface/button/token pass |
| `app/print.css` | Verify chrome selectors still hide new header/sidebar |

Exact file list and token mapping belong in the implementation plan.

## 10. Testing / verification

- Visual: shell on Dashboard, Projects, Templates, Problems, Settings, login/register
- New Workbook creates project and lands on Projects
- Notifications/Help do not navigate or error
- Generate / Export PDF / DnD / overflow warn still work
- Print preview: no sidebar/top bar; letter pages intact
- No regressions to auth session or settings password/delete flows

## 11. Open decisions for the plan (non-blocking)

- Exact workspace label string in the top bar
- Whether Settings stays footer-only (preferred) vs also listed mid-nav like the HTML mock
- Precise Inter/IBM Plex Mono loading via `next/font` vs CSS import
