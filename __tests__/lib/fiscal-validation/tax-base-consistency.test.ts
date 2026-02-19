import { validateTaxBaseConsistency } from "@/lib/fiscal-validation/invoice-rules";
import { FISCAL_VALIDATION_RULES } from "@/lib/fiscal-validation/types";

describe("Tax Base Consistency Validation", () => {
  it("should return valid when sum of items (subtotal - discount) equals invoice subtotal", () => {
    const invoice = {
      subtotal: "100.00",
      items: [
        { subtotal: "60.00", discount: "10.00" }, // Net: 50
        { subtotal: "50.00", discount: "0.00" },  // Net: 50
      ]
    };
    const result = validateTaxBaseConsistency(invoice as any);
    expect(result.isValid).toBe(true);
  });

  it("should fail when sum of items does not equal invoice subtotal", () => {
    const invoice = {
      subtotal: "100.00",
      items: [
        { subtotal: "60.00", discount: "5.00" },  // Net: 55
        { subtotal: "50.00", discount: "0.00" },  // Net: 50
      ] // Total net: 105
    };
    const result = validateTaxBaseConsistency(invoice as any);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].code).toBe(FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_SUBTOTAL_INCONSISTENCY);
  });

  it("should handle floating point precision with a small tolerance", () => {
    const invoice = {
      subtotal: "100.00",
      items: [
        { subtotal: "33.333333", discount: "0" },
        { subtotal: "33.333333", discount: "0" },
        { subtotal: "33.333334", discount: "0" },
      ]
    };
    const result = validateTaxBaseConsistency(invoice as any);
    expect(result.isValid).toBe(true);
  });

  it("should return valid if items are missing (skips validation or returns true)", () => {
    const invoice = {
      subtotal: "100.00",
      items: undefined
    };
    const result = validateTaxBaseConsistency(invoice as any);
    expect(result.isValid).toBe(true);
  });

  describe("validateInvoice Integration", () => {
    it("should include tax base consistency errors when calling validateInvoice", () => {
      const invoice = {
        total: "116.00",
        subtotal: "100.00",
        amountPaid: "0.00",
        paymentStatus: "pending",
        status: "active",
        items: [
          { subtotal: "50.00", discount: "0.00" },
          { subtotal: "60.00", discount: "0.00" },
        ] // Sum: 110 != 100
      };
      const { validateInvoice } = require("@/lib/fiscal-validation/invoice-rules");
      const result = validateInvoice(invoice as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: FISCAL_VALIDATION_RULES.INTEGRITY.INVOICE_SUBTOTAL_INCONSISTENCY,
        })
      );
    });
  });

  describe("Edge cases for parsing", () => {
    it("should handle invalid numeric strings by falling back to 0", () => {
      const invoice = {
        subtotal: "invalid",
        items: [
          { subtotal: "NaN", discount: "foo" }
        ]
      };
      const result = validateTaxBaseConsistency(invoice as any);
      // itemsNetTotal = (0 - 0) = 0. invoiceSubtotal = 0. 0 - 0 = 0 < 0.01. Valid.
      expect(result.isValid).toBe(true);
    });

    it("should handle numeric inputs instead of strings", () => {
      const invoice = {
        subtotal: 100,
        items: [
          { subtotal: 60, discount: 10 },
          { subtotal: 50, discount: 0 },
        ]
      };
      const result = validateTaxBaseConsistency(invoice as any);
      expect(result.isValid).toBe(true);
    });
  });
});
