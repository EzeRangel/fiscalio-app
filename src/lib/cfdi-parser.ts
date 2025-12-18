import { JsonConverter } from "@nodecfdi/cfdi-to-json";
import { ComprobanteSchema, type CFDIComprobante } from "@/types/cfdi-schemas";
import z from "zod/v4";

export class CFDIParser {
  /**
   * Parsea XML del SAT usando NodeCfdi y valida con Zod
   */
  static async parse(xmlContent: string): Promise<CFDIComprobante> {
    try {
      const jsonConverter = new JsonConverter();
      const json = jsonConverter.convertToJson(xmlContent);
      const jsonData = JSON.parse(json);

      return ComprobanteSchema.parse(jsonData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`CFDI inválido: ${this.formatZodErrors(error)}`);
      }

      throw new Error(`Error al procesar XML: ${(error as Error).message}`);
    }
  }

  private static formatZodErrors(error: z.ZodError): string {
    return error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
  }

  static extractEssentials(cfdi: CFDIComprobante) {
    // NodeCfdi ya maneja arrays vs objetos únicos correctamente
    const conceptos = Array.isArray(cfdi.Conceptos.Concepto)
      ? cfdi.Conceptos.Concepto
      : [cfdi.Conceptos.Concepto];

    return {
      // Datos del timbre
      uuid: cfdi.Complemento.TimbreFiscalDigital.UUID,
      fechaTimbrado: new Date(
        cfdi.Complemento.TimbreFiscalDigital.FechaTimbrado
      ),

      // Datos generales
      version: cfdi.Version,
      serie: cfdi.Serie,
      folio: cfdi.Folio,
      fecha: new Date(cfdi.Fecha),
      tipoComprobante: cfdi.TipoDeComprobante,

      // Emisor
      emisorRfc: cfdi.Emisor.Rfc,
      emisorNombre: cfdi.Emisor.Nombre,
      emisorRegimenFiscal: cfdi.Emisor.RegimenFiscal,

      // Receptor
      receptorRfc: cfdi.Receptor.Rfc,
      receptorNombre: cfdi.Receptor.Nombre,
      receptorUsoCFDI: cfdi.Receptor.UsoCFDI,
      receptorDomicilioFiscal: cfdi.Receptor.DomicilioFiscalReceptor,
      receptorRegimenFiscal: cfdi.Receptor.RegimenFiscalReceptor,

      // Montos
      moneda: cfdi.Moneda,
      tipoCambio: cfdi.TipoCambio,
      subtotal: parseFloat(cfdi.SubTotal),
      descuento: cfdi.Descuento ? parseFloat(cfdi.Descuento) : undefined,
      total: parseFloat(cfdi.Total),

      // Forma de pago
      metodoPago: cfdi.MetodoPago,
      formaPago: cfdi.FormaPago,
      lugarExpedicion: cfdi.LugarExpedicion,

      // Conceptos procesados
      conceptos: conceptos.map((c) => ({
        claveProdServ: c.ClaveProdServ,
        cantidad: parseFloat(c.Cantidad),
        claveUnidad: c.ClaveUnidad,
        unidad: c.Unidad,
        descripcion: c.Descripcion,
        valorUnitario: parseFloat(c.ValorUnitario),
        importe: parseFloat(c.Importe),
        descuento: c.Descuento ? parseFloat(c.Descuento) : undefined,
        objetoImp: c.ObjetoImp,
      })),
    };
  }
}
