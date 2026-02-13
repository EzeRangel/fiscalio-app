import { validateInvoice, validateResicoRegime, validateIsrWithholding, validateExchangeRate } from "@/lib/fiscal-validation/invoice-rules";
import { FiscalInvoice, FISCAL_VALIDATION_RULES } from "@/lib/fiscal-validation/types";

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

  describe("INT-INV-03: Total allocated amount <= invoice.total", () => {
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
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_ALLOCATION_LIMIT,
        })
      );
    });

    it("should fail if sum of allocations exceeds total (even if amountPaid is consistent)", () => {
      const invalidInvoice: FiscalInvoice = {
        ...validInvoice,
        total: "1000.00",
        allocations: [{ amount: "600", paymentId: 1 }, { amount: "500", paymentId: 2 }],
      };
      const result = validateInvoice(invalidInvoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_ALLOCATION_LIMIT,
        })
      );
    });
  });

  describe("INT-INV-04: Payment status is always derived", () => {
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
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_PAYMENT_STATUS_DERIVED,
        })
      );
    });

    it("should fail if status is 'pending' but amountPaid > 0 (partial)", () => {
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
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_PAYMENT_STATUS_DERIVED,
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
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_PAYMENT_STATUS_DERIVED,
        })
      );
    });
  });

  describe("INT-INV-02: Cancelled invoice invariants", () => {
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
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_CANCELLED_NO_ALLOCATIONS,
        })
      );
    });
  });

  describe("RESICO Specific Validations", () => {
    describe("validateResicoRegime", () => {
      it("should return valid if income invoice has issuer regime 626", () => {
        const result = validateResicoRegime({
          type: "income",
          issuerRegime: "626",
          receiverRegime: "601"
        });
        expect(result.isValid).toBe(true);
      });

      it("should return invalid if income invoice has issuer regime other than 626", () => {
        const result = validateResicoRegime({
          type: "income",
          issuerRegime: "601",
          receiverRegime: "601"
        });
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe(FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_NON_RESICO_REGIME);
      });
    });

    describe("validateIsrWithholding", () => {
      it("should return invalid if legal entity receiver is missing ISR withholding", () => {
        const result = validateIsrWithholding({
          cfdiType: "I",
          receiverRfc: "ABC123456T12",
          taxes: []
        });
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe(FISCAL_VALIDATION_RULES.USER_FACING.INVOICE_MISSING_ISR_WITHHOLDING);
      });
    });

    describe("validateExchangeRate", () => {
      it("should return invalid for USD with missing exchange rate", () => {
        const result = validateExchangeRate({
          currency: "USD",
          exchangeRate: undefined
        });
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe(FISCAL_VALIDATION_RULES.USER_FACING.INVOICE_INVALID_EXCHANGE_RATE);
      });
    });
  });
});
