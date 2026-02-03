import { getTaxDeclarationsDashboardData } from "./tax-declarations";
import { getDB, invoices, paymentAllocations } from "@/db";

// Mock deps
jest.mock("@/db", () => ({
  getDB: jest.fn(),
  invoices: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    invoiceType: { name: 'invoice_type' },
    currency: { name: 'currency' },
    exchangeRate: { name: 'exchange_rate' },
  },
  taxDeclarations: {
    organizationId: { name: 'organization_id' },
    fiscalPeriod: { name: 'fiscal_period' },
    status: { name: 'status' },
  },
  paymentAllocations: {
    paymentId: { name: 'payment_id' },
    invoiceId: { name: 'invoice_id' },
    amountAllocated: { name: 'amount_allocated' },
    exchangeRate: { name: 'exchange_rate' },
  },
  payments: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    paymentDate: { name: 'payment_date' },
  }
}));

jest.mock("drizzle-orm", () => {
    const actual = jest.requireActual("drizzle-orm");
    return {
        ...actual,
        sql: jest.fn((strings, ...values) => {
            const sqlObj = { type: 'sql', strings, values };
            (sqlObj as any).mapWith = jest.fn(() => sqlObj);
            return sqlObj;
        }),
        eq: jest.fn(),
        and: jest.fn(),
        gte: jest.fn(),
        lt: jest.fn(),
        desc: jest.fn(),
    };
});

describe("getTaxDeclarationsDashboardData", () => {
  it("should return invoice counts and correctly normalized amounts", async () => {
    const mockDb = {
      query: {
        taxDeclarations: {
            findFirst: jest.fn().mockResolvedValue(null),
            findMany: jest.fn().mockResolvedValue([]),
        }
      },
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockResolvedValue([
          { invoiceType: 'income', paidAmount: 100, count: 5 }, // Hypothetical return if we fixed it
          { invoiceType: 'expense', paidAmount: 50, count: 2 }
      ]),
    };
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

    const result = await getTaxDeclarationsDashboardData(1);

    // 1. Check for Invoice Counts (Bug Reproduction)
    // currently these properties don't exist in the return type or runtime object
    expect(result.currentPeriod).toHaveProperty('incomeInvoiceCount');
    expect(result.currentPeriod).toHaveProperty('expenseInvoiceCount');

    // 2. Check for Currency Normalization in SQL
    const selectArgs = mockDb.select.mock.calls[0][0];
    const paidAmountSql = selectArgs.paidAmount;
    
    const sqlStrings = paidAmountSql.strings.join("");
    expect(sqlStrings).toContain("CASE");
    expect(sqlStrings).toContain("WHEN");
    
    // Check values passed to interpolation
    expect(paidAmountSql.values).toContainEqual(expect.objectContaining({ name: 'exchange_rate' }));
    expect(paidAmountSql.values).toContainEqual(expect.objectContaining({ name: 'currency' }));
  });
});
