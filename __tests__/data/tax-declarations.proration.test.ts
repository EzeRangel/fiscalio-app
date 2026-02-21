import { getTaxDeclarationsDashboardData } from "@/data/tax-declarations";
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

describe("getTaxDeclarationsDashboardData Granular Proration", () => {
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
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    mockDb.query.taxDeclarations.findFirst.mockResolvedValue(null);
  });

  it("should calculate prorated taxes for multiple items with different tax rates", async () => {
    // Arrangement
    // Invoice: 
    // Item 1: Subtotal 100, IVA 16% (16), ISR Withheld 10% (10) -> Total 106
    // Item 2: Subtotal 200, IVA 16% (32) -> Total 232
    // Header Total: 338
    
    mockDb.query.payments.findMany.mockResolvedValue([{ id: 10 }]);

    mockDb.query.paymentAllocations.findMany.mockResolvedValue([
      {
        invoiceId: 101,
        amountAllocated: "169.00", // Exactly 50% of 338
        exchangeRate: "1.0",
        invoice: {
          id: 101,
          invoiceType: 'income',
          total: "338.00",
          subtotal: "300.00",
          currency: "MXN",
          items: [
            {
              subtotal: "100.00",
              taxes: [
                { taxType: 'transferred', taxCode: '002', rate: '0.160000', taxAmount: '16.00' },
                { taxType: 'withheld', taxCode: '001', rate: '0.100000', taxAmount: '10.00' }
              ]
            },
            {
              subtotal: "200.00",
              taxes: [
                { taxType: 'transferred', taxCode: '002', rate: '0.160000', taxAmount: '32.00' }
              ]
            }
          ],
          account: { isDeductible: false }
        }
      }
    ]);

    // Act
    const result = await getTaxDeclarationsDashboardData(1);

    // Assert
    // Ratio = 169 / 338 = 0.5
    // Total Paid = 169
    // Subtotal Paid = 300 * 0.5 = 150
    // IVA Charged (Transferred) = (16 + 32) * 0.5 = 24
    // ISR Withheld = 10 * 0.5 = 5
    
    expect(result.currentPeriod.totalIncome).toBe(169);
    expect(result.currentPeriod.netAmount).toBe(150); // netAmount is calcTotalIncomeSubtotal
    expect(result.currentPeriod.ivaBalance).toBe(24);
    
    // estimatedTax = calculatedIsr - calcIsrWithheld
    // calculatedIsr for 150 at RESICO rate (assume 1% or similar for testing, but it uses calculateISR_RESICO)
    // The test's main concern is calcIsrWithheld being correct.
    // If we assume a fixed rate for calculateISR_RESICO for a moment, say 1% -> 1.5
    // estimatedTax = 1.5 - 5 = -3.5 (clamped to 0)
    
    // We can't easily check estimatedTax without knowing calculateISR_RESICO implementation, 
    // but we can check if it considered the 5 pesos of withheld ISR.
  });

  it("maintains precision with complex fractions in proration", async () => {
     // Ratio: 1/3 (333.33 / 1000)
    mockDb.query.payments.findMany.mockResolvedValue([{ id: 20 }]);

    mockDb.query.paymentAllocations.findMany.mockResolvedValue([
      {
        invoiceId: 201,
        amountAllocated: "333.33",
        exchangeRate: "1.0",
        invoice: {
          id: 201,
          invoiceType: 'income',
          total: "1000.00",
          subtotal: "862.07",
          currency: "MXN",
          items: [
            {
              subtotal: "862.07",
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

    // Ratio = 333.33 / 1000 = 0.33333
    // Subtotal Paid = 862.07 * 0.33333 = 287.355601...
    // IVA Charged = 137.93 * 0.33333 = 45.976206...
    
    // Expected values (after final rounding in cash-basis-utils):
    // Subtotal Paid -> 287.35 (333.33 * 862.07 / 1000 = 287.3531231)
    // IVA Charged -> 45.98 (333.33 * 137.93 / 1000 = 45.9762069 -> rounded to 45.98)
    
    expect(result.currentPeriod.netAmount).toBe(287.35);
    expect(result.currentPeriod.ivaBalance).toBe(45.98);
  });
});
