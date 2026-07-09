import { z } from "zod";

export const SAT_CANCELLATION_MOTIVES = {
  "01": "Comprobante emitido con errores con relación",
  "02": "Comprobante emitido con errores sin relación",
  "03": "No se llevó a cabo la operación",
  "04": "Operación nominativa relacionada en la factura global",
} as const;

export type SatCancellationMotive = keyof typeof SAT_CANCELLATION_MOTIVES;

export const cancellationRequestSchema = z.object({
  invoiceId: z.number(),
  reasonCode: z.enum(["01", "02", "03", "04"]),
  cancellationReason: z.string().min(1, "La descripción del motivo es requerida"),
  substituteInvoiceUuid: z.string().uuid().optional().nullable(),
});

export type CancellationRequest = z.infer<typeof cancellationRequestSchema>;

export const registerRefundSchema = z.object({
  invoiceId: z.number(),
  amount: z.string().refine((v) => parseFloat(v) > 0, {
    message: "El monto debe ser mayor a cero",
  }),
  paymentDate: z.date(),
  paymentMethod: z.string().min(1, "El método de pago es requerido"),
  referenceNumber: z.string().optional().nullable(),
  bankAccountId: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type RegisterRefund = z.infer<typeof registerRefundSchema>;
