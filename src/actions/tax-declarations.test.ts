import { createTaxDeclarationDraft } from "./tax-declarations";
import { getDB } from "@/db";
import { getActiveOrganizationId } from "@/lib/session";
import { calculateCashBasisSummary } from "@/lib/cash-basis-utils";

// Mock dependencies
jest.mock("@/db");
jest.mock("@/lib/session");
jest.mock("@/lib/cash-basis-utils");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock safe-action
jest.mock("@/lib/safe-action", () => ({
  actionClient: {
    inputSchema: jest.fn().mockReturnThis(),
    action: jest.fn((callback) => (input) => callback({ parsedInput: input })),
  },
}));

describe("createTaxDeclarationDraft", () => {
  const mockDb = {
    query: {
      organizations: {
        findFirst: jest.fn(),
      },
      taxDeclarations: {
        findFirst: jest.fn(),
      },
      invoices: {
        findFirst: jest.fn(),
      }
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 1 }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
    
    mockDb.query.organizations.findFirst.mockResolvedValue({
      id: 1,
      taxRegime: { code: "626" }, // RESICO
    });
    
    mockDb.query.taxDeclarations.findFirst.mockResolvedValue(null);
  });

  it("should create a draft using cash-basis summary", async () => {
    // 1. Mock one allocation found in the period
    mockDb.where.mockResolvedValueOnce([
      {
        allocation: { amountAllocated: "1160.00" },
        payment: { paymentDate: new Date("2026-01-15") },
        invoice: { id: 101, invoiceType: "income" }
      }
    ]);

    // 2. Mock the full invoice fetch
    mockDb.query.invoices.findFirst.mockResolvedValue({
      id: 101,
      invoiceType: "income",
      total: "1160.00",
      subtotal: "1000.00",
      items: [
        {
          taxes: [{ taxType: "transferred", taxCode: "002", taxAmount: "160.00", rate: "0.160000" }]
        }
      ],
      account: { accountCode: "401", isDeductible: false }
    });

    // 3. Mock the utility result
    (calculateCashBasisSummary as jest.Mock).mockReturnValue({
      totalPaid: 1160,
      subtotalPaid: 1000,
      taxesPaid: 160,
      withholdingsPaid: 0,
      taxBreakdown: [
        { taxType: "transferred", taxCode: "002", rate: "0.160000", amount: 160 }
      ]
    });

    const result = await createTaxDeclarationDraft({
      fiscalPeriod: "2026-01",
      declarationType: "monthly",
    });

    expect(result).toEqual({ id: 1 });
    
    // Verify it updated the declaration with calculated totals
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
      totalIncome: "1000",
      ivaCharged: "160",
      isrBase: "1000",
    }));
  });
});
