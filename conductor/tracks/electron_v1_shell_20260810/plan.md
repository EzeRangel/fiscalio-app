# Implementation Plan: Electron v1 Shell

## Phase 1: Environment, Jest Setup & Core Fixes
- [ ] Task: Fix JSDOM test failures by adding global TextEncoder polyfill in Jest configuration
- [ ] Task: Fix CFDI parser test asset UUID to conform to strict RFC 4122 validation
- [ ] Task: Verify all existing tests pass (`pnpm test`)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Environment, Jest Setup & Core Fixes' (Protocol in workflow.md)

## Phase 2: Next.js Standalone Build & Asset Copying
- [ ] Task: Update `next.config.ts` to output standalone and trace `@electric-sql/pglite` WASM assets
- [ ] Task: Write a Node/TS script to compile Next.js and copy `public` and `.next/static` assets into the standalone bundle
- [ ] Task: Validate that the standalone bundle runs independently with a test spawn
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Next.js Standalone Build & Asset Copying' (Protocol in workflow.md)

## Phase 3: Electron Main Process & IPC Server
- [ ] Task: Setup Electron main process configuration and create the entrypoint file `src/electron/main.ts`
- [ ] Task: Implement Next standalone server spawning using `utilityProcess.fork` or child process fork
- [ ] Task: Implement dynamic port acquisition (port 3120 or ephemeral) and IPC handshake for `"server-listening"`
- [ ] Task: Implement window lifecycles, native splash screen, and bounds state persistence
- [ ] Task: Implement clean shutdown logic (handling OS exits and killing child process with SIGTERM/SIGKILL)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Electron Main Process & IPC Server' (Protocol in workflow.md)

## Phase 4: PGLite Database Relocation & Backup Engine
- [ ] Task: Relocate the Next.js database storage to `app.getPath("userData")` by injecting `FISCALIO_DATA_DIR`
- [ ] Task: Call `runBootstrap` on child process boot prior to starting the HTTP server
- [ ] Task: Build the backup engine inside the child process to handle periodic PGLite backups (`dumpDataDir()` to tar.gz)
- [ ] Task: Implement backup FIFO rotation (7 days / 50 files limit)
- [ ] Task: Add test coverage for database relocation, bootstrap execution, and backup triggers
- [ ] Task: Conductor - User Manual Verification 'Phase 4: PGLite Database Relocation & Backup Engine' (Protocol in workflow.md)

## Phase 5: Upgrade/Downgrade Schema Gate & UX Polish
- [ ] Task: Implement database schema version comparison against build migrations on boot
- [ ] Task: Build a generic error HTML screen and wire it to show database corruption, child crashes, or downgrade blocks
- [ ] Task: Create minimal native menu structure
- [ ] Task: Write unit tests verifying the downgrade gate and error states
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Upgrade/Downgrade Schema Gate & UX Polish' (Protocol in workflow.md)

## Phase 6: Packaging & Auto-Update Configuration
- [ ] Task: Configure `electron-builder` targets for macOS and Windows, ensuring PGLite files are unpacked from ASAR
- [ ] Task: Integrate `electron-updater` for Windows auto-check on boot and macOS in-app update notifications
- [ ] Task: Execute test package builds and verify standalone executable functionality
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Packaging & Auto-Update Configuration' (Protocol in workflow.md)
