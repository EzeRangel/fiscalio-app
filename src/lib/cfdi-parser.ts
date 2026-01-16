import { JsonConverter } from "@nodecfdi/cfdi-to-json";
import {
  ComprobanteSchemaWithPagos,
  type CFDIComprobante,
} from "@/types/cfdi-schemas";
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

      return ComprobanteSchemaWithPagos.parse(jsonData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`CFDI inválido: ${this.formatZodErrors(error)}`);
      }

      throw new Error(
        `Error al procesar XML, el documento está mal formado o tiene errores.`
      );
    }
  }

  private static formatZodErrors(error: z.ZodError): string {
    return error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
  }

  static extractEssentials(cfdi: CFDIComprobante) {
    const conceptos = cfdi.Conceptos.Concepto;

    // Find the TimbreFiscalDigital within the Complemento array
    const timbreComplement = cfdi.Complemento.find(
      (c) => c.TimbreFiscalDigital
    );
    const timbre = timbreComplement?.TimbreFiscalDigital;

    if (!timbre) {
      throw new Error("TimbreFiscalDigital no encontrado en el CFDI.");
    }

    return {
      // Datos del timbre
      uuid: timbre.UUID,
      fechaTimbrado: new Date(timbre.FechaTimbrado),

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
