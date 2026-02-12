import { checkFileHashUniqueness, checkFolioFiscalUniqueness, generateFileHash } from "@/lib/data-integrity";
import { getDB } from "@/db/drizzle";
import { invoices } from "@/db/schema/invoices";
import { ActionError } from "@/lib/errors";

// Mock dependencies
jest.mock("@/db/drizzle");
jest.mock("@/db/schema/invoices", () => ({
  invoices: {
    fileHash: { name: 'file_hash' },
    folioFiscal: { name: 'folio_fiscal' },
    organizationId: { name: 'organization_id' },
  }
}));

// Mock drizzle-orm
jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn((col, val) => ({ type: 'eq', col, val })),
  and: jest.fn((...conds) => ({ type: 'and', conds })),
}));

describe("data-integrity utils", () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
  });

  describe("generateFileHash", () => {
    it("should generate consistent SHA-256 hashes", () => {
      const content = "<xml>test</xml>";
      const hash1 = generateFileHash(content);
      const hash2 = generateFileHash(content);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 is 64 hex chars
    });
  });

  describe("checkFileHashUniqueness", () => {
    it("should throw ActionError if file hash already exists in organization", async () => {
      mockDb.limit.mockResolvedValue([{ id: 1 }]); // Found a match

      await expect(checkFileHashUniqueness(1, "existing-hash"))
        .rejects.toThrow(ActionError);
      
      await expect(checkFileHashUniqueness(1, "existing-hash"))
        .rejects.toThrow("Este archivo ya ha sido importado.");
    });

    it("should not throw if file hash does not exist", async () => {
      mockDb.limit.mockResolvedValue([]); // No match

      await expect(checkFileHashUniqueness(1, "new-hash"))
        .resolves.not.toThrow();
    });
  });

  describe("checkFolioFiscalUniqueness", () => {
    it("should throw ActionError if folio fiscal already exists in organization", async () => {
      mockDb.limit.mockResolvedValue([{ id: 1 }]); // Found a match

      await expect(checkFolioFiscalUniqueness(1, "existing-uuid"))
        .rejects.toThrow(ActionError);
      
      await expect(checkFolioFiscalUniqueness(1, "existing-uuid"))
        .rejects.toThrow("Una factura con este UUID (Folio Fiscal) ya está registrada.");
    });

    it("should not throw if folio fiscal does not exist", async () => {
      mockDb.limit.mockResolvedValue([]); // No match

      await expect(checkFolioFiscalUniqueness(1, "new-uuid"))
        .resolves.not.toThrow();
    });
  });
});
