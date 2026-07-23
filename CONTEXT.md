# Domain Glossary

## Invoice Status

- **active**: Factura vigente. Estado inicial. Transita a `cancelled` o `substituted`.
- **cancelled**: Factura cancelada sin sustituta. Terminal. Visible en listas con badge rojo.
- **substituted**: Factura cancelada con factura sustituta. Terminal. Oculta de listas por defecto; accesible desde la sustituta vía link.

## Payment Status

State machine: `pending → partial → paid → refunded`

- **pending**: Sin pagos registrados.
- **partial**: Pagos registrados pero menores al total.
- **paid**: Pagos cubren el total.
- **refunded**: Factura cancelada con devolución. Terminal.

## Cancellation Motives (SAT)

Catálogo cerrado de 4 motivos:
- **01**: Comprobante emitido con errores sin relación (requiere sustituta)
- **02**: Comprobante emitido con errores con relación (no requiere sustituta)
- **03**: No se llevó a cabo la operación (requiere refund si `amountPaid > 0`)
- **04**: Operación nominativa relacionada en la factura global

## Refund

Pago de devolución registrado en `payments` con `isRefund = true`, `paymentType = "refund"`, `amount > 0`, sin allocations. Vinculado a la factura cancelada vía `refundedInvoiceId`. Solo se permiten refunds totales (no parciales). Requisito previo para cancelar con motivo 03 cuando `amountPaid > 0`.

## Substitute Invoice

Factura que reemplaza a una cancelada (motivo 01/02). Se selecciona por UUID (`folioFiscal`) en el diálogo de cancelación. Al confirmar, las `paymentAllocations` de la original se reasignan a la sustituta.

## Tax Adjustment

Ajuste fiscal creado automáticamente al registrar un refund con motivo 03. Representa la compensación de ingresos previamente declarados. Se aplica manualmente a una declaración (`appliedInDeclarationId`), no modifica cálculos automáticos.

## Validación de Cancelación (INT-CAN)

Reglas que se ejecutan pre-transacción en el server action:
- **INT-CAN-01**: Cancelación con pagos sin refund previo (bloquea)
- **INT-CAN-02**: Motivo 01/02 sin `substituteInvoiceId` (bloquea)
- **INT-CAN-03**: Monto del refund excede `amountPaid` original (bloquea)

## Tax Declaration

Estado fiscal calculado para un período. Representa una estimación informativa de impuestos (ISR/IVA) bajo régimen RESICO.

## Declaration Status

Máquina de estados: `draft → validated → filed`

| Estado | DB value | Significado |
|---|---|---|
| Borrador | `draft` | Creado pero no revisado |
| Verificada | `validated` | Usuario confirmó cálculos |
| Exportada | `exported` | Archivo generado (no implementado aún) |
| Finalizada | `filed` | Presentada ante el SAT (acuse registrado) |

El historial muestra todos los estados en lista plana ordenada por período descendente, excluyendo el período actual.

## Payment Complement (Complemento de Pago)

Factura de tipo `payment_issued` / `payment_received` (`cfdiType = "P"`). Corresponde al XML de Complemento de Pago del SAT. Contiene uno o más nodos `Pago` y cada pago referencia una o más facturas Ingreso mediante `DoctoRelacionado`. Se importa antes o después de la Ingreso; si se importa antes, el linking queda pendiente.

## CFDI Types

Tipos de comprobante fiscal según el catálogo SAT `c_TipoDeComprobante`:

- **I (Ingreso)**: Ingresos por venta de bienes o servicios. Aplica reglas de integridad comercial (INV-03, INV-04, INT-INV-06) y retenciones ISR.
- **E (Egreso)**: Egresos o notas de crédito. Mismas reglas que Ingreso.
- **P (Pago)**: Complemento de Pago. No representa ingresos/egresos en sí mismo. Se exenta de reglas de integridad comercial (INV-03, INV-04, INT-INV-06) y no requiere tipo de cambio para moneda "XXX".
- **N (Nómina)**: Recibo de nómina. No es un comprobante de ingresos comercial. Mismas exenciones que P.
- **T (Traslado)**: Traslado de mercancía (no genera ingresos). Mismas exenciones que P.

## DoctoRelacionado

Elemento SAT dentro del Complemento de Pago que declara una factura Ingreso vinculada al pago. Contiene `IdDocumento` (folioFiscal UUID de la Ingreso), `ImpPagado` (monto pagado), `NumParcialidad` (número de parcialidad). Es la fuente de verdad para las `paymentAllocations`.
