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
