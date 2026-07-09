import {
  INVOICE_TYPE,
  PAYMENT_FORMS,
  PAYMENT_METHODS,
  TAX_TYPES,
  PAYMENT_TYPE,
} from "@/lib/constants";

export type InvoiceTypes = keyof typeof INVOICE_TYPE;

export type PaymentTypes = InvoiceTypes | keyof typeof PAYMENT_TYPE;

export type PaymentMethods = keyof typeof PAYMENT_METHODS;

export type PaymentForms = keyof typeof PAYMENT_FORMS;

export type TaxTypes = keyof typeof TAX_TYPES;
