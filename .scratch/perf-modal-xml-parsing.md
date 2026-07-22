# Performance: Modal de vinculación parsea XML de cada complemento

## Problema

`getUnlinkedPaymentComplements` parsea el XML completo de cada complemento de pago (usando `@nodecfdi/cfdi-to-json`) cada vez que se abre el modal. Con ~100 complementos, son 100 parses de XML que pueden tomar segundos.

## Causa raíz

El filtro actual recorre todos los complements no cancelados del partner, parsea su XML, extrae `<Pago>` → `<DoctoRelacionado>`, y busca si algún `IdDocumento` coincide con el `folioFiscal` de la factura actual. El parseo ocurre en cada apertura del modal.

## Solución propuesta

Agregar columna `referencedFolios: text[]` en `payments` (arreglo de UUIDs de facturas Ingreso que este payment referencia). Llenarla al importar en `savePaymentComplement`. El modal filtra con operador PostgreSQL `@>` (array contains) sin parsear XML.

### Archivos a modificar

- `src/db/schema/payments.ts` — agregar columna
- `src/data/payments.ts` — llenar en `savePaymentComplement`; usar `@>` en `getUnlinkedPaymentComplements`; `processPendingAllocations` mantiene parseo (solo en linking, no en modal)
- Migración Drizzle (`pnpm db:generate`)

### Caso borde

Complements sin payment registrado aún requieren parseo XML (son pocos/frecuencia baja).
