import { upsertPatternCandidate } from "@/data/pattern-detection";
import { getDB } from "@/db/drizzle";
import { CLASSIFICATION_LEARNING } from "@/lib/constants";
import { DerivedEngineInvoice } from "@/types/classification-engine";

// Mock dependencies
jest.mock("@/db/drizzle", () => ({
  getDB: jest.fn(),
}));

jest.mock("@/lib/audit-service", () => ({
  logAction: jest.fn(),
}));

// Constants for testing
const MOCK_ORG_ID = 1;
const MOCK_HASH = "test-hash-123";
const MOCK_ACCOUNT = "5000";
const MOCK_FEATURES: Partial<DerivedEngineInvoice> = {
  partnerRfc: "TEST010101ABC",
  items: [{ productServiceKey: "84111506" }],
};

describe("Auto-Expansive Classification System (Integration)", () => {
  let mockDb: any;
  let mockTx: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 100 }])
        })
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({})
        })
      }),
    };

    mockDb = {
      query: {
        patternCandidates: {
          findFirst: jest.fn(),
        },
      },
      transaction: jest.fn((callback) => callback(mockTx)),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: 1 }]) }),
      where: jest.fn().mockReturnThis(),
    };

    (getDB as jest.Mock).mockResolvedValue({ db: mockDb });
  });

  it("should create a new candidate when first seen", async () => {
    mockDb.query.patternCandidates.findFirst.mockResolvedValue(null);

    await upsertPatternCandidate(
      MOCK_ORG_ID,
      MOCK_HASH,
      MOCK_FEATURES,
      MOCK_ACCOUNT
    );

    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
    // Verify it wasn't promoted
    expect(mockTx.insert).not.toHaveBeenCalled(); 
  });

  it("should update an existing candidate and NOT promote if below thresholds", async () => {
    mockDb.query.patternCandidates.findFirst.mockResolvedValue({
      id: 1,
      organizationId: MOCK_ORG_ID,
      featureSetHash: MOCK_HASH,
      features: MOCK_FEATURES,
      proposedAccountId: MOCK_ACCOUNT,
      evidenceCount: 1,
      consistencyRate: "1.0",
      confidenceScore: "0.5",
      status: "candidate",
    });

    await upsertPatternCandidate(
      MOCK_ORG_ID,
      MOCK_HASH,
      MOCK_FEATURES,
      MOCK_ACCOUNT
    );

    expect(mockDb.update).toHaveBeenCalled();
    // Should verify that update was called with incremented evidenceCount
    // logic is inside calculateCandidateUpdate, but we can infer by the flow
    expect(mockTx.insert).not.toHaveBeenCalled(); // No promotion yet
  });

  it("should promote candidate to rule when thresholds are met", async () => {
    // Setup state just before promotion
    // Assume threshold is 5 (default in constants, but we'll ensure we trigger it)
    const storedEvidenceCount = CLASSIFICATION_LEARNING.MIN_EVIDENCE_TO_PROMOTE - 1;
    
    mockDb.query.patternCandidates.findFirst.mockResolvedValue({
      id: 1,
      organizationId: MOCK_ORG_ID,
      featureSetHash: MOCK_HASH,
      features: MOCK_FEATURES,
      proposedAccountId: MOCK_ACCOUNT,
      evidenceCount: storedEvidenceCount,
      consistencyRate: "1.0",
      confidenceScore: "0.9",
      status: "candidate",
    });

    await upsertPatternCandidate(
      MOCK_ORG_ID,
      MOCK_HASH,
      MOCK_FEATURES,
      MOCK_ACCOUNT
    );

    expect(mockDb.update).toHaveBeenCalled(); // Update candidate stats
    
    // VERIFY PROMOTION FLOW
    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockTx.insert).toHaveBeenCalled(); // Create Rule
    expect(mockTx.update).toHaveBeenCalled(); // Update Candidate Status to promoted
  });

  it("should NOT promote if consistency drops below threshold", async () => {
    // Setup state where count is high but consistency is bad
    const storedEvidenceCount = CLASSIFICATION_LEARNING.MIN_EVIDENCE_TO_PROMOTE;
    
    mockDb.query.patternCandidates.findFirst.mockResolvedValue({
      id: 1,
      organizationId: MOCK_ORG_ID,
      featureSetHash: MOCK_HASH,
      features: MOCK_FEATURES,
      proposedAccountId: MOCK_ACCOUNT,
      evidenceCount: storedEvidenceCount,
      consistencyRate: "0.4", // Low consistency
      confidenceScore: "0.2",
      status: "candidate",
    });

    // We pass a DIFFERENT account code to lower consistency further
    await upsertPatternCandidate(
      MOCK_ORG_ID,
      MOCK_HASH,
      MOCK_FEATURES,
      "9999" // Mismatch
    );

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.transaction).not.toHaveBeenCalled(); // No promotion
  });
});
