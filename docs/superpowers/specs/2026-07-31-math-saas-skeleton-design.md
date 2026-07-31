# Math SaaS — Application Skeleton Design

**Date:** 2026-07-31  
**Status:** Approved for implementation planning  
**Scope:** Auth + app shell only (no problem generation, PDFs, or billing)

## 1. Purpose

Build the foundation of a SaaS product that helps **teachers/tutors** and **homeschool parents** generate math problem sheets and workbooks.

This first slice delivers a working login/register flow and a protected main application with left navigation. Domain features (generation, persistence of projects/problems/templates) come later.

## 2. Users

| Persona | Need (product-level) |
|---------|----------------------|
| Teacher / tutor | Create worksheets for students |
| Homeschool parent | Create practice sheets at home |

Skeleton UX should feel approachable for both — simple, clear empty states; no classroom-only jargon in the shell copy.

## 3. Goals & non-goals

### Goals
- Register, log in, and log out with email/password
- Protected app routes behind Auth.js session
- Left nav with Dashboard, Projects, Problems, Templates
- Each main page shows an empty state plus a stub “New …” control
- Local Postgres via Docker Compose for easy onboarding

### Non-goals (explicitly out of skeleton)
- Math problem generation or editors
- PDF / workbook export
- Billing / subscriptions
- Real CRUD persistence for Projects, Problems, or Templates
- OAuth providers (Google, etc.)
- Multi-seat / organization accounts
- Automated E2E test suite

## 4. Information model (product language)

These labels appear in the nav and empty states. Persistence of domain entities is deferred.

| Concept | Meaning |
|---------|---------|
| **Dashboard** | Overview / recent activity (placeholder for now) |
| **Projects** | Workbooks or sheet collections |
| **Problems** | Reusable problem bank |
| **Templates** | Layout/style presets for sheets |

## 5. Approach

**Route-group shell:** Next.js App Router with `(auth)` for public auth pages and `(app)` for the authenticated shell. Clean separation that scales when domain CRUD is added.

## 6. Architecture

### Stack
- **Framework:** Next.js (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** Auth.js (credentials provider: email/password)
- **Data:** Prisma + PostgreSQL
- **Local DB:** Docker Compose Postgres service

### Route layout

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  (app)/
    layout.tsx              # left nav shell
    dashboard/page.tsx
    projects/page.tsx
    problems/page.tsx
    templates/page.tsx
  api/auth/[...nextauth]/route.ts
  page.tsx                  # redirect: session → /dashboard, else → /login
lib/
  auth.ts
  prisma.ts
prisma/
  schema.prisma             # User (+ Auth.js adapter tables only)
docker-compose.yml          # Postgres
```

### Auth flow
1. **Register** → validate input → hash password → create `User` → sign in → redirect `/dashboard`
2. **Login** → credentials → session cookie → protected routes
3. **Logout** → clear session → `/login`
4. Auth.js middleware guards `/dashboard`, `/projects`, `/problems`, `/templates` (and the `(app)` layout as a second line of defense)

### Data (skeleton)
- Prisma models via Auth.js Prisma adapter: `User`, `Account`, `Session`, `VerificationToken` (credentials auth uses `User`; adapter tables kept for Auth.js compatibility)
- **No** `Project`, `Problem`, or `Template` tables in this slice
- “New …” buttons do not write to the database

### Environment
- `DATABASE_URL` — Postgres connection string
- `AUTH_SECRET` — Auth.js secret

## 7. UI design

### App shell
- Sticky left sidebar
- Brand/wordmark at top (placeholder name: **MathSheets**)
- Nav links: Dashboard, Projects, Problems, Templates (active state on current route)
- Bottom of sidebar: signed-in user email + Logout

### Auth pages
- Centered card forms (shadcn)
- Login: email, password, link to register
- Register: name, email, password, link to login
- Inline field/form validation messages

### Main pages (shared pattern)
- Page title + short subtitle
- Primary “New …” button — stub only (toast or “Coming soon”; non-destructive)
- Empty state: short copy + optional simple icon

| Page | Empty copy | Button label |
|------|------------|--------------|
| Dashboard | Create a project to get started | New project |
| Projects | No projects yet | New project |
| Problems | Your problem bank is empty | New problem |
| Templates | No templates yet | New template |

## 8. Error handling

| Case | Behavior |
|------|----------|
| Register with existing email | Form error: “Email already in use” |
| Login with bad credentials | Form error: “Invalid email or password” |
| Unauthenticated app route | Redirect to `/login` |
| Authenticated login/register | Redirect to `/dashboard` |
| DB / unexpected auth failure | Generic “Something went wrong” (no stack traces in UI) |

## 9. Testing & verification

### Manual checklist (required)
1. Register a new user → lands on Dashboard
2. Logout → login again with same credentials
3. Visit `/projects` while logged out → redirected to login
4. Each nav item shows its empty state and “New …” control
5. “New …” stub does not crash (toast or coming-soon feedback)

### Automated
- Not required for skeleton
- Optional cheap unit/integration coverage for password hashing or register validation only if low-cost

### Definition of done
A developer can register, log in, navigate the four sections, and log out, with empty states that communicate the product model.

## 10. Follow-on (out of this spec)

After the skeleton ships, natural next slices:
1. Prisma models + CRUD for Projects
2. Problem bank CRUD
3. Templates
4. Sheet composition and PDF export
5. Billing

## 11. Open decisions (resolved for skeleton)

| Decision | Choice |
|----------|--------|
| Primary users | Teachers/tutors and homeschool parents |
| Stack | Next.js full stack |
| Auth + DB | Auth.js + Postgres (Prisma) |
| UI kit | Tailwind + shadcn/ui |
| Skeleton depth | Auth + shell + empty states + stub New buttons (no domain persistence) |
| Structure | Route-group shell `(auth)` / `(app)` |
