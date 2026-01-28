import { getDB } from "@/db/drizzle";
import { patternCandidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PatternCandidate, DerivedEngineInvoice } from "@/types/classification-engine";
import { calculateCandidateUpdate } from "@/lib/pattern-detection";

export async function upsertPatternCandidate(
  organizationId: number,
  featureSetHash: string,
  features: Partial<DerivedEngineInvoice>,
  proposedAccountId: string
) {
  const { db } = await getDB();
  const existing = await db.query.patternCandidates.findFirst({
    where: eq(patternCandidates.featureSetHash, featureSetHash),
  });

  let candidateForLogic: PatternCandidate | null = null;

  if (existing) {
    candidateForLogic = {
      ...existing,
      // Convert decimals to numbers for logic
      consistencyRate: parseFloat(existing.consistencyRate),
      confidenceScore: parseFloat(existing.confidenceScore),
      // Ensure features is typed correctly
      features: existing.features as Partial<DerivedEngineInvoice>,
      status: existing.status as any,
    };
  }

  const update = calculateCandidateUpdate(
    candidateForLogic,
    organizationId,
    featureSetHash,
    features,
    proposedAccountId
  );

  if (existing) {
    await db
      .update(patternCandidates)
      .set({
        evidenceCount: update.evidenceCount,
        consistencyRate: update.consistencyRate,
        confidenceScore: update.confidenceScore,
        lastSeenAt: update.lastSeenAt,
      })
      .where(eq(patternCandidates.id, existing.id));
  } else {
    await db.insert(patternCandidates).values({
      organizationId: update.organizationId,
      featureSetHash: update.featureSetHash,
      features: update.features,
      proposedAccountId: update.proposedAccountId,
      evidenceCount: update.evidenceCount,
      consistencyRate: update.consistencyRate,
      confidenceScore: update.confidenceScore,
      firstSeenAt: update.firstSeenAt,
      lastSeenAt: update.lastSeenAt,
      status: update.status,
    });
  }
}
