import { Invoice } from "./invoices";

export type ClassificationCandidate = {
  accountCode: string;
  costCenter?: string | null;
  department?: string | null;
  score: number;
  evidence: Evidence[];
};

export type Evidence = {
  ruleName: string;
  ruleType: string;
  confidenceBoost: number;
  priority: number;
  matchStrength: number;
};

// The full invoice type is complex, so we'll define a subset for the engine
// This also helps decoupling the engine from the database schema
export type EngineInvoice = Pick<
  Invoice,
  "cfdiType" | "currency" | "paymentForm" | "partnerId"
> & {
  items: {
    productServiceKey: string | null;
  }[];
  taxes: {
    rate: number;
  }[];
  partnerRfc: string | null;
};
