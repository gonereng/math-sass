### Task 1: Scaffold Next.js + Tailwind + shadcn

**Files:**
- Create: Next.js app at repo root (keep existing `docs/`)
- Create: `components.json` (shadcn)
- Create: shadcn primitives under `components/ui/`

**Interfaces:**
- Consumes: none
- Produces: runnable `npm run dev`; path alias `@/*`; Tailwind + shadcn ready

- [ ] **Step 1: Create Next.js app in the repo root**

The repo already has `docs/` and a git history. Scaffold without overwriting docs:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --turbopack --yes
```

If the tool refuses a non-empty directory, create in a temp folder and move files, preserving `docs/`.

- [ ] **Step 2: Verify dev server starts**

```bash
npm run dev
```

Expected: server on `http://localhost:3000` without errors. Stop the server after check.

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label card sonner separator
```

Use defaults from `-d` (neutral base is fine).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js with Tailwind and shadcn"
```

---

