import { upsertPatternCandidate, promoteCandidateToRule } from "./pattern-detection";
import { getDB } from "@/db/drizzle";
import { classificationRules, patternCandidates } from "@/db/schema";
import { logAction } from "@/lib/audit-service";
import { CLASSIFICATION_LEARNING } from "@/lib/constants";

jest.mock("@/db/drizzle", () => ({
  getDB: jest.fn(),
}));

jest.mock("@/lib/audit-service", () => ({
  logAction: jest.fn(),
}));

jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn(),
}));

describe("Pattern Detection Data Service", () => {
  const orgId = 1;
  const hash = "abc123hash";
  const features = { hasVat: true };
  const accountCode = "5000";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("promoteCandidateToRule", () => {
    it("should create a rule and mark candidate as promoted", async () => {
      const mockCandidate = {
        id: 10,
        organizationId: orgId,
        featureSetHash: hash,
        features,
        proposedAccountId: accountCode,
        evidenceCount: 10,
        consistencyRate: "1.0000",
        confidenceScore: "1.0000",
        status: "candidate",
      };

      const mockTx = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 99 }]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };

      const mockDb = {
        query: {
          patternCandidates: {
            findFirst: jest.fn().mockResolvedValue(mockCandidate),
          },
        },
        transaction: jest.fn((cb) => cb(mockTx)),
      };

      (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

      await promoteCandidateToRule(10);

      expect(mockTx.insert).toHaveBeenCalledWith(classificationRules);
      expect(mockTx.update).toHaveBeenCalledWith(patternCandidates);
      expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
        entityType: "classification_rule",
        action: "created",
      }));
    });

    it("should log correct metadata for promotion events", async () => {
      const mockCandidate = {
        id: 11,
        organizationId: orgId,
        featureSetHash: hash,
        features,
        proposedAccountId: accountCode,
        evidenceCount: 15,
        consistencyRate: "0.9500",
        confidenceScore: "0.8500",
        status: "candidate",
      };

      const mockTx = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 100 }]),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };

      const mockDb = {
        query: {
          patternCandidates: {
            findFirst: jest.fn().mockResolvedValue(mockCandidate),
          },
        },
        transaction: jest.fn((cb) => cb(mockTx)),
      };

      (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

      await promoteCandidateToRule(11);

      expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
        metadata: expect.objectContaining({
          source: "ai",
          reason: "Patrón detectado con alta confianza",
          evidenceCount: 15,
          consistencyRate: "0.9500",
        }),
      }));
    });
  });

  describe("upsertPatternCandidate", () => {
    it("should trigger promotion if thresholds are met", async () => {
      const mockExisting = {
        id: 10,
        organizationId: orgId,
        featureSetHash: hash,
        features,
        proposedAccountId: accountCode,
        evidenceCount: CLASSIFICATION_LEARNING.MIN_EVIDENCE_TO_PROMOTE - 1,
        consistencyRate: "1.0000",
        confidenceScore: "0.5000",
        status: "candidate",
      };

      const mockDb = {
        query: {
          patternCandidates: {
            findFirst: jest.fn().mockResolvedValue(mockExisting),
          },
        },
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        transaction: jest.fn(),
      };

      (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

      // After update, it will hit MIN_EVIDENCE_TO_PROMOTE
      await upsertPatternCandidate(orgId, hash, features, accountCode);

      // Verify update was called
      expect(mockDb.update).toHaveBeenCalled();
      
      // Verify promotion was checked (since transaction would be called if promoted)
      // Note: In our implementation, upsertPatternCandidate calls promoteCandidateToRule 
      // which starts its own transaction if getDB is called again or uses same db.
      // But here we are mocking promoteCandidateToRule's internal calls via getDB.
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it("should not trigger promotion if consistency is too low", async () => {
      const mockExisting = {
        id: 10,
        organizationId: orgId,
        featureSetHash: hash,
        features,
        proposedAccountId: accountCode,
        evidenceCount: 10,
        consistencyRate: "0.2000", // Very low
        status: "candidate",
      };

      const mockDb = {
        query: {
          patternCandidates: {
            findFirst: jest.fn().mockResolvedValue(mockExisting),
          },
        },
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        transaction: jest.fn(),
      };

      (getDB as jest.Mock).mockResolvedValue({ db: mockDb });

      await upsertPatternCandidate(orgId, hash, features, accountCode);

      // New consistency will be (round(10*0.2)+1)/11 = 3/11 = 0.27
      // which is well below 0.8
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });
});
