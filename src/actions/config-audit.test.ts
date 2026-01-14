import { saveBusinessPartner, updateBusinessPartnerTags } from "./business-partners";
import { createAccount } from "./chart-of-accounts";
import { getDB } from "@/db/drizzle";
import { logAction, calculateDiff } from "@/lib/audit-service";
import { getActiveOrganizationId } from "@/lib/session";

// Mock dependencies
jest.mock("@/db/drizzle");
jest.mock("@/lib/session");
jest.mock("next/cache");
jest.mock("@/lib/audit-service", () => ({
    logAction: jest.fn(),
    calculateDiff: jest.fn().mockReturnValue({})
}));

// Mock safe-action
jest.mock("@/lib/safe-action", () => ({
  actionClient: {
    inputSchema: jest.fn().mockReturnThis(),
    action: jest.fn((callback) => (input) => callback({ parsedInput: input })),
  },
}));

describe("Configuration Integration Audit", () => {
  const mockDb = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 101 }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ id: 101 }]),
    query: {
        chartOfAccounts: { findFirst: jest.fn() },
        businessPartners: { findFirst: jest.fn() }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
  });

  it("should log audit on saveBusinessPartner", async () => {
    const input = {
      businessName: "Test Partner",
      rfc: "TEST123456789",
      partnerType: "client" as const,
      taxRegimeId: 1
    };

    await saveBusinessPartner(input);

    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "business_partner",
      action: "created",
      organizationId: 1
    }));
  });

  it("should log audit on updateBusinessPartnerTags", async () => {
    const input = {
      partnerId: 101,
      tags: ["VIP"]
    };

    mockDb.query.businessPartners.findFirst.mockResolvedValue({
        id: 101,
        tags: ["Old Tag"]
    });
    
    (calculateDiff as jest.Mock).mockReturnValue({
        tags: { old: ["Old Tag"], new: ["VIP"] }
    });

    await updateBusinessPartnerTags(input);

    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "business_partner",
      action: "updated",
      entityId: 101,
      organizationId: 1
    }));
  });

  it("should log audit on createAccount", async () => {
    const input = {
      accountCode: "100.01",
      name: "Test Account",
      type: "asset",
      subtype: "current_asset",
      normalBalance: "debit"
    };

    await createAccount(input);

    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      entityType: "account",
      action: "created",
      organizationId: 1
    }));
  });
});
