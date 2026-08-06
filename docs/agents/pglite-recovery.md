# PGLite data dir recovery runbook

Hard-won operational knowledge for the embedded local PostgreSQL (PGLite) used by this app.

## Ground rules (avoid causing this)

- **Single-writer per data dir.** PGLite allows only ONE live connection to a given
  data directory. Opening `pglite/db` with a second `new PGlite(...)` /
  `PGlite.create(...)` while anything else has it open trips a WASM
  `RuntimeError: Aborted()` and corrupts `pg_control`.
- **Never open `pglite/db` directly for inspection** unless you first confirm nobody
  else is using it:
  `ps aux | grep -iE "next|tsx|server\.js"`, plus `lsof pglite/db`.
- Always `debug: 3` on `PGlite` so the real postgres message surfaces instead of the
  opaque `Aborted()`: `new PGlite(dataDir, { debug: 3 })`.

## Symptoms of a torn checkpoint

- Any open attempt fails with `RuntimeError: Aborted()` (WASM).
- With `debug: 3` you get the real cause:
  ```
  LOG:  invalid record length at 0/B53820: expected at least 24, got 1
  LOG:  invalid checkpoint record
  PANIC:  could not locate a valid checkpoint record
  ```
- A stale, invalid `postmaster.pid` may also be present (`ps` shows no process).

## Recovery procedure (do it on a COPY, never the live dir)

1. **Confirm nothing holds the DB**, then make a cold copy:
   `cp -R pglite/db /tmp/pglite-recovery && rm -f /tmp/pglite-recovery/postmaster.pid`

2. Reset WAL/control with **the same PG major version as the cluster (17)**.
   The project only ships PG 14 via Homebrew, and `pg_resetwal` refuses on a wrong
   major. Use the `postgres:17` Docker image. `pg_resetwal` can't run as root, so
   chown to the container `postgres` user (uid 999) first, then back to the local user:
   ```bash
   docker run --rm -v /tmp/pglite-recovery:/pgdata:rw postgres:17 chown -R 999:999 /pgdata
   docker run --rm -u 999:999 -v /tmp/pglite-recovery:/pgdata:rw postgres:17 pg_resetwal -f /pgdata
   chown -R "$(whoami)" /tmp/pglite-recovery && chmod -R u+rwX /tmp/pglite-recovery
   rm -f /tmp/pglite-recovery/postmaster.pid
   ```

3. **Verify all tables read cleanly** with PGLite:
   `new PGlite("/tmp/pglite-recovery")`, listing `pg_tables` and `count(*)` each.

4. **Back up durable** (tar.gz via PGLite `dumpDataDir()`), never rely on `/tmp`:
   ```
   const db = new PGlite("/tmp/pglite-recovery");
   const blob = await db.dumpDataDir();           // -> Blob (t.gz of whole data dir)
   writeFile(`pglite/backups/recovered-<date>.tar.gz`, Buffer.from(await blob.arrayBuffer()));
   ```

5. **Swap into place** (preserve the broken original as `pglite/db-broken-<date>`):
   ```bash
   mv pglite/db pglite/db-broken-<date>
   cp -R /tmp/pglite-recovery pglite/db
   rm -f pglite/db/postmaster.pid && chmod -R u+rwX pglite/db
   ```

6. Re-verify with a probe script, then start `pnpm dev`.

## Success case (2026-08-06)
`pg_resetwal` recovered the developer DB with **no data loss** — even the most
recently uploaded invoice was intact. The crash only affected the WAL/checkpoint,
not the heap. Artifacts remain under `pglite/backups/`
(`recovered-20260806.tar.gz`, `broken-original-20260806.tar.gz`) and `pglite/db-broken-20260806/`.

## Notes that save time
- PGLite API surface on the installed version is **instance** methods:
  `db.dumpDataDir(compression?)`, `db.dumpTar(dbname)`, `db.dump()`, `db.restore()`.
  There is **no** top-level `dump` / `dumpDataDir` export.
- `pg_dump` (system 14 or Docker 17) **cannot** connect to PGLite (embedded WASM, no
  TCP listener). All copy/restore must go through the PGLite instance APIs.