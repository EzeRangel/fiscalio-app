import { validateAllocation } from "@/lib/fiscal-validation/allocation-rules";
import {
  FiscalAllocationContext,
  FiscalInvoice,
  FiscalPayment,
  FiscalAllocation,
  FISCAL_VALIDATION_RULES,
} from "@/lib/fiscal-validation/types";

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

  describe("INT-ALL-01: Allocation amount > 0", () => {
    it("should fail if amount is 0", () => {
      const invalidContext = {
        ...context,
        allocation: { ...allocation, amount: "0.00" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.ALLOCATION_POSITIVE_AMOUNT,
        })
      );
    });
  });

  describe("INT-ALL-02: Allocation invoice must not be cancelled", () => {
    it("should fail if invoice is cancelled", () => {
      const invalidContext = {
        ...context,
        invoice: { ...invoice, status: "cancelled" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.ALLOCATION_INVOICE_NOT_CANCELLED,
        })
      );
    });
  });

  describe("INT-ALL-03: Allocation sum per invoice <= invoice.total", () => {
    it("should fail if new allocation exceeds remaining invoice total", () => {
      const invalidContext = {
        ...context,
        allocation: { ...allocation, amount: "1001.00" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.ALLOCATION_INVOICE_SUM_LIMIT,
        })
      );
    });
  });

  describe("INT-ALL-04: Allocation sum per payment <= payment.amount", () => {
    it("should fail if new allocation exceeds payment amount", () => {
       const invalidContext = {
        ...context,
        allocation: { ...allocation, amount: "1001.00" },
      };
      const result = validateAllocation(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.ALLOCATION_PAYMENT_SUM_LIMIT,
        })
      );
    });
  });
  
  describe("INT-ALL-07: Payment date cannot be earlier than Invoice date", () => {
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
          code: FISCAL_VALIDATION_RULES.INTEGRITY.ALLOCATION_DATE_MISMATCH,
        })
      );
    });
  });
});
