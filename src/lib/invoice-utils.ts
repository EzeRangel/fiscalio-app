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

export interface DistributedTaxEntry {
  taxType: "transferred" | "withheld";
  taxCode: string;
  taxName: string;
  rate: string;
  factor: string;
  baseAmount: string;
  taxAmount: string;
}

/**
 * Distributes header-level taxes proportionally across items based on their subtotal.
 * This is a fallback for CFDIs that do not provide item-level tax details.
 * 
 * @param totalTaxes Total transferred taxes (IVA) from header
 * @param totalWithholdings Total withheld taxes (ISR) from header
 * @param items List of invoice items with their subtotals
 * @param invoiceSubtotal The total subtotal of the invoice
 */
export function distributeHeaderTaxesToItems(
  totalTaxes: string | number | null | undefined,
  totalWithholdings: string | number | null | undefined,
  items: { subtotal: string | number }[],
  invoiceSubtotal: string | number
): { taxes: DistributedTaxEntry[] }[] {
  const taxes = typeof totalTaxes === "string" ? parseFloat(totalTaxes) : (totalTaxes || 0);
  const withholdings = typeof totalWithholdings === "string" ? parseFloat(totalWithholdings) : (totalWithholdings || 0);
  const subtotal = typeof invoiceSubtotal === "string" ? parseFloat(invoiceSubtotal) : (invoiceSubtotal || 0);

  if (subtotal <= 0) {
    return items.map(() => ({ taxes: [] }));
  }

  return items.map((item) => {
    const itemSubtotal = typeof item.subtotal === "string" ? parseFloat(item.subtotal) : (item.subtotal || 0);
    const itemTaxes: DistributedTaxEntry[] = [];
    const proportion = itemSubtotal / subtotal;

    if (taxes > 0) {
      itemTaxes.push({
        taxType: "transferred",
        taxCode: "002",
        taxName: "IVA",
        rate: "0.160000",
        factor: "Tasa",
        baseAmount: itemSubtotal.toFixed(2),
        taxAmount: (taxes * proportion).toFixed(2),
      });
    }

    if (withholdings > 0) {
      itemTaxes.push({
        taxType: "withheld",
        taxCode: "001",
        taxName: "ISR",
        rate: "0.012500",
        factor: "Tasa",
        baseAmount: itemSubtotal.toFixed(2),
        taxAmount: (withholdings * proportion).toFixed(2),
      });
    }

    return { taxes: itemTaxes };
  });
}
