import { validateInvoice } from "./invoice-rules";
import { FiscalInvoice, FISCAL_VALIDATION_RULES } from "./types";

describe("Invoice Validation Rules", () => {
  const validInvoice: FiscalInvoice = {
    id: 1,
    total: "1000.00",
    amountPaid: "0.00",
    paymentStatus: "pending",
    status: "active",
    allocations: [],
  };

  it("should return valid for a correct pending invoice", () => {
    const result = validateInvoice(validInvoice);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  describe("INV-03: Total allocated amount <= invoice.total", () => {
    it("should fail if amountPaid exceeds total", () => {
      const invalidInvoice: FiscalInvoice = {
        ...validInvoice,
        total: "1000.00",
        amountPaid: "1001.00",
      };
      const result = validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INVOICE.ALLOCATION_LIMIT,
        })
      );
    });

    it("should fail if sum of allocations exceeds total (even if amountPaid is consistent)", () => {
      // In case amountPaid is not updated but allocations exist
      const invalidInvoice: FiscalInvoice = {
        ...validInvoice,
        total: "1000.00",
        allocations: [{ amount: "600", paymentId: 1 }, { amount: "500", paymentId: 2 }],
      };
      const result = validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INVOICE.ALLOCATION_LIMIT,
        })
      );
    });
  });

  describe("INV-04: Payment status is always derived", () => {
    it("should fail if status is 'paid' but amountPaid < total", () => {
      const invalidInvoice: FiscalInvoice = {
        ...validInvoice,
        total: "1000.00",
        amountPaid: "999.00",
        paymentStatus: "paid",
      };
      const result = validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INVOICE.PAYMENT_STATUS_DERIVED,
        })
      );
    });

    it("should fail if status is 'pending' but amountPaid > 0 (partial)", () => {
      // Assuming pending means 0 paid. Partial means > 0 and < total.
      const invalidInvoice: FiscalInvoice = {
        ...validInvoice,
        total: "1000.00",
        amountPaid: "500.00",
        paymentStatus: "pending",
      };
      const result = validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INVOICE.PAYMENT_STATUS_DERIVED,
        })
      );
    });
    
    it("should fail if status is 'partial' but amountPaid == total", () => {
      const invalidInvoice: FiscalInvoice = {
        ...validInvoice,
        total: "1000.00",
        amountPaid: "1000.00",
        paymentStatus: "partial",
      };
      const result = validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INVOICE.PAYMENT_STATUS_DERIVED,
        })
      );
    });
  });

  describe("INV-02: Cancelled invoice invariants", () => {
    it("should fail if a cancelled invoice has allocations (active allocations)", () => {
       const invalidInvoice: FiscalInvoice = {
        ...validInvoice,
        status: "cancelled",
        amountPaid: "500.00",
        allocations: [{ amount: "500", paymentId: 1 }],
      };
      const result = validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INVOICE.CANCELLED_NO_ALLOCATIONS,
        })
      );
    });
  });
});
