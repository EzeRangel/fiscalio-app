# Fixes Plan: Electron v1 Shell — bugs y desviaciones post-revisión

## Estado de implementación (2026-08-17)

**TODAS las fases implementadas y verificadas.** Detalles de las correcciones aplicadas:

- 1.1 ✓ keepalive en `shutdownHandler` (dump PGlite no sostiene el event loop). Hallazgo extra:
  el `server.js` standalone de Next registra sus propios handlers SIGTERM/SIGINT que salen al
  instante, tumbando el backup. Se resolvió con `NEXT_MANUAL_SIG_HANDLE=1` en el `env` del child
  (`server-manager.ts`), para que el shutdown lo gestione nuestro handler. Smoke validado:
  SIGTERM → se escribe `backups/Fiscalio-1.0.0-<ts>.tar.gz` (1146 entradas, raíz `/PG_VERSION`,
  `/global`, `/base`, layout correcto para `restore-engine`).
- 1.2 ✓ `electron-updater` → `dependencies`. Verificado: `app.asar` contiene
  `electron-updater@6.8.9`.
- 2.1 ✓ `outputFileTracingExcludes` `./pglite/**` + filters en `electron-builder.json`. Hallazgo
  extra: `./dist/**` (salida previa de packaging) se trazaba al standalone y electron-builder lo
  firmaba archivo por archivo (recursión) → se excluye también en `next.config.ts`.
- 2.2 ✓ `readExpectedSchemaInfo` con candidato `process.resourcesPath/.next/standalone/schema.json`.
- 3.1 ✓ logger drizzle que cuenta writes (`recordWriteOp`) en `src/db/drizzle.ts`; `backups.ts`
  usa `getActiveBackupEngine()` vía `engineFor`.
- 3.2 ✓ `src/lib/app-version.ts` (`resolveAppVersion`), usado en `BackupEngine` y `runBootstrapOnPG`.
- 3.3 ✓ upsert single-row de `app_meta.schema_version`; test de idempotencia (1 fila tras 3 boots).
- 3.4 ✓ documentado (se cubre vía shutdown backup; sin IPC en v1).
- 4.1 ✓ `checkpointPgliteDir` (PGlite dinámico + CHECKPOINT + close) antes del `cpSync`,
  con guard `isLikelyPgliteDataDir` (evita instanciar WASM contra carpetas arbitrarias).
- 4.2 ✓ `restore-engine` reescrito: `tar.x` a staging, validación `PG_VERSION`, rename atómico,
  cleanup; roundtrip test verde. Función correcta aunque sin wire a server action (decisión plan).
- 5.1 ✓ `updater.ts` con rama macOS (GitHub Releases vía `net`, `versionGreater`, dialog
  Descargar → `shell.openExternal`); Windows queda con electron-updater.

Suite: `pnpm test` 331/331 (los fallos de `src/lib/bootstrap.test.ts` en `test:pglite` son
pre-existentes/environment en HEAD). Smoke standalone y `pnpm package` verificados (ver arriba).

---

Plan de implementación derivado de la segunda revisión (2026-08-17). Ordenado por riesgo:
los bloqueantes de release van primero. Cada fase lista archivos, cambios y verificación.

## Fase 1 — Bloqueantes (sin esto no hay release)

### 1.1 Backup de cierre limpio que realmente completa

Problema verificado: al enviar `SIGTERM`, el child muere en ~1–2s, el directorio `backups/`
se crea pero el `.tar.gz` jamás se escribe (el dump PGlite tarda ~3.7s y no hay keepalive del
event loop). Aislado: con un handle de keepalive (`setInterval`) el dump completa; sin él no.

- `src/db/drizzle.ts` (`shutdownHandler`): mantener vivo el event loop durante el dump y salir explícito:
  ```ts
  const keepAlive = setInterval(() => {}, 1000);
  try { await engine.handleCleanShutdown(pg); } finally { clearInterval(keepAlive); }
  await pg.close();
  process.exit(0);
  ```
- `src/electron/server-manager.ts` (`stop()`): subir la gracia `SIGTERM→SIGKILL` de 3s a ~20s.
  Con el `process.exit(0)` del child, el SIGKILL casi nunca dispara.
- **Verificación (manual):** standalone en dir de datos fresco → request a `/onboarding` →
  `kill -TERM <pid>` → debe aparecer `backups/Fiscalio-<ver>-<ts>.tar.gz`.

### 1.2 `electron-updater` a runtime dependency

- `package.json`: mover `electron-updater` de `devDependencies` → `dependencies`.
- **Verificación:** `pnpm build:all && pnpm package` y confirmar que el `app.asar` contiene
  `node_modules/electron-updater`; la app empaquetada arranca sin pantalla de error.

## Fase 2 — Higiene del build

### 2.1 No distribuir la DB de desarrollo

Problema: `pglite/db` (datos reales del dev) se traza al standalone y viaja en el instalador.

- `next.config.ts`: añadir `outputFileTracingExcludes: { "/**": ["./pglite/**"] }`.
- `electron-builder.json`: en `extraResources`, filter que excluya `pglite/**`.
- **Verificación:** reconstruir; `.next/standalone/pglite` no debe existir.

### 2.2 `readExpectedSchemaInfo` con path empaquetado

- `src/electron/schema-gate-check.ts`: añadir candidato
  `path.resolve(process.resourcesPath, ".next", "standalone", "schema.json")`.
- **Verificación:** test unitario con el path de resources simulado.

## Fase 3 — Motor de backups operativo

### 3.1 Activar el gatillo de 100 ops y el timer de 15 min

- `src/db/drizzle.ts`: `drizzle(pg, { schema, logger })` con un logger que cuente writes
  (`insert`/`update`/`delete`) y llame `engine.recordWriteOp(pg)`. Sin tocar cada server action.
- `src/actions/backups.ts`: usar `getActiveBackupEngine()` en vez de `new BackupEngine(...)`;
  limpiar imports `fs`/`z` sin uso.
- **Verificación:** test de integración: N writes simulados → backup en el umbral; timer dispara
  solo si `writeOpsCount > 0`.

### 3.2 `appVersion` real (no hardcoded)

- Helper (en `src/lib/backup-engine.ts` o `src/lib/app-version.ts`): leer `schema.json`
  (child, cwd=standalone) → fallback `package.json.version` → fallback `"1.0.0"`.
- Usarlo en `drizzle.ts` (crear `BackupEngine`), en `performBackup` de las actions y en el gate
  de `runBootstrapOnPG` (hoy `"1.0.0"` fijo).

### 3.3 `app_meta.schema_version` sin acumular filas

- `src/lib/schema-gate.ts` y `src/electron/schema-gate.ts`: reemplazar el `INSERT` por
  update-in-place de la fila más reciente (o `ON CONFLICT` con único por `version`).

### 3.4 Backup forzado antes del auto-update (Windows)

- Decisión: se cubre vía el shutdown backup de la Fase 1 (el `quitAndInstall` provoca
  `before-quit` → SIGTERM → backup). Documentarlo; el IPC "backup a demanda" queda como
  mejora post-v1 (no bloquea el release).

## Fase 4 — Migración legacy + restore

### 4.1 Migración legacy con semántica dump/restore (#20)

- `src/electron/migration-utils.ts`: antes del `cpSync`, abrir el legacy con
  `new PGlite(legacyDir)`, `CHECKPOINT`, cerrar limpio (recupera WAL y deja el dir consistente)
  → luego copiar. Ajustar tests existentes.

### 4.2 `restore-engine` que realmente restaura

- Añadir dependencia `tar` (o extractor minimal). En `restoreBackupFromArchive`: gunzip + untar
  **dentro** de `tempRestoreDir`, validar que quedó un data-dir PGLite, luego el swap (ya existe).
- Test roundtrip: `dumpDataDir` → `restoreBackupFromArchive` → abrir PGLite y leer datos.
- Decidir si se wire a una server action; si no se usa en v1, al menos dejar la función correcta.

## Fase 5 — macOS update (#12/#19)

### 5.1 `src/electron/updater.ts`: rama por plataforma

- **macOS:** no usar `electron-updater`; en `initAutoUpdater` consultar
  `https://api.github.com/repos/EzeRangel/fiscalio-app/releases/latest` (vía `net`), comparar
  versión y si hay novedad mostrar dialog con botón "Descargar" → `shell.openExternal(releases)`.
  Aplica igual a `checkForUpdatesManual` del menú.
- **Windows:** electron-updater tal cual (ya alineado).

## Verificación final

1. `pnpm test` (323+ tests) y `pnpm lint` sobre el área tocada.
2. `pnpm build:all` + smoke manual: dir de datos fresco → 200 en `/onboarding`; SIGTERM → backup
   escrito; datos migrados si hay `pglite/db` legacy.
3. `pnpm package` (mac): asar con `electron-updater`, sin `pglite/`, arranque sin pantalla de error.