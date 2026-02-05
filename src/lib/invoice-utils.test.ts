import { deriveInvoiceType } from "./invoice-utils";

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
    expect(deriveInvoiceType("X" as any, true)).toBe("income");
  });

  it("should default to 'expense' for unknown types when receiver", () => {
    expect(deriveInvoiceType("X" as any, false)).toBe("expense");
  });
});
