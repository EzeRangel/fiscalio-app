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
  "cfdiType" | "currency" | "paymentForm" | "partnerId" | "invoiceType"
> & {
  items: {
    productServiceKey: string | null;
  }[];
  taxes: {
    taxCode: string; // 002 (IVA), 001 (ISR), 003 (IEPS)
    taxType: string; // transferred, withheld
    rate: number;
  }[];
  partnerRfc: string | null;
};

export type DerivedEngineInvoice = EngineInvoice & {
  // Partner
  partnerType: "foreign" | "national";
  hasRfc: boolean;

  // Currency
  isForeignCurrency: boolean;
  isUSD: boolean;

  // Items
  itemCount: number;
  hasServiceItems: boolean;
  hasMixedItems: boolean; // e.g. Products + Services

  // Taxes
  hasVat: boolean;
  hasIsr: boolean;
  hasIeps: boolean;

  vatRate: number | "mixed" | "exempt" | null; // e.g., 0.16, 0.00, 'mixed'

  isrRetained: boolean;
  vatRetained: boolean;

  // CFDI
  isIncome: boolean;
  isExpense: boolean;
};

export type PatternCandidateStatus = "candidate" | "promoted" | "rejected";

export type PatternCandidate = {
  id: number;
  organizationId: number;
  featureSetHash: string;
  features: Partial<DerivedEngineInvoice>;
  proposedAccountId: string;
  evidenceCount: number;
  consistencyRate: number;
  confidenceScore: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  status: PatternCandidateStatus;
};
