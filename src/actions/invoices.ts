"use server";

import { getDB } from "@/db/drizzle";
import {
  businessPartners,
  invoiceItems,
  invoices,
  invoiceTaxes,
  taxRegimes,
} from "@/db/schema";
import { CFDIParser } from "@/lib/cfdi-parser";
import { actionClient } from "@/lib/safe-action";
import { BusinessPartner } from "@/types/businessPartners";
import { Impuesto } from "@/types/cfdi-schemas";
import { Regime } from "@/types/taxRegimes";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { zfd } from "zod-form-data";
import z from "zod/v4";

const insertInvoiceSchema = zfd.formData({
  cfdi: zfd.file(),
  organizationId: zfd.text(z.coerce.number()),
});

function transformTaxCodeToName(code: string): Impuesto {
  switch (code) {
    case "001":
      return Impuesto?.["001"] as const;
    case "002":
      return Impuesto?.["002"];
    case "003":
      return Impuesto["003"];
    default:
      return Impuesto["001"];
  }
}

export const saveInvoice = actionClient
  .inputSchema(insertInvoiceSchema)
  .action(async ({ parsedInput }) => {
    const { cfdi, organizationId } = parsedInput;

    if (!cfdi || cfdi.size === 0) {
      throw new Error("No hay archivo o está vacío");
    }

    const xmlContent = await cfdi.text();
    const parsedCFDI = await CFDIParser.parse(xmlContent);

    const { db } = await getDB();

    // TODO: Validar que la factura tenga el RFC de mi organización...

    const invoiceId = await db.transaction(async (tx) => {
      const conceptos = Array.isArray(parsedCFDI.Conceptos.Concepto)
        ? parsedCFDI.Conceptos.Concepto
        : [parsedCFDI.Conceptos.Concepto];

      // 1. Find or create the business partner
      // Assuming the app user is the receiver, the emitter is the business partner
      const emitterRfc = parsedCFDI.Emisor.Rfc;
      const receiverRfc = parsedCFDI.Receptor.Rfc;

      let partnerType: string | null = null;
      let partner: BusinessPartner | undefined;
      let partnerTaxRegime: Regime | undefined;

      if (parsedCFDI.TipoDeComprobante === "I") {
        partner = await tx.query.businessPartners.findFirst({
          where: eq(businessPartners.rfc, receiverRfc),
        });

        partnerTaxRegime = await tx.query.taxRegimes.findFirst({
          where: eq(taxRegimes.code, parsedCFDI.Receptor.RegimenFiscalReceptor),
        });

        partnerType = "client";
      } else {
        partner = await tx.query.businessPartners.findFirst({
          where: eq(businessPartners.rfc, emitterRfc),
        });

        partnerTaxRegime = await tx.query.taxRegimes.findFirst({
          where: eq(taxRegimes.code, parsedCFDI.Emisor.RegimenFiscal),
        });

        partnerType = "provider";
      }

      if (!partner && !!partnerTaxRegime) {
        const partnerRFC =
          partnerType === "client"
            ? parsedCFDI.Receptor.Rfc
            : parsedCFDI.Emisor.Rfc;

        const [newPartner] = await tx
          .insert(businessPartners)
          .values({
            partnerType,
            businessName: parsedCFDI.Emisor.Nombre,
            legalName: parsedCFDI.Emisor.Nombre,
            rfc: partnerRFC,
            taxRegimeId: partnerTaxRegime?.id,
            organizationId,
          })
          .returning();

        partner = newPartner;
      }

      // 2. Insert the main invoice
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          organizationId,
          partnerId: partner!.id,
          invoiceType: partnerType === "client" ? "income" : "spend",
          cfdiType: parsedCFDI.TipoDeComprobante,
          cfdiVersion: parsedCFDI.Version,
          folioFiscal: parsedCFDI.Complemento.TimbreFiscalDigital.UUID,
          internalFolio: parsedCFDI.Folio,
          series: parsedCFDI.Serie,
          invoiceDate: new Date(parsedCFDI.Fecha),
          certificationDate: new Date(
            parsedCFDI.Complemento.TimbreFiscalDigital.FechaTimbrado
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

      // 3. Insert invoice items and their taxes
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

        const taxesToInsert = [
          ...traslados.map((t) => ({
            itemId: newItem.id,
            taxType: "transferred" as const,
            taxCode: t.Impuesto,
            taxName: transformTaxCodeToName(t.Impuesto),
            factor: t.TipoFactor,
            rate: t.TasaOCuota,
            baseAmount: t.Base,
            taxAmount: t.Importe,
          })),
          ...retenciones.map((r) => ({
            itemId: newItem.id,
            taxType: "withheld" as const,
            taxCode: r.Impuesto,
            taxName: transformTaxCodeToName(t.Impuesto),
            factor: r.TipoFactor,
            rate: r.TasaOCuota,
            baseAmount: r.Base,
            taxAmount: r.Importe,
          })),
        ];

        if (taxesToInsert.length > 0) {
          await tx.insert(invoiceTaxes).values(taxesToInsert);
        }
      }

      return newInvoice.id;
    });

    revalidatePath("/");

    return { invoiceId };
  });
