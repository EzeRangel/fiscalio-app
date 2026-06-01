import { getDB } from "@/db/drizzle";
import { classificationRules, patternCandidates } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  PatternCandidate,
  DerivedEngineInvoice,
} from "@/types/classification-engine";
import {
  calculateCandidateUpdate,
  prepareRuleFromCandidate,
} from "@/lib/pattern-detection";
import { CLASSIFICATION_LEARNING } from "@/lib/constants";
import { logAction } from "@/lib/audit-service";

export async function promoteCandidateToRule(candidateId: number) {
  const { db } = await getDB();

  const candidate = await db.query.patternCandidates.findFirst({
    where: eq(patternCandidates.id, candidateId),
  });

  if (!candidate || candidate.status !== "candidate") return;

  const rulePayload = prepareRuleFromCandidate({
    ...candidate,
    consistencyRate: parseFloat(candidate.consistencyRate),
    confidenceScore: parseFloat(candidate.confidenceScore),
    features: candidate.features as Partial<DerivedEngineInvoice>,
    status: candidate.status as any,
  });

  await db.transaction(async (tx) => {
    // 1. Create the new rule
    const [newRule] = await tx
      .insert(classificationRules)
      .values({
        ...rulePayload,
        originCandidateId: candidate.id,
      })
      .returning();

    // 2. Mark candidate as promoted
    await tx
      .update(patternCandidates)
      .set({
        status: "promoted",
      })
      .where(eq(patternCandidates.id, candidate.id));

    // 3. Log the audit event
    await logAction({
      organizationId: candidate.organizationId,
      entityType: "classification_rule",
      entityId: newRule.id,
      action: "created",
      metadata: {
        source: "ai",
        reason: "Patrón detectado con alta confianza",
        aiConfidence: parseFloat(candidate.confidenceScore),
        evidenceCount: candidate.evidenceCount,
        consistencyRate: candidate.consistencyRate,
      },
      tx,
    });
  });
}

export async function upsertPatternCandidate(
  organizationId: number,
  featureSetHash: string,
  features: Partial<DerivedEngineInvoice>,
  proposedAccountId: string,
) {
  const { db } = await getDB();
  const existing = await db.query.patternCandidates.findFirst({
    where: eq(patternCandidates.featureSetHash, featureSetHash),
  });

  let candidateForLogic: PatternCandidate | null = null;

  if (existing) {
    if (existing.status === "promoted") return; // Already a rule, nothing to do here

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
    proposedAccountId,
  );

  let candidateId = existing?.id;

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
    const [inserted] = await db
      .insert(patternCandidates)
      .values({
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
      })
      .returning();
    candidateId = inserted.id;
  }

  // --- Check for Promotion ---
  const minConsistency = parseFloat(
    CLASSIFICATION_LEARNING.MIN_CONSISTENCY_RATE,
  );
  const meetsCount =
    update.evidenceCount >= CLASSIFICATION_LEARNING.MIN_EVIDENCE_TO_PROMOTE;
  const meetsConsistency = parseFloat(update.consistencyRate) >= minConsistency;

  if (candidateId && meetsCount && meetsConsistency) {
    await promoteCandidateToRule(candidateId);
  }
}
