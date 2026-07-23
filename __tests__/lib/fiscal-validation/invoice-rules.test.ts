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

      it("should return valid if expense invoice has receiver regime 626", () => {
        const result = validateResicoRegime({
          type: "expense",
          issuerRegime: "601",
          receiverRegime: "626"
        });
        expect(result.isValid).toBe(true);
      });

      it("should return invalid if expense invoice has receiver regime other than 626", () => {
        const result = validateResicoRegime({
          type: "expense",
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

      it("should return valid for XXX currency without exchange rate", () => {
        const result = validateExchangeRate({
          currency: "XXX",
          exchangeRate: undefined
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should return valid for MXN without exchange rate (no regression)", () => {
        const result = validateExchangeRate({
          currency: "MXN",
          exchangeRate: undefined
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe("Non-Commercial CFDI Types (P, T, N)", () => {
    it.each(["P", "T", "N"])("should bypass INV-03 when cfdiType is %s (amountPaid > total)", (cfdiType) => {
      const invoice: FiscalInvoice = {
        ...validInvoice,
        cfdiType,
        total: "1000.00",
        amountPaid: "2000.00",
      };
      const result = validateInvoice(invoice);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it.each(["P", "T", "N"])("should bypass INV-04 when cfdiType is %s (payment status inconsistency)", (cfdiType) => {
      const invoice: FiscalInvoice = {
        ...validInvoice,
        cfdiType,
        total: "1000.00",
        amountPaid: "500.00",
        paymentStatus: "paid",
      };
      const result = validateInvoice(invoice);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it.each(["P", "T", "N"])("should bypass INT-INV-06 when cfdiType is %s (tax base mismatch)", (cfdiType) => {
      const invoice: FiscalInvoice = {
        ...validInvoice,
        cfdiType,
        subtotal: "100.00",
        items: [
          { subtotal: "60.00", discount: "0" },
          { subtotal: "60.00", discount: "0" },
        ],
      };
      const result = validateInvoice(invoice);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it.each(["P", "T", "N"])("should still enforce INV-02 when cfdiType is %s (cancelled + allocations)", (cfdiType) => {
      const invoice: FiscalInvoice = {
        ...validInvoice,
        cfdiType,
        status: "cancelled",
        amountPaid: "500.00",
        allocations: [{ amount: "500", paymentId: 1 }],
      };
      const result = validateInvoice(invoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_CANCELLED_NO_ALLOCATIONS,
        })
      );
    });

    it("should enforce all rules when cfdiType is undefined (commercial default)", () => {
      const invoice: FiscalInvoice = {
        ...validInvoice,
        cfdiType: undefined,
        total: "1000.00",
        amountPaid: "2000.00",
      };
      const result = validateInvoice(invoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_ALLOCATION_LIMIT,
        })
      );
    });

    it("should enforce all rules for commercial cfdiType I (no regression)", () => {
      const invoice: FiscalInvoice = {
        ...validInvoice,
        cfdiType: "I",
        total: "1000.00",
        amountPaid: "2000.00",
      };
      const result = validateInvoice(invoice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_ALLOCATION_LIMIT,
        })
      );
    });
  });
});
