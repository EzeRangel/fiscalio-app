import { getDashboardMetrics } from "./dashboard";
import { getDB, invoices, paymentAllocations } from "@/db";
import { sql } from "drizzle-orm";

// Mock deps
jest.mock("@/db", () => ({
  getDB: jest.fn(),
  invoices: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    invoiceType: { name: 'invoice_type' },
    invoiceDate: { name: 'invoice_date' },
    total: { name: 'total' },
    currency: { name: 'currency' },
    exchangeRate: { name: 'exchange_rate' },
    status: { name: 'status' },
  },
  payments: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    paymentDate: { name: 'payment_date' },
  },
  paymentAllocations: {
    paymentId: { name: 'payment_id' },
    invoiceId: { name: 'invoice_id' },
    amountAllocated: { name: 'amount_allocated' },
    exchangeRate: { name: 'exchange_rate' },
  },
  taxDeclarations: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    fiscalPeriod: { name: 'fiscal_period' },
    status: { name: 'status' },
  }
}));

jest.mock("drizzle-orm", () => {
    const actual = jest.requireActual("drizzle-orm");
    return {
        ...actual,
        sql: jest.fn((strings, ...values) => ({ type: 'sql', strings, values })),
        eq: jest.fn(),
        and: jest.fn(),
        gte: jest.fn(),
        lte: jest.fn(),
    };
});

describe("getDashboardMetrics SQL Generation", () => {
  it("should generate SQL with exchange rate fallback logic", async () => {
    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ total: "0", status: "filed", fiscalPeriod: "2024-01" }]),
    };
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

    await getDashboardMetrics(1, { month: 0, year: 2024 });

    // Inspect the SQL chunks passed to select()
    // The first call to select receives an object where keys are fields and values are sql objects.
    // We check the first call (Income query)
    const selectArgs = mockDb.select.mock.calls[0][0];
    const totalSql = selectArgs.total;
    
    // The SQL strings array should contain the CASE WHEN logic parts
    const sqlString = totalSql.strings.join("?");
    
    // Expect the SQL structure to resemble:
    // sum(${amount} * CASE WHEN ${allocRate} = 1.0 AND ${currency} != 'MXN' THEN ${invRate} ELSE ${allocRate} END)
    
    expect(sqlString).toContain("CASE");
    expect(sqlString).toContain("WHEN");
    expect(sqlString).toContain("THEN");
    expect(sqlString).toContain("ELSE");
    
    // Check values passed to interpolation
    // values[1] is allocRate, values[2] is currency, values[3] is invRate, values[4] is allocRate
    // Note: indices depend on exact structure of template literal
    
    // Check that we are using the correct columns
    expect(totalSql.values).toContain(paymentAllocations.exchangeRate);
    expect(totalSql.values).toContain(invoices.currency);
    expect(totalSql.values).toContain(invoices.exchangeRate);
  });
});
