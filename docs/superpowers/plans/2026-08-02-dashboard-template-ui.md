# Dashboard Template UI Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle MathSheets with the blue surface system from `docs/templates/dashboard.html`—shared 320px sidebar + fixed top bar, Inter + IBM Plex Mono, honest Dashboard empty state, New Workbook wired to `createProject` → `/projects`.

**Architecture:** Map mock colors into CSS variables / shadcn theme once; rebuild `AppSidebar` + new `AppTopBar` in `(app)/layout`; shared `NewWorkbookButton` for header and Dashboard; retoken other pages without changing CRUD/DnD/generate/PDF behavior. Print continues to hide chrome via `data-print-hide`.

**Tech Stack:** Next.js App Router, Tailwind v4 + CSS variables, `next/font` (Inter, IBM Plex Mono), Lucide icons, existing `createProject` server action, Vitest for small pure helpers

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-02-dashboard-template-ui-design.md`
- Brand text: **MathSheets** (never MathGen)
- Fonts: **Inter** (UI) + **IBM Plex Mono** (mono / tabular UI numbers) via `next/font`
- Top bar workspace label: **Academic Workspace**
- Settings: **footer-only** (single entry above email)—not duplicated in primary nav
- New Workbook / New Project: call `createProject()` with default name `"Untitled project"`, then `router.push("/projects")` + `router.refresh()`
- Notifications + Help: visible, inert (`type="button"`, no navigation, no fake toasts)
- No Auto-solve / LaTeX / collaborators / fake system footer metadata
- Letter worksheet ink stays black; do not apply graph/grid chrome to printable page bodies
- No mobile hamburger system; no data-model changes
- Prefer Lucide over Material Symbols CDN
- If local WIP already touched chrome/CSS, reconcile to **this** token map (do not keep graph-paper utilities on app chrome)

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/ui/workspace.ts` | Shared constants (`WORKSPACE_LABEL`, sidebar width class contract) |
| `lib/ui/workspace.test.ts` | Constant sanity tests |
| `app/globals.css` | Token remap; surface utilities; remove chrome graph-paper |
| `app/layout.tsx` | Inter + IBM Plex Mono |
| `components/app-sidebar.tsx` | 320px mock-aligned sidebar |
| `components/app-top-bar.tsx` | Fixed header + New Workbook + inert icons |
| `components/new-workbook-button.tsx` | Shared create → Projects action |
| `app/(app)/layout.tsx` | Sidebar + top bar + main offset |
| `components/dashboard/dashboard-home.tsx` | Split empty Dashboard |
| `app/(app)/dashboard/page.tsx` | Render `DashboardHome` |
| `app/(auth)/layout.tsx` | Auth shell without graph-paper |
| `components/login-form.tsx`, `register-form.tsx`, settings forms, editors, `empty-state-page.tsx`, `logout-button.tsx`, `button.tsx` | Surface/radius/token pass |
| `app/print.css` | Ensure new chrome selectors stay hidden (`data-print-hide`) |

---

### Task 1: Workspace constants

**Files:**
- Create: `lib/ui/workspace.ts`
- Create: `lib/ui/workspace.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const WORKSPACE_LABEL = "Academic Workspace";
  export const SIDEBAR_WIDTH_CLASS = "w-80"; // 320px
  export const SIDEBAR_OFFSET_CLASS = "pl-80";
  export const TOP_BAR_HEIGHT_CLASS = "h-16";
  ```

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  SIDEBAR_OFFSET_CLASS,
  SIDEBAR_WIDTH_CLASS,
  TOP_BAR_HEIGHT_CLASS,
  WORKSPACE_LABEL,
} from "./workspace";

describe("workspace chrome constants", () => {
  it("uses Academic Workspace label", () => {
    expect(WORKSPACE_LABEL).toBe("Academic Workspace");
  });

  it("uses 320px sidebar width utilities", () => {
    expect(SIDEBAR_WIDTH_CLASS).toBe("w-80");
    expect(SIDEBAR_OFFSET_CLASS).toBe("pl-80");
    expect(TOP_BAR_HEIGHT_CLASS).toBe("h-16");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run lib/ui/workspace.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```ts
/** Shared chrome labels / Tailwind width contract (320px = w-80). */
export const WORKSPACE_LABEL = "Academic Workspace";
export const SIDEBAR_WIDTH_CLASS = "w-80";
export const SIDEBAR_OFFSET_CLASS = "pl-80";
export const TOP_BAR_HEIGHT_CLASS = "h-16";
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run lib/ui/workspace.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add lib/ui/workspace.ts lib/ui/workspace.test.ts
git commit -m "feat: add workspace chrome constants for dashboard UI"
```

---

### Task 2: Design tokens + fonts

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: none
- Produces: CSS variables listed below; `--font-sans` = Inter; `--font-mono` = IBM Plex Mono

**Token map (mock → app):**

| CSS variable | Value | Notes |
|--------------|-------|-------|
| `--background` | `#f8f9ff` | mock background/surface |
| `--foreground` | `#0b1c30` | on-surface |
| `--card` | `#ffffff` | surface-container-lowest |
| `--card-foreground` | `#0b1c30` | |
| `--primary` | `#0058be` | mock **secondary** (blue CTAs) |
| `--primary-foreground` | `#ffffff` | |
| `--secondary` | `#d8e2ff` | secondary-fixed soft fill |
| `--secondary-foreground` | `#001a42` | |
| `--muted` | `#eff4ff` | surface-container-low |
| `--muted-foreground` | `#45464d` | on-surface-variant |
| `--accent` | `#dce9ff` | surface-container-high |
| `--accent-foreground` | `#0b1c30` | |
| `--destructive` | `#ba1a1a` | |
| `--border` / `--input` | `#c6c6cd` | outline-variant |
| `--ring` | `#2170e4` | secondary-container |
| `--sidebar` | `#eff4ff` | surface-container-low |
| `--sidebar-foreground` | `#0b1c30` | |
| `--sidebar-primary` | `#0058be` | |
| `--sidebar-primary-foreground` | `#ffffff` | |
| `--sidebar-accent` | `#d3e4fe` | surface-container-highest |
| `--sidebar-accent-foreground` | `#0b1c30` | |
| `--sidebar-border` | `#c6c6cd` | |
| `--radius` | `0.5rem` | mock xl |
| `--ink` | `#0b1c30` | keep for existing `text-ink` |
| `--rule` | `rgb(198 198 205 / 0.35)` | only if decorative empty-card grid needs it |

Also add optional semantic aliases in `:root` and `@theme inline` if used by components:

```css
--surface-container: #e5eeff;
--surface-container-high: #dce9ff;
--surface-container-highest: #d3e4fe;
--surface-container-low: #eff4ff;
--surface-container-lowest: #ffffff;
```

- [ ] **Step 1: Switch root layout fonts to Inter + IBM Plex Mono**

In `app/layout.tsx`, replace IBM Plex Sans with Inter; keep IBM Plex Mono:

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./print.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MathSheets",
  description: "Generate math problem sheets and workbooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Remap `:root` (and simplify `.dark` to a reasonable blue-dark or leave unused) in `app/globals.css`**

Replace the graph-paper studio `:root` block with the token table above. In `@theme inline`, keep existing shadcn mappings; optionally add:

```css
--color-surface-container: var(--surface-container);
--color-surface-container-high: var(--surface-container-high);
--color-surface-container-highest: var(--surface-container-highest);
--color-surface-container-low: var(--surface-container-low);
--color-surface-container-lowest: var(--surface-container-lowest);
```

- [ ] **Step 3: Remove chrome graph-paper**

Delete or stop using `.bg-graph` / `.bg-graph-fine` on app chrome. Prefer deleting both utilities if unused after later tasks; if kept temporarily, do **not** apply them in layouts. Soften `.panel-ruled` to:

```css
.panel-ruled {
  @apply rounded-xl border border-border bg-card shadow-sm;
}
```

Keep `.animate-fade-rise` as-is.

- [ ] **Step 4: Visual smoke**

```bash
npm run dev
```

Open `/login` — Inter loaded, background `#f8f9ff`-ish, no graph grid on auth once Task 6 runs (fonts/tokens visible immediately).

- [ ] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: adopt dashboard template tokens and Inter fonts"
```

---

### Task 3: App sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`
- Modify: `components/logout-button.tsx` (error-tint styling)

**Interfaces:**
- Consumes: `SIDEBAR_WIDTH_CLASS` from `lib/ui/workspace.ts`
- Produces: sidebar with `data-print-hide`, brand MathSheets, primary nav + footer Settings

- [ ] **Step 1: Restyle `AppSidebar`**

Replace implementation with mock-aligned structure (Lucide icons optional; text-only nav is acceptable if icons add noise—prefer Lucide: `LayoutDashboard`, `FolderOpen`, `Calculator`, `FileText`, `Settings`, `LogOut`):

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { SIDEBAR_WIDTH_CLASS } from "@/lib/ui/workspace";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/problems", label: "Problems", icon: Calculator },
  { href: "/templates", label: "Templates", icon: FileText },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside
      data-print-hide
      className={cn(
        "fixed top-0 left-0 z-50 flex h-full flex-col bg-sidebar py-8 shadow-[1px_0_0_rgba(0,0,0,0.05)]",
        SIDEBAR_WIDTH_CLASS,
      )}
    >
      <div className="mb-10 flex items-center gap-3 px-6">
        <Link
          href="/dashboard"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          MathSheets
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-4">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-bold text-sidebar-foreground"
                  : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 px-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
            pathname === "/settings"
              ? "bg-sidebar-accent font-bold text-sidebar-foreground"
              : "font-medium text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <Settings className="size-5 shrink-0" aria-hidden />
          Settings
        </Link>
        <div className="rounded-xl bg-[var(--surface-container)] px-4 py-3">
          <p className="truncate text-xs font-medium tracking-wide text-foreground uppercase">
            Account
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Restyle `LogoutButton` for error-tint full-width control**

```tsx
"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-3 rounded-xl px-4 py-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="size-5" aria-hidden />
      Logout
    </Button>
  );
}
```

- [ ] **Step 3: Manual check**

With Task 4 incomplete, sidebar may overlap content briefly—acceptable until layout updated. Confirm brand + active states after Task 4.

- [ ] **Step 4: Commit**

```bash
git add components/app-sidebar.tsx components/logout-button.tsx
git commit -m "feat: restyle app sidebar to dashboard template chrome"
```

---

### Task 4: Top bar + app layout shell

**Files:**
- Create: `components/new-workbook-button.tsx`
- Create: `components/app-top-bar.tsx`
- Modify: `app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `createProject` from `@/lib/actions/projects`; workspace constants; `WORKSPACE_LABEL`
- Produces: `NewWorkbookButton` (shared), `AppTopBar`, layout with `pl-80` + `pt-16`

- [ ] **Step 1: Implement `NewWorkbookButton`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createProject } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";

export function NewWorkbookButton({
  className,
  label = "New Workbook",
  size = "sm",
}: {
  className?: string;
  label?: string;
  size?: "sm" | "default" | "lg";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const result = await createProject();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push("/projects");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      disabled={pending}
      onClick={onClick}
      className={cn("gap-2", className)}
    >
      <Plus className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
```

- [ ] **Step 2: Implement `AppTopBar`**

```tsx
"use client";

import { Bell, CircleHelp } from "lucide-react";
import { NewWorkbookButton } from "@/components/new-workbook-button";
import {
  SIDEBAR_OFFSET_CLASS,
  TOP_BAR_HEIGHT_CLASS,
  WORKSPACE_LABEL,
} from "@/lib/ui/workspace";
import { cn } from "@/lib/utils";

export function AppTopBar() {
  return (
    <header
      data-print-hide
      className={cn(
        "fixed top-0 right-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl",
        SIDEBAR_OFFSET_CLASS,
        TOP_BAR_HEIGHT_CLASS,
      )}
    >
      <p className="text-sm text-muted-foreground">{WORKSPACE_LABEL}</p>
      <div className="flex items-center gap-4">
        <NewWorkbookButton />
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Help"
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          >
            <CircleHelp className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Update `app/(app)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopBar } from "@/components/app-top-bar";
import { auth } from "@/lib/auth";
import { SIDEBAR_OFFSET_CLASS } from "@/lib/ui/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar email={session.user.email ?? ""} />
      <div className={SIDEBAR_OFFSET_CLASS}>
        <AppTopBar />
        <main className="min-h-dvh pt-16">
          <div className="mx-auto w-full max-w-[1400px] p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Manual verify**

1. Signed-in: sidebar fixed 320px; header frosted; main clears header  
2. Click **New Workbook** → new Untitled project appears on Projects  
3. Notifications / Help click → no navigation, no toast  
4. Print preview from Projects (after generation): sidebar + top bar hidden (`data-print-hide`)

- [ ] **Step 5: Commit**

```bash
git add components/new-workbook-button.tsx components/app-top-bar.tsx "app/(app)/layout.tsx"
git commit -m "feat: add app top bar and New Workbook action"
```

---

### Task 5: Dashboard split empty state

**Files:**
- Create: `components/dashboard/dashboard-home.tsx`
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `NewWorkbookButton`
- Produces: honest MathSheets empty dashboard (no floaties / collaborators)

- [ ] **Step 1: Implement `DashboardHome`**

```tsx
import { FileText, Printer } from "lucide-react";
import { NewWorkbookButton } from "@/components/new-workbook-button";

export function DashboardHome() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col justify-center">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="order-2 w-full space-y-10 lg:order-1 lg:w-1/2">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Empty workspace
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Your worksheet
              <br />
              <span className="text-primary">canvas awaits.</span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Compose letter-sized templates, generate workbooks, and export
              print-ready PDFs with MathSheets.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl bg-muted p-6">
              <FileText className="size-6 text-primary" aria-hidden />
              <p className="text-lg font-semibold text-foreground">Templates</p>
              <p className="text-sm text-muted-foreground">
                Drag problem types into letter layouts you can reuse.
              </p>
            </div>
            <div className="space-y-2 rounded-xl bg-muted p-6">
              <Printer className="size-6 text-primary" aria-hidden />
              <p className="text-lg font-semibold text-foreground">
                Print-ready export
              </p>
              <p className="text-sm text-muted-foreground">
                Export from Projects via browser Print → Save as PDF.
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 flex w-full justify-center lg:order-2 lg:w-1/2">
          <div className="relative flex h-[440px] w-[340px] max-w-full flex-col items-center justify-center overflow-hidden rounded-sm border border-border/40 bg-card p-10 shadow-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            />
            <div className="relative z-10 flex flex-col items-center space-y-6 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-background shadow-inner">
                <FileText className="size-10 text-muted-foreground" strokeWidth={1.25} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Workspace empty
                </h2>
                <p className="px-2 text-sm text-muted-foreground">
                  No workbooks yet. Create a project to start generating pages.
                </p>
              </div>
              <NewWorkbookButton label="New Project" size="lg" className="rounded-xl px-8 py-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire dashboard page**

```tsx
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default function DashboardPage() {
  return <DashboardHome />;
}
```

- [ ] **Step 3: Manual verify**

- Desktop split; mobile stacks with canvas first  
- No Auto-solve / LaTeX badges / collaborator row  
- **New Project** creates project and opens Projects  
- Copy says MathSheets

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/dashboard-home.tsx "app/(app)/dashboard/page.tsx"
git commit -m "feat: add dashboard empty state from template mock"
```

---

### Task 6: Auth + secondary surfaces pass

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `components/login-form.tsx`
- Modify: `components/register-form.tsx`
- Modify: `components/change-password-form.tsx`
- Modify: `components/delete-account-form.tsx`
- Modify: `app/(app)/settings/page.tsx`
- Modify: `components/empty-state-page.tsx` (if still used elsewhere)
- Modify: `components/ui/button.tsx` — bump default radius toward `rounded-lg` via variants if still `rounded-sm` looks wrong against new `--radius`
- Light pass: `components/projects/projects-editor.tsx`, `components/templates/templates-editor.tsx`, `components/problems/problems-catalog.tsx` — replace `bg-graph` / harsh `rounded-sm` chrome wrappers with `bg-background` / `rounded-xl` panel classes **without** changing logic

**Interfaces:**
- Consumes: new tokens
- Produces: consistent surfaces; auth without graph-paper

- [ ] **Step 1: Auth layout**

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
          MathSheets
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Worksheet studio
        </h1>
      </div>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}
```

If login/register forms already wrap themselves in a card, avoid double-card—either put padding only on layout or strip inner card. Prefer **one** card surface.

- [ ] **Step 2: Forms / settings / editors**

Sweep class strings:
- Remove `bg-graph`, `bg-graph-fine`
- Prefer `text-foreground` over one-off ink where equivalent
- Panels: `rounded-xl border border-border bg-card` or `bg-muted`
- Do **not** change handlers, server actions, DnD, generate, export, overflow
- Do **not** restyle problem ink inside `addition-blank` beyond leaving black text

- [ ] **Step 3: Button radius (optional small tweak)**

In `buttonVariants` base string, change `rounded-sm` → `rounded-lg` so CTAs match mock.

- [ ] **Step 4: Manual verify**

Login, register, settings, projects, templates, problems all share blue surfaces; editors still function.

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/layout.tsx components/login-form.tsx components/register-form.tsx components/change-password-form.tsx components/delete-account-form.tsx "app/(app)/settings/page.tsx" components/empty-state-page.tsx components/ui/button.tsx components/projects/projects-editor.tsx components/templates/templates-editor.tsx components/problems/problems-catalog.tsx
git commit -m "feat: retoken auth and app surfaces to dashboard palette"
```

---

### Task 7: Print chrome verification + cleanup

**Files:**
- Modify: `app/print.css` only if needed
- Delete unused `.bg-graph` / `.bg-graph-fine` from `globals.css` if still present
- Optionally add `docs/templates/dashboard.html` to git if not tracked (reference asset)

**Interfaces:**
- Consumes: `data-print-hide` on sidebar + top bar
- Produces: print path unchanged functionally

- [ ] **Step 1: Confirm print CSS**

Existing rule already hides `[data-print-hide]`. Ensure `AppSidebar` and `AppTopBar` both set it (Tasks 3–4). If main padding fights print, keep:

```css
main {
  padding: 0 !important;
  overflow: visible !important;
}
```

No `@page` margin changes in this plan.

- [ ] **Step 2: End-to-end checklist**

1. Dashboard visual matches adapted mock (honest copy)  
2. New Workbook (header) + New Project (dashboard) → Projects with new item  
3. Notifications/Help inert  
4. Generate + Export PDF still work; print preview has no sidebar/header  
5. Templates DnD + overflow banner still work  
6. Settings password + delete still work  
7. `npx vitest run` — existing suite + `lib/ui/workspace.test.ts` pass  

```bash
npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git add app/print.css app/globals.css docs/templates/dashboard.html
git commit -m "chore: verify print chrome hide and clean graph utilities"
```

(Only stage files actually changed.)

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Tokens / remove graph-paper | 2, 7 |
| Inter + IBM Plex Mono | 2 |
| 320px sidebar + fixed header | 1, 3, 4 |
| MathSheets brand; Settings footer-only | 3 |
| New Workbook wired; notifications/help inert | 4 |
| Dashboard split + honest teasers; no fluff | 5 |
| Auth + other pages retoken | 6 |
| Letter ink / print hide chrome | 5 (decorative grid only on empty card), 7 |
| No model/CRUD/DnD/PDF math changes | All tasks constrain |

**Open decisions locked:** label `Academic Workspace`; Settings footer-only; fonts via `next/font`.
