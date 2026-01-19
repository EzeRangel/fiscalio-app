import { updateBusinessPartnerTags } from "./business-partners";
import { getDB } from "@/db/drizzle";
import { getActiveOrganizationId } from "@/lib/session";
import { businessPartners } from "@/db/schema/businessPartners";
import { revalidatePath } from "next/cache";
import { GENERIC_RFCS } from "@/lib/constants";

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
    query: {
      businessPartners: {
        findFirst: jest.fn().mockResolvedValue({ tags: ["old-tag"] }),
      },
    },
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

import { saveBusinessPartner } from "./business-partners";

describe("saveBusinessPartner", () => {
    const mockDb = {
        insert: jest.fn(() => ({
            values: jest.fn(() => ({
                returning: jest.fn().mockResolvedValue([{ id: 100 }])
            }))
        })),
        query: {
            businessPartners: {
                findFirst: jest.fn(),
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
        (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
    });

    const baseInput = {
        businessName: "Test Partner",
        rfc: "SPECIFICRFC123",
        partnerType: "client",
        taxRegimeId: 601,
        address: {},
        contact: {}
    };

    it("should fail if specific RFC already exists in organization", async () => {
        // Mock finding an existing partner with the same RFC
        mockDb.query.businessPartners.findFirst.mockResolvedValue({ id: 99, rfc: "SPECIFICRFC123" });

        // Since our mock actionClient just calls the function directly and doesn't catch errors like the real one,
        // we expect the error to bubble up.
        await expect(saveBusinessPartner(baseInput)).rejects.toThrow("Ya existe un socio con este RFC.");
        
        // Verify we checked DB
        expect(mockDb.query.businessPartners.findFirst).toHaveBeenCalled();
        // Verify we did NOT insert
        expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it("should succeed if specific RFC exists in DIFFERENT organization", async () => {
        // Mock findFirst returning null (scoped to organization)
        mockDb.query.businessPartners.findFirst.mockResolvedValue(null);

        const result = await saveBusinessPartner(baseInput);

        // Should proceed to insert
        expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should succeed if generic RFC exists in SAME organization", async () => {
        const genericInput = { ...baseInput, rfc: GENERIC_RFCS.PUBLIC };
        
        // Even if findFirst finds one (if we were to query it), the logic should allow it.
        // But the pre-check should ideally skip the query for generic RFCs, OR the query logic should filter them out?
        // Plan says: "Add a pre-check to query for existing RFCs... if the RFC is not generic."
        
        await saveBusinessPartner(genericInput);
        
        // Should NOT query for duplicates if generic
        expect(mockDb.query.businessPartners.findFirst).not.toHaveBeenCalled();
        // Should insert
        expect(mockDb.insert).toHaveBeenCalled();
    });
});

