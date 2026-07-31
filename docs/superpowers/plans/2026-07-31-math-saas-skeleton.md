# Math SaaS Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working Next.js skeleton with email/password auth and a protected app shell (Dashboard, Projects, Problems, Templates) with empty states.

**Architecture:** App Router route groups — `(auth)` for login/register, `(app)` for the left-nav shell. Auth.js v5 credentials + JWT sessions; Prisma `User` (with password hash) in Postgres via Docker Compose. Domain CRUD is stubbed only (toasts).

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Auth.js (`next-auth` v5), Prisma, PostgreSQL, bcryptjs, Vitest (register/password helpers only), sonner (toasts)

## Global Constraints

- Product name in UI: **MathSheets**
- Auth: email/password only (no OAuth)
- Session strategy: **JWT** (required for Auth.js credentials provider)
- No `Project` / `Problem` / `Template` Prisma models in this plan
- Empty-state copy and button labels must match the design spec exactly
- Error strings: `"Email already in use"`, `"Invalid email or password"`, `"Something went wrong"`
- Env vars: `DATABASE_URL`, `AUTH_SECRET` (also set `AUTH_URL=http://localhost:3000` for local)
- Spec: `docs/superpowers/specs/2026-07-31-math-saas-skeleton-design.md`

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `docker-compose.yml` | Local Postgres |
| `.env` / `.env.example` | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` |
| `prisma/schema.prisma` | User (+ Auth.js adapter models) with `password` on User |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/password.ts` | `hashPassword` / `verifyPassword` |
| `lib/validations/auth.ts` | Zod schemas for login/register |
| `lib/actions/register.ts` | Server action: create user |
| `lib/auth.ts` | Auth.js config (`NextAuth`, providers, callbacks) |
| `lib/auth.config.ts` | Edge-safe auth config for middleware |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js route handlers |
| `middleware.ts` | Protect `(app)` routes; redirect authed users off auth pages |
| `app/page.tsx` | Root redirect by session |
| `app/(auth)/layout.tsx` | Centered auth chrome |
| `app/(auth)/login/page.tsx` | Login form |
| `app/(auth)/register/page.tsx` | Register form |
| `app/(app)/layout.tsx` | Sidebar shell + session gate |
| `components/app-sidebar.tsx` | Nav links, brand, user email, logout |
| `components/empty-state-page.tsx` | Shared title / empty copy / stub New button |
| `components/providers.tsx` | SessionProvider + Toaster |
| `app/(app)/dashboard/page.tsx` | Dashboard empty state |
| `app/(app)/projects/page.tsx` | Projects empty state |
| `app/(app)/problems/page.tsx` | Problems empty state |
| `app/(app)/templates/page.tsx` | Templates empty state |
| `lib/password.test.ts` | Unit tests for hash/verify |
| `lib/validations/auth.test.ts` | Unit tests for Zod schemas |

---

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

### Task 2: Postgres + Prisma User schema

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `.env` (gitignored)
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Modify: `.gitignore` (ensure `.env` is ignored)

**Interfaces:**
- Consumes: none
- Produces:
  - `prisma` client export from `@/lib/prisma`
  - Models: `User` (id, name, email, emailVerified, image, password, accounts, sessions), `Account`, `Session`, `VerificationToken`

- [ ] **Step 1: Add Docker Compose Postgres**

Create `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: mathsaas
      POSTGRES_PASSWORD: mathsaas
      POSTGRES_DB: mathsaas
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 2: Start Postgres**

```bash
docker compose up -d
```

Expected: container healthy/running; port 5432 listening.

- [ ] **Step 3: Install Prisma and create schema**

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([provider, providerAccountId])
}

model Session {
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
}
```

- [ ] **Step 4: Env files**

Create `.env`:

```env
DATABASE_URL="postgresql://mathsaas:mathsaas@localhost:5432/mathsaas"
AUTH_SECRET="dev-secret-change-me-in-production-use-openssl"
AUTH_URL="http://localhost:3000"
```

Create `.env.example` with the same keys and placeholder values (no real secrets). Confirm `.env` is in `.gitignore`.

- [ ] **Step 5: Migrate**

```bash
npx prisma migrate dev --name init_auth
```

Expected: migration applied; Prisma Client generated.

- [ ] **Step 6: Add Prisma client singleton**

Create `lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example prisma lib/prisma.ts package.json package-lock.json
git commit -m "feat: add Postgres, Prisma, and auth User schema"
```

Do **not** commit `.env`.

---

### Task 3: Password helpers + auth validation (TDD)

**Files:**
- Create: `lib/password.ts`
- Create: `lib/password.test.ts`
- Create: `lib/validations/auth.ts`
- Create: `lib/validations/auth.test.ts`
- Modify: `package.json` (vitest scripts)
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, hash: string): Promise<boolean>`
  - `registerSchema` / `loginSchema` (Zod)
  - Types: `RegisterInput`, `LoginInput`

- [ ] **Step 1: Install test + crypto deps**

```bash
npm install bcryptjs zod
npm install -D vitest @types/bcryptjs
```

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Write failing password tests**

Create `lib/password.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});
```

- [ ] **Step 3: Run tests — expect fail**

```bash
npm test
```

Expected: FAIL — cannot find module `./password` or exports missing.

- [ ] **Step 4: Implement password helpers**

Create `lib/password.ts`:

```ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 5: Run password tests — expect pass**

```bash
npm test
```

Expected: PASS for password tests.

- [ ] **Step 6: Write failing validation tests**

Create `lib/validations/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "password1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "ada@example.com",
      password: "password1",
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 7: Run tests — expect fail on missing module**

```bash
npm test
```

Expected: FAIL on `./auth` missing.

- [ ] **Step 8: Implement Zod schemas**

Create `lib/validations/auth.ts`:

```ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 9: Run all unit tests — expect pass**

```bash
npm test
```

Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/password.ts lib/password.test.ts lib/validations vitest.config.ts package.json package-lock.json
git commit -m "feat: add password hashing and auth validation"
```

---

### Task 4: Auth.js config + register server action

**Files:**
- Create: `lib/auth.config.ts`
- Create: `lib/auth.ts`
- Create: `lib/actions/register.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `types/next-auth.d.ts`

**Interfaces:**
- Consumes: `prisma`, `hashPassword`, `verifyPassword`, `registerSchema`, `loginSchema`
- Produces:
  - `export const { handlers, auth, signIn, signOut } = NextAuth(...)`
  - `registerUser(input: RegisterInput): Promise<{ ok: true } | { ok: false; error: string }>`
  - Session user includes `id` and `email`

- [ ] **Step 1: Install Auth.js + adapter**

```bash
npm install next-auth@beta @auth/prisma-adapter
```

- [ ] **Step 2: Edge-safe auth config**

Create `lib/auth.config.ts`:

```ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isAuthRoute =
        pathname.startsWith("/login") || pathname.startsWith("/register");
      const isAppRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/problems") ||
        pathname.startsWith("/templates");

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      if (isAppRoute) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 3: Full Auth.js config with credentials**

Create `lib/auth.ts`:

```ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.password) return null;

        const valid = await verifyPassword(
          parsed.data.password,
          user.password,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});
```

- [ ] **Step 4: Type augmentation**

Create `types/next-auth.d.ts`:

```ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
```

- [ ] **Step 5: Route handlers**

Create `app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 6: Register server action**

Create `lib/actions/register.ts`:

```ts
"use server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth";

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Something went wrong" };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: "Email already in use" };
    }

    const password = await hashPassword(parsed.data.password);
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        password,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong" };
  }
}
```

- [ ] **Step 7: Smoke-check TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors (ignore unfinished pages if any). Fix any type issues before continuing.

- [ ] **Step 8: Commit**

```bash
git add lib/auth.ts lib/auth.config.ts lib/actions/register.ts app/api/auth types/next-auth.d.ts package.json package-lock.json
git commit -m "feat: wire Auth.js credentials and register action"
```

---

### Task 5: Auth pages (login + register)

**Files:**
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `components/login-form.tsx`
- Create: `components/register-form.tsx`

**Interfaces:**
- Consumes: `registerUser`, `signIn` from `next-auth/react` or server `signIn` from `@/lib/auth`
- Produces: working `/login` and `/register` UI

- [ ] **Step 1: Auth layout**

Create `app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Register form component**

Create `components/register-form.tsx` as a client component:

- Fields: name, email, password (shadcn `Input` + `Label` + `Button` + `Card`)
- On submit: call `registerUser`, then `signIn("credentials", { email, password, redirectTo: "/dashboard" })`
- On `{ ok: false }`, show `error` under the form
- Link to `/login`

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerUser } from "@/lib/actions/register";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const result = await registerUser({ name, email, password });
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    if (signInResult?.error) {
      setError("Something went wrong");
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Start building math sheets with MathSheets.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 3: Register page**

Create `app/(auth)/register/page.tsx`:

```tsx
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 4: Login form component**

Create `components/login-form.tsx`:

- On submit: `signIn("credentials", { email, password, redirect: false })`
- If `result?.error`, show `"Invalid email or password"`
- Else `router.push("/dashboard")` and `router.refresh()`
- Link to `/register`

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back to MathSheets.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link className="underline" href="/register">
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
```

- [ ] **Step 5: Login page**

Create `app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 6: Session provider for client `signIn`**

Create `components/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
}
```

Wrap root `app/layout.tsx` children with `<Providers>`.

- [ ] **Step 7: Manual smoke (partial)**

With `docker compose up -d` and `npm run dev`:

1. Open `/register`, create a user — expect redirect to dashboard **or** temporary 404 if app routes not built yet (user row must exist in DB either way).
2. If dashboard 404s, confirm via Prisma Studio / SQL that the user was inserted.

```bash
npx prisma studio
```

- [ ] **Step 8: Commit**

```bash
git add app/(auth) components/login-form.tsx components/register-form.tsx components/providers.tsx app/layout.tsx
git commit -m "feat: add login and register pages"
```

---

### Task 6: Middleware + root redirect

**Files:**
- Create: `middleware.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `authConfig` / `auth` from Auth.js
- Produces: unauthenticated users cannot open app routes; authed users leaving `/` go to `/dashboard`

- [ ] **Step 1: Middleware**

Create `middleware.ts` at repo root:

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/problems/:path*",
    "/templates/:path*",
    "/login",
    "/register",
  ],
};
```

- [ ] **Step 2: Root page redirect**

Replace `app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  redirect(session?.user ? "/dashboard" : "/login");
}
```

- [ ] **Step 3: Verify redirects (manual)**

1. Logged out: visit `/dashboard` → redirected to `/login`
2. Logged in: visit `/login` → redirected to `/dashboard` (may 404 until Task 7)
3. `/` redirects appropriately

- [ ] **Step 4: Commit**

```bash
git add middleware.ts app/page.tsx
git commit -m "feat: protect app routes and redirect root by session"
```

---

### Task 7: App shell + empty-state pages

**Files:**
- Create: `components/app-sidebar.tsx`
- Create: `components/empty-state-page.tsx`
- Create: `components/logout-button.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/projects/page.tsx`
- Create: `app/(app)/problems/page.tsx`
- Create: `app/(app)/templates/page.tsx`

**Interfaces:**
- Consumes: `auth()`, `signOut`
- Produces: four navigable empty-state pages with stub New buttons (sonner toast: `"Coming soon"`)

- [ ] **Step 1: Logout button**

Create `components/logout-button.tsx`:

```tsx
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Log out
    </Button>
  );
}
```

- [ ] **Step 2: Sidebar**

Create `components/app-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/problems", label: "Problems" },
  { href: "/templates", label: "Templates" },
] as const;

export function AppSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-background">
      <div className="border-b px-4 py-5">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          MathSheets
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t p-3">
        <p className="truncate px-1 text-xs text-muted-foreground">{email}</p>
        <LogoutButton />
      </div>
    </aside>
  );
}
```

If `@/lib/utils` `cn` helper is missing after shadcn init, ensure it exists (shadcn usually adds it).

- [ ] **Step 3: Shared empty-state page**

Create `components/empty-state-page.tsx`:

```tsx
"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type EmptyStatePageProps = {
  title: string;
  description: string;
  emptyMessage: string;
  actionLabel: string;
};

export function EmptyStatePage({
  title,
  description,
  emptyMessage,
  actionLabel,
}: EmptyStatePageProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" onClick={() => toast("Coming soon")}>
          {actionLabel}
        </Button>
      </div>
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: App layout**

Create `app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";

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
    <div className="flex min-h-screen">
      <AppSidebar email={session.user.email ?? ""} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: Four pages**

`app/(app)/dashboard/page.tsx`:

```tsx
import { EmptyStatePage } from "@/components/empty-state-page";

export default function DashboardPage() {
  return (
    <EmptyStatePage
      title="Dashboard"
      description="Overview of your recent activity."
      emptyMessage="Create a project to get started"
      actionLabel="New project"
    />
  );
}
```

`app/(app)/projects/page.tsx`:

```tsx
import { EmptyStatePage } from "@/components/empty-state-page";

export default function ProjectsPage() {
  return (
    <EmptyStatePage
      title="Projects"
      description="Workbooks and sheet collections."
      emptyMessage="No projects yet"
      actionLabel="New project"
    />
  );
}
```

`app/(app)/problems/page.tsx`:

```tsx
import { EmptyStatePage } from "@/components/empty-state-page";

export default function ProblemsPage() {
  return (
    <EmptyStatePage
      title="Problems"
      description="Your reusable problem bank."
      emptyMessage="Your problem bank is empty"
      actionLabel="New problem"
    />
  );
}
```

`app/(app)/templates/page.tsx`:

```tsx
import { EmptyStatePage } from "@/components/empty-state-page";

export default function TemplatesPage() {
  return (
    <EmptyStatePage
      title="Templates"
      description="Layout and style presets for sheets."
      emptyMessage="No templates yet"
      actionLabel="New template"
    />
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add app/(app) components/app-sidebar.tsx components/empty-state-page.tsx components/logout-button.tsx
git commit -m "feat: add app shell with empty-state pages"
```

---

### Task 8: End-to-end manual verification + README

**Files:**
- Create: `README.md` (setup: Docker, env, migrate, dev)
- Modify: none required unless bugs found

**Interfaces:**
- Consumes: full skeleton
- Produces: verified definition-of-done; documented local setup

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: all PASS.

- [ ] **Step 2: Manual checklist (from spec)**

With Postgres up and `npm run dev`:

1. Register a new user → lands on Dashboard  
2. Log out → log in again with same credentials  
3. Visit `/projects` while logged out → redirected to `/login`  
4. Each nav item shows its empty state and “New …” control  
5. “New …” shows toast `"Coming soon"` — no crash  

- [ ] **Step 3: Write README**

Include:

```md
# MathSheets

SaaS skeleton for generating math problem sheets and workbooks.

## Stack

Next.js, Auth.js, Prisma, Postgres, Tailwind, shadcn/ui

## Local setup

1. `docker compose up -d`
2. Copy `.env.example` to `.env` and set `AUTH_SECRET`
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run dev` → http://localhost:3000
```

- [ ] **Step 4: Final commit**

```bash
git add README.md
git commit -m "docs: add local setup README"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Register / login / logout | 4, 5, 7 |
| Protected app routes | 6, 7 layout |
| Left nav: Dashboard, Projects, Problems, Templates | 7 |
| Empty states + stub New buttons | 7 |
| Docker Postgres | 2 |
| Auth.js + Prisma User (+ adapter tables) | 2, 4 |
| Exact error strings | 4, 5 |
| No domain CRUD / PDF / billing | honored (stubs only) |
| Manual verification | 8 |
| Optional password unit tests | 3 |

No TBD placeholders. JWT session strategy is explicit (credentials constraint). Types/signatures consistent across tasks (`registerUser` → `RegisterResult`, `EmptyStatePage` props).
