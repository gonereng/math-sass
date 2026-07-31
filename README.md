# MathSheets

SaaS skeleton for generating math problem sheets and workbooks.

## Stack

Next.js, Auth.js, Prisma, Postgres, Tailwind, shadcn/ui

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose)
- Node.js 20+

## Local setup

1. Start Postgres:

   ```bash
   docker compose up -d
   ```

   Postgres listens on host port **5433** (mapped from container 5432). This avoids conflicting with a local Postgres install that often uses 5432. If you change `docker-compose.yml` to map `5432:5432` while another Postgres is running on 5432, the container will fail to start or your app will connect to the wrong database.

2. Copy environment variables:

   ```bash
   copy .env.example .env
   ```

   Set a strong random value for `AUTH_SECRET` (e.g. `openssl rand -base64 32`). Keep `DATABASE_URL` pointed at `localhost:5433` as in `.env.example`:

   ```
   DATABASE_URL="postgresql://mathsaas:mathsaas@localhost:5433/mathsaas"
   ```

3. Install dependencies and apply migrations:

   ```bash
   npm install
   npx prisma migrate dev
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start Next.js dev server |
| `npm test`     | Run Vitest unit tests    |
| `npm run lint` | ESLint                   |
| `npm run build`| Production build         |

## Auth flow

Register at `/register`, sign in at `/login`. Protected routes (`/dashboard`, `/projects`, `/problems`, `/templates`) require a session. Domain CRUD is stubbed — "New …" buttons show a "Coming soon" toast.
