import { getTaxDeclarationsDashboardData } from "./tax-declarations";
import { getDB } from "@/db";
import { and, eq, not, desc } from "drizzle-orm";

jest.mock("@/db", () => ({
  getDB: jest.fn(),
}));

jest.mock("drizzle-orm", () => {
  const actual = jest.requireActual("drizzle-orm");
  return {
    ...actual,
    and: jest.fn((...args) => ({ type: "and", args })),
    eq: jest.fn((a, b) => ({ type: "eq", left: a, right: b })),
    not: jest.fn((a) => ({ type: "not", operand: a })),
    desc: jest.fn((a) => ({ type: "desc", operand: a })),
    gte: jest.fn(),
    lt: jest.fn(),
    inArray: jest.fn(),
  };
});

describe("getTaxDeclarationsDashboardData History Query", () => {
  const mockDb = {
    query: {
      taxDeclarations: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      payments: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
  });

  it("should fetch history excluding current period, only monthly, limited to 12", async () => {
    await getTaxDeclarationsDashboardData(1);

    expect(mockDb.query.taxDeclarations.findMany).toHaveBeenCalled();
    const findManyCall = mockDb.query.taxDeclarations.findMany.mock.calls[0][0];

    // We expect the limit to be 12
    expect(findManyCall.limit).toBe(12);

    // We expect the orderBy to be descending by fiscalPeriod
    expect(desc).toHaveBeenCalled();

    // Verify where clause:
    // and(
    //   eq(taxDeclarations.organizationId, 1),
    //   not(eq(taxDeclarations.fiscalPeriod, fiscalPeriodToDeclare)),
    //   eq(taxDeclarations.declarationType, "monthly")
    // )
    expect(and).toHaveBeenCalled();
    
    // Check that eq was called for organizationId = 1
    const eqCalls = (eq as jest.Mock).mock.calls;
    const hasOrgIdCall = eqCalls.some(call => call[1] === 1);
    expect(hasOrgIdCall).toBe(true);

    // Check that eq was called with "monthly"
    const hasMonthlyCall = eqCalls.some(call => call[1] === "monthly");
    expect(hasMonthlyCall).toBe(true);

    // Check that not was called (to exclude the current period's declaration)
    expect(not).toHaveBeenCalled();
  });
});
