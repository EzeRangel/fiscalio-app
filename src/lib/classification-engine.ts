import { Rule, MatchCriteria } from "@/types/classification-rules";
import {
  ClassificationCandidate,
  EngineInvoice,
  Evidence,
} from "@/types/classification-engine";

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
      default:
        return null;
    }
  }
}
