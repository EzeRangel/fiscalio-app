import { validateCancellation } from "@/lib/fiscal-validation/cancellation-rules";
import { FISCAL_VALIDATION_RULES } from "@/lib/fiscal-validation/constants";
import { FiscalInvoice } from "@/lib/fiscal-validation/types";

describe("Cancellation Validation Rules", () => {
  const activeInvoice: FiscalInvoice = {
    id: 1,
    subtotal: "100.00",
    total: "116.00",
    amountPaid: "116.00",
    paymentStatus: "paid",
    status: "active",
    cfdiType: "I",
  };

  const unpaidInvoice: FiscalInvoice = {
    id: 2,
    subtotal: "100.00",
    total: "116.00",
    amountPaid: "0.00",
    paymentStatus: "pending",
    status: "active",
    cfdiType: "I",
  };

  it("should validate a valid motive 02 cancellation (errors without relation) without payments", () => {
    const request = {
      reasonCode: "02" as const,
      cancellationReason: "RFC incorrecto",
    };
    const result = validateCancellation(unpaidInvoice, request);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation for motive 01 or 02 if substitute UUID is missing (INT-CAN-02)", () => {
    const request = {
      reasonCode: "01" as const,
      cancellationReason: "Sustitución",
      substituteInvoiceUuid: "",
    };
    const result = validateCancellation(unpaidInvoice, request);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: FISCAL_VALIDATION_RULES.CANCELLATION.MISSING_SUBSTITUTE,
        severity: "error",
      })
    );
  });

  it("should pass validation for motive 01 if substitute UUID is provided", () => {
    const request = {
      reasonCode: "01" as const,
      cancellationReason: "Sustitución",
      substituteInvoiceUuid: "123e4567-e89b-12d3-a456-426614174000",
    };
    const result = validateCancellation(unpaidInvoice, request);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation for motive 03 if invoice has payments but no refund (INT-CAN-01)", () => {
    const request = {
      reasonCode: "03" as const,
      cancellationReason: "No se concretó",
    };
    const result = validateCancellation(activeInvoice, request, []);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: FISCAL_VALIDATION_RULES.CANCELLATION.UNPAID_REFUND,
        severity: "error",
      })
    );
  });

  it("should pass validation for motive 03 if invoice has payments and sufficient refund is provided", () => {
    const request = {
      reasonCode: "03" as const,
      cancellationReason: "No se concretó",
    };
    const refunds = [{ amount: "116.00" }];
    const result = validateCancellation(activeInvoice, request, refunds);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation for motive 03 if refunds are registered but sum is less than amountPaid (INT-CAN-01)", () => {
    const request = {
      reasonCode: "03" as const,
      cancellationReason: "No se concretó",
    };
    const refunds = [{ amount: "50.00" }];
    const result = validateCancellation(activeInvoice, request, refunds);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: FISCAL_VALIDATION_RULES.CANCELLATION.UNPAID_REFUND,
        severity: "error",
      })
    );
  });
});
