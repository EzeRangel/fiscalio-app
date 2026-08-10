# Specification: Electron v1 Shell Integration

## Overview
This specification details the design and functional requirements for wrapping the Fiscalio Next.js (local-first with PGLite) web application inside an Electron shell (v1). The goal is to provide a desktop executable for macOS and Windows, complete with background server spawning, PGLite data storage relocation, database backup mechanisms, auto-updates, and schema upgrade protections.

## Functional Requirements
1. **Next.js Standalone Spawning**: The Electron main process must build Next.js as standalone and spawn the `.next/standalone/server.js` file as a child process using `utilityProcess.fork` (or standard process fork under `ELECTRON_RUN_AS_NODE=1`).
2. **User Data Directory**: The database must be relocated from the local workspace to `app.getPath("userData")` by injecting the directory path via the `FISCALIO_DATA_DIR` environment variable to the spawned server.
3. **Database Bootstrap**: Run Drizzle migrations and seed catalogs on boot via `runBootstrap` before the HTTP server starts listening.
4. **Port Resolution**: Listen on fixed port `3120` with a fallback to an ephemeral port (`0`) if the port is in use. Broadcast the listening port via IPC `"server-listening {port}"`.
5. **Window Lifecycles & UX**:
   - Immediately display a borderless native splash screen ("Iniciando Fiscalio...").
   - Open the main `BrowserWindow` (1200×800, min 1024×700) only after the `"server-listening"` signal is received.
   - Persist window position and size bounds in `userData/window-state.json`.
   - macOS window close keeps application in dock; Windows close quits.
   - Clean shutdown must capture the exit signals and send `SIGTERM` followed by a `SIGKILL` timeout to the child process.
6. **Automatic Backups**:
   - Perform PGLite DB checkpoints and backups (`dumpDataDir()`) on clean exit, every 15 minutes of write activity, and every 100 database operations.
   - Backups must be stored under `userData/backups/Fiscalio-<appVersion>-<ts>.tar.gz`.
   - Maintain a FIFO rotation policy: max 7 days of backups or 50 total files.
7. **Downgrade Schema Gate**:
   - Count build migrations and compare them against `app_meta.schema_version`.
   - If the DB schema is newer than the build migrations count, prevent starting and display a generic error screen directing the user to download the latest version from GitHub Releases.
8. **Auto-Updates**:
   - Unsigned NSIS auto-updater on Windows via `electron-updater` (omitting `publisherName` validation).
   - In-app notification for macOS when a newer version is available on GitHub Releases (since macOS auto-update requires Developer ID signature).

## Non-Functional Requirements
- **Performance**: Startup timeout of 30 seconds for the child process server.
- **Testing**: Fix existing Jest test failures (JSDOM environment lacking `TextEncoder`/`TextDecoder`, and invalid UUID structure in `cfdi-parser` test asset). Fix new code with unit tests (>80% coverage).
- **Security**: The child process runs with minimal privileges and only accesses local loopback network interface.

## Acceptance Criteria
- Executables compile successfully for macOS and Windows.
- Launching the app starts the native splash screen, spins up the Next standalone server, relocates the DB to user data, runs migrations, and opens the app UI.
- Closing the app kills the child process cleanly and triggers database backups.
- Downgrades are correctly prevented and show the update redirection screen.
- All unit tests pass.

## Out of Scope
- Linux target.
- Code signing / Apple Developer ID certificate in v1 (updates are unsigned).
- Custom tray icon.
