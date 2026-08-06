# Agent skills

### Issue tracker

Work for this repo is tracked as GitHub Issues on `EzeRangel/fiscalio-app`. Use the `gh` CLI for all operations. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles with standard names (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

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

- **PGLite is single-writer per data dir**: NEVER open `pglite/db` with a second `new PGlite(...)`/`PGlite.create(...)` while the dev server or any other process has it open. It trips the WASM `RuntimeError: Aborted()` and corrupts `pg_control` (PANIC "could not locate a valid checkpoint record" on next start). Always `pg` `ps aux | grep next|tsx` before opening; use `debug: 3` on `PGlite` to surface the real postgres error. See `docs/agents/pglite-recovery.md` for the full recovery runbook.
- **PGLite 0.3.14 (installed) HAS dump APIs**: instance methods `db.dumpDataDir(compression?)` → `Blob` (t.gz of the whole data dir) and `db.dumpTar(dbname)`; there is no top-level `dump`/`dumpDataDir` export. `pg_dump` (system or Docker) cannot connect to PGLite (embedded/WASM, no TCP).
- **Local DB recovery note (2026-08-06)**: the dev DB got a torn-checkpoint crash while experiments ran against the live dir; recovered with `pg_resetwal -f` (Postgres 17 via `docker run postgres:17`, since Homebrew has only PG 14) on a COPY, then `chown` back to the user. No data lost. Artifacts preserved in `pglite/backups/` (`recovered-20260806.tar.gz`, `broken-original-20260806.tar.gz`) and the pre-swap dir lives at `pglite/db-broken-20260806/`.
- **Classification engine** lives in `src/lib/classification-engine.ts`. Two critical constants in `src/actions/classification-rules.ts`: `LEARNING_RATE` (confidence boost change per feedback) and `DOMINANT_EVIDENCE_THRESHOLD` (minimum match strength for penalization).
- **`.env`** only contains `DATABASE_NAME=fdi_asistant`.
- **No CI/CD workflows** found in repo.
- **`conductor/workflow.md`** documents TDD-driven workflow with phase checkpoints, git notes, and plan.md conventions. New work should follow it.
- **`conductor/archive/`** holds past ADRs/pitch docs (20 entries as of writing); skim relevant ones before touching those areas.
- **`GEMINI.md`** has additional detail (classification engine, form patterns, data flow principles) worth reading for deeper context on specific subsystems.
