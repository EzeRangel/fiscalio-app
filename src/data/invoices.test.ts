import { getInvoicesByOrganization } from "./invoices";
import { getDB } from "@/db";
import { invoices } from "@/db/schema";

jest.mock("@/db", () => ({
  getDB: jest.fn(),
  invoices: {
    organizationId: { name: 'organization_id' },
    partnerId: { name: 'partner_id' },
    invoiceDate: { name: 'invoice_date' }
  }
}));

// Mock drizzle-orm
jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  and: jest.fn((...conds) => ({ type: 'and', conds })),
  desc: jest.fn((col) => ({ type: 'desc', col })),
}));

describe("getInvoicesByOrganization", () => {
  it("should filter by partnerId if provided", async () => {
    const mockDb = {
      query: {
        invoices: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
    };
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

    // @ts-ignore - second argument not yet supported in types
    await getInvoicesByOrganization(1, { partnerId: 123 });

    const lastCall = (mockDb.query.invoices.findMany as jest.Mock).mock.calls[0][0];
    
    // We expect the 'where' to include partnerId: 123
    // Currently, it will only have organizationId: 1
    const whereStr = JSON.stringify(lastCall.where);
    expect(whereStr).toContain('"val":123');
  });

  it("should include businessPartner and allocations in 'with' clause", async () => {
    const mockDb = {
      query: {
        invoices: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
    };
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

    await getInvoicesByOrganization(1);

    const lastCall = (mockDb.query.invoices.findMany as jest.Mock).mock.calls[0][0];
    expect(lastCall.with).toEqual({
      account: true,
      businessPartner: true,
      items: { with: { taxes: true } },
      linkedPayments: { with: { allocations: true } },
      allocations: { with: { payment: true, invoice: true } },
    });
  });

  it("should filter out substituted invoices by default, and include them if showSubstituted is true", async () => {
    const mockDb = {
      query: {
        invoices: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
    };
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

    // Default call (without filter)
    await getInvoicesByOrganization(1);
    let lastCall = (mockDb.query.invoices.findMany as jest.Mock).mock.calls[0][0];
    let whereStr = JSON.stringify(lastCall.where);
    expect(whereStr).toContain('"substituted"');
    expect(whereStr).toContain('" <> "');

    // With showSubstituted = true
    jest.clearAllMocks();
    await getInvoicesByOrganization(1, { showSubstituted: true });
    lastCall = (mockDb.query.invoices.findMany as jest.Mock).mock.calls[0][0];
    whereStr = JSON.stringify(lastCall.where);
    expect(whereStr).not.toContain('"substituted"');
  });
});
