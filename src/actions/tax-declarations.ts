"use server";

import {
  invoices,
  taxDeclarations,
  declarationInvoices,
  organizations,
  payments,
} from "@/db";
import { getDB } from "@/db";
import { and, eq, gte, isNotNull, lt } from "drizzle-orm";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { calculateISR_RESICO } from "@/lib/tax-calculations";
import { getActiveOrganizationId } from "@/lib/session";
import { zfd } from "zod-form-data";

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
          "Ya existe un borrador de declaración para este período y tipo."
        );
      }
      throw new Error("Ya existe una declaración para este período y tipo.");
    }

    const [year, month] = fiscalPeriod.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 2. Fetch relevant data for the period (Cash Flow based)
    
    // 2a. Fetch PUE invoices (Paid in full at issuance)
    const pueInvoices = await db.query.invoices.findMany({
      where: and(
        eq(invoices.organizationId, organizationId),
        gte(invoices.invoiceDate, startDate),
        lt(invoices.invoiceDate, endDate),
        eq(invoices.paymentMethod, "PUE"),
        isNotNull(invoices.accountId)
      ),
      with: {
        account: true,
      },
    });

    // 2b. Fetch Payments in the period (for PPD invoices)
    const periodPayments = await db.query.payments.findMany({
      where: and(
        eq(payments.organizationId, organizationId),
        gte(payments.paymentDate, startDate),
        lt(payments.paymentDate, endDate)
      ),
      with: {
        allocations: {
          with: {
            invoice: {
              with: {
                account: true,
              },
            },
          },
        },
      },
    });

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
      throw new Error("Error al crear la declaración de impuestos.");
    }

    // 4. Aggregate data and create snapshot entries
    let totalIncome = 0;
    let totalExpenses = 0;
    let deductibleExpenses = 0;
    let ivaCharged = 0;
    let ivaCreditable = 0;
    const isrWithheld = 0;

    const declarationInvoicesBatch: any[] = [];

    // Process PUE Invoices
    for (const invoice of pueInvoices) {
      const isDeductible = invoice.account?.isDeductible || false;
      const deductionPercentage = parseFloat(
        invoice.account?.deductionPercentage || "100.00"
      );
      const includedAmount = parseFloat(invoice.total);
      const deductibleAmount = isDeductible
        ? includedAmount * (deductionPercentage / 100)
        : 0;

      if (invoice.invoiceType === "income") {
        totalIncome += includedAmount;
      } else if (invoice.invoiceType === "expense") {
        totalExpenses += includedAmount;
        if (isDeductible) {
          deductibleExpenses += deductibleAmount;
        }
      }

      const invoiceIvaAmount = parseFloat(invoice.totalTaxes || "0");
      let ivaType: string | null = null;
      if (invoiceIvaAmount > 0) {
        if (invoice.invoiceType === "income") {
          ivaCharged += invoiceIvaAmount;
          ivaType = "charged";
        } else if (invoice.invoiceType === "expense" && isDeductible) {
          ivaCreditable += invoiceIvaAmount;
          ivaType = "creditable";
        }
      }

      declarationInvoicesBatch.push({
        declarationId: newDeclaration.id,
        invoiceId: invoice.id,
        appliedAccountCode: invoice.account?.accountCode || null,
        appliedAccountName: invoice.account?.accountName || null,
        isDeductible: isDeductible,
        deductionPercentage: deductionPercentage.toString(),
        includedAmount: includedAmount.toString(),
        deductibleAmount: deductibleAmount.toString(),
        ivaAmount: invoiceIvaAmount.toString(),
        ivaType: ivaType,
        wasManuallyAdjusted: false,
      });
    }

    // Process Payments (PPD Allocations)
    for (const payment of periodPayments) {
      for (const allocation of payment.allocations) {
        const invoice = allocation.invoice;
        if (!invoice || !invoice.accountId) continue;

        const isDeductible = invoice.account?.isDeductible || false;
        const deductionPercentage = parseFloat(
          invoice.account?.deductionPercentage || "100.00"
        );
        const includedAmount = parseFloat(allocation.amountAllocated);
        const deductibleAmount = isDeductible
          ? includedAmount * (deductionPercentage / 100)
          : 0;

        if (invoice.invoiceType === "income") {
          totalIncome += includedAmount;
        } else if (invoice.invoiceType === "expense") {
          totalExpenses += includedAmount;
          if (isDeductible) {
            deductibleExpenses += deductibleAmount;
          }
        }

        // Calculate proportional IVA
        const invoiceTotal = parseFloat(invoice.total);
        const invoiceTotalTaxes = parseFloat(invoice.totalTaxes || "0");
        const proportionalIva = invoiceTotal > 0 
          ? (includedAmount / invoiceTotal) * invoiceTotalTaxes
          : 0;

        let ivaType: string | null = null;
        if (proportionalIva > 0) {
          if (invoice.invoiceType === "income") {
            ivaCharged += proportionalIva;
            ivaType = "charged";
          } else if (invoice.invoiceType === "expense" && isDeductible) {
            ivaCreditable += proportionalIva;
            ivaType = "creditable";
          }
        }

        declarationInvoicesBatch.push({
          declarationId: newDeclaration.id,
          invoiceId: invoice.id,
          appliedAccountCode: invoice.account?.accountCode || null,
          appliedAccountName: invoice.account?.accountName || null,
          isDeductible: isDeductible,
          deductionPercentage: deductionPercentage.toString(),
          includedAmount: includedAmount.toString(),
          deductibleAmount: deductibleAmount.toString(),
          ivaAmount: proportionalIva.toFixed(2),
          ivaType: ivaType,
          wasManuallyAdjusted: false,
        });
      }
    }

    if (declarationInvoicesBatch.length > 0) {
      await db.insert(declarationInvoices).values(declarationInvoicesBatch);
    }

    // 5. Final totals calculation
    const isrBase = totalIncome - deductibleExpenses;
    const ivaBalance = ivaCharged - ivaCreditable;

    const isrCalculatedValue = calculateISR_RESICO(isrBase, declarationType);
    const isrRateValue = isrBase > 0 ? isrCalculatedValue / isrBase : 0;
    const isrBalance = isrCalculatedValue - isrWithheld;

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
        isrWithheld: isrWithheld.toString(),
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
      throw new Error("Declaración no encontrada.");
    }

    if (declaration.status !== "draft") {
      throw new Error(
        "Solo se pueden validar declaraciones en estado de borrador."
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

    return { success: true, message: "Declaración validada exitosamente." };
  });

// New schema for filing a declaration
const fileTaxDeclarationSchema = zfd.formData({
  declarationId: z.number(),
  acknowledgmentNumber: z.string().min(1, "El número de acuse es requerido."),
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
      throw new Error("Declaración no encontrada.");
    }

    if (declaration.status !== "validated") {
      throw new Error(
        "Solo se pueden presentar declaraciones en estado 'validada'."
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
      .where(eq(taxDeclarations.id, declarationId));

    // revalidatePath might be needed here depending on UI implementation
    // revalidatePath(`/declarations/${declarationId}`);

    return { success: true, message: "Declaración presentada exitosamente." };
  });
