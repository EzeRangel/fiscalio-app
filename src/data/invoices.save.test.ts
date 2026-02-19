import { saveNewInvoice } from "./invoices";
import { getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { businessPartners } from "@/db/schema";
import { GENERIC_RFCS } from "@/lib/constants";

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

describe("saveNewInvoice - Partner creation logic", () => {
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
          findFirst: jest.fn(),
        },
        taxRegimes: {
          findFirst: jest.fn().mockResolvedValue(mockTaxRegime),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 999 }]),
    };

    mockDb = {
      transaction: jest.fn((cb) => cb(mockTx)),
    };

    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(mockOrg.id);
  });

  const createMockCFDI = (partnerRfc: string, partnerName: string) => ({
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
      Rfc: partnerRfc,
      Nombre: partnerName,
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

  it("should create separate partners for same generic RFC with different names", async () => {
    const genericRfc = GENERIC_RFCS.FOREIGN;
    const cfdi1 = createMockCFDI(genericRfc, "Foreign Partner A");
    const cfdi2 = createMockCFDI(genericRfc, "Foreign Partner B");

    // 1. Process first invoice
    mockTx.query.businessPartners.findFirst.mockResolvedValueOnce(null); // Not found
    
    // For the insert call during partner creation
    mockTx.insert.mockImplementationOnce(() => ({
        values: () => ({
            returning: () => Promise.resolve([{ id: 1, businessName: "Foreign Partner A" }])
        })
    }));
    // For the insert call during invoice creation
    mockTx.insert.mockImplementationOnce(() => ({
        values: () => ({
            returning: () => Promise.resolve([{ id: 101 }])
        })
    }));
    // For the insert call during invoice items
    mockTx.insert.mockImplementationOnce(() => ({
        values: () => ({
            returning: () => Promise.resolve([{ id: 201 }])
        })
    }));

    await saveNewInvoice(cfdi1 as any, "<xml/>");

    // Verify first call to findFirst included the name
    const firstCall = mockTx.query.businessPartners.findFirst.mock.calls[0][0];
    expect(firstCall.where.conds.some((c: any) => c.val === "Foreign Partner A")).toBe(true);

    // 2. Process second invoice with DIFFERENT name
    // It should NOT find the partner because we are now querying by name too
    mockTx.query.businessPartners.findFirst.mockResolvedValueOnce(null);

    // Mock insert for the second partner
    mockTx.insert.mockImplementationOnce(() => ({
        values: () => ({
            returning: () => Promise.resolve([{ id: 2, businessName: "Foreign Partner B" }])
        })
    }));

    await saveNewInvoice(cfdi2 as any, "<xml/>");

    // Verify second call to findFirst also included the name
    const secondCall = mockTx.query.businessPartners.findFirst.mock.calls[1][0];
    expect(secondCall.where.conds.some((c: any) => c.val === "Foreign Partner B")).toBe(true);

    // The expectation for the NEW logic:
    // It should have attempted to create a NEW partner for CFDI2 because name is different
    // Currently it will reuse partner 1, so insert(businessPartners) will only be called once.
    
    // We filter calls to insert to only count those for businessPartners
    const partnerInserts = mockTx.insert.mock.calls.filter((call: any) => call[0] === businessPartners);
    expect(partnerInserts).toHaveLength(2);
  });

  it("should reuse same partner for same generic RFC with same name", async () => {
      const genericRfc = GENERIC_RFCS.FOREIGN;
      const cfdi1 = createMockCFDI(genericRfc, "Foreign Partner A");
      const cfdi2 = createMockCFDI(genericRfc, "Foreign Partner A");

      mockTx.query.businessPartners.findFirst
        .mockResolvedValueOnce(null) // First time not found
        .mockResolvedValueOnce({ id: 1, businessName: "Foreign Partner A" }); // Second time found

      await saveNewInvoice(cfdi1 as any, "<xml/>");
      await saveNewInvoice(cfdi2 as any, "<xml/>");

      const partnerInserts = mockTx.insert.mock.calls.filter((call: any) => call[0] === businessPartners);
      expect(partnerInserts).toHaveLength(1);
  });

  it("should reuse same partner for same specific RFC even with different name", async () => {
      const specificRfc = "ABC123456789";
      const cfdi1 = createMockCFDI(specificRfc, "Partner Name A");
      const cfdi2 = createMockCFDI(specificRfc, "Partner Name B");

      mockTx.query.businessPartners.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 2, businessName: "Partner Name A" });

      await saveNewInvoice(cfdi1 as any, "<xml/>");
      await saveNewInvoice(cfdi2 as any, "<xml/>");

      const partnerInserts = mockTx.insert.mock.calls.filter((call: any) => call[0] === businessPartners);
      expect(partnerInserts).toHaveLength(1);
  });

  it("should distribute header taxes to items when item taxes are missing", async () => {
    const specificRfc = "ABC123456789";
    const cfdi = createMockCFDI(specificRfc, "Partner Name");
    
    // Ensure header taxes are present but concepts have NO taxes
    (cfdi as any).Impuestos = {
      TotalImpuestosTrasladados: "16.00",
      TotalImpuestosRetenidos: "1.25",
    };
    // Item in createMockCFDI already has no taxes by default in its schema
    
    mockTx.query.businessPartners.findFirst.mockResolvedValue({ id: 2 });
    
    // For invoice items
    const { invoiceItems, invoiceTaxes } = require("@/db/schema");
    
    await saveNewInvoice(cfdi as any, "<xml/>");

    // Verify fallback distribution was called and inserted
    const taxInserts = mockTx.insert.mock.calls.filter((call: any) => call[0] === invoiceTaxes);
    expect(taxInserts.length).toBeGreaterThan(0);
    
    // Check that we inserted both IVA and ISR
    const insertedTaxes = mockTx.values.mock.calls.find(call => 
      Array.isArray(call[0]) && call[0].some(t => t.taxCode === "002")
    )[0];
    
    expect(insertedTaxes).toContainEqual(expect.objectContaining({ taxCode: "002", taxAmount: "16.00" }));
    expect(insertedTaxes).toContainEqual(expect.objectContaining({ taxCode: "001", taxAmount: "1.25" }));
  });
});
