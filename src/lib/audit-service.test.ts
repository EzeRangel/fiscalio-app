import { calculateDiff, auditMetadataSchema } from "./audit-service";

describe("AuditService", () => {
  describe("calculateDiff", () => {
    it("should return empty object for identical objects", () => {
      const obj = { a: 1, b: "test" };
      expect(calculateDiff(obj, obj)).toEqual({});
    });

    it("should detect changed values", () => {
      const oldObj = { a: 1, b: "old" };
      const newObj = { a: 1, b: "new" };
      expect(calculateDiff(oldObj, newObj)).toEqual({
        b: { old: "old", new: "new" },
      });
    });

    it("should detect added values", () => {
      const oldObj = { a: 1 };
      const newObj = { a: 1, b: "new" };
      expect(calculateDiff(oldObj, newObj)).toEqual({
        b: { old: undefined, new: "new" },
      });
    });

    it("should detect deleted values", () => {
        const oldObj = { a: 1, b: "old" };
        const newObj = { a: 1 };
        expect(calculateDiff(oldObj, newObj)).toEqual({
            b: { old: "old", new: undefined },
        });
    });
    
    it("should handle date comparisons", () => {
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2023-01-02');
        const oldObj = { d: date1 };
        const newObj = { d: date2 };
        expect(calculateDiff(oldObj, newObj)).toEqual({
            d: { old: date1, new: date2 }
        });
    });
    
    it("should handle identical dates", () => {
        const date1 = new Date('2023-01-01');
        const date2 = new Date('2023-01-01');
        const oldObj = { d: date1 };
        const newObj = { d: date2 };
        expect(calculateDiff(oldObj, newObj)).toEqual({});
    });
  });

  describe("auditMetadataSchema", () => {
      it("should validate correct metadata", () => {
          const valid = {
              reason: "User update",
              source: "manual",
              aiConfidence: 0.95,
              extra: "data"
          };
          expect(auditMetadataSchema.safeParse(valid).success).toBe(true);
      });

      it("should allow empty metadata", () => {
          expect(auditMetadataSchema.safeParse({}).success).toBe(true);
      });
      
      it("should reject invalid source", () => {
          const invalid = {
              source: "invalid-source"
          };
          expect(auditMetadataSchema.safeParse(invalid).success).toBe(false);
      });
  });
});
