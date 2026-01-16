import z from "zod/v4";

/**
 * Helper para manejar campos que pueden venir como un objeto único o como un array.
 * Siempre los normaliza a un array para facilitar el procesamiento.
 */
const maybeArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (val === undefined || val === null) return [];
    return Array.isArray(val) ? val : [val];
  }, z.array(schema));

// NodeCfdi convierte atributos XML a propiedades del objeto
export const EmisorSchema = z.object({
  Rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/),
  Nombre: z.string().min(1),
  RegimenFiscal: z.string().regex(/^\d{3}$/),
});

export const ReceptorSchema = z.object({
  Rfc: z.string().regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/),
  Nombre: z.string().min(1),
  UsoCFDI: z.string().regex(/^[A-Z]\d{2}$/),
  DomicilioFiscalReceptor: z.string().regex(/^\d{5}$/),
  RegimenFiscalReceptor: z.string().regex(/^\d{3}$/),
});

const TrasladoConceptoSchema = z.object({
  Base: z.string(),
  Impuesto: z.string(),
  TipoFactor: z.enum(["Tasa", "Cuota", "Exento"]),
  TasaOCuota: z.string().optional(),
  Importe: z.string().optional(),
});

const RetencionConceptoSchema = z.object({
  Base: z.string(),
  Impuesto: z.string(),
  TipoFactor: z.enum(["Tasa", "Cuota"]),
  TasaOCuota: z.string(),
  Importe: z.string(),
});

const ImpuestosConceptoSchema = z.object({
  Traslados: z
    .object({
      Traslado: maybeArray(TrasladoConceptoSchema),
    })
    .optional(),
  Retenciones: z
    .object({
      Retencion: maybeArray(RetencionConceptoSchema),
    })
    .optional(),
});

export const ConceptoSchema = z.object({
  ClaveProdServ: z.string().regex(/^\d{8}$/),
  NoIdentificacion: z.string().optional(),
  Cantidad: z.string(),
  ClaveUnidad: z.string(),
  Unidad: z.string().optional(),
  Descripcion: z.string().min(1),
  ValorUnitario: z.string(),
  Importe: z.string(),
  Descuento: z.string().optional(),
  ObjetoImp: z.enum(["01", "02", "03", "04"]),
  Impuestos: ImpuestosConceptoSchema.optional(),
});

export const TimbreFiscalDigitalSchema = z.object({
  Version: z.literal("1.1"),
  UUID: z.string().uuid(),
  FechaTimbrado: z.iso.datetime({ local: true }),
  RfcProvCertif: z.string(),
  SelloCFD: z.string(),
  NoCertificadoSAT: z.string(),
  SelloSAT: z.string(),
});

const ImpuestosComprobanteSchema = z.object({
  TotalImpuestosTrasladados: z.string().optional(),
  TotalImpuestosRetenidos: z.string().optional(),
});

export const ComprobanteSchema = z.object({
  Version: z.enum(["3.3", "4.0"]),
  Serie: z.string().optional(),
  Folio: z.string().optional(),
  Fecha: z.iso.datetime({ local: true }),
  Sello: z.string(),
  FormaPago: z.string().optional(),
  NoCertificado: z.string(),
  Certificado: z.string(),
  SubTotal: z.string(),
  Descuento: z.string().optional(),
  Moneda: z.string(),
  TipoCambio: z.string().optional(),
  Total: z.string(),
  TipoDeComprobante: z.enum(["I", "E", "T", "N", "P"]),
  Exportacion: z.enum(["01", "02", "03", "04"]),
  MetodoPago: z.enum(["PUE", "PPD"]).optional(),
  LugarExpedicion: z.string().regex(/^\d{5}$/),

  Emisor: EmisorSchema,
  Receptor: ReceptorSchema,

  // NodeCfdi maneja esto correctamente: array o objeto único
  Conceptos: z.object({
    Concepto: maybeArray(ConceptoSchema),
  }),

  Complemento: maybeArray(z.record(z.any(), z.any())),
  Impuestos: ImpuestosComprobanteSchema.optional(),
});

export enum Impuesto {
  "001" = "ISR",
  "002" = "IVA",
  "003" = "IEPS",
}

// --- Schemas para Complemento de Pagos 2.0 ---

export const TrasladoDRSchema = z.object({
  BaseDR: z.string(),
  ImpuestoDR: z.string(),
  TipoFactorDR: z.string(),
  TasaOCuotaDR: z.string().optional(),
  ImporteDR: z.string().optional(),
});

export const RetencionDRSchema = z.object({
  BaseDR: z.string(),
  ImpuestoDR: z.string(),
  TipoFactorDR: z.string(),
  TasaOCuotaDR: z.string(),
  ImporteDR: z.string(),
});

export const ImpuestosDRSchema = z.object({
  TrasladosDR: z
    .object({
      TrasladoDR: maybeArray(TrasladoDRSchema),
    })
    .optional(),
  RetencionesDR: z
    .object({
      RetencionDR: maybeArray(RetencionDRSchema),
    })
    .optional(),
});

export const DoctoRelacionadoSchema = z.object({
  IdDocumento: z.string().uuid(),
  Serie: z.string().optional(),
  Folio: z.string().optional(),
  MonedaDR: z.string(),
  EquivalenciaDR: z.string().optional(),
  NumParcialidad: z.string(),
  ImpSaldoAnt: z.string(),
  ImpPagado: z.string(),
  ImpSaldoInsoluto: z.string(),
  ObjetoImpDR: z.string(),
  ImpuestosDR: ImpuestosDRSchema.optional(),
});

export const TrasladoPSchema = z.object({
  BaseP: z.string(),
  ImpuestoP: z.string(),
  TipoFactorP: z.string(),
  TasaOCuotaP: z.string().optional(),
  ImporteP: z.string().optional(),
});

export const RetencionPSchema = z.object({
  BaseP: z.string(),
  ImpuestoP: z.string(),
});

export const ImpuestosPagoSchema = z.object({
  TrasladosP: z
    .object({
      TrasladoP: maybeArray(TrasladoPSchema),
    })
    .optional(),
  RetencionesP: z
    .object({
      RetencionP: maybeArray(RetencionPSchema),
    })
    .optional(),
});

export const PagoSchema = z.object({
  FechaPago: z.string(),
  FormaDePagoP: z.string(),
  MonedaP: z.string(),
  TipoCambioP: z.string().optional(),
  Monto: z.string(),
  NumOperacion: z.string().optional(),
  RfcEmisorCtaOrd: z.string().optional(),
  NomBancoOrdExt: z.string().optional(),
  CtaOrdenante: z.string().optional(),
  RfcEmisorCtaBen: z.string().optional(),
  CtaBeneficiario: z.string().optional(),
  TipoCadPago: z.string().optional(),
  CertPago: z.string().optional(),
  CadPago: z.string().optional(),
  SelloPago: z.string().optional(),
  DoctoRelacionado: maybeArray(DoctoRelacionadoSchema),
  ImpuestosP: ImpuestosPagoSchema.optional(),
});

export const TotalesPagosSchema = z.object({
  MontoTotalPagos: z.string().optional(),
  TotalRetencionesIVA: z.string().optional(),
  TotalRetencionesISR: z.string().optional(),
  TotalRetencionesIEPS: z.string().optional(),
  TotalTrasladosBaseIVA16: z.string().optional(),
  TotalTrasladosImpuestoIVA16: z.string().optional(),
  TotalTrasladosBaseIVA8: z.string().optional(),
  TotalTrasladosImpuestoIVA8: z.string().optional(),
  TotalTrasladosBaseIVA0: z.string().optional(),
  TotalTrasladosImpuestoIVA0: z.string().optional(),
  TotalTrasladosBaseIVAExento: z.string().optional(),
});

export const PagosSchema = z.object({
  Version: z.literal("2.0"),
  Totales: TotalesPagosSchema.optional(),
  Pago: maybeArray(PagoSchema),
});

// Update ComprobanteSchema to handle the array-based Complemento and specialized Pagos schema
export const ComprobanteSchemaWithPagos = ComprobanteSchema.extend({
  Complemento: maybeArray(
    z
      .object({
        TimbreFiscalDigital: TimbreFiscalDigitalSchema.optional(),
        Pagos: PagosSchema.optional(),
      })
      .catchall(z.any())
  ),
});

export type CFDIComprobante = z.infer<typeof ComprobanteSchemaWithPagos>;
