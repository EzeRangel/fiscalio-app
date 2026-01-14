// Mock dependencies before imports to avoid ESM issues
jest.mock("@/lib/cfdi-parser", () => ({
    CFDIParser: {
        parse: jest.fn().mockResolvedValue({
            Version: "4.0",
            Fecha: "2023-01-01T12:00:00",
            TipoDeComprobante: "I",
            Folio: "123",
            Serie: "A",
            Moneda: "MXN",
            TipoCambio: "1",
            SubTotal: "100.00",
            Total: "116.00",
            MetodoPago: "PUE",
            FormaPago: "01",
            Emisor: { Rfc: "TEST_EMITTER", Nombre: "Emitter", RegimenFiscal: "601" },
            Receptor: { Rfc: "TEST_RECEIVER", Nombre: "Receiver", RegimenFiscalReceptor: "601", UsoCFDI: "G03" },
            Conceptos: { Concepto: [] },
            Complemento: { TimbreFiscalDigital: { UUID: "UUID-123", FechaTimbrado: "2023-01-01T12:05:00" } }
        })
    }
}));
jest.mock("@/db/drizzle");
jest.mock("@/lib/session");
jest.mock("next/cache");
jest.mock("@/lib/audit-service");
jest.mock("@/data/classification-rules", () => ({
    getClassificationRules: jest.fn().mockResolvedValue([])
}));

import { saveInvoice } from "./invoices";
import { applyClassification } from "./classification-rules";
import { getDB } from "@/db/drizzle";
import { logAction } from "@/lib/audit-service";
import { getActiveOrganizationId } from "@/lib/session";

// Mock safe-action
jest.mock("@/lib/safe-action", () => ({
  actionClient: {
    inputSchema: jest.fn().mockReturnThis(),
    action: jest.fn((callback) => (input) => callback({ parsedInput: input })),
  },
}));

describe("Invoices Integration Audit", () => {
  const mockDb = {
    transaction: jest.fn((cb) => cb(mockDb)),
    query: {
      organizations: { findFirst: jest.fn() },
      taxRegimes: { findFirst: jest.fn() },
      businessPartners: { findFirst: jest.fn() },
      invoices: { findFirst: jest.fn() },
      classificationSnapshots: { findFirst: jest.fn() },
      chartOfAccounts: { findFirst: jest.fn() },
    },
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ id: 1 }]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
  });

  it("should log audit on saveInvoice", async () => {
    const mockFile = {
      size: 100,
      text: jest.fn().mockResolvedValue("<xml></xml>"),
    };
    
    mockDb.query.organizations.findFirst.mockResolvedValue({ id: 1, rfc: "TEST_EMITTER" });
    mockDb.query.taxRegimes.findFirst.mockResolvedValue({ id: 1, code: "601" });
    mockDb.query.businessPartners.findFirst.mockResolvedValue({ id: 1 });
    mockDb.returning.mockResolvedValue([{ id: 100 }]); // for returning invoiceId
    
    await saveInvoice({ cfdi: mockFile });

    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "invoice",
      action: "created",
      entityId: 100,
      organizationId: 1
    }));
  });

  it("should log audit on applyClassification", async () => {
      mockDb.query.invoices.findFirst.mockResolvedValue({ id: 1, organizationId: 1 });
      mockDb.query.chartOfAccounts.findFirst.mockResolvedValue({ id: 1, accountCode: "101" });
      mockDb.query.classificationSnapshots.findFirst.mockResolvedValue({
          id: 1,
          invoiceId: 1,
          candidates: [{ accountCode: "101", score: 0.8, evidence: [] }]
      });
      
      await applyClassification({
          invoiceId: 1,
          action: "select",
          selectedAccount: "101"
      });

      expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
          entityType: "invoice",
          action: "classified",
          entityId: 1,
          organizationId: 1
      }));
  });
});
