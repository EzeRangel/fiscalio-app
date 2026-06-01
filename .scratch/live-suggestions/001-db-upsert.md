## What to build
Reemplazar la lógica manual de 'buscar y luego insertar/actualizar' en `suggestInvoiceClassification` por un `onConflictDoUpdate` nativo de Postgres. 

## Acceptance criteria
- [ ] Crear migración para añadir restricción `UNIQUE` en `classification_snapshots.invoice_id`.
- [ ] Refactorizar `src/data/classification-snapshots.ts` para usar el UPSERT de Drizzle.
- [ ] Validar que no se dupliquen registros en la tabla.

## Blocked by
None - can start immediately
