import { updateBusinessPartnerTags } from "./business-partners";
import { getDB } from "@/db/drizzle";
import { getActiveOrganizationId } from "@/lib/session";
import { businessPartners } from "@/db/schema/businessPartners";
import { revalidatePath } from "next/cache";

// Mock dependencies
jest.mock("@/db/drizzle");
jest.mock("@/lib/session");
jest.mock("next/cache");
jest.mock("@/db/schema/businessPartners", () => ({
  businessPartners: {
    id: { name: 'id' },
    organizationId: { name: 'organization_id' },
    tags: { name: 'tags' }
  }
}));

// Mock safe-action to avoid ESM issues
jest.mock("@/lib/safe-action", () => ({
  actionClient: {
    inputSchema: jest.fn().mockReturnThis(),
    schema: jest.fn().mockReturnThis(),
    action: jest.fn((callback) => (input) => callback({ parsedInput: input })), // Wrap input
  },
}));

// Mock drizzle-orm
jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  and: jest.fn((...conds) => ({ type: 'and', conds })),
}));

describe("updateBusinessPartnerTags", () => {
  const mockDb = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([{ id: 1 }]),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
  });

  it("should update tags for a business partner", async () => {
    const input = {
      partnerId: 1,
      tags: ["VIP", "Late Payer"],
    };

    const result = await updateBusinessPartnerTags(input);

    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalledWith(businessPartners);
    expect(mockDb.set).toHaveBeenCalledWith({ tags: input.tags });
    // Verify where clause: must match partnerId and organizationId
    const whereCall = mockDb.where.mock.calls[0][0];
    // Since we mocked 'and' to return { type: 'and', conds: [...] }
    expect(whereCall.type).toBe('and');
    expect(whereCall.conds).toHaveLength(2);
    expect(revalidatePath).toHaveBeenCalledWith("/partners");
  });

  it("should handle empty tags", async () => {
    const input = {
        partnerId: 1,
        tags: [],
    };
    
    await updateBusinessPartnerTags(input);
    expect(mockDb.set).toHaveBeenCalledWith({ tags: [] });
  });
});
