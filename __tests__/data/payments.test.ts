import { processPendingAllocations, getUnlinkedPaymentComplements } from "@/data/payments";
import { getDB } from "@/db";
import { invoices, payments, paymentAllocations } from "@/db/schema";
import { CFDIParser } from "@/lib/cfdi-parser";

jest.mock("@/db", () => {
  const actual = jest.requireActual("@/db");
  const actualSchema = jest.requireActual("@/db/schema");
  return {
    ...actual,
    ...actualSchema,
    getDB: jest.fn(),
  };
});
jest.mock("@/lib/cfdi-parser");

describe("Payments Data Functions", () => {
  let mockTx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = {
      query: {
        payments: {
          findFirst: jest.fn(),
        },
        invoices: {
          findFirst: jest.fn(),
        },
        paymentAllocations: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    };
  });

  describe("processPendingAllocations", () => {
    it("should throw error if payment is not found", async () => {
      mockTx.query.payments.findFirst.mockResolvedValue(null);

      await expect(
        processPendingAllocations(mockTx, 1, 1)
      ).rejects.toThrow("Pago no encontrado.");
    });

    it("should throw error if invoice XML is not found", async () => {
      mockTx.query.payments.findFirst.mockResolvedValue({
        id: 1,
        cfdiPaymentId: "XML-UUID",
        paymentDate: new Date("2023-01-01T12:00:00"),
        amount: "500.00",
      });
      mockTx.query.invoices.findFirst.mockResolvedValue(null);

      await expect(
        processPendingAllocations(mockTx, 1, 1)
      ).rejects.toThrow("XML del complemento de pago no encontrado.");
    });

    it("should link invoice and update status if target invoice exists and not yet linked", async () => {
      const mockPayment = {
        id: 1,
        cfdiPaymentId: "XML-UUID",
        paymentDate: new Date("2023-01-01T12:00:00"),
        amount: "500.00",
      };
      mockTx.query.payments.findFirst.mockResolvedValue(mockPayment);

      const mockPaymentInvoice = {
        id: 10,
        folioFiscal: "XML-UUID",
        xmlContent: "<xml></xml>",
      };
      mockTx.query.invoices.findFirst.mockResolvedValueOnce(mockPaymentInvoice);

      const parsedCFDI = {
        Complemento: [
          {
            Pagos: {
              Pago: {
                FechaPago: "2023-01-01T12:00:00",
                FormaDePagoP: "01",
                MonedaP: "MXN",
                Monto: "500.00",
                DoctoRelacionado: {
                  IdDocumento: "TARGET-INVOICE-UUID",
                  ImpPagado: "500.00",
                  NumParcialidad: "1",
                },
              },
            },
          },
        ],
      };
      (CFDIParser.parse as jest.Mock).mockResolvedValue(parsedCFDI);

      const mockTargetInvoice = {
        id: 20,
        folioFiscal: "TARGET-INVOICE-UUID",
        total: "500.00",
        subtotal: "500.00",
        amountPaid: "0.00",
        paymentStatus: "pending",
        status: "active",
        invoiceDate: new Date("2023-01-01T10:00:00"),
      };
      // Second call to findFirst is to find target invoice
      mockTx.query.invoices.findFirst.mockResolvedValueOnce(mockTargetInvoice);

      // paymentAllocations.findFirst check (returns null, i.e. not yet linked)
      mockTx.query.paymentAllocations.findFirst.mockResolvedValue(null);
      mockTx.query.paymentAllocations.findMany.mockResolvedValue([]);

      await processPendingAllocations(mockTx, 1, 1);

      expect(mockTx.insert).toHaveBeenCalledWith(paymentAllocations);
      expect(mockTx.update).toHaveBeenCalledWith(invoices);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          amountPaid: "500",
          paymentStatus: "paid",
        })
      );
    });

    it("should be idempotent and skip if allocation already exists", async () => {
      const mockPayment = {
        id: 1,
        cfdiPaymentId: "XML-UUID",
        paymentDate: new Date("2023-01-01T12:00:00"),
        amount: "500.00",
      };
      mockTx.query.payments.findFirst.mockResolvedValue(mockPayment);

      const mockPaymentInvoice = {
        id: 10,
        folioFiscal: "XML-UUID",
        xmlContent: "<xml></xml>",
      };
      mockTx.query.invoices.findFirst.mockResolvedValueOnce(mockPaymentInvoice);

      const parsedCFDI = {
        Complemento: [
          {
            Pagos: {
              Pago: {
                FechaPago: "2023-01-01T12:00:00",
                FormaDePagoP: "01",
                MonedaP: "MXN",
                Monto: "500.00",
                DoctoRelacionado: {
                  IdDocumento: "TARGET-INVOICE-UUID",
                  ImpPagado: "500.00",
                  NumParcialidad: "1",
                },
              },
            },
          },
        ],
      };
      (CFDIParser.parse as jest.Mock).mockResolvedValue(parsedCFDI);

      const mockTargetInvoice = {
        id: 20,
        folioFiscal: "TARGET-INVOICE-UUID",
        total: "500.00",
        subtotal: "500.00",
        amountPaid: "0.00",
        paymentStatus: "pending",
        status: "active",
      };
      mockTx.query.invoices.findFirst.mockResolvedValueOnce(mockTargetInvoice);

      // paymentAllocations.findFirst check (returns existing alloc)
      mockTx.query.paymentAllocations.findFirst.mockResolvedValue({ id: 50 });

      await processPendingAllocations(mockTx, 1, 1);

      expect(mockTx.insert).not.toHaveBeenCalled();
      expect(mockTx.update).not.toHaveBeenCalled();
    });
  });

  describe("getUnlinkedPaymentComplements", () => {
    let mockDb: any;

    beforeEach(() => {
      mockDb = {
        query: {
          invoices: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
          },
          payments: {
            findMany: jest.fn(),
          },
          paymentAllocations: {
            findFirst: jest.fn(),
          },
        },
      };
      (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    });

    it("should return empty list if invoice is not found", async () => {
      mockDb.query.invoices.findFirst.mockResolvedValue(null);

      const result = await getUnlinkedPaymentComplements(999);
      expect(result).toEqual([]);
    });

    it("should return payment complements that contain target UUID in XML and lack allocations", async () => {
      const mockCurrentInvoice = {
        id: 100,
        organizationId: 1,
        partnerId: 5,
        folioFiscal: "TARGET-UUID",
      };
      mockDb.query.invoices.findFirst.mockResolvedValue(mockCurrentInvoice);

      const mockPaymentInvoice = {
        id: 200,
        folioFiscal: "PAYMENT-CFDI-UUID",
        xmlContent: "<xml/>",
        businessPartner: {
          businessName: "Test Partner",
        },
      };
      mockDb.query.invoices.findMany.mockResolvedValue([mockPaymentInvoice]);

      const parsedCFDI = {
        Complemento: [
          {
            Pagos: {
              Pago: {
                FechaPago: "2023-01-01T12:00:00",
                Monto: "500.00",
                DoctoRelacionado: {
                  IdDocumento: "TARGET-UUID",
                  ImpPagado: "500.00",
                },
              },
            },
          },
        ],
      };
      (CFDIParser.parse as jest.Mock).mockResolvedValue(parsedCFDI);

      const mockPayments = [
        {
          id: 300,
          cfdiPaymentId: "PAYMENT-CFDI-UUID",
          paymentDate: new Date("2023-01-01T12:00:00"),
          amount: "500.00",
        },
      ];
      mockDb.query.payments.findMany.mockResolvedValue(mockPayments);

      // Allocation not found (meaning it's unlinked)
      mockDb.query.paymentAllocations.findFirst.mockResolvedValue(null);

      const result = await getUnlinkedPaymentComplements(100);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          paymentId: 300,
          amount: "500.00",
          uuid: "PAYMENT-CFDI-UUID",
          partnerName: "Test Partner",
        })
      );
    });

    it("should exclude payment complements that are already linked to the current invoice", async () => {
      const mockCurrentInvoice = {
        id: 100,
        organizationId: 1,
        partnerId: 5,
        folioFiscal: "TARGET-UUID",
      };
      mockDb.query.invoices.findFirst.mockResolvedValue(mockCurrentInvoice);

      const mockPaymentInvoice = {
        id: 200,
        folioFiscal: "PAYMENT-CFDI-UUID",
        xmlContent: "<xml/>",
      };
      mockDb.query.invoices.findMany.mockResolvedValue([mockPaymentInvoice]);

      const parsedCFDI = {
        Complemento: [
          {
            Pagos: {
              Pago: {
                FechaPago: "2023-01-01T12:00:00",
                Monto: "500.00",
                DoctoRelacionado: {
                  IdDocumento: "TARGET-UUID",
                  ImpPagado: "500.00",
                },
              },
            },
          },
        ],
      };
      (CFDIParser.parse as jest.Mock).mockResolvedValue(parsedCFDI);

      const mockPayments = [
        {
          id: 300,
          cfdiPaymentId: "PAYMENT-CFDI-UUID",
          paymentDate: new Date("2023-01-01T12:00:00"),
          amount: "500.00",
        },
      ];
      mockDb.query.payments.findMany.mockResolvedValue(mockPayments);

      // Allocation exists
      mockDb.query.paymentAllocations.findFirst.mockResolvedValue({ id: 99 });

      const result = await getUnlinkedPaymentComplements(100);
      expect(result).toHaveLength(0);
    });
  });
});

