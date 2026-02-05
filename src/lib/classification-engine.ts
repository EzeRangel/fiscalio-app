import { createHash } from "crypto";
import { GENERIC_RFCS } from "./constants";
import { Rule, MatchCriteria } from "@/types/classification-rules";
import {
  ClassificationCandidate,
  EngineInvoice,
  DerivedEngineInvoice,
  Evidence,
} from "@/types/classification-engine";

export function deriveEngineInvoice(
  invoice: EngineInvoice
): DerivedEngineInvoice {
  const isUSD = invoice.currency === "USD";
  const isForeignCurrency = invoice.currency !== "MXN";

  const partnerType =
    invoice.partnerRfc === GENERIC_RFCS.FOREIGN ? "foreign" : "national";
  const hasRfc =
    !!invoice.partnerRfc && invoice.partnerRfc !== GENERIC_RFCS.PUBLIC;

  const itemCount = invoice.items.length;
  // Service codes in SAT usually start with 7, 8, 9
  const hasServiceItems = invoice.items.some(
    (item) => item.productServiceKey && /^[789]/.test(item.productServiceKey)
  );
  // Product codes in SAT usually start with 1-6
  const hasProductItems = invoice.items.some(
    (item) => item.productServiceKey && /^[123456]/.test(item.productServiceKey)
  );
  const hasMixedItems = hasServiceItems && hasProductItems;

  // Tax Analysis
  const hasVat = invoice.taxes.some((t) => t.taxCode === "002");
  const hasIsr = invoice.taxes.some((t) => t.taxCode === "001");
  const hasIeps = invoice.taxes.some((t) => t.taxCode === "003");

  const isrRetained = invoice.taxes.some(
    (t) => t.taxCode === "001" && t.taxType === "withheld"
  );
  const vatRetained = invoice.taxes.some(
    (t) => t.taxCode === "002" && t.taxType === "withheld"
  );

  // VAT Rate Analysis (only transferred VAT matters for rate profile usually)
  const vatTaxes = invoice.taxes.filter(
    (t) => t.taxCode === "002" && t.taxType === "transferred"
  );
  const vatRates = new Set(vatTaxes.map((t) => t.rate));

  let vatRate: number | "mixed" | "exempt" | null = null;

  if (vatRates.size === 0) {
    // If no transferred VAT found, check if it's because there are no VAT taxes at all (exempt/0%)
    // But since we filter for 002/transferred, this covers most.
    // However, if hasVat is true but no transferred VAT, maybe it's all withheld?
    // For pattern simplicity:
    vatRate = "exempt";
  } else if (vatRates.size === 1) {
    vatRate = Array.from(vatRates)[0];
  } else {
    vatRate = "mixed";
  }

  // CFDI/Invoice Type
  const isIncome =
    invoice.invoiceType === "income" ||
    invoice.invoiceType === "credit_note_received";
  const isExpense =
    invoice.invoiceType === "expense" ||
    invoice.invoiceType === "credit_note_issued";

  return {
    ...invoice,
    partnerType,
    hasRfc,
    isUSD,
    isForeignCurrency,
    itemCount,
    hasServiceItems,
    hasMixedItems,
    hasVat,
    hasIsr,
    hasIeps,
    vatRate,
    isrRetained,
    vatRetained,
    isIncome,
    isExpense,
  };
}

export function generateFeatureSetHash(derived: DerivedEngineInvoice): string {
  // Select key features that define a pattern
  const features = {
    invoiceType: derived.invoiceType,
    currency: derived.currency,
    paymentForm: derived.paymentForm,
    partnerType: derived.partnerType,
    hasRfc: derived.hasRfc,
    hasServiceItems: derived.hasServiceItems,
    hasMixedItems: derived.hasMixedItems,

    // Tax patterns
    hasVat: derived.hasVat,
    hasIsr: derived.hasIsr,
    hasIeps: derived.hasIeps,
    vatRate: derived.vatRate,
    isrRetained: derived.isrRetained,
    vatRetained: derived.vatRetained,

    // Add RFC if it's not generic to capture partner-specific patterns
    partnerRfc:
      derived.partnerRfc !== GENERIC_RFCS.PUBLIC &&
      derived.partnerRfc !== GENERIC_RFCS.FOREIGN
        ? derived.partnerRfc
        : null,
  };

  const str = JSON.stringify(features, Object.keys(features).sort());
  return createHash("sha256").update(str).digest("hex");
}

export class ClassificationEngine {
  public run(invoice: EngineInvoice, rules: Rule[]): ClassificationCandidate[] {
    const candidates: Record<string, ClassificationCandidate> = {};

    for (const rule of rules) {
      const matchStrength = this.evaluate(invoice, rule);
      if (matchStrength !== null && rule.accountCode) {
        const { accountCode } = rule;

        if (!candidates[accountCode]) {
          candidates[accountCode] = {
            accountCode,
            costCenter: rule.costCenter,
            department: rule.department,
            score: 0,
            evidence: [],
          };
        }

        candidates[accountCode].evidence.push({
          ruleName: rule.ruleName,
          ruleType: rule.ruleType,
          confidenceBoost: parseFloat(rule.confidenceBoost || "0"),
          priority: rule.priority || 100,
          matchStrength,
        });
      }
    }

    // Calculate scores and sort candidates
    const sortedCandidates = Object.values(candidates)
      .map((candidate) => {
        candidate.score = this.calculateScore(candidate.evidence);
        return candidate;
      })
      .sort((a, b) => b.score - a.score);

    return sortedCandidates;
  }

  private calculateScore(evidence: Evidence[]): number {
    let totalScore = 0;
    for (const ev of evidence) {
      totalScore += (ev.priority / 100) * ev.confidenceBoost * ev.matchStrength;
    }
    return Math.min(totalScore, 1); // Cap score at 1.0
  }

  private evaluate(invoice: EngineInvoice, rule: Rule): number | null {
    const criteria = rule.matchCriteria as MatchCriteria;

    switch (criteria.ruleType) {
      case "cfdi-type":
        return invoice.cfdiType === criteria.cfdiType ? 1 : null;
      case "product-service":
        const invoiceKeys = new Set(
          invoice.items.map((item) => item.productServiceKey)
        );
        const matchingKeys = criteria.productServiceKeys.filter((key) =>
          invoiceKeys.has(key)
        );
        if (matchingKeys.length === 0) {
          return null;
        }
        return matchingKeys.length / criteria.productServiceKeys.length;
      case "rfc":
        return invoice.partnerRfc === criteria.rfc ? 1 : null;
      case "tax":
        return invoice.taxes.some((tax) => tax.rate === criteria.taxRate)
          ? 1
          : null;
      case "currency":
        if (!invoice.currency) {
          return null;
        }

        return criteria.currency.includes(invoice.currency) ? 0.7 : null;
      case "payment-form":
        return !!invoice.paymentForm &&
          criteria.paymentForms.includes(invoice.paymentForm)
          ? 0.5
          : null;
      case "partner":
        return !!invoice.partnerId &&
          criteria.partnerIds.includes(invoice.partnerId)
          ? 1
          : null;
      case "pattern":
        const derived = deriveEngineInvoice(invoice);
        const hash = generateFeatureSetHash(derived);
        return hash === criteria.featureSetHash ? 1 : null;
      default:
        return null;
    }
  }
}
