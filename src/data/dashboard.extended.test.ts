import { getDashboardMetrics } from "./dashboard";
import { getDB } from "@/db";
import { invoices } from "@/db/schema";
import { inArray } from "drizzle-orm";

jest.mock("@/db", () => {
    const actual = jest.requireActual("@/db");
    const actualSchema = jest.requireActual("@/db/schema");
    return {
        ...actual,
        ...actualSchema,
        getDB: jest.fn(),
    };
});

// Mock drizzle-orm
jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  and: jest.fn((...conds) => ({ type: 'and', conds })),
  gte: jest.fn((col, val) => ({ type: 'gte', col, val })),
  lte: jest.fn((col, val) => ({ type: 'lte', col, val })),
  inArray: jest.fn((col, vals) => ({ type: 'inArray', col, vals })),
  sql: jest.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}));

describe("getDashboardMetrics - Extended Types", () => {
  it("should use inArray to filter by multiple invoice types for income", async () => {
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

    // The first call to where should be for income
    const incomeWhere = mockDb.where.mock.calls[0][0];
    
    // Check if inArray was used with correct types
    const inArrayCall = incomeWhere.conds.find((c: any) => c.type === 'inArray');
    expect(inArrayCall).toBeDefined();
    expect(inArrayCall.col).toBe(invoices.invoiceType);
    expect(inArrayCall.vals).toContain("income");
    expect(inArrayCall.vals).toContain("credit_note_received");
  });

  it("should use inArray to filter by multiple invoice types for expenses", async () => {
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

    // The second call to where should be for expenses
    const expenseWhere = mockDb.where.mock.calls[1][0];
    
    const inArrayCall = expenseWhere.conds.find((c: any) => c.type === 'inArray');
    expect(inArrayCall).toBeDefined();
    expect(inArrayCall.col).toBe(invoices.invoiceType);
    expect(inArrayCall.vals).toContain("expense");
    expect(inArrayCall.vals).toContain("credit_note_issued");
  });
});
