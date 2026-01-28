import { EngineInvoice } from "@/types/classification-engine";
import { 
  deriveEngineInvoice, 
  generateFeatureSetHash 
} from "./classification-engine";

const mockRawInvoice: EngineInvoice = {
  cfdiType: "I",
  invoiceType: "income",
  currency: "USD",
  paymentForm: "03",
  partnerId: 1,
  partnerRfc: "ABC123456XYZ",
  items: [
    { productServiceKey: "80101500" }, // Service
  ],
  taxes: [{ taxCode: "002", taxType: "transferred", rate: 0.16 }],
};

describe("EngineInvoice Canonicalization", () => {
  describe("deriveEngineInvoice", () => {
    it("should correctly identify national partner type", () => {
      const derived = deriveEngineInvoice({ ...mockRawInvoice, partnerRfc: "ABC123456XYZ" });
      expect(derived.partnerType).toBe("national");
      expect(derived.hasRfc).toBe(true);
    });

    it("should correctly identify foreign partner type", () => {
      const derived = deriveEngineInvoice({ ...mockRawInvoice, partnerRfc: "XEXX010101000" });
      expect(derived.partnerType).toBe("foreign");
    });

    it("should correctly identify currency flags", () => {
      const derived = deriveEngineInvoice(mockRawInvoice);
      expect(derived.isUSD).toBe(true);
      expect(derived.isForeignCurrency).toBe(true);
    });

    it("should correctly identify item properties", () => {
      const derived = deriveEngineInvoice({
        ...mockRawInvoice,
        items: [
          { productServiceKey: "80101500" }, // Service
          { productServiceKey: "10101500" }, // Product
        ]
      });
      expect(derived.itemCount).toBe(2);
      expect(derived.hasServiceItems).toBe(true);
      expect(derived.hasMixedItems).toBe(true);
    });

    it("should correctly identify tax profiles (standard)", () => {
      const derived = deriveEngineInvoice({
        ...mockRawInvoice,
        taxes: [{ taxCode: "002", taxType: "transferred", rate: 0.16 }]
      });
      expect(derived.hasVat).toBe(true);
      expect(derived.vatRate).toBe(0.16);
      expect(derived.vatRetained).toBe(false);
    });

    it("should correctly identify tax profiles (mixed)", () => {
      const derived = deriveEngineInvoice({
        ...mockRawInvoice,
        taxes: [
            { taxCode: "002", taxType: "transferred", rate: 0.16 },
            { taxCode: "002", taxType: "transferred", rate: 0.00 }
        ]
      });
      expect(derived.hasVat).toBe(true);
      expect(derived.vatRate).toBe("mixed");
    });

    it("should correctly identify retained taxes", () => {
        const derived = deriveEngineInvoice({
          ...mockRawInvoice,
          taxes: [
              { taxCode: "002", taxType: "transferred", rate: 0.16 },
              { taxCode: "001", taxType: "withheld", rate: 0.10 }, // ISR Retained
              { taxCode: "002", taxType: "withheld", rate: 0.106667 } // IVA Retained
          ]
        });
        expect(derived.isrRetained).toBe(true);
        expect(derived.vatRetained).toBe(true);
      });

    it("should correctly identify CFDI flags based on invoiceType", () => {
      const derived = deriveEngineInvoice(mockRawInvoice);
      expect(derived.isIncome).toBe(true);
      expect(derived.isExpense).toBe(false);

      const expenseDerived = deriveEngineInvoice({ ...mockRawInvoice, invoiceType: "expense" });
      expect(expenseDerived.isIncome).toBe(false);
      expect(expenseDerived.isExpense).toBe(true);
    });
  });

  describe("generateFeatureSetHash", () => {
    it("should generate the same hash for identical derived invoices", () => {
      const derived1 = deriveEngineInvoice(mockRawInvoice);
      const derived2 = deriveEngineInvoice(mockRawInvoice);
      
      const hash1 = generateFeatureSetHash(derived1);
      const hash2 = generateFeatureSetHash(derived2);
      
      expect(hash1).toBe(hash2);
    });

    it("should generate different hashes for different feature sets", () => {
      const derived1 = deriveEngineInvoice(mockRawInvoice);
      const derived2 = deriveEngineInvoice({ ...mockRawInvoice, currency: "MXN" });
      
      const hash1 = generateFeatureSetHash(derived1);
      const hash2 = generateFeatureSetHash(derived2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
});