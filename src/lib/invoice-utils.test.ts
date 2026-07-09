import { deriveInvoiceType, isInvoiceLinked } from "./invoice-utils";

describe("isInvoiceLinked", () => {
  it("should return false for regular income invoices", () => {
    expect(isInvoiceLinked({ invoiceType: "income" })).toBe(false);
  });

  it("should return false for cancelled invoices even if they have linkage data", () => {
    expect(
      isInvoiceLinked({
        invoiceType: "payment_received",
        status: "cancelled",
        linkedPayments: [{ allocations: [{ id: 1 }] }],
      })
    ).toBe(false);
  });

  it("should return true for payment_received with allocations", () => {
    expect(
      isInvoiceLinked({
        invoiceType: "payment_received",
        linkedPayments: [{ allocations: [{ id: 1 }] }],
      })
    ).toBe(true);
  });

  it("should return false for payment_received without allocations", () => {
    expect(
      isInvoiceLinked({
        invoiceType: "payment_received",
        linkedPayments: [{ allocations: [] }],
      })
    ).toBe(false);
    expect(isInvoiceLinked({ invoiceType: "payment_received" })).toBe(false);
  });

  it("should return true for credit_note_issued with substituteInvoiceId", () => {
    expect(
      isInvoiceLinked({
        invoiceType: "credit_note_issued",
        substituteInvoiceId: 123,
      })
    ).toBe(true);
  });

  it("should return false for credit_note_issued without substituteInvoiceId", () => {
    expect(
      isInvoiceLinked({
        invoiceType: "credit_note_issued",
        substituteInvoiceId: null,
      })
    ).toBe(false);
  });
});

describe("deriveInvoiceType", () => {
  it("should derive 'income' for type 'I' when organization is the emitter", () => {
    expect(deriveInvoiceType("I", true)).toBe("income");
  });

  it("should derive 'expense' for type 'I' when organization is the receiver", () => {
    expect(deriveInvoiceType("I", false)).toBe("expense");
  });

  it("should derive 'credit_note_issued' for type 'E' when organization is the emitter", () => {
    expect(deriveInvoiceType("E", true)).toBe("credit_note_issued");
  });

  it("should derive 'credit_note_received' for type 'E' when organization is the receiver", () => {
    expect(deriveInvoiceType("E", false)).toBe("credit_note_received");
  });

  it("should derive 'payment_issued' for type 'P' when organization is the emitter", () => {
    expect(deriveInvoiceType("P", true)).toBe("payment_issued");
  });

  it("should derive 'payment_received' for type 'P' when organization is the receiver", () => {
    expect(deriveInvoiceType("P", false)).toBe("payment_received");
  });

  it("should derive 'payroll_issued' for type 'N' when organization is the emitter", () => {
    expect(deriveInvoiceType("N", true)).toBe("payroll_issued");
  });

  it("should derive 'payroll_received' for type 'N' when organization is the receiver", () => {
    expect(deriveInvoiceType("N", false)).toBe("payroll_received");
  });

  it("should derive 'transfer_issued' for type 'T' when organization is the emitter", () => {
    expect(deriveInvoiceType("T", true)).toBe("transfer_issued");
  });

  it("should derive 'transfer_received' for type 'T' when organization is the receiver", () => {
    expect(deriveInvoiceType("T", false)).toBe("transfer_received");
  });

  it("should default to 'income' for unknown types when emitter", () => {
    expect(deriveInvoiceType("UNKNOWN_TYPE" as any, true)).toBe("income");
  });

  it("should default to 'expense' for unknown types when receiver", () => {
    expect(deriveInvoiceType("UNKNOWN_TYPE" as any, false)).toBe("expense");
  });
});
