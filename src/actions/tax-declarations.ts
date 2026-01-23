"use server";

import {
  invoices,
  taxDeclarations,
  declarationInvoices,
  organizations,
  payments,
  paymentAllocations,
} from "@/db";
import { getDB } from "@/db";
import { and, eq, gte, lt } from "drizzle-orm";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { calculateISR_RESICO } from "@/lib/tax-calculations";
import { getActiveOrganizationId } from "@/lib/session";
import { zfd } from "zod-form-data";
import { revalidatePath } from "next/cache";
import { calculateDiff, logAction } from "@/lib/audit-service";
import { calculateCashBasisSummary } from "@/lib/cash-basis-utils";

const createTaxDeclarationDraftSchema = z.object({
  fiscalPeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Invalid fiscal period format (YYYY-MM)"),
  declarationType: z.enum(["monthly", "bimonthly", "annual"]),
});

export const createTaxDeclarationDraft = actionClient
  .inputSchema(createTaxDeclarationDraftSchema)
  .action(async ({ parsedInput: { fiscalPeriod, declarationType } }) => {
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();

    // Get organization's tax regime
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      with: {
        taxRegime: true,
      },
    });

    if (!organization || !organization.taxRegime) {
      throw new Error("Organization or its tax regime not found.");
    }

    // 1. Check for existing declaration draft
    const existingDeclaration = await db.query.taxDeclarations.findFirst({
      where: and(
        eq(taxDeclarations.organizationId, organizationId),
        eq(taxDeclarations.fiscalPeriod, fiscalPeriod),
        eq(taxDeclarations.declarationType, declarationType)
      ),
    });

    if (existingDeclaration) {
      if (existingDeclaration.status === "draft") {
        throw new Error(
          "Ya existe un borrador de estimación para este período y tipo."
        );
      }
      throw new Error("Ya existe una estimación para este período y tipo.");
    }

    const [year, month] = fiscalPeriod.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 2. Fetch all payment allocations in the period (Cash-Basis source of truth)
    const rawAllocations = await db
      .select({
        allocation: paymentAllocations,
        payment: payments,
        invoice: invoices,
      })
      .from(paymentAllocations)
      .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
      .innerJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
      .where(
        and(
          eq(payments.organizationId, organizationId),
          gte(payments.paymentDate, startDate),
          lt(payments.paymentDate, endDate)
        )
      );

    // 3. Create initial taxDeclaration entry
    const [newDeclaration] = await db
      .insert(taxDeclarations)
      .values({
        organizationId,
        fiscalPeriod,
        declarationType,
        taxRegime: organization.taxRegime.code,
        totalIncome: "0",
        totalExpenses: "0",
        deductibleExpenses: "0",
        ivaCharged: "0",
        ivaCreditable: "0",
        ivaBalance: "0",
        isrBase: "0",
        isrCalculated: "0",
        isrWithheld: "0",
        isrProvisional: "0",
        isrBalance: "0",
        status: "draft",
      })
      .returning();

    if (!newDeclaration) {
      throw new Error("Error al generar la estimación de impuestos.");
    }

    // 4. Aggregate data and create snapshot entries
    let totalIncome = 0;
    let totalExpenses = 0;
    let deductibleExpenses = 0;
    let ivaCharged = 0;
    let ivaCreditable = 0;
    let totalIsrWithheld = 0;

    // Group rawAllocations by invoice to process them with full context
    const allocationsByInvoice = new Map<number, any[]>();
    for (const item of rawAllocations) {
      if (!allocationsByInvoice.has(item.invoice.id)) {
        allocationsByInvoice.set(item.invoice.id, []);
      }
      allocationsByInvoice.get(item.invoice.id)!.push(item);
    }

    const declarationInvoicesBatch: any[] = [];

    for (const [invoiceId, items] of allocationsByInvoice.entries()) {
      // Fetch full invoice details for accurate tax calculation
      const fullInvoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId),
        with: {
          account: true,
          items: {
            with: {
              taxes: true,
            },
          },
        },
      });

      if (!fullInvoice) continue;

      // Flatten taxes for the utility
      const allTaxes = fullInvoice.items.flatMap((item) =>
        item.taxes.map((t) => ({
          taxType: t.taxType,
          taxCode: t.taxCode,
          rate: t.rate,
          amount: t.taxAmount,
        }))
      );

      // Prepare allocations for this invoice in this period
      const invoiceAllocations = items.map((i: any) => ({
        amountAllocated: i.allocation.amountAllocated,
        invoice: {
          total: fullInvoice.total,
          subtotal: fullInvoice.subtotal,
          taxes: allTaxes,
        },
      }));

      const summary = calculateCashBasisSummary(invoiceAllocations);

      const isDeductible = fullInvoice.account?.isDeductible || false;
      const deductionPercentage = parseFloat(
        fullInvoice.account?.deductionPercentage || "100.00"
      );

      const includedAmount = summary.totalPaid;
      const deductibleAmount = isDeductible
        ? summary.subtotalPaid * (deductionPercentage / 100)
        : 0;

      if (fullInvoice.invoiceType === "income") {
        totalIncome += summary.subtotalPaid;
      } else if (fullInvoice.invoiceType === "expense") {
        totalExpenses += summary.subtotalPaid;
        if (isDeductible) {
          deductibleExpenses += deductibleAmount;
        }
      }

      // Classify taxes
      let periodIvaAmount = 0;
      let ivaType: string | null = null;

      for (const tax of summary.taxBreakdown) {
        if (tax.taxCode === "002") { // IVA
          if (tax.taxType === "transferred") {
            periodIvaAmount += tax.amount;
            if (fullInvoice.invoiceType === "income") {
              ivaCharged += tax.amount;
              ivaType = "charged";
            } else if (fullInvoice.invoiceType === "expense" && isDeductible) {
              ivaCreditable += tax.amount;
              ivaType = "creditable";
            }
          }
        } else if (tax.taxCode === "001" && tax.taxType === "withheld") { // ISR Withheld
            if (fullInvoice.invoiceType === "income") {
                totalIsrWithheld += tax.amount;
            }
        }
      }

      declarationInvoicesBatch.push({
        declarationId: newDeclaration.id,
        invoiceId: fullInvoice.id,
        appliedAccountCode: fullInvoice.account?.accountCode || null,
        appliedAccountName: fullInvoice.account?.accountName || null,
        isDeductible: isDeductible,
        deductionPercentage: deductionPercentage.toString(),
        includedAmount: includedAmount.toString(),
        deductibleAmount: deductibleAmount.toString(),
        ivaAmount: periodIvaAmount.toFixed(2),
        ivaType: ivaType,
        wasManuallyAdjusted: false,
      });
    }

    if (declarationInvoicesBatch.length > 0) {
      await db.insert(declarationInvoices).values(declarationInvoicesBatch);
    }

    // 5. Final totals calculation
    // Note: ISR Base in RESICO is strictly Gross Income (Total collected subtotal)
    const isrBase = totalIncome;
    const ivaBalance = ivaCharged - ivaCreditable;

    const isrCalculatedValue = calculateISR_RESICO(isrBase, declarationType);
    const isrRateValue = isrBase > 0 ? isrCalculatedValue / isrBase : 0;
    const isrBalance = isrCalculatedValue - totalIsrWithheld;

    await db
      .update(taxDeclarations)
      .set({
        totalIncome: totalIncome.toString(),
        totalExpenses: totalExpenses.toString(),
        deductibleExpenses: deductibleExpenses.toString(),
        ivaCharged: ivaCharged.toString(),
        ivaCreditable: ivaCreditable.toString(),
        ivaBalance: ivaBalance.toString(),
        isrBase: isrBase.toString(),
        isrRate: isrRateValue.toFixed(4).toString(),
        isrCalculated: isrCalculatedValue.toString(),
        isrWithheld: totalIsrWithheld.toString(),
        isrProvisional: "0",
        isrBalance: isrBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(taxDeclarations.id, newDeclaration.id));

    return newDeclaration;
  });

// New schema for validating a declaration
const validateTaxDeclarationSchema = z.object({
  declarationId: z.number(),
});

export const validateTaxDeclaration = actionClient
  .inputSchema(validateTaxDeclarationSchema)
  .action(async ({ parsedInput: { declarationId } }) => {
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();

    const declaration = await db.query.taxDeclarations.findFirst({
      where: and(
        eq(taxDeclarations.id, declarationId),
        eq(taxDeclarations.organizationId, organizationId)
      ),
    });

    if (!declaration) {
      throw new Error("Estimación no encontrada.");
    }

    if (declaration.status !== "draft") {
      throw new Error(
        "Solo se pueden verificar estimaciones en estado de borrador."
      );
    }

    await db
      .update(taxDeclarations)
      .set({
        status: "validated",
        updatedAt: new Date(),
      })
      .where(eq(taxDeclarations.id, declarationId));

    // TODO: Optionally, update fiscalPeriod status to 'closed'
    // This requires checking if all declarations for that period are validated/filed.

    // revalidatePath might be needed here depending on UI implementation
    // revalidatePath(`/declarations/${declarationId}`);

    return { success: true, message: "Cálculos verificados exitosamente." };
  });

// New schema for filing a declaration
const fileTaxDeclarationSchema = zfd.formData({
  declarationId: zfd.numeric(),
  acknowledgmentNumber: zfd.text(
    z.string().min(1, "El número de acuse es requerido.")
  ),
});

export const fileTaxDeclaration = actionClient
  .inputSchema(fileTaxDeclarationSchema)
  .action(async ({ parsedInput: { declarationId, acknowledgmentNumber } }) => {
    const { db } = await getDB();
    const organizationId = await getActiveOrganizationId();

    const declaration = await db.query.taxDeclarations.findFirst({
      where: and(
        eq(taxDeclarations.id, declarationId),
        eq(taxDeclarations.organizationId, organizationId)
      ),
    });

        if (!declaration) {

          throw new Error("Estimación no encontrada.");

        }

    

        if (declaration.status !== "validated") {

          throw new Error(

            "Solo se pueden marcar como finalizadas las estimaciones en estado 'verificado'."

          );

        }

    

        await db

          .update(taxDeclarations)

          .set({

            status: "filed",

            acknowledgmentNumber: acknowledgmentNumber,

            filedAt: new Date(),

            updatedAt: new Date(),

          })

          .where(eq(taxDeclarations.id, declarationId))

          .returning();

    

        if (declaration) {

          const changes = calculateDiff(

            {

              status: declaration.status,

              acknowledgmentNumber: declaration.acknowledgmentNumber,

            },

            { status: "filed", acknowledgmentNumber: acknowledgmentNumber }

          );

    

                      await logAction({

    

                        organizationId,

    

                        entityType: "tax_declaration",

    

                        entityId: declarationId,

    

                        action: "updated",

    

                        changes,

    

                        metadata: {

    

                          source: "manual",

    

                          reason: "Finalizar revisión de estimación",

    

                        },

    

                      });

    

                

    

          

        }

    

        // revalidatePath might be needed here depending on UI implementation

        revalidatePath(`/tax-declarations/${declarationId}`);

    

        return { success: true, message: "Revisión finalizada exitosamente." };

      });

    