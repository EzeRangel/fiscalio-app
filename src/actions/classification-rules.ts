"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getDB } from "@/db/drizzle";
import { actionClient } from "@/lib/safe-action";
import { ActionError } from "@/lib/errors";
import { getActiveOrganizationId } from "@/lib/session";
import {
  chartOfAccounts,
  classificationFeedback,
  classificationRules,
  classificationSnapshots,
  invoices,
} from "@/db/schema";
import { getClassificationRules } from "@/data/classification-rules";
import { ClassificationEngine } from "@/lib/classification-engine";
import { ClassificationCandidate, EngineInvoice } from "@/types/classification-engine";
import { logAction } from "@/lib/audit-service";

const LEARNING_RATE = 0.05;
const DOMINANT_EVIDENCE_THRESHOLD = 0.15;

async function reinforceRuleConfidence(ruleId: number, impactShare: number) {
  const { db } = await getDB();
  const rule = await db.query.classificationRules.findFirst({
    where: eq(classificationRules.id, ruleId),
  });

  if (!rule || !rule.confidenceBoost) return;

  const oldConfidence = parseFloat(rule.confidenceBoost);
  let newConfidence = oldConfidence + LEARNING_RATE * impactShare;

  // Ensure confidence stays within [0, 1] bounds
  newConfidence = Math.max(0, Math.min(1, newConfidence));

  await db
    .update(classificationRules)
    .set({
      confidenceBoost: String(newConfidence.toFixed(4)),
    })
    .where(eq(classificationRules.id, ruleId));
}

async function penalizeRuleConfidence(ruleId: number, impactShare: number) {
  const { db } = await getDB();
  const rule = await db.query.classificationRules.findFirst({
    where: eq(classificationRules.id, ruleId),
  });

  if (!rule || !rule.confidenceBoost) return;

  const oldConfidence = parseFloat(rule.confidenceBoost);
  let newConfidence = oldConfidence - LEARNING_RATE * impactShare;

  // Ensure confidence stays within [0, 1] bounds
  newConfidence = Math.max(0, Math.min(1, newConfidence));

  await db
    .update(classificationRules)
    .set({
      confidenceBoost: String(newConfidence.toFixed(4)),
    })
    .where(eq(classificationRules.id, ruleId));
}

async function updateClassificationMetrics(ruleId: number, accepted: boolean) {
  const { db } = await getDB();
  const rule = await db.query.classificationRules.findFirst({
    where: eq(classificationRules.id, ruleId),
  });

  if (!rule) return;

  const newTimesApplied = (rule.timesApplied || 0) + 1;
  const newTimesAccepted = (rule.timesAccepted || 0) + (accepted ? 1 : 0);
  const newTimesRejected = (rule.timesRejected || 0) + (accepted ? 0 : 1);
  const newAccuracyRate =
    newTimesAccepted + newTimesRejected > 0
      ? newTimesAccepted / (newTimesAccepted + newTimesRejected)
      : 0;

  await db
    .update(classificationRules)
    .set({
      timesApplied: newTimesApplied,
      timesAccepted: newTimesAccepted,
      timesRejected: newTimesRejected,
      accuracyRate: String(newAccuracyRate.toFixed(4)),
    })
    .where(eq(classificationRules.id, ruleId));
}

export const getInvoiceClassificationSuggestion = actionClient
  .inputSchema(z.object({ invoiceId: z.number() }))
  .action(async ({ parsedInput }) => {
    const organizationId = await getActiveOrganizationId();
    const { db } = await getDB();

    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, parsedInput.invoiceId),
        eq(invoices.organizationId, organizationId)
      ),
      with: {
        items: {
          with: {
            taxes: true,
          },
        },
        businessPartner: true,
      },
    });

    if (!invoice) {
      throw new ActionError("La factura no fue encontrada.");
    }

    const snapshot = await db
      .select()
      .from(classificationSnapshots)
      .where(eq(classificationSnapshots.invoiceId, invoice.id));

    if (snapshot?.length < 1) {
      return [];
    }

    const { candidates } = snapshot[0];

    return candidates as ClassificationCandidate[];
  });

const ACTIONS = ["select", "non-correct"] as const;

const feedbackInputSchema = z.object({
  invoiceId: z.number(),
  action: z.string().pipe(z.enum(ACTIONS)),
  selectedAccount: z.string(),
});

export const applyClassification = actionClient
  .inputSchema(feedbackInputSchema)
  .action(async ({ parsedInput }) => {
    const organizationId = await getActiveOrganizationId();
    const { db } = await getDB();
    const { invoiceId, action, selectedAccount: accountCode } = parsedInput;

    const invoice = await db.query.invoices.findFirst({
      where: and(
        eq(invoices.id, invoiceId),
        eq(invoices.organizationId, organizationId)
      ),
    });

    if (!invoice) {
      throw new ActionError("La factura no fue encontrada o no es válida.");
    }

    const snapshot = await db.query.classificationSnapshots.findFirst({
      where: eq(classificationSnapshots.invoiceId, invoice.id),
    });

    const candidates =
      (snapshot?.candidates as ClassificationCandidate[]) || [];

    const acceptedCandidate = candidates.find(
      (c) => c.accountCode === accountCode
    );

    const rules = await getClassificationRules();

    const hasCandidates = candidates.length >= 1;
    const account = await db.query.chartOfAccounts.findFirst({
      where: eq(chartOfAccounts.accountCode, accountCode),
    });

    if (action === "select" && acceptedCandidate) {
      // User chose one of the suggestions. Reinforce all rules for that candidate.
      const totalScore = acceptedCandidate.score;

      for (const evidence of acceptedCandidate.evidence) {
        const rule = rules.find((r) => r.ruleName === evidence.ruleName);
        if (rule) {
          // Update standard metrics (applied, accepted, etc.)
          await updateClassificationMetrics(rule.id, true);

          // Reinforce the rule's confidence based on its impact
          const contribution =
            (evidence.priority / 100) *
            evidence.confidenceBoost *
            evidence.matchStrength;
          const impactShare = totalScore > 0 ? contribution / totalScore : 0;
          await reinforceRuleConfidence(rule.id, impactShare);
        }
      }

      await db.insert(classificationFeedback).values({
        invoiceId: invoice.id,
        snapshotId: snapshot?.id,
        selectedAccountId: account?.id,
        feedbackType: "positive",
      });

      await db
        .update(invoices)
        .set({
          accountId: account?.id,
          classificationSource: "ai",
          classificationConfindence: totalScore.toString(),
        })
        .where(eq(invoices.id, invoiceId));

      await logAction({
        organizationId,
        entityType: "invoice",
        entityId: invoiceId,
        action: "classified",
        metadata: {
          source: "ai",
          reason: "Usuario aceptó sugerencia de la plataforma",
          aiConfidence: totalScore,
        },
      });
    } else if (action === "non-correct" && hasCandidates) {
      // User did not select any suggested candidates
      //  instead chose manually an account
      //  this is negative impact on suggested rules.

      const topCandidates = candidates.slice(0, 3);
      const updatedMetricsForRuleIds = new Set<number>();

      for (const candidate of topCandidates) {
        const totalScore = candidate.score;
        for (const evidence of candidate.evidence) {
          if (evidence.matchStrength > DOMINANT_EVIDENCE_THRESHOLD) {
            // Keep the filter for dominant evidence
            const rule = rules.find((r) => r.ruleName === evidence.ruleName);
            if (rule) {
              if (!updatedMetricsForRuleIds.has(rule.id)) {
                await updateClassificationMetrics(rule.id, false);
                updatedMetricsForRuleIds.add(rule.id);
              }

              const contribution =
                (evidence.priority / 100) *
                evidence.confidenceBoost *
                evidence.matchStrength;
              const impactShare =
                totalScore > 0 ? contribution / totalScore : 0;
              await penalizeRuleConfidence(rule.id, impactShare);
            }
          }
        }
      }

      await db.insert(classificationFeedback).values({
        invoiceId: invoice.id,
        snapshotId: snapshot?.id,
        selectedAccountId: account?.id,
        feedbackType: "negative",
      });

      await db
        .update(invoices)
        .set({
          accountId: account?.id,
          classificationSource: "manual",
          classificationConfindence: "1.00",
        })
        .where(eq(invoices.id, invoiceId));

      await logAction({
        organizationId,
        entityType: "invoice",
        entityId: invoiceId,
        action: "classified",
        metadata: {
          source: "manual",
          reason: "Usuario seleccionó cuenta manualmente (corrección)",
        },
      });
    } else if (action === "non-correct" && !hasCandidates) {
      // User manually selected an account when no candidates were presented.
      //  No rule reinforcement/penalization, no metric updates.
      //  Just update the invoice.

      await db
        .update(invoices)
        .set({
          accountId: account?.id,
          classificationSource: "manual",
          classificationConfindence: "1.00",
        })
        .where(eq(invoices.id, invoiceId));

      await logAction({
        organizationId,
        entityType: "invoice",
        entityId: invoiceId,
        action: "classified",
        metadata: {
          source: "manual",
          reason: "Clasificación manual (sin sugerencias)",
        },
      });
    }

    revalidatePath(`/invoices/${invoiceId}`);

    return { message: "Clasificación aplicada exitosamente." };
  });
