import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";
import { invoices } from "@/db/schema";
import {
  businessPartners,
  getDB,
  invoiceItems,
  invoiceTaxes,
  organizations,
  taxRegimes,
} from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { CFDIComprobante as ParsedCFDI } from "@/types/cfdi-schemas";
import { getTaxName } from "@/lib/utils";

// TODO: Mejorar la función para obtener todas las facturas, enviar filtros como parámetros.
export const getInvoicesByOrganization = async (organizationId: number) => {
  const { db } = await getDB();

  return db.query.invoices.findMany({
    where: eq(invoices.organizationId, organizationId),
    orderBy: [desc(invoices.invoiceDate)],
    with: {
      businessPartner: true,
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
    0
  );
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return db.query.invoices.findMany({
    where: and(
      eq(invoices.organizationId, organizationId),
      gte(invoices.invoiceDate, startOfMonth),
      lte(invoices.invoiceDate, endOfMonth)
    ),
    orderBy: [desc(invoices.invoiceDate)],
    with: {
      businessPartner: true,
    },
  });
};

export const getInvoiceById = async (id: number) => {
  const { db } = await getDB();
  const organizationId = await getActiveOrganizationId(); // Still needed for filtering
  return db.query.invoices.findFirst({
    where: and(
      eq(invoices.id, id),
      eq(invoices.organizationId, organizationId)
    ),
    with: {
      businessPartner: true,
      items: {
        with: {
          taxes: true,
        },
      },
    },
  });
};

export const saveNewInvoice = async (parsedCFDI: ParsedCFDI, xml: string) => {
  const { db } = await getDB();
  const organizationId = await getActiveOrganizationId();

  const invoiceId = await db.transaction(async (tx) => {
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
      throw new Error(
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

    // 4. Insert the main invoice
    const [newInvoice] = await tx
      .insert(invoices)
      .values({
        organizationId,
        partnerId: partner.id,
        invoiceType,
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
        xmlContent: xml,
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

      // TODO: Fix this
      const taxesToInsert = [
        ...traslados.map((t) => ({
          itemId: newItem.id,
          taxType: "transferred" as const,
          taxCode: t.Impuesto,
          taxName: getTaxName(t.Impuesto),
          factor: t.TipoFactor,
          rate: t.TasaOCuota,
          baseAmount: t.Base,
          taxAmount: t.Importe,
        })),
        ...retenciones.map((r) => ({
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

      if (taxesToInsert.length > 0) {
        await tx.insert(invoiceTaxes).values(taxesToInsert);
      }
    }

    return newInvoice.id;
  });

  return invoiceId;
};
