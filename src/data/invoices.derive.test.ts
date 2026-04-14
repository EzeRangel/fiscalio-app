import { saveNewInvoice } from "./invoices";
import { getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { invoices as invoicesSchema } from "@/db/schema";

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
jest.mock("./payments", () => ({
  savePaymentComplement: jest.fn(),
  savePUEPayment: jest.fn(),
}));

// Mock drizzle-orm
jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn((col, val) => ({ type: "eq", col, val })),
  and: jest.fn((...conds) => ({ type: "and", conds })),
}));

const mockOrg = {
  id: 1,
  rfc: "ORG123456789",
};

const mockTaxRegime = {
  id: 10,
  code: "601",
};

describe("saveNewInvoice - Invoice Type Derivation", () => {
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
          findFirst: jest.fn().mockResolvedValue({ id: 1, rfc: "PARTNER" }),
        },
        taxRegimes: {
          findFirst: jest.fn().mockResolvedValue(mockTaxRegime),
        },
        invoices: {
            findFirst: jest.fn().mockResolvedValue({ id: 999, total: "100.00" }),
        }
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 999 }]),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };

    mockDb = {
      transaction: jest.fn((cb) => cb(mockTx)),
    };

    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(mockOrg.id);
  });

  const createMockCFDI = (cfdiType: string, emitterRfc: string, receiverRfc: string) => ({
    Version: "4.0",
    Fecha: "2023-01-01T10:00:00",
    TipoDeComprobante: cfdiType,
    Serie: "A",
    Folio: "123",
    Moneda: "MXN",
    SubTotal: "100.00",
    Total: "116.00",
    Emisor: {
      Rfc: emitterRfc,
      Nombre: "Emitter Org",
      RegimenFiscal: "626",
    },
    Receptor: {
      Rfc: receiverRfc,
      Nombre: "Receiver Org",
      RegimenFiscalReceptor: "626",
      UsoCFDI: "G03",
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
  });

  it("should derive 'income' for type 'I' when organization is Emitter", async () => {
    const cfdi = createMockCFDI("I", mockOrg.rfc, "OTHER_RFC");
    await saveNewInvoice(cfdi as any, "<xml/>");
    
    const invoiceInsert = mockTx.insert.mock.calls.find((c: any) => c[0] === invoicesSchema);
    const values = mockTx.values.mock.calls.find((c: any) => c[0].invoiceType !== undefined)[0];
    expect(values.invoiceType).toBe("income");
  });

  it("should derive 'expense' for type 'I' when organization is Receiver", async () => {
    const cfdi = createMockCFDI("I", "OTHER_RFC", mockOrg.rfc);
    await saveNewInvoice(cfdi as any, "<xml/>");
    
    const values = mockTx.values.mock.calls.find((c: any) => c[0].invoiceType !== undefined)[0];
    expect(values.invoiceType).toBe("expense");
  });

  it("should derive 'credit_note_issued' for type 'E' when organization is Emitter", async () => {
    const cfdi = createMockCFDI("E", mockOrg.rfc, "OTHER_RFC");
    await saveNewInvoice(cfdi as any, "<xml/>");
    
    const values = mockTx.values.mock.calls.find((c: any) => c[0].invoiceType !== undefined)[0];
    expect(values.invoiceType).toBe("credit_note_issued");
  });

  it("should derive 'credit_note_received' for type 'E' when organization is Receiver", async () => {
    const cfdi = createMockCFDI("E", "OTHER_RFC", mockOrg.rfc);
    await saveNewInvoice(cfdi as any, "<xml/>");
    
    const values = mockTx.values.mock.calls.find((c: any) => c[0].invoiceType !== undefined)[0];
    expect(values.invoiceType).toBe("credit_note_received");
  });

  it("should derive 'payment_issued' for type 'P' when organization is Emitter", async () => {
    const cfdi = createMockCFDI("P", mockOrg.rfc, "OTHER_RFC");
    await saveNewInvoice(cfdi as any, "<xml/>");
    
    const values = mockTx.values.mock.calls.find((c: any) => c[0].invoiceType !== undefined)[0];
    expect(values.invoiceType).toBe("payment_issued");
  });

  it("should derive 'payment_received' for type 'P' when organization is Receiver", async () => {
    const cfdi = createMockCFDI("P", "OTHER_RFC", mockOrg.rfc);
    await saveNewInvoice(cfdi as any, "<xml/>");
    
    const values = mockTx.values.mock.calls.find((c: any) => c[0].invoiceType !== undefined)[0];
    expect(values.invoiceType).toBe("payment_received");
  });
});
