import "server-only";

import { and, desc, eq, gte, lte, ne } from "drizzle-orm";
import {
  businessPartners,
  getDB,
  invoiceItems,
  invoices,
  invoiceTaxes,
  organizations,
  taxRegimes,
} from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { CFDIComprobante as ParsedCFDI } from "@/types/cfdi-schemas";
import { getTaxName } from "@/lib/utils";
import { savePaymentComplement, savePUEPayment } from "./payments";
import { GENERIC_RFC_LIST } from "@/lib/constants";
import {
  validateInvoice,
  validateResicoRegime,
  validateIsrWithholding,
  validateExchangeRate,
  FiscalInvoice,
  FiscalValidationError,
} from "@/lib/fiscal-validation";

import {
  deriveInvoiceType,
  distributeHeaderTaxesToItems,
} from "@/lib/invoice-utils";
import { InvoiceTaxInsert } from "@/types/invoice-taxes";
import { InvoiceDetails } from "@/types/invoices";

export const saveNewInvoice = async (
  parsedCFDI: ParsedCFDI,
  xml: string,
  fileHash: string,
) => {
  const { db } = await getDB();
  const organizationId = await getActiveOrganizationId();

  const invoiceRecord = await db.transaction(async (tx) => {
    // 1. Verify organization RFC against the CFDI
    const organization = await tx.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!organization) {
      throw new Error("La organización activa no es válida.");
    }

    const emitterRfc = parsedCFDI.Emisor.Rfc;
    const receiverRfc = parsedCFDI.Receptor.Rfc;

    if (organization.rfc !== emitterRfc && organization.rfc !== receiverRfc) {
      throw new Error(
        "Ningún RFC del CFDI coincide con el de su organización.",
      );
    }

    const conceptos = parsedCFDI.Conceptos.Concepto;

    // 2. Determine partner info and invoice type
    const isEmitter = organization.rfc === emitterRfc;
    const invoiceType = deriveInvoiceType(
      parsedCFDI.TipoDeComprobante,
      isEmitter,
    );

    // --- RESICO REGIME VALIDATION ---
    const regimeValidation = validateResicoRegime({
      type: isEmitter ? "income" : "expense",
      issuerRegime: parsedCFDI.Emisor.RegimenFiscal,
      receiverRegime: parsedCFDI.Receptor.RegimenFiscalReceptor,
    });

    if (!regimeValidation.isValid) {
      throw new Error(regimeValidation.errors[0].message);
    }
    // -------------------------------

    const partnerType = isEmitter ? "client" : "provider";
    const partnerRfc = isEmitter ? receiverRfc : emitterRfc;
    const partnerName = isEmitter
      ? parsedCFDI.Receptor.Nombre
      : parsedCFDI.Emisor.Nombre;
    const partnerTaxRegimeCode = isEmitter
      ? parsedCFDI.Receptor.RegimenFiscalReceptor
      : parsedCFDI.Emisor.RegimenFiscal;

    // 3. Find or create the business partner (scoped to the organization)
    const isGenericRfc = GENERIC_RFC_LIST.includes(partnerRfc);

    const partnerConditions = [
      eq(businessPartners.rfc, partnerRfc),
      eq(businessPartners.organizationId, organizationId),
    ];

    if (isGenericRfc) {
      partnerConditions.push(eq(businessPartners.businessName, partnerName));
    }

    let partner = await tx.query.businessPartners.findFirst({
      where: and(...partnerConditions),
    });

    const partnerTaxRegime = await tx.query.taxRegimes.findFirst({
      where: eq(taxRegimes.code, partnerTaxRegimeCode),
    });

    if (!partnerTaxRegime) {
      throw new Error(
        `Régimen Fiscal ${partnerTaxRegimeCode} del socio no encontrado.`,
      );
    }

    if (!partner) {
      const [newPartner] = await tx
        .insert(businessPartners)
        .values({
          businessName: partnerName,
          legalName: partnerName,
          rfc: partnerRfc,
          taxRegimeId: partnerTaxRegime.id,
          partnerType,
          organizationId,
        })
        .returning();

      partner = newPartner;
    }

    // 4. Insert the main invoice record
    const timbreComplement = parsedCFDI.Complemento.find(
      (c) => c.TimbreFiscalDigital,
    );

    const uuid = timbreComplement?.TimbreFiscalDigital?.UUID;

    if (!uuid) {
      throw new Error(
        "El CFDI no contiene un UUID válido (TimbreFiscalDigital).",
      );
    }

    const certificationDate =
      timbreComplement.TimbreFiscalDigital?.FechaTimbrado;

    if (!certificationDate) {
      throw new Error("El CFDI no contiene una fecha de timbrado.");
    }

    // Gather Taxes for validations
    const allTaxes: {
      taxType: "transferred" | "withheld";
      taxCode: string;
      rate: string;
    }[] = [];

    for (const c of conceptos) {
      const traslados =
        c.Impuestos?.Traslados && Array.isArray(c.Impuestos.Traslados.Traslado)
          ? c.Impuestos.Traslados.Traslado
          : c.Impuestos?.Traslados?.Traslado
            ? [c.Impuestos.Traslados.Traslado]
            : [];

      const retenciones =
        c.Impuestos?.Retenciones &&
        Array.isArray(c.Impuestos.Retenciones.Retencion)
          ? c.Impuestos.Retenciones.Retencion
          : c.Impuestos?.Retenciones?.Retencion
            ? [c.Impuestos.Retenciones.Retencion]
            : [];

      traslados.forEach((t: any) =>
        allTaxes.push({
          taxType: "transferred",
          taxCode: t.Impuesto,
          rate: t.TasaOCuota,
        }),
      );
      retenciones.forEach((r: any) =>
        allTaxes.push({
          taxType: "withheld",
          taxCode: r.Impuesto,
          rate: r.TasaOCuota,
        }),
      );
    }

    // --- FISCAL COMPLIANCE VALIDATIONS ---
    const validationErrors: FiscalValidationError[] = [];

    // ISR Withholding (Warning if missing)
    const isrValidation = validateIsrWithholding({
      cfdiType: parsedCFDI.TipoDeComprobante,
      receiverRfc: parsedCFDI.Receptor.Rfc,
      taxes: allTaxes,
    });
    if (!isrValidation.isValid) {
      validationErrors.push(...isrValidation.errors);
    }

    // Exchange Rate (Warning if invalid)
    const exchangeValidation = validateExchangeRate({
      currency: parsedCFDI.Moneda,
      exchangeRate: parsedCFDI.TipoCambio,
    });
    if (!exchangeValidation.isValid) {
      validationErrors.push(...exchangeValidation.errors);
    }

    const fiscalInvoiceToCheck: FiscalInvoice = {
      id: 0,
      total: parsedCFDI.Total,
      subtotal: parsedCFDI.SubTotal,
      amountPaid: 0,
      paymentStatus: "pending",
      status: "active",
      allocations: [],
    };

    const integrityValidation = validateInvoice(fiscalInvoiceToCheck);
    if (!integrityValidation.isValid) {
      throw new Error(
        `Error de validación fiscal: ${integrityValidation.errors[0].message}`,
      );
    }

    const [newInvoice] = await tx
      .insert(invoices)
      .values({
        organizationId,
        partnerId: partner.id,
        invoiceType,
        cfdiType: parsedCFDI.TipoDeComprobante,
        cfdiVersion: parsedCFDI.Version,
        folioFiscal: uuid,
        internalFolio: parsedCFDI.Folio,
        series: parsedCFDI.Serie,
        invoiceDate: new Date(parsedCFDI.Fecha),
        certificationDate: timbreComplement
          ? new Date(certificationDate)
          : null,
        currency: parsedCFDI.Moneda,
        exchangeRate: parsedCFDI.TipoCambio,
        subtotal: parsedCFDI.SubTotal,
        discount: parsedCFDI.Descuento,
        totalTaxes: parsedCFDI.Impuestos?.TotalImpuestosTrasladados,
        totalWithholdings: parsedCFDI.Impuestos?.TotalImpuestosRetenidos,
        total: parsedCFDI.Total,
        paymentMethod: parsedCFDI.MetodoPago,
        paymentForm: parsedCFDI.FormaPago,
        taxRegimeIssuer: parsedCFDI.Emisor.RegimenFiscal,
        taxRegimeReceiver: parsedCFDI.Receptor.RegimenFiscalReceptor,
        cfdiUse: parsedCFDI.Receptor.UsoCFDI,
        xmlContent: xml,
        fileHash: fileHash,
        validationErrors: validationErrors.length > 0 ? validationErrors : null,
        status: validationErrors.length > 0 ? "invalid" : "active",
      })
      .returning();

    // 5. If it's a Payment Complement, process the payments and allocations
    if (parsedCFDI.TipoDeComprobante === "P") {
      await savePaymentComplement(
        tx,
        parsedCFDI,
        organizationId,
        partner.id,
        invoiceType,
      );
    } else {
      // Auto-generate Payment for PUE
      if (parsedCFDI.MetodoPago === "PUE") {
        await savePUEPayment(
          tx,
          parsedCFDI.Total,
          parsedCFDI.Moneda,
          parsedCFDI.TipoCambio || "1.0",
          new Date(parsedCFDI.Fecha),
          parsedCFDI.FormaPago || "99",
          organizationId,
          partner.id,
          newInvoice.id,
          invoiceType,
        );

        await tx
          .update(invoices)
          .set({
            amountPaid: parsedCFDI.Total,
            paymentStatus: "paid",
          })
          .where(eq(invoices.id, newInvoice.id));
      }

      // Check if any item has taxes. If not, we'll use the fallback distribution.
      const hasItemTaxes = conceptos.some((c) => {
        const hasTraslados =
          c.Impuestos?.Traslados &&
          (Array.isArray(c.Impuestos.Traslados.Traslado)
            ? c.Impuestos.Traslados.Traslado.length > 0
            : Boolean(c.Impuestos.Traslados.Traslado));
        const hasRetenciones =
          c.Impuestos?.Retenciones &&
          (Array.isArray(c.Impuestos.Retenciones.Retencion)
            ? c.Impuestos.Retenciones.Retencion.length > 0
            : Boolean(c.Impuestos.Retenciones.Retencion));
        return hasTraslados || hasRetenciones;
      });

      const fallbackTaxes = !hasItemTaxes
        ? distributeHeaderTaxesToItems(
            parsedCFDI.Impuestos?.TotalImpuestosTrasladados,
            parsedCFDI.Impuestos?.TotalImpuestosRetenidos,
            conceptos.map((c) => ({ subtotal: c.Importe })),
            parsedCFDI.SubTotal,
          )
        : [];

      // Standard invoice: Insert items and their taxes
      for (const [index, c] of conceptos.entries()) {
        const [newItem] = await tx
          .insert(invoiceItems)
          .values({
            invoiceId: newInvoice.id,
            lineNumber: index + 1,
            productServiceKey: c.ClaveProdServ,
            identificationNumber: c.NoIdentificacion,
            description: c.Descripcion,
            unit: c.ClaveUnidad,
            quantity: c.Cantidad,
            unitPrice: c.ValorUnitario,
            discount: c.Descuento,
            subtotal: c.Importe,
          })
          .returning();

        let taxesToInsert: InvoiceTaxInsert[] = [];

        if (hasItemTaxes) {
          const traslados =
            c.Impuestos?.Traslados &&
            Array.isArray(c.Impuestos.Traslados.Traslado)
              ? c.Impuestos.Traslados.Traslado
              : c.Impuestos?.Traslados?.Traslado
                ? [c.Impuestos.Traslados.Traslado]
                : [];

          const retenciones =
            c.Impuestos?.Retenciones &&
            Array.isArray(c.Impuestos.Retenciones.Retencion)
              ? c.Impuestos.Retenciones.Retencion
              : c.Impuestos?.Retenciones?.Retencion
                ? [c.Impuestos.Retenciones.Retencion]
                : [];

          taxesToInsert = [
            ...traslados.map((t: any) => ({
              itemId: newItem.id,
              taxType: "transferred" as const,
              taxCode: t.Impuesto,
              taxName: getTaxName(t.Impuesto),
              factor: t.TipoFactor,
              rate: t.TasaOCuota,
              baseAmount: t.Base,
              taxAmount: t.Importe,
            })),
            ...retenciones.map((r: any) => ({
              itemId: newItem.id,
              taxType: "withheld" as const,
              taxCode: r.Impuesto,
              taxName: getTaxName(r.Impuesto),
              factor: r.TipoFactor,
              rate: r.TasaOCuota,
              baseAmount: r.Base,
              taxAmount: r.Importe,
            })),
          ];
        } else {
          // Use fallback distribution
          const itemFallback = fallbackTaxes[index];
          if (itemFallback) {
            taxesToInsert = itemFallback.taxes.map((t) => ({
              itemId: newItem.id,
              ...t,
            }));
          }
        }

        if (taxesToInsert.length > 0) {
          await tx.insert(invoiceTaxes).values(taxesToInsert);
        }
      }
    }

    return newInvoice;
  });

  return invoiceRecord;
};

// TODO: Mejorar la función para obtener todas las facturas, enviar filtros como parámetros.
export const getInvoicesByOrganization = async (
  organizationId: number,
  filters?: { partnerId?: number; showSubstituted?: boolean },
): Promise<InvoiceDetails[]> => {
  const { db } = await getDB();

  const conditions = [eq(invoices.organizationId, organizationId)];

  if (filters?.partnerId) {
    conditions.push(eq(invoices.partnerId, filters.partnerId));
  }

  if (!filters?.showSubstituted) {
    conditions.push(ne(invoices.status, "substituted"));
  }

  return db.query.invoices.findMany({
    where: and(...conditions),
    orderBy: [desc(invoices.invoiceDate)],
    with: {
      account: true,
      items: { with: { taxes: true } },
      businessPartner: true,
      allocations: { with: { payment: true, invoice: true } },
      linkedPayments: {
        with: {
          allocations: true,
        },
      },
    },
  });
};

export const getLatestInvoices = async (organizationId: number) => {
  const { db } = await getDB();

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return db.query.invoices.findMany({
    where: and(
      eq(invoices.organizationId, organizationId),
      gte(invoices.invoiceDate, startOfMonth),
      lte(invoices.invoiceDate, endOfMonth),
    ),
    orderBy: [desc(invoices.invoiceDate)],
    with: {
      businessPartner: true,
      allocations: true,
      linkedPayments: {
        with: {
          allocations: true,
        },
      },
    },
  });
};

export const getInvoicesByPeriod = async (
  organizationId: number,
  period: { month: number; year: number },
) => {
  const { db } = await getDB();

  const startOfMonth = new Date(period.year, period.month, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(
    period.year,
    period.month + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return db.query.invoices.findMany({
    where: and(
      eq(invoices.organizationId, organizationId),
      gte(invoices.invoiceDate, startOfMonth),
      lte(invoices.invoiceDate, endOfMonth),
    ),
    orderBy: [desc(invoices.invoiceDate)],
    with: {
      businessPartner: true,
      allocations: true,
      linkedPayments: {
        with: {
          allocations: true,
        },
      },
    },
  });
};

export const getInvoiceById = async (id: number) => {
  const { db } = await getDB();
  const organizationId = await getActiveOrganizationId(); // Still needed for filtering
  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, organizationId),
    ),
    with: {
      account: true,
      businessPartner: true,
      refundPayments: true,
      items: {
        with: {
          taxes: true,
        },
      },
      allocations: {
        with: {
          payment: {
            with: {
              allocations: {
                with: {
                  invoice: true,
                },
              },
            },
          },
          invoice: true,
        },
      },
    },
  });
};
