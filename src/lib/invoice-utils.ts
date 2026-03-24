import { InvoiceTypes } from "@/types/utils";
import { SAT_TAX_CODES, DEFAULT_TAX_RATES } from "./constants";

export interface InvoiceWithLinkage {
  invoiceType: string;
  substituteInvoiceId?: number | null;
  linkedPayments?: {
    allocations?: { id: number | string }[];
  }[];
}

/**
 * Determines if an invoice should be hidden (deduplicated) because it is linked
 * to a primary "Ingreso" invoice that already reflects the transaction.
 */
export function isInvoiceLinked(invoice: InvoiceWithLinkage): boolean {
  // 1. Hide Payment Complements (P) if they have allocations to an Ingreso
  if (
    invoice.invoiceType === "payment_issued" ||
    invoice.invoiceType === "payment_received"
  ) {
    const hasAllocations =
      invoice.linkedPayments?.some(
        (p) => p.allocations && p.allocations.length > 0
      ) || false;
    return hasAllocations;
  }

  // 2. Hide Credit Notes (E) if they are linked as a substitution
  if (
    invoice.invoiceType === "credit_note_issued" ||
    invoice.invoiceType === "credit_note_received"
  ) {
    return !!invoice.substituteInvoiceId;
  }

  return false;
}

/**
 * Derives the internal invoice type based on the CFDI type and the organization's role.
...
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
        taxCode: SAT_TAX_CODES.IVA,
        taxName: "IVA",
        rate: DEFAULT_TAX_RATES.IVA,
        factor: "Tasa",
        baseAmount: itemSubtotal.toFixed(2),
        taxAmount: (taxes * proportion).toFixed(2),
      });
    }

    if (withholdings > 0) {
      itemTaxes.push({
        taxType: "withheld",
        taxCode: SAT_TAX_CODES.ISR,
        taxName: "ISR",
        rate: DEFAULT_TAX_RATES.ISR_RESICO,
        factor: "Tasa",
        baseAmount: itemSubtotal.toFixed(2),
        taxAmount: (withholdings * proportion).toFixed(2),
      });
    }

    return { taxes: itemTaxes };
  });
}

/**
 * Calculates the creditable IVA based on total IVA and the accreditation percentage.
 * 
 * @param totalIva The total IVA amount paid
 * @param percentage The accreditation percentage (0-100)
 * @returns The calculated creditable IVA as a string formatted to 2 decimal places
 */
export function calculateCreditableIva(
  totalIva: string | number | null | undefined,
  percentage: string | number | null | undefined
): string {
  const iva =
    typeof totalIva === "string" ? parseFloat(totalIva) : totalIva || 0;
  const pct =
    typeof percentage === "string" ? parseFloat(percentage) : percentage || 0;

  if (iva <= 0 || pct <= 0) {
    return "0.00";
  }

  const result = iva * (pct / 100);
  return result.toFixed(2);
}
