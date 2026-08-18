# Specification: Electron v1 Shell Integration

## Overview
This specification details the design and functional requirements for wrapping the Fiscalio Next.js (local-first with PGLite) web application inside an Electron shell (v1). The goal is to provide a desktop executable for macOS and Windows, complete with background server spawning, PGLite data storage relocation, legacy data migration, database backup mechanisms, auto-updates, and schema upgrade protections.

## Functional Requirements
1. **Next.js Standalone Spawning**: The Electron main process must build Next.js as standalone and spawn the `.next/standalone/server.js` file as a child process using `utilityProcess.fork` (or standard process fork under `ELECTRON_RUN_AS_NODE=1`).
2. **Single-Instance Enforcement**: The app must call `app.requestSingleInstanceLock()`; a second instance must focus the existing window instead of spawning a new child process.
3. **User Data Directory**: The database must be relocated from the local workspace to `app.getPath("userData")` by injecting the directory path via the `FISCALIO_DATA_DIR` environment variable to the spawned server (`resolveDBPath` already honours this env var).
4. **Database Bootstrap**: Run Drizzle migrations and seed catalogs on boot via `runBootstrap` before the HTTP server starts listening (function already implemented).
5. **Legacy Data Migration**: On first run, if the target `userData` dir is empty and a legacy `pglite/db` source exists, migrate it idempotently via PGLite dump/restore (`dump()`/`dumpDataDir()`). Never migrate into a non-empty target.
6. **Port Resolution**: Listen on fixed port `3120` with a fallback to an ephemeral port (`0`) if the port is in use, bound to `127.0.0.1` loopback only. Broadcast the listening port via IPC `"server-listening {port}"`.
7. **Window Lifecycles & UX**:
   - Immediately display a borderless native splash screen ("Iniciando Fiscalio...").
   - Open the main `BrowserWindow` (1200×800, min 1024×700) only after the `"server-listening"` signal is received, within a 30s startup timeout (on timeout, show the generic error screen).
   - Persist window position and size bounds in `userData/window-state.json`.
   - macOS window close keeps application in dock; Windows close quits.
   - Clean shutdown must capture the exit signals and send `SIGTERM` followed by a `SIGKILL` timeout to the child process.
8. **Application Logs**: Write Electron main-process and child errors to `userData/logs`.
9. **Automatic Backups**:
   - Perform a PGLite CHECKPOINT on every clean close.
   - Backups (`dumpDataDir()` to tar.gz) on clean close, every 15 minutes of write activity, and every 100 database operations.
   - Backups must be stored under `userData/backups/Fiscalio-<appVersion>-<ts>.tar.gz`.
   - Maintain a FIFO rotation policy: max 7 days of backups or 50 total files.
   - Expose backup/checkpoint to the main process via IPC on demand, and force a backup right before applying an auto-update (Windows).
10. **Downgrade Schema Gate**:
    - `app_meta.schema_version` (current DB migration count) is created by bootstrap, outside the vanilla Drizzle migration run, to avoid a circular init dependency.
    - The build emits a `schema.json` artifact with the expected migration count, bundled with the standalone output.
    - On boot, compare build migrations against `app_meta.schema_version`. If the DB schema is newer than the build migrations count, prevent starting and display a generic error screen directing the user to download the latest version from GitHub Releases.
11. **Auto-Updates**:
    - Product identity: `productName: "Fiscalio"`, version `v1.0.0`, `CHANGELOG.md` (Keep a Changelog), with a documented manual release process.
    - Package targets covering: Windows NSIS (`.exe` + `latest.yml` + `.blockmap`) with unsigned auto-update via `electron-updater` (`provider: github`, omitting `publisherName` validation, auto-check on boot plus a manual button); macOS `.dmg` + `.zip` + `latest-mac.yml` (unsigned).
    - In-app notification for macOS when a newer version is available on GitHub Releases (since macOS auto-update requires Developer ID signature).

## Non-Functional Requirements
- **Performance**: Startup timeout of 30 seconds for the child process server.
- **Testing**: Fix existing Jest test failures (JSDOM environment lacking `TextEncoder`/`TextDecoder`; invalid UUID structure in `cfdi-parser` test asset; stale "invalid XML content" error assertion). Fix new code with unit tests (>80% coverage).
- **Security**: The child process runs with minimal privileges and only accesses the local loopback network interface. No secrets committed to the repo.

## Acceptance Criteria
- Executables compile successfully for macOS and Windows.
- Launching the app starts the native splash screen, spins up the Next standalone server, relocates the DB to user data, migrates any legacy `pglite/db` on first run, runs migrations, and opens the app UI.
- A second launch focuses the existing window (single instance).
- Closing the app kills the child process cleanly and triggers a checkpoint and database backup.
- Downgrades are correctly prevented and show the update redirection screen.
- Backups are rotated (7 days / 50 files) and forced before applying a Windows auto-update.
- All unit tests pass.

## Out of Scope
- Linux target.
- Code signing / Apple Developer ID certificate in v1 (updates are unsigned).
- Custom tray icon.