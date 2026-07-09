import { loadInvoiceForCancellation, getInvoiceByFolioFiscal, updateInvoiceStatus } from "./cancellation";
import { getDB } from "@/db";
import { invoices, payments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

jest.mock("@/db", () => {
  const actualSchema = jest.requireActual("@/db/schema");
  return {
    ...actualSchema,
    getDB: jest.fn(),
  };
});

describe("Cancellation Data Access Layer", () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
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

  it("should load invoice for cancellation with correct query parameters", async () => {
    const mockInvoice = { id: 1, folioFiscal: "UUID-1", total: "100.00" };
    mockDb.query.invoices.findFirst.mockResolvedValue(mockInvoice);

    const result = await loadInvoiceForCancellation(1, 10);
    expect(result).toEqual(mockInvoice);
    expect(mockDb.query.invoices.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
        with: expect.objectContaining({
          refundPayments: true,
          allocations: true,
        }),
      })
    );
  });

  it("should get invoice by folio fiscal UUID", async () => {
    const mockInvoice = { id: 2, folioFiscal: "UUID-2" };
    mockDb.query.invoices.findFirst.mockResolvedValue(mockInvoice);

    const result = await getInvoiceByFolioFiscal("UUID-2", 10);
    expect(result).toEqual(mockInvoice);
    expect(mockDb.query.invoices.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
      })
    );
  });

  it("should update invoice status and cancellation fields", async () => {
    mockDb.returning.mockResolvedValue([{ id: 1, status: "cancelled" }]);

    const result = await updateInvoiceStatus(1, 10, {
      status: "cancelled",
      cancellationReason: "RFC incorrecto",
      cancellationReasonCode: "02",
      substituteInvoiceId: 99,
    });

    expect(result).toEqual({ id: 1, status: "cancelled" });
    expect(mockDb.update).toHaveBeenCalledWith(invoices);
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        cancellationReason: "02 - RFC incorrecto",
        substituteInvoiceId: 99,
      })
    );
  });
});
