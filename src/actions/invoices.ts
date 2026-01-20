"use server";

import { revalidatePath } from "next/cache";

import { and, eq } from "drizzle-orm";
import { zfd } from "zod-form-data";

import {
  businessPartners,
  invoiceItems,
  invoices,
  invoiceTaxes,
  organizations,
  taxRegimes,
} from "@/db/schema";
import { CFDIParser } from "@/lib/cfdi-parser";
import { actionClient } from "@/lib/safe-action";
import { getActiveOrganizationId } from "@/lib/session";
import { getDB } from "@/db";
import { ActionError } from "@/lib/errors";
import { getTaxName } from "@/lib/utils";
import { logAction } from "@/lib/audit-service";
import { validateInvoice } from "@/lib/fiscal-validation/invoice-rules";
import { FiscalInvoice } from "@/lib/fiscal-validation/types";

const insertInvoiceSchema = zfd.formData({
  cfdi: zfd.file(),
});

export const saveInvoice = actionClient
  .inputSchema(insertInvoiceSchema)
  .action(async ({ parsedInput }) => {
    const { cfdi } = parsedInput;
    const organizationId = await getActiveOrganizationId();

    if (!cfdi || cfdi.size === 0) {
      throw new ActionError("No hay archivo o está vacío");
    }

    const xmlContent = await cfdi.text();
    const parsedCFDI = await CFDIParser.parse(xmlContent);

    const { db } = await getDB();
    const invoiceId = await db.transaction(async (tx) => {
      // 1. Verify organization RFC against the CFDI
      const organization = await tx.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      });

      if (!organization) {
        throw new ActionError("La organización activa no es válida.");
      }

      const emitterRfc = parsedCFDI.Emisor.Rfc;
      const receiverRfc = parsedCFDI.Receptor.Rfc;

      if (organization.rfc !== emitterRfc && organization.rfc !== receiverRfc) {
        throw new ActionError(
          "Ningún RFC del CFDI coincide con el de su organización."
        );
      }

      const conceptos = Array.isArray(parsedCFDI.Conceptos.Concepto)
        ? parsedCFDI.Conceptos.Concepto
        : [parsedCFDI.Conceptos.Concepto];

      // 2. Determine partner info and invoice type
      const isEmitter = organization.rfc === emitterRfc;
      const invoiceType = isEmitter ? "income" : "expense";
      const partnerType = isEmitter ? "client" : "provider";
      const partnerRfc = isEmitter ? receiverRfc : emitterRfc;
      const partnerName = isEmitter
        ? parsedCFDI.Receptor.Nombre
        : parsedCFDI.Emisor.Nombre;
      const partnerTaxRegimeCode = isEmitter
        ? parsedCFDI.Receptor.RegimenFiscalReceptor
        : parsedCFDI.Emisor.RegimenFiscal;

      // 3. Find or create the business partner (scoped to the organization)
      let partner = await tx.query.businessPartners.findFirst({
        where: and(
          eq(businessPartners.rfc, partnerRfc),
          eq(businessPartners.organizationId, organizationId)
        ),
      });

      const partnerTaxRegime = await tx.query.taxRegimes.findFirst({
        where: eq(taxRegimes.code, partnerTaxRegimeCode),
      });

      if (!partnerTaxRegime) {
        throw new ActionError(
          `Régimen Fiscal ${partnerTaxRegimeCode} del socio no encontrado.`
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

      const complements = Array.isArray(parsedCFDI.Complemento)
        ? parsedCFDI.Complemento
        : [parsedCFDI.Complemento];

      const complement = complements.find((item) =>
        Boolean(item.TimbreFiscalDigital?.UUID)
      );

      if (!complement?.TimbreFiscalDigital?.UUID) {
        throw new ActionError(`El CFDI no contiene un folio fiscal correcto`);
      }

      if (!complement?.TimbreFiscalDigital?.FechaTimbrado) {
        throw new ActionError(`El CFDI no tiene una fecha de timbrado`);
      }

      // Validate Invoice Invariants
      const fiscalInvoiceToCheck: FiscalInvoice = {
        id: 0, // Not yet created
        total: parsedCFDI.Total,
        amountPaid: 0,
        paymentStatus: "pending", // Default
        status: "active",
        allocations: [],
      };

      const validation = validateInvoice(fiscalInvoiceToCheck);
      if (!validation.isValid) {
        throw new ActionError(
          `Error de validación fiscal: ${validation.errors[0].message}`
        );
      }

      // 4. Insert the main invoice
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          organizationId,
          partnerId: partner.id,
          invoiceType,
          cfdiType: parsedCFDI.TipoDeComprobante,
          cfdiVersion: parsedCFDI.Version,
          folioFiscal: complement.TimbreFiscalDigital.UUID,
          internalFolio: parsedCFDI.Folio,
          series: parsedCFDI.Serie,
          invoiceDate: new Date(parsedCFDI.Fecha),
          certificationDate: new Date(
            complement.TimbreFiscalDigital.FechaTimbrado
          ),
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
          xmlContent,
        })
        .returning();

      // 5. Insert invoice items and their taxes
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

        const traslados = Array.isArray(c.Impuestos?.Traslados?.Traslado)
          ? c.Impuestos.Traslados.Traslado
          : c.Impuestos?.Traslados?.Traslado
          ? [c.Impuestos.Traslados.Traslado]
          : [];

        const retenciones = Array.isArray(c.Impuestos?.Retenciones?.Retencion)
          ? c.Impuestos.Retenciones.Retencion
          : c.Impuestos?.Retenciones?.Retencion
          ? [c.Impuestos.Retenciones.Retencion]
          : [];

        const taxesToInsert = [
          ...traslados.map((t) => ({
            itemId: newItem.id,
            taxType: "transferred" as const,
            taxCode: t.Impuesto,
            taxName: getTaxName(t.Impuesto as "001" | "002" | "003"),
            factor: t.TipoFactor,
            rate: t.TasaOCuota,
            baseAmount: t.Base,
            taxAmount: t.Importe ?? "0.00", // TODO: Check if this is correct
          })),

          ...retenciones.map((r) => ({
            itemId: newItem.id,
            taxType: "withheld" as const,
            taxCode: r.Impuesto,
            taxName: getTaxName(r.Impuesto as "001" | "002" | "003"),
            factor: r.TipoFactor,
            rate: r.TasaOCuota,
            baseAmount: r.Base,
            taxAmount: r.Importe, // Corrected from r.Impuesto
          })),
        ];

        if (taxesToInsert.length > 0) {
          await tx.insert(invoiceTaxes).values(taxesToInsert);
        }
      }

      await logAction({
        organizationId,
        entityType: "invoice",
        entityId: newInvoice.id,
        action: "created",
        metadata: {
          source: "import",
          reason: "CFDI Upload",
        },
        tx,
      });

      return newInvoice.id;
    });

    revalidatePath("/");

    return { invoiceId };
  });
