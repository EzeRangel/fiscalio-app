import { getTaxDeclarationsDashboardData } from "./tax-declarations";
import { getDB } from "@/db";

// Mock deps
jest.mock("@/db", () => ({
  getDB: jest.fn(),
}));

jest.mock("drizzle-orm", () => {
    const actual = jest.requireActual("drizzle-orm");
    return {
        ...actual,
        sql: jest.fn(),
        eq: jest.fn(),
        and: jest.fn(),
        gte: jest.fn(),
        lt: jest.fn(),
        inArray: jest.fn(),
        desc: jest.fn(),
    };
});

describe("getTaxDeclarationsDashboardData Cash-Basis", () => {
  const mockDb = {
    query: {
      taxDeclarations: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
      },
      payments: {
          findMany: jest.fn(),
      },
      paymentAllocations: {
          findMany: jest.fn(),
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    mockDb.query.taxDeclarations.findFirst.mockResolvedValue(null);
  });

  it("should ignore PPD invoices without payments in the period", async () => {
    // Mock no payments in the period
    mockDb.query.payments.findMany.mockResolvedValue([]);

    const result = await getTaxDeclarationsDashboardData(1);

    expect(result.currentPeriod.totalIncome).toBe(0);
    expect(result.currentPeriod.incomeInvoiceCount).toBe(0);
  });

  it("should include PPD invoices that have payments in the period", async () => {
    // 1. Mock a payment in the period
    mockDb.query.payments.findMany.mockResolvedValue([{ id: 10 }]);

    // 2. Mock the allocation for that payment
    mockDb.query.paymentAllocations.findMany.mockResolvedValue([
      {
        invoiceId: 101,
        amountAllocated: "500.00",
        exchangeRate: "1.0",
        invoice: {
            id: 101,
            invoiceType: 'income',
            total: "1000.00",
            subtotal: "862.07", // 862.07 + 137.93 (16% IVA)
            currency: "MXN",
            items: [
                {
                    taxes: [
                        { taxType: 'transferred', taxCode: '002', rate: '0.160000', taxAmount: '137.93' }
                    ]
                }
            ],
            account: { isDeductible: false }
        }
      }
    ]);

    const result = await getTaxDeclarationsDashboardData(1);

    // Paid ratio is 500 / 1000 = 0.5
    // Subtotal paid = 862.07 * 0.5 = 431.035 -> round to 431.04
    // Total paid = 500
    expect(result.currentPeriod.totalIncome).toBe(500);
    expect(result.currentPeriod.netAmount).toBe(431.04);
    expect(result.currentPeriod.incomeInvoiceCount).toBe(1);
  });

  it("should handle credit notes correctly", async () => {
    // 1. Mock a payment for a credit note issued (income reduction)
    mockDb.query.payments.findMany.mockResolvedValue([{ id: 20 }]);

    mockDb.query.paymentAllocations.findMany.mockResolvedValue([
      {
        invoiceId: 201,
        amountAllocated: "200.00",
        exchangeRate: "1.0",
        invoice: {
            id: 201,
            invoiceType: 'credit_note_issued',
            total: "200.00",
            subtotal: "172.41",
            currency: "MXN",
            items: [
                {
                    taxes: [
                        { taxType: 'transferred', taxCode: '002', rate: '0.160000', taxAmount: '27.59' }
                    ]
                }
            ],
            account: { isDeductible: false }
        }
      }
    ]);

    const result = await getTaxDeclarationsDashboardData(1);

    // Current implementation will likely ignore it or treat it as income if we don't fix it
    // If it ignores it, totalIncome will be 0.
    // If it treats it as income, totalIncome will be 200.
    // We WANT it to be -200 (or subtracted from other income).
    
    // For this test with ONLY a credit note:
    expect(result.currentPeriod.totalIncome).toBe(-200);
    expect(result.currentPeriod.netAmount).toBe(-172.41);
  });

  it("should handle USD normalization correctly in the data layer", async () => {
    // 1. Mock a payment for a USD invoice
    mockDb.query.payments.findMany.mockResolvedValue([{ id: 30 }]);

    mockDb.query.paymentAllocations.findMany.mockResolvedValue([
      {
        invoiceId: 301,
        amountAllocated: "100.00", // 100 USD
        exchangeRate: "20.00", // 20 MXN/USD
        invoice: {
            id: 301,
            invoiceType: 'income',
            total: "100.00",
            subtotal: "100.00",
            currency: "USD",
            exchangeRate: "20.00",
            items: [],
            account: { isDeductible: false }
        }
      }
    ]);

    const result = await getTaxDeclarationsDashboardData(1);

    // 100 USD * 20 = 2000 MXN
    expect(result.currentPeriod.totalIncome).toBe(2000);
    expect(result.currentPeriod.netAmount).toBe(2000);
  });
});
