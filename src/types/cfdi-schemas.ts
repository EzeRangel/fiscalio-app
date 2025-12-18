import z from "zod/v4";

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
      Traslado: z.union([
        TrasladoConceptoSchema,
        z.array(TrasladoConceptoSchema),
      ]),
    })
    .optional(),
  Retenciones: z
    .object({
      Retencion: z.union([
        RetencionConceptoSchema,
        z.array(RetencionConceptoSchema),
      ]),
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
    Concepto: z.union([ConceptoSchema, z.array(ConceptoSchema)]),
  }),

  Complemento: z.object({
    TimbreFiscalDigital: TimbreFiscalDigitalSchema,
  }),
  Impuestos: ImpuestosComprobanteSchema.optional(),
});

export enum Impuesto {
  "001" = "ISR",
  "002" = "IVA",
  "003" = "IEPS",
}

export type CFDIComprobante = z.infer<typeof ComprobanteSchema>;
