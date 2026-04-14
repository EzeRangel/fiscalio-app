import { getDashboardMetrics } from "./dashboard";
import { getDB } from "@/db";

jest.mock("@/db", () => ({
  getDB: jest.fn(),
  invoices: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    invoiceType: { name: 'invoice_type' },
    invoiceDate: { name: 'invoice_date' },
    total: { name: 'total' },
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
  },
  taxDeclarations: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    fiscalPeriod: { name: 'fiscal_period' },
    status: { name: 'status' },
  }
}));

// Mock drizzle-orm
jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  and: jest.fn((...conds) => ({ type: 'and', conds })),
  gte: jest.fn((col, val) => ({ type: 'gte', col, val })),
  lte: jest.fn((col, val) => ({ type: 'lte', col, val })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
  inArray: jest.fn((col, vals) => ({ type: 'inArray', col, vals })),
  sql: jest.fn((strings, ...values) => ({ type: 'sql', strings, values })),
}));

describe("getDashboardMetrics", () => {
  it("should calculate income and expenses for the period based on payment allocations", async () => {
    const mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn()
        .mockResolvedValueOnce([{ total: "1000.50" }]) // Income (Chain 1)
        .mockResolvedValueOnce([{ total: "500.25" }]) // Expenses (Chain 2)
        .mockReturnThis(), // Last declaration (Chain 3)
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([{ id: 1, status: "filed", fiscalPeriod: "2024-01" }]),
    };
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

    const result = await getDashboardMetrics(1, { month: 0, year: 2024 });

    expect(result.income).toBe(1000.50);
    expect(result.expenses).toBe(500.25);
    expect(result.nextDeclarationDate).toEqual(new Date(2024, 1, 17));

    // Verify it queries paymentAllocations
    expect(mockDb.from).toHaveBeenCalledWith(expect.objectContaining({
        paymentId: expect.anything(),
        invoiceId: expect.anything()
    }));
    
    // Verify joins
    expect(mockDb.innerJoin).toHaveBeenCalledTimes(4); // 2 joins per query, 2 queries
  });
});