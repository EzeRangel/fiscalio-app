import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  CFDI_TYPE,
  INVOICE_TYPE,
  PAYMENT_FORMS,
  PAYMENT_METHODS,
  TAX_NAMES,
  TAX_TYPES,
} from "./constants";
import { PaymentForms, PaymentMethods, TaxTypes } from "@/types/utils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCFDIType(code: keyof typeof CFDI_TYPE) {
  return CFDI_TYPE[code];
}

export function getInvoiceType(code: keyof typeof INVOICE_TYPE) {
  return INVOICE_TYPE[code];
}

export function getPaymentMethod(code: PaymentMethods) {
  return PAYMENT_METHODS[code];
}

export function getPaymentForm(code: PaymentForms) {
  return PAYMENT_FORMS[code];
}

export function getTaxType(code: TaxTypes) {
  return TAX_TYPES[code];
}

export function getTaxName(code: keyof typeof TAX_NAMES): string {
  return TAX_NAMES[code];
}

export function formatCurrency(amount: string | number) {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(numericAmount);
}

export function formatCompactNumber(number: number) {
  return new Intl.NumberFormat("es-MX", {
    notation: "compact",
    compactDisplay: "short",
  }).format(number);
}

export function delay(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    const ms = seconds * 1000;

    setTimeout(() => {
      resolve();
    }, ms);
  });
}
