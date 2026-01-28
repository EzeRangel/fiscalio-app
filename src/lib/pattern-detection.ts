import { PatternCandidate, DerivedEngineInvoice } from "@/types/classification-engine";
import { CLASSIFICATION_LEARNING } from "./constants";

export function calculateCandidateUpdate(
  existing: PatternCandidate | null,
  organizationId: number,
  featureSetHash: string,
  features: Partial<DerivedEngineInvoice>,
  proposedAccountId: string
) {
  if (!existing) {
    const consistency = 1.0;
    const count = 1;
    return {
      organizationId,
      featureSetHash,
      features,
      proposedAccountId,
      evidenceCount: count,
      consistencyRate: consistency.toFixed(4),
      confidenceScore: calculateConfidence(count, consistency),
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      status: "candidate" as const
    };
  }

  const isMatch = existing.proposedAccountId === proposedAccountId;
  
  // Calculate previous hits
  // existing.consistencyRate is number from the domain type
  const prevHits = Math.round(existing.evidenceCount * existing.consistencyRate);
  const newHits = prevHits + (isMatch ? 1 : 0);
  const newEvidenceCount = existing.evidenceCount + 1;
  
  const newConsistencyRate = newHits / newEvidenceCount;
  
  return {
    ...existing,
    evidenceCount: newEvidenceCount,
    consistencyRate: newConsistencyRate.toFixed(4),
    confidenceScore: calculateConfidence(newEvidenceCount, newConsistencyRate),
    lastSeenAt: new Date(),
  };
}

function calculateConfidence(count: number, consistency: number): string {
    // Simple heuristic: Confidence grows with count, scaled by consistency.
    // We want it to approach 1.0 as count increases, IF consistency is high.
    
    // Normalize count against the promotion threshold
    const countFactor = Math.min(count / CLASSIFICATION_LEARNING.MIN_EVIDENCE_TO_PROMOTE, 1.0);
    
    // Penalize low consistency heavily.
    // If consistency < 0.5, score should be very low.
    const consistencyFactor = consistency < 0.5 ? 0 : consistency;

    const score = countFactor * consistencyFactor;
    return score.toFixed(4);
}
