import { distributeHeaderTaxesToItems } from "@/lib/invoice-utils";

describe("distributeHeaderTaxesToItems", () => {
  it("should distribute header taxes proportionally to items based on subtotal", () => {
    const items = [
      { subtotal: "60.00" },
      { subtotal: "40.00" },
    ];
    const headerTaxes = "16.00"; // Total IVA
    const headerWithholdings = "1.25"; // Total ISR
    const invoiceSubtotal = "100.00";

    const result = distributeHeaderTaxesToItems(
      headerTaxes,
      headerWithholdings,
      items,
      invoiceSubtotal
    );

    expect(result).toHaveLength(2);
    
    // Item 1 (60% of 100)
    expect(result[0].taxes).toContainEqual(expect.objectContaining({
      taxType: "transferred",
      taxCode: "002",
      taxAmount: "9.60", // 16 * 0.6
    }));
    expect(result[0].taxes).toContainEqual(expect.objectContaining({
      taxType: "withheld",
      taxCode: "001",
      taxAmount: "0.75", // 1.25 * 0.6
    }));

    // Item 2 (40% of 100)
    expect(result[1].taxes).toContainEqual(expect.objectContaining({
      taxType: "transferred",
      taxCode: "002",
      taxAmount: "6.40", // 16 * 0.4
    }));
    expect(result[1].taxes).toContainEqual(expect.objectContaining({
      taxType: "withheld",
      taxCode: "001",
      taxAmount: "0.50", // 1.25 * 0.4
    }));
  });

  it("should handle zero subtotal by returning empty tax arrays for all items", () => {
    const items = [
      { subtotal: "0.00" },
    ];
    const headerTaxes = "16.00";
    const headerWithholdings = "0.00";
    const invoiceSubtotal = "0.00";

    const result = distributeHeaderTaxesToItems(
      headerTaxes,
      headerWithholdings,
      items,
      invoiceSubtotal
    );

    expect(result[0].taxes).toHaveLength(0);
  });

  it("should not create tax entries if header amounts are zero", () => {
    const items = [
      { subtotal: "100.00" },
    ];
    const result = distributeHeaderTaxesToItems(0, 0, items, 100);
    expect(result[0].taxes).toHaveLength(0);
  });
});
