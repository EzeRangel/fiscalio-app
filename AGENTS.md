# Agent skills

### Domain docs

Single-context layout (`conductor/product.md` + `conductor/tracks/`). See `docs/agents/domain.md`.

---

# Repo guide

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui (new-york), Lucide icons. pnpm (required, see `.nvmrc` for Node 22.13.0).

PGLite (embedded local PostgreSQL) + Drizzle ORM. No remote DB. DB lives at `pglite/db`, path resolved from `cwd`.

## Commands

| Command                  | Purpose                             |
| ------------------------ | ----------------------------------- |
| `pnpm dev`               | Start dev server (Turbopack)        |
| `pnpm build`             | Production build                    |
| `pnpm lint`              | ESLint                              |
| `pnpm test`              | Jest (coverage on)                  |
| `pnpm test:watch`        | Jest watch mode                     |
| `pnpm db:generate`       | Drizzle migrate + seed              |
| `pnpm db:seed:rules`     | Migrate + seed classification rules |
| `pnpm db:seed:accounts`  | Backfill chart of accounts          |
| `pnpm db:seed:test-data` | Seed test data                      |
| `pnpm db:backfill:pue`   | Backfill PUE payments               |

No dedicated typecheck script; `tsc --noEmit` can be used ad-hoc.

## Architecture

```
src/
  app/           -- routes (App Router)
  actions/       -- server actions (next-safe-action, "use server")
  data/          -- data access layer (server-only, uses getDB())
  lib/           -- utilities, actionClient, engines
  components/    -- React components (shadcn/ui style)
  hooks/         -- custom hooks
  types/         -- shared TS types
  db/
    schema/      -- Drizzle table definitions
    migrations/  -- generated migrations
    drizzle.ts   -- lazy singleton getDB()
  scripts/       -- seed / backfill scripts
```

## Key conventions

- **Server actions** use `actionClient` from `@/lib/safe-action` with Zod input schemas that mirror DB column types/nullability.
- **Client data fetching** uses TanStack Query (`useQuery`), not `useEffect`.
- **Forms** bind `next-safe-action` `execute` to `<form action>`, name inputs to match Zod schema keys, use dot-notation for nested objects (`name="address.street"`).
- **DB access** is server-only (`import "server-only"` in `src/data/` files). Uses lazy singleton `getDB()` from `@/db/drizzle`.
- **Middleware** in `src/proxy.ts` handles org-based onboarding redirect via `activeOrganizationId` cookie.
- **Path alias**: `@/*` → `./src/*`.

## Testing quirks

- Jest with `next/jest`, `ts-jest` for ESM transforms.
- `transformIgnorePatterns` exempts `.pnpm`, `@nodecfdi`, `next-safe-action`, `@electric-sql`, `drizzle-orm`.
- Test files co-located (`*.test.ts`, `*.test.tsx`) or in `__tests__/`.
- `clearMocks: true`, coverage collected.

## Important hard-earned context

- **Classification engine** lives in `src/lib/classification-engine.ts`. Two critical constants in `src/actions/classification-rules.ts`: `LEARNING_RATE` (confidence boost change per feedback) and `DOMINANT_EVIDENCE_THRESHOLD` (minimum match strength for penalization).
- **`.env`** only contains `DATABASE_NAME=fdi_asistant`.
- **No CI/CD workflows** found in repo.
- **`conductor/workflow.md`** documents TDD-driven workflow with phase checkpoints, git notes, and plan.md conventions. New work should follow it.
- **`conductor/archive/`** holds past ADRs/pitch docs (20 entries as of writing); skim relevant ones before touching those areas.
- **`GEMINI.md`** has additional detail (classification engine, form patterns, data flow principles) worth reading for deeper context on specific subsystems.
