import { InvoiceTypes } from "@/types/utils";

/**
 * Derives the internal invoice type based on the CFDI type and the organization's role.
 * 
 * @param cfdiType The SAT CFDI type (I, E, P, N, T)
 * @param isEmitter Whether the organization is the emitter of the document
 * @returns A descriptive InvoiceTypes string
 */
export function deriveInvoiceType(
  cfdiType: string,
  isEmitter: boolean
): InvoiceTypes {
  switch (cfdiType) {
    case "I":
      return isEmitter ? "income" : "expense";
    case "E":
      return isEmitter ? "credit_note_issued" : "credit_note_received";
    case "P":
      return isEmitter ? "payment_issued" : "payment_received";
    case "N":
      return isEmitter ? "payroll_issued" : "payroll_received";
    case "T":
      return isEmitter ? "transfer_issued" : "transfer_received";
    default:
      return isEmitter ? "income" : "expense";
  }
}
