import { ComprobanteSchemaWithPagos } from "@/types/cfdi-schemas";

describe("CFDI Schema - Variation Tests", () => {
  const baseComprobante: any = {
    Version: "4.0",
    Serie: "Serie",
    Folio: "Folio",
    Fecha: "2024-04-29T10:46:30Z",
    Sello: "sello",
    NoCertificado: "30001000000500003416",
    Certificado: "cert",
    SubTotal: "200.00",
    Moneda: "MXN",
    Total: "199.96",
    TipoDeComprobante: "I",
    Exportacion: "01",
    MetodoPago: "PPD",
    FormaPago: "99",
    LugarExpedicion: "20000",
    Emisor: {
      Rfc: "EKU9003173C9",
      Nombre: "ESCUELA KEMPER URGATE",
      RegimenFiscal: "601",
    },
    Receptor: {
      Rfc: "URE180429TM6",
      Nombre: "UNIVERSIDAD ROBOTICA ESPAÑOLA",
      DomicilioFiscalReceptor: "86991",
      RegimenFiscalReceptor: "601",
      UsoCFDI: "G01",
    },
    Conceptos: {
      Concepto: [
        {
          ClaveProdServ: "50211503",
          Cantidad: "1",
          ClaveUnidad: "H87",
          Descripcion: "Cigarros",
          ValorUnitario: "200.00",
          Importe: "200.00",
          ObjetoImp: "02",
        },
      ],
    },
  };

  it("should parse Complemento as a single object and normalize it to an array", () => {
    const data = {
      ...baseComprobante,
      Complemento: {
        TimbreFiscalDigital: {
          Version: "1.1",
          UUID: "3ea43e97-71bf-4ac5-a28e-9374ea9f8b45",
          FechaTimbrado: "2024-04-29T10:46:30Z",
          RfcProvCertif: "SPR190613I52",
          SelloCFD: "sello",
          NoCertificadoSAT: "30001000000500003456",
          SelloSAT: "sello",
        },
      },
    };

    const parsed = ComprobanteSchemaWithPagos.parse(data);
    expect(Array.isArray(parsed.Complemento)).toBe(true);
    expect(parsed.Complemento).toHaveLength(1);
    expect(parsed.Complemento[0].TimbreFiscalDigital).toBeDefined();
  });

  it("should parse Pagos.Pago as a single object and normalize it to an array", () => {
    const data = {
      ...baseComprobante,
      TipoDeComprobante: "P",
      SubTotal: "0",
      Total: "0",
      Complemento: [
        {
          Pagos: {
            Version: "2.0",
            Totales: { MontoTotalPagos: "200.00" },
            Pago: {
              FechaPago: "2021-12-15T00:00:00Z",
              FormaDePagoP: "01",
              MonedaP: "MXN",
              Monto: "200.00",
              TipoCambioP: "1",
              DoctoRelacionado: [
                {
                  IdDocumento: "bfc36522-4b8e-45c4-8f14-d11b289f9eb7",
                  MonedaDR: "MXN",
                  NumParcialidad: "1",
                  ImpSaldoAnt: "200.00",
                  ImpPagado: "200.00",
                  ImpSaldoInsoluto: "0.00",
                  ObjetoImpDR: "01",
                  EquivalenciaDR: "1",
                },
              ],
            },
          },
        },
      ],
    };

    const parsed = ComprobanteSchemaWithPagos.parse(data);
    const pagosComplement = parsed.Complemento.find((c: any) => c.Pagos);
    expect(Array.isArray(pagosComplement.Pagos.Pago)).toBe(true);
    expect(pagosComplement.Pagos.Pago).toHaveLength(1);
  });

  it("should parse Pago.DoctoRelacionado as a single object and normalize it to an array", () => {
    const data = {
        ...baseComprobante,
        TipoDeComprobante: "P",
        SubTotal: "0",
        Total: "0",
        Complemento: [
          {
            Pagos: {
              Version: "2.0",
              Totales: { MontoTotalPagos: "200.00" },
              Pago: [
                {
                    FechaPago: "2021-12-15T00:00:00Z",
                    FormaDePagoP: "01",
                    MonedaP: "MXN",
                    Monto: "200.00",
                    TipoCambioP: "1",
                    DoctoRelacionado: {
                        IdDocumento: "bfc36522-4b8e-45c4-8f14-d11b289f9eb7",
                        MonedaDR: "MXN",
                        NumParcialidad: "1",
                        ImpSaldoAnt: "200.00",
                        ImpPagado: "200.00",
                        ImpSaldoInsoluto: "0.00",
                        ObjetoImpDR: "01",
                        EquivalenciaDR: "1",
                    },
                }
              ]
            }
          }
        ]
    };
    
    const parsed = ComprobanteSchemaWithPagos.parse(data);
    const pagosComplement = parsed.Complemento.find((c: any) => c.Pagos);
    expect(Array.isArray(pagosComplement.Pagos.Pago[0].DoctoRelacionado)).toBe(true);
    expect(pagosComplement.Pagos.Pago[0].DoctoRelacionado).toHaveLength(1);
  });
});
