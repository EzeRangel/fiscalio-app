import { validateAllocation } from "./allocation-rules";
import {
  FiscalAllocationContext,
  FiscalInvoice,
  FiscalPayment,
  FiscalAllocation,
  FISCAL_VALIDATION_RULES,
} from "./types";

describe("Allocation Validation Rules", () => {
  const invoice: FiscalInvoice = {
    id: 1,
    total: "1000.00",
    amountPaid: "0.00",
    paymentStatus: "pending",
    status: "active",
    allocations: [],
  };

  const payment: FiscalPayment = {
    id: 1,
    amount: "1000.00",
    paymentDate: new Date("2024-01-15T12:00:00Z"),
    allocations: [],
  };

  const allocation: FiscalAllocation = {
    amount: "500.00",
    paymentId: 1,
    invoiceId: 1,
  };

  const context: FiscalAllocationContext = {
    allocation,
    invoice,
    payment,
    existingAllocationsForInvoice: [],
    existingAllocationsForPayment: [],
  };

  it("should return valid for a correct allocation", () => {
    const result = validateAllocation(context);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  describe("ALL-01: Allocation amount > 0", () => {
    it("should fail if amount is 0", () => {
      const invalidContext = {
        ...context,
        allocation: { ...allocation, amount: "0.00" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.ALLOCATION.POSITIVE_AMOUNT,
        })
      );
    });
  });

  describe("ALL-02: Allocation invoice must not be cancelled", () => {
    it("should fail if invoice is cancelled", () => {
      const invalidContext = {
        ...context,
        invoice: { ...invoice, status: "cancelled" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.ALLOCATION.INVOICE_NOT_CANCELLED,
        })
      );
    });
  });

  describe("ALL-03: Allocation sum per invoice <= invoice.total", () => {
    it("should fail if new allocation exceeds remaining invoice total", () => {
      const invalidContext = {
        ...context,
        allocation: { ...allocation, amount: "1001.00" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.ALLOCATION.INVOICE_SUM_LIMIT,
        })
      );
    });

    it("should fail if existing + new exceeds total", () => {
      const invalidContext = {
        ...context,
        existingAllocationsForInvoice: [{ amount: "600", paymentId: 2, invoiceId: 1 }],
        allocation: { ...allocation, amount: "500" }, // 600 + 500 > 1000
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.ALLOCATION.INVOICE_SUM_LIMIT,
        })
      );
    });
  });

  describe("ALL-04: Allocation sum per payment <= payment.amount", () => {
    it("should fail if new allocation exceeds payment amount", () => {
       const invalidContext = {
        ...context,
        allocation: { ...allocation, amount: "1001.00" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.ALLOCATION.PAYMENT_SUM_LIMIT,
        })
      );
    });

    it("should fail if existing + new exceeds payment", () => {
        const invalidContext = {
        ...context,
        existingAllocationsForPayment: [{ amount: "600", paymentId: 1, invoiceId: 2 }],
        allocation: { ...allocation, amount: "500" }, // 600 + 500 > 1000
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.ALLOCATION.PAYMENT_SUM_LIMIT,
        })
      );
    });
  });
  
  // ALL-05: Allocation fiscal period = month(payment.payment_date)
  // This rule is about ensuring the allocation inherits the period. 
  // It's effectively structural: the allocation *doesn't have* its own date, it relies on payment.
  // So validation might just be "Allocation date (if exists) must match payment date" or similar.
  // But spec says "Allocation fiscal period = month(payment.payment_date)".
  // Since allocation usually doesn't store a date (it links payment and invoice), this rule might be enforced by logic that *derives* period from payment.
  // However, if we were to store period on allocation, we'd check it.
  // The schema `paymentAllocations` has `createdAt` but no `period`.
  // So ALL-05 is likely a derived invariant (ensuring we don't try to force a different period).
  // If the allocation object had a `period` field, we'd validate it.
  // For now, there's nothing to validate on the object itself regarding period unless we pass a target period.
  // I'll skip specific test for ALL-05 unless I add a period field to FiscalAllocation.

  describe("ALL-07: Payment date cannot be earlier than Invoice date", () => {
    it("should fail if payment date is before invoice date", () => {
      const invoiceDate = new Date("2024-01-10T12:00:00Z");
      const paymentDate = new Date("2024-01-09T12:00:00Z"); // Before

      const invalidContext = {
        ...context,
        invoice: { ...invoice, invoiceDate },
        payment: { ...payment, paymentDate },
      };

      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.ALLOCATION.DATE_MISMATCH,
        })
      );
    });

    it("should pass if payment date is same as invoice date", () => {
      const date = new Date("2024-01-10T12:00:00Z");
      const validContext = {
        ...context,
        invoice: { ...invoice, invoiceDate: date },
        payment: { ...payment, paymentDate: date },
      };

      const result = validateAllocation(validContext);
      expect(result.isValid).toBe(true);
    });
  });
});
