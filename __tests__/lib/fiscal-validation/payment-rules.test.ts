import { validatePayment } from "@/lib/fiscal-validation/payment-rules";
import { FiscalPayment, FISCAL_VALIDATION_RULES } from "@/lib/fiscal-validation/types";

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

  describe("INT-PAY-01: Payment amount > 0", () => {
    it("should fail if amount is 0", () => {
      const invalidPayment = { ...validPayment, amount: "0.00" };
      const result = validatePayment(invalidPayment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.PAYMENT_POSITIVE_AMOUNT,
        })
      );
    });
  });

  describe("INT-PAY-02: Payment date <= current system date", () => {
    it("should fail if payment date is in the future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const invalidPayment = { ...validPayment, paymentDate: futureDate };
      const result = validatePayment(invalidPayment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.PAYMENT_NO_FUTURE_DATE,
        })
      );
    });
  });

  describe("INT-PAY-03: Sum of allocations <= payment.amount", () => {
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
          code: FISCAL_VALIDATION_RULES.INTEGRITY.PAYMENT_ALLOCATION_SUM_LIMIT,
        })
      );
    });
  });
});
