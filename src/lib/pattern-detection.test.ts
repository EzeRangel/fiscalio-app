import { PatternCandidate } from "@/types/classification-engine";
import { calculateCandidateUpdate } from "./pattern-detection";

describe("Pattern Detection Logic", () => {
  const mockFeatures = { hasVat: true, invoiceType: "expense" } as any; // Partial features
  const hash = "abc123hash";
  const orgId = 1;

  describe("calculateCandidateUpdate", () => {
    it("should create a new candidate state if none exists", () => {
      const result = calculateCandidateUpdate(
        null, 
        orgId, 
        hash, 
        mockFeatures, 
        "5000" // proposedAccountId
      );

      expect(result).toMatchObject({
        organizationId: orgId,
        featureSetHash: hash,
        features: mockFeatures,
        proposedAccountId: "5000",
        evidenceCount: 1,
        consistencyRate: "1.0000",
        status: "candidate"
      });
      // Confidence score should be low/initial
      expect(parseFloat(result.confidenceScore)).toBeGreaterThan(0);
    });

    it("should increment evidence and maintain consistency for matching account", () => {
      const existing: PatternCandidate = {
        id: 1,
        organizationId: orgId,
        featureSetHash: hash,
        features: mockFeatures,
        proposedAccountId: "5000",
        evidenceCount: 5,
        consistencyRate: 1.0,
        confidenceScore: 0.5,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        status: "candidate"
      };

      const result = calculateCandidateUpdate(
        existing,
        orgId,
        hash,
        mockFeatures,
        "5000"
      );

      expect(result.evidenceCount).toBe(6);
      expect(parseFloat(result.consistencyRate)).toBe(1.0);
      expect(parseFloat(result.confidenceScore)).toBeGreaterThan(0.5); // Should increase
    });

    it("should decrement consistency for conflicting account", () => {
      const existing: PatternCandidate = {
        id: 1,
        organizationId: orgId,
        featureSetHash: hash,
        features: mockFeatures,
        proposedAccountId: "5000",
        evidenceCount: 10,
        consistencyRate: 1.0, // 10 out of 10 matches so far
        confidenceScore: 1.0,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        status: "candidate"
      };

      // User classifies as "6000" instead of "5000"
      const result = calculateCandidateUpdate(
        existing,
        orgId,
        hash,
        mockFeatures,
        "6000"
      );

      expect(result.evidenceCount).toBe(11);
      // Previous: 10 hits. New: 1 miss. Total 11. Hits 10.
      // Rate = 10 / 11 = 0.9090
      expect(parseFloat(result.consistencyRate)).toBeCloseTo(0.9090, 3);
      expect(parseFloat(result.confidenceScore)).toBeLessThan(1.0); // Should decrease
    });
  });
});
