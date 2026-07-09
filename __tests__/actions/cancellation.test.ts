import { cancelInvoiceAction, registerRefundAction } from "@/actions/cancellation";
import { getDB } from "@/db";
import { invoices, payments, taxAdjustments, paymentAllocations } from "@/db/schema";
import { logAction } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";

// Mock safe-action
jest.mock("@/lib/safe-action", () => ({
  actionClient: {
    schema: jest.fn().mockReturnThis(),
    inputSchema: jest.fn().mockReturnThis(),
    action: jest.fn((callback) => async (input: any) => {
      try {
        const result = await callback({ parsedInput: input });
        return { data: result };
      } catch (e: any) {
        return { serverError: e.message };
      }
    }),
  },
}));

// Mock database
jest.mock("@/db", () => {
  const actualSchema = jest.requireActual("@/db/schema");
  return {
    ...actualSchema,
    getDB: jest.fn(),
  };
});

jest.mock("@/lib/session", () => ({
  getActiveOrganizationId: jest.fn().mockResolvedValue(10),
}));

jest.mock("@/lib/audit-service", () => ({
  logAction: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Cancellation Server Actions", () => {
  let mockDb: any;
  let mockTx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = {
      query: {
        invoices: {
          findFirst: jest.fn(),
        },
        payments: {
          findFirst: jest.fn(),
        },
      },
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
    };

    mockDb = {
      transaction: jest.fn((cb) => cb(mockTx)),
      query: {
        invoices: {
          findFirst: jest.fn(),
        },
      },
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn(),
    };

    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
  });

  describe("cancelInvoiceAction", () => {
    it("should successfully cancel an unpaid invoice with motive 02", async () => {
      const mockInvoice = {
        id: 1,
        organizationId: 10,
        subtotal: "100.00",
        total: "116.00",
        amountPaid: "0.00",
        status: "active",
        paymentStatus: "pending",
        cfdiType: "I",
      };
      mockDb.query.invoices.findFirst.mockResolvedValue(mockInvoice);
      mockTx.returning.mockResolvedValue([{ id: 1, status: "cancelled" }]);

      const result = await cancelInvoiceAction({
        invoiceId: 1,
        reasonCode: "02",
        cancellationReason: "RFC incorrecto",
      });

      expect(result.data).toEqual({ success: true, invoice: expect.any(Object) });
      expect(mockTx.update).toHaveBeenCalledWith(invoices);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "cancelled",
          cancellationReason: "02 - RFC incorrecto",
        })
      );
      expect(logAction).toHaveBeenCalledWith(
        expect.any(Object),
        "cancelled",
        "invoice",
        "1",
        expect.any(Object)
      );
    });

    it("should fail cancellation if substitute invoice is missing for motive 01", async () => {
      const mockInvoice = {
        id: 1,
        organizationId: 10,
        subtotal: "100.00",
        total: "116.00",
        amountPaid: "0.00",
        status: "active",
        paymentStatus: "pending",
        cfdiType: "I",
      };
      mockDb.query.invoices.findFirst.mockResolvedValue(mockInvoice);

      const result = await cancelInvoiceAction({
        invoiceId: 1,
        reasonCode: "01",
        cancellationReason: "Sustitucion",
        substituteInvoiceUuid: "",
      });

      expect(result.serverError).toBeDefined();
    });

    it("should successfully cancel with motive 01 and migrate allocations to the substitute invoice", async () => {
      const mockInvoice = {
        id: 1,
        organizationId: 10,
        subtotal: "100.00",
        total: "116.00",
        amountPaid: "0.00",
        status: "active",
        paymentStatus: "pending",
        cfdiType: "I",
      };
      const mockSubstitute = {
        id: 2,
        organizationId: 10,
        folioFiscal: "UUID-SUB",
        status: "active",
      };

      mockDb.query.invoices.findFirst
        .mockResolvedValueOnce(mockInvoice) // for loading original invoice
        .mockResolvedValueOnce(mockSubstitute); // for lookup of substitute

      mockTx.returning.mockResolvedValue([{ id: 1, status: "cancelled" }]);

      const result = await cancelInvoiceAction({
        invoiceId: 1,
        reasonCode: "01",
        cancellationReason: "Errores con relacion",
        substituteInvoiceUuid: "123e4567-e89b-12d3-a456-426614174000",
      });

      expect(result.data).toEqual({ success: true, invoice: expect.any(Object) });
      expect(mockTx.update).toHaveBeenCalledWith(paymentAllocations);
      expect(mockTx.set).toHaveBeenCalledWith({ invoiceId: 2 });
    });
  });

  describe("registerRefundAction", () => {
    it("should successfully register a refund and create a tax adjustment", async () => {
      const mockInvoice = {
        id: 1,
        organizationId: 10,
        subtotal: "100.00",
        total: "116.00",
        amountPaid: "116.00",
        status: "active",
        paymentStatus: "paid",
        currency: "MXN",
      };
      mockDb.query.invoices.findFirst.mockResolvedValue(mockInvoice);
      mockTx.returning
        .mockResolvedValueOnce([{ id: 50, amount: "116.00" }]) // payment insert
        .mockResolvedValueOnce([{ id: 1, amount: "116.00" }]); // tax adjustment insert

      const result = await registerRefundAction({
        invoiceId: 1,
        amount: "116.00",
        paymentDate: new Date("2023-05-15"),
        paymentMethod: "03",
        notes: "Refund complete",
      });

      expect(result.data).toEqual({ success: true, payment: expect.any(Object) });
      expect(mockTx.insert).toHaveBeenCalledWith(payments);
      expect(mockTx.insert).toHaveBeenCalledWith(taxAdjustments);
      expect(mockTx.update).toHaveBeenCalledWith(invoices);
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          amountPaid: "0.00",
          paymentStatus: "refunded",
        })
      );
      expect(logAction).toHaveBeenCalledWith(
        expect.any(Object),
        "refunded",
        "payment",
        "50",
        expect.any(Object)
      );
    });

    it("should fail to register a refund if amount exceeds amountPaid (INT-CAN-03)", async () => {
      const mockInvoice = {
        id: 1,
        organizationId: 10,
        subtotal: "100.00",
        total: "116.00",
        amountPaid: "50.00",
        status: "active",
        paymentStatus: "partial",
        currency: "MXN",
      };
      mockDb.query.invoices.findFirst.mockResolvedValue(mockInvoice);

      const result = await registerRefundAction({
        invoiceId: 1,
        amount: "100.00",
        paymentDate: new Date(),
        paymentMethod: "03",
      });

      expect(result.serverError).toBeDefined();
      expect(result.serverError).toContain("El monto del reembolso no puede exceder el total pagado");
    });
  });
});
