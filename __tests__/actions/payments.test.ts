import { updatePaymentAction, linkPaymentAction } from "@/actions/payments";
import { getDB, payments, invoices } from "@/db";
import { logAction } from "@/lib/audit-service";
import { processPendingAllocations } from "@/data/payments";
import { CFDIParser } from "@/lib/cfdi-parser";

jest.mock("@/data/payments", () => ({
  processPendingAllocations: jest.fn(),
}));
jest.mock("@/lib/cfdi-parser");


// Mock @/lib/safe-action to avoid ESM issues and simplify testing
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

// Mock dependencies
jest.mock("@/db", () => ({
  getDB: jest.fn(),
  payments: {
    id: { name: "id" },
    paymentDate: { name: "payment_date" },
    notes: { name: "notes" },
    organizationId: { name: "organization_id" },
  },
  invoices: {
    id: { name: "id" },
    invoiceDate: { name: "invoice_date" },
  },
  paymentAllocations: {
    paymentId: { name: "payment_id" },
    invoiceId: { name: "invoice_id" },
  },
}));

jest.mock("@/lib/audit-service", () => ({
  ...jest.requireActual("@/lib/audit-service"),
  logAction: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn(),
  and: jest.fn(),
}));

describe("updatePaymentAction", () => {
  const mockDb = {
    query: {
      payments: {
        findFirst: jest.fn(),
      },
    },
    transaction: jest.fn((callback) => callback(mockDb)),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(),
        })),
      })),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
  });

  it("should fail if payment does not exist", async () => {
    mockDb.query.payments.findFirst.mockResolvedValue(null);

    const result = await updatePaymentAction({
      paymentId: 1,
      paymentDate: new Date(),
      notes: "Updated note",
    });

    expect(result?.serverError).toBeDefined();
    expect(result?.serverError).toContain("Pago no encontrado");
  });

  it("should fail if new date is before invoice date", async () => {
    const invoiceDate = new Date("2023-01-10");
    const paymentDate = new Date("2023-01-05"); // Before invoice date

    mockDb.query.payments.findFirst.mockResolvedValue({
      id: 1,
      paymentDate: new Date("2023-01-15"),
      organizationId: 123,
      allocations: [
        {
          invoiceId: 10,
          amountAllocated: "100",
          invoice: {
            id: 10,
            invoiceDate: invoiceDate,
          },
        },
      ],
    });

    const result = await updatePaymentAction({
      paymentId: 1,
      paymentDate: paymentDate,
      notes: "Updated note",
    });

    expect(result?.serverError).toBeDefined();
    expect(result?.serverError).toContain(
      "La fecha de pago no puede ser anterior a la de la factura",
    );
  });

  it("should successfully update payment date and notes and log action", async () => {
    const invoiceDate = new Date("2023-01-01");
    const oldDate = new Date("2023-01-10");
    const newDate = new Date("2023-01-12");

    const mockPayment = {
      id: 1,
      paymentDate: oldDate,
      notes: "Old note",
      organizationId: 123,
      allocations: [
        {
          invoiceId: 10,
          amountAllocated: "100",
          invoice: {
            id: 10,
            invoiceDate: invoiceDate,
          },
        },
      ],
    };

    mockDb.query.payments.findFirst.mockResolvedValue(mockPayment);

    // Mock update returning the updated payment
    const mockUpdateReturning = jest
      .fn()
      .mockResolvedValue([
        { ...mockPayment, paymentDate: newDate, notes: "New note" },
      ]);
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: mockUpdateReturning,
        }),
      }),
    });

    const result = await updatePaymentAction({
      paymentId: 1,
      paymentDate: newDate,
      notes: "New note",
    });

    expect(result?.data).toBeDefined();
    expect(result?.data?.success).toBe(true);

    // Verify Audit Log
    expect(logAction).toHaveBeenCalledTimes(2);

    // Log for Payment
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "updated",
        entityType: "payment",
        entityId: 1,
        organizationId: 123,
      }),
    );

    // Log for Linked Invoice
    expect(logAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "updated",
        entityType: "invoice",
        entityId: 10,
        organizationId: 123,
        metadata: expect.objectContaining({
          reason: "Actualización de fecha de registro de pago",
        }),
      }),
    );
  });

  describe("linkPaymentAction", () => {
    beforeEach(() => {
      mockDb.query.invoices = {
        findFirst: jest.fn(),
      };
      mockDb.query.payments = {
        findFirst: jest.fn(),
      };
    });

    it("should fail if target invoice is not found", async () => {
      mockDb.query.invoices.findFirst.mockResolvedValue(null);

      const result = await linkPaymentAction({
        paymentId: 1,
        invoiceId: 10,
      });

      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain("Factura no encontrada");
    });

    it("should fail if payment is not found", async () => {
      mockDb.query.invoices.findFirst.mockResolvedValue({ id: 10, folioFiscal: "INV-UUID" });
      mockDb.query.payments.findFirst.mockResolvedValue(null);

      const result = await linkPaymentAction({
        paymentId: 1,
        invoiceId: 10,
      });

      expect(result?.serverError).toBeDefined();
      expect(result?.serverError).toContain("Pago no encontrado");
    });

    it("should successfully call processPendingAllocations and log action if target invoice is referenced", async () => {
      mockDb.query.invoices.findFirst.mockResolvedValue({ id: 10, folioFiscal: "INV-UUID", organizationId: 123 });
      
      const mockPayment = {
        id: 1,
        cfdiPaymentId: "PAYMENT-UUID",
        organizationId: 123,
        paymentDate: new Date("2023-01-01T12:00:00"),
        amount: "500.00",
      };
      mockDb.query.payments.findFirst.mockResolvedValue(mockPayment);

      const mockPaymentInvoice = {
        id: 100,
        folioFiscal: "PAYMENT-UUID",
        xmlContent: "<xml/>",
        organizationId: 123,
      };
      mockDb.query.invoices.findFirst
        .mockResolvedValueOnce({ id: 10, folioFiscal: "INV-UUID", organizationId: 123 }) // target invoice
        .mockResolvedValueOnce(mockPaymentInvoice); // payment invoice

      const parsedCFDI = {
        Complemento: [
          {
            Pagos: {
              Pago: {
                FechaPago: "2023-01-01T12:00:00",
                Monto: "500.00",
                DoctoRelacionado: {
                  IdDocumento: "INV-UUID",
                },
              },
            },
          },
        ],
      };
      (CFDIParser.parse as jest.Mock).mockResolvedValue(parsedCFDI);

      (processPendingAllocations as jest.Mock).mockResolvedValue(undefined);

      const result = await linkPaymentAction({
        paymentId: 1,
        invoiceId: 10,
      });

      expect(result?.data).toBeDefined();
      expect(result?.data?.success).toBe(true);
      expect(processPendingAllocations).toHaveBeenCalledWith(mockDb, 1, 123);
      expect(logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "updated",
          entityType: "invoice",
          entityId: 10,
          organizationId: 123,
          metadata: expect.objectContaining({
            reason: "Vinculación manual de complemento de pago",
          }),
        })
      );
    });
  });
});
