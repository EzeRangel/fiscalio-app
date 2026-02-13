import { saveNewInvoice } from "@/data/invoices";
import { getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { FISCAL_VALIDATION_RULES } from "@/lib/fiscal-validation/constants";

jest.mock("@/db", () => {
  const actual = jest.requireActual("@/db");
  const actualSchema = jest.requireActual("@/db/schema");
  return {
    ...actual,
    ...actualSchema,
    getDB: jest.fn(),
  };
});
jest.mock("@/lib/session");
jest.mock("@/data/payments", () => ({
  savePaymentComplement: jest.fn(),
  savePUEPayment: jest.fn(),
}));

const mockOrg = {
  id: 1,
  rfc: "ORG123456789",
  taxRegimeId: 1,
};

const mockTaxRegime = {
  id: 1,
  code: "626", // RESICO
};

describe("Invoices Integration - RESICO Validations", () => {
  let mockTx: any;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = {
      query: {
        organizations: {
          findFirst: jest.fn().mockResolvedValue(mockOrg),
        },
        businessPartners: {
          findFirst: jest.fn().mockResolvedValue({ id: 10, rfc: "PARTNER123" }),
        },
        taxRegimes: {
          findFirst: jest.fn().mockResolvedValue(mockTaxRegime),
        },
      },
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockImplementation(function (this: any) {
        // Return based on what was inserted
        const values = this.values?.mock?.calls?.[0]?.[0] || {};
        return Promise.resolve([{ 
          id: 999,
          status: values.status || "active",
          validationErrors: values.validationErrors || null
        }]);
      }),
    };

    mockDb = {
      transaction: jest.fn((cb) => cb(mockTx)),
    };

    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(mockOrg.id);
  });

  const createMockCFDI = (overrides: any = {}) => ({
    Version: "4.0",
    Fecha: "2023-01-01T10:00:00",
    TipoDeComprobante: "I",
    Serie: "A",
    Folio: "123",
    Moneda: "MXN",
    SubTotal: "100.00",
    Total: "116.00",
    Emisor: {
      Rfc: mockOrg.rfc,
      Nombre: "My Org",
      RegimenFiscal: "626",
    },
    Receptor: {
      Rfc: "LEGAL1234567", // 12 chars = Legal Entity
      Nombre: "Partner Name",
      RegimenFiscalReceptor: "601",
      UsoCFDI: "G03",
      DomicilioFiscalReceptor: "12345",
    },
    Conceptos: {
      Concepto: [
        {
          ClaveProdServ: "01010101",
          Cantidad: "1",
          ClaveUnidad: "H87",
          Descripcion: "Test Item",
          ValorUnitario: "100.00",
          Importe: "100.00",
          ObjetoImp: "02",
          Impuestos: {
            Traslados: {
              Traslado: [{ Base: "100.00", Impuesto: "002", TipoFactor: "Tasa", TasaOCuota: "0.160000", Importe: "16.00" }]
            },
            Retenciones: {
              Retencion: [{ Base: "100.00", Impuesto: "001", TipoFactor: "Tasa", TasaOCuota: "0.012500", Importe: "1.25" }]
            }
          }
        },
      ],
    },
    Complemento: [
      {
        TimbreFiscalDigital: {
          UUID: "550e8400-e29b-41d4-a716-446655440000",
          FechaTimbrado: "2023-01-01T10:05:00",
        },
      },
    ],
    ...overrides
  });

  it("should reject income invoice if issuer regime is not 626", async () => {
    const cfdi = createMockCFDI({
      Emisor: { Rfc: mockOrg.rfc, Nombre: "My Org", RegimenFiscal: "601" }
    });

    await expect(saveNewInvoice(cfdi as any, "<xml/>", "hash")).rejects.toThrow(
      "El emisor del CFDI de ingreso debe estar bajo el régimen RESICO (626)."
    );
  });

  it("should save as 'active' and no validation errors for correct RESICO invoice", async () => {
    const cfdi = createMockCFDI();
    const result = await saveNewInvoice(cfdi as any, "<xml/>", "hash");

    expect(result.status).toBe("active");
    expect(result.validationErrors).toBeNull();
  });

  it("should save as 'invalid' if ISR withholding is missing for legal entity", async () => {
    const cfdi = createMockCFDI();
    // Remove ISR withholding
    cfdi.Conceptos.Concepto[0].Impuestos.Retenciones.Retencion = [];

    const result = await saveNewInvoice(cfdi as any, "<xml/>", "hash");

    expect(result.status).toBe("invalid");
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({ code: FISCAL_VALIDATION_RULES.USER_FACING.INVOICE_MISSING_ISR_WITHHOLDING })
    );
  });

  it("should save as 'invalid' if exchange rate is missing for USD", async () => {
    const cfdi = createMockCFDI({
      Moneda: "USD",
      TipoCambio: "1.0" // Invalid for foreign currency
    });

    const result = await saveNewInvoice(cfdi as any, "<xml/>", "hash");

    expect(result.status).toBe("invalid");
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({ code: FISCAL_VALIDATION_RULES.USER_FACING.INVOICE_INVALID_EXCHANGE_RATE })
    );
  });
});
