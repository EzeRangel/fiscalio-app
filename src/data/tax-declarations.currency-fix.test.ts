import { getTaxDeclarationsDashboardData } from "./tax-declarations";
import { getDB } from "@/db";

// Mock deps
jest.mock("@/db", () => ({
  getDB: jest.fn(),
  // Schema mocks not strictly needed for this test structure but good to keep
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

jest.mock("@/lib/cash-basis-utils", () => {
    const actual = jest.requireActual("@/lib/cash-basis-utils");
    return {
        ...actual,
        calculateCashBasisSummary: jest.fn().mockReturnValue({
            subtotalPaid: 2000,
            taxBreakdown: [],
            totalPaid: 2320,
        })
    };
});

jest.mock("@/lib/tax-calculations", () => ({
    calculateISR_RESICO: jest.fn().mockReturnValue(50)
}));

describe("getTaxDeclarationsDashboardData", () => {
  it("should return calculated fallback values and counts", async () => {
    const mockDb = {
      query: {
        taxDeclarations: {
            findFirst: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockResolvedValue([]),
        },
        payments: {
            findMany: jest.fn().mockResolvedValue([{ id: 1 }]),
        },
        paymentAllocations: {
            findMany: jest.fn().mockResolvedValue([
                {
                    invoiceId: 101,
                    amountAllocated: 100,
                    exchangeRate: 1, // Number, effectively 1.0. Should trigger fallback.
                    invoice: {
                        invoiceType: 'income',
                        total: 100,
                        subtotal: 100,
                        exchangeRate: "20.0",
                        currency: "USD",
                        items: [], 
                        account: { isDeductible: false }
                    }
                }
            ]),
        }
      }
    };
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

    const result = await getTaxDeclarationsDashboardData(1);

    // Verify exchange rate fallback logic was applied
    const { calculateCashBasisSummary } = require("@/lib/cash-basis-utils");
    const lastCall = calculateCashBasisSummary.mock.calls[calculateCashBasisSummary.mock.calls.length - 1];
    const allocationsPassed = lastCall[0];
    // We expect the exchange rate to be "20.0" because 1 (alloc) was replaced by "20.0" (invoice)
    expect(allocationsPassed[0].exchangeRate).toBe("20.0");

    // 1. Check for Invoice Counts
    expect(result.currentPeriod.incomeInvoiceCount).toBe(1);
    
    // 2. Check for calculated values (mocked utility return)
    expect(result.currentPeriod.totalIncome).toBe(2320); // Gross
    expect(result.currentPeriod.netAmount).toBe(2000); // Net (Base)
    expect(result.currentPeriod.estimatedTax).toBe(50);
    
    // 3. Check extra fields existence
    expect(result.currentPeriod).toHaveProperty('ivaBalance');
  });
});