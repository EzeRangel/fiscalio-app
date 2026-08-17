# Implementation Plan: Electron v1 Shell

## Phase 1: Environment, Jest Setup & Core Fixes [checkpoint: e9b067d]
- [x] Task: Fix JSDOM test failures by adding global TextEncoder polyfill in Jest configuration a1fc88f
- [x] Task: Fix CFDI parser test asset UUID to conform to strict RFC 4122 validation (variant nibble: `8`/`9`/`a`/`b`) edfe522
- [x] Task: Fix the failing "should throw an error for invalid XML content" assertion in `cfdi-parser.test.ts` (expected `Error al procesar XML: The document is not a CFDI`, parser now throws `CFDI inválido: ...`; align parser or assertion deliberately) 8e43b76
- [x] Task: Verify all existing tests pass (`pnpm test`)
- [x] Task: Verify the isolated PGLite suite passes (`pnpm test:pglite`)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment, Jest Setup & Core Fixes' (Protocol in workflow.md) e9b067d

## Phase 2: Next.js Standalone Build & Asset Copying [checkpoint: ff7744e]
- [x] Task: Update `next.config.ts` to output standalone and trace `@electric-sql/pglite` WASM assets 6db3af3
- [x] Task: Write a Node/TS script to compile Next.js and copy `public` and `.next/static` assets into the standalone bundle 8ff91d1
- [x] Task: Validate that the standalone bundle runs independently with a test spawn f8bec05
- [x] Task: Conductor - User Manual Verification 'Phase 2: Next.js Standalone Build & Asset Copying' (Protocol in workflow.md) ff7744e

## Phase 3: Electron Main Process & IPC Server
- [x] Task: Add Electron toolchain devDependencies (`electron`, `electron-builder`, `electron-updater`) a85bec4
- [ ] Task: Setup Electron main process configuration and create the entrypoint file `src/electron/main.ts`
- [ ] Task: Implement Next standalone server spawning using `utilityProcess.fork` or child process fork
- [ ] Task: Implement dynamic port acquisition (fixed `3120` or ephemeral fallback) bound to `127.0.0.1` loopback, and IPC handshake for `"server-listening"`
- [ ] Task: Enforce `app.requestSingleInstanceLock()` — a second instance must focus the existing window instead of spawning a new child
- [ ] Task: Implement window lifecycles, native splash screen, bounds state persistence, and 30s "server-listening" timeout
- [ ] Task: Implement clean shutdown logic (handling OS exits and killing child process with SIGTERM/SIGKILL)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Electron Main Process & IPC Server' (Protocol in workflow.md)

## Phase 4: PGLite Database Relocation, Migration & Backup Engine
- [ ] Task: Wire `FISCALIO_DATA_DIR` into the child spawn so the server DB points to `app.getPath("userData")` (`resolveDBPath` is already implemented and tested)
- [ ] Task: Hook `runBootstrap` into the standalone child boot before the HTTP server starts listening (function already implemented)
- [ ] Task: Implement legacy data migration from `pglite/db` → `userData` on first run (detect legacy source, migrate only if target is empty, idempotent; decision #20)
- [ ] Task: Build the backup engine inside the child process: CHECKPOINT on clean close, periodic backups (`dumpDataDir()` → tar.gz) on a 15-min write timer and every 100 DB operations
- [ ] Task: Implement backup FIFO rotation (7 days / 50 files limit)
- [ ] Task: Expose backup/checkpoint to the main process via IPC on demand, and force a backup right before applying an auto-update (Windows)
- [ ] Task: Add test coverage for database relocation, bootstrap execution, legacy migration, and backup triggers
- [ ] Task: Conductor - User Manual Verification 'Phase 4: PGLite Database Relocation, Migration & Backup Engine' (Protocol in workflow.md)

## Phase 5: Upgrade/Downgrade Schema Gate & UX Polish
- [ ] Task: Create `app_meta.schema_version` table via bootstrap (outside vanilla Drizzle migrations, to avoid a circular init dependency; decision #21)
- [ ] Task: Emit `schema.json` (expected build migration count) as part of the Next.js standalone build
- [ ] Task: Implement database schema version comparison (build migrations vs `app_meta.schema_version`) on boot; on downgrade block startup and redirect to GitHub Releases
- [ ] Task: Build a generic error HTML screen and wire it to show database corruption, child crashes, or downgrade blocks; write main-process logs to `userData/logs`
- [ ] Task: Create minimal native menu structure (macOS App/Edit/View/Window; Windows File/View/Window hideable with Alt)
- [ ] Task: Write unit tests verifying the downgrade gate and error states
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Upgrade/Downgrade Schema Gate & UX Polish' (Protocol in workflow.md)

## Phase 6: Packaging & Auto-Update Configuration
- [ ] Task: Configure `electron-builder` with identity `productName: "Fiscalio"`, ensuring PGLite files are unpacked from ASAR (`asarUnpack`)
- [ ] Task: Configure build targets: Windows NSIS (`.exe` + `latest.yml` + `.blockmap`); macOS `.dmg` + `.zip` + `latest-mac.yml` (unsigned)
- [ ] Task: Integrate `electron-updater` with `provider: github` for Windows auto-check on boot plus a manual button, and macOS in-app update notifications
- [ ] Task: Bump version to `v1.0.0` in `package.json` and add `CHANGELOG.md` (Keep a Changelog); document the manual release process
- [ ] Task: Execute test package builds and verify standalone executable functionality
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Packaging & Auto-Update Configuration' (Protocol in workflow.md)