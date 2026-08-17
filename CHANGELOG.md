# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-17

### Added
- **Desktop Electron Shell**: Full offline desktop application shell for macOS and Windows.
- **Standalone Next.js Backend**: Embedded production bundle with dynamic port binding (`3120` with ephemeral fallback) on `127.0.0.1`.
- **Embedded PGLite Relocation**: Local database relocated safely to OS `userData/data` with single-instance locking (`requestSingleInstanceLock`).
- **Legacy Migration & Auto-Bootstrap**: Automatic idempotent migration from `./pglite/db` on first run and automated schema catalog seeding.
- **Automated Backup Engine**: Periodic `.tar.gz` dumps using `PGlite.dumpDataDir()` with 7-day daily and 12-month monthly retention rotation.
- **Manual Backups & Restores**: Server actions and restore engine for manual database exports and safe staged restoration.
- **Schema Protection & Downgrade Gate**: `app_meta.schema_version` verification preventing execution of outdated binaries on newer database schemas.
- **Auto-Update Integration**: Integration with `electron-updater` via GitHub Releases for update notifications and auto-installs.
- **Native OS Integration**: macOS and Windows native menus, dock lifecycles, and window state persistence (`window-state.json`).
