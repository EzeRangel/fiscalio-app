import { validatePayment } from "./payment-rules";
import { FiscalPayment, FISCAL_VALIDATION_RULES } from "./types";

describe("Payment Validation Rules", () => {
  const validPayment: FiscalPayment = {
    id: 1,
    amount: "1000.00",
    paymentDate: new Date(),
    allocations: [],
  };

  it("should return valid for a correct payment", () => {
    const result = validatePayment(validPayment);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  describe("PAY-01: Payment amount > 0", () => {
    it("should fail if amount is 0", () => {
      const invalidPayment = { ...validPayment, amount: "0.00" };
      const result = validatePayment(invalidPayment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.PAYMENT.POSITIVE_AMOUNT,
        })
      );
    });
    
    it("should fail if amount is negative", () => {
      const invalidPayment = { ...validPayment, amount: "-100.00" };
      const result = validatePayment(invalidPayment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.PAYMENT.POSITIVE_AMOUNT,
        })
      );
    });
  });

  describe("PAY-02: Payment date <= current system date", () => {
    it("should fail if payment date is in the future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const invalidPayment = { ...validPayment, paymentDate: futureDate };
      const result = validatePayment(invalidPayment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.PAYMENT.NO_FUTURE_DATE,
        })
      );
    });

    it("should allow today", () => {
        const today = new Date();
        const valid = { ...validPayment, paymentDate: today };
        const result = validatePayment(valid);
        expect(result.isValid).toBe(true);
    });
  });

  describe("PAY-03: Sum of allocations <= payment.amount", () => {
    it("should fail if allocations exceed payment amount", () => {
      const invalidPayment = {
        ...validPayment,
        amount: "1000.00",
        allocations: [{ amount: "600" }, { amount: "500" }],
      };
      const result = validatePayment(invalidPayment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.PAYMENT.ALLOCATION_SUM_LIMIT,
        })
      );
    });
  });
});
