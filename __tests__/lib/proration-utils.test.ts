import { calculatePaidTaxForItem } from '@/lib/proration-utils';

describe('proration-utils', () => {
  describe('calculatePaidTaxForItem', () => {
    it('calculates proportional tax for a partial payment', () => {
      // Arrangement
      const allocation = {
        amountAllocated: 500, // Half of the total
      };
      const invoice = {
        total: 1000,
      };
      const itemTax = {
        taxAmount: 160, // 16% IVA on 1000 subtotal (simplified)
      };

      // Factor = 500 / 1000 = 0.5
      // PaidAmount = 160 * 0.5 = 80

      // Act
      const result = calculatePaidTaxForItem(
        allocation.amountAllocated,
        invoice.total,
        itemTax.taxAmount
      );

      // Assert
      expect(result).toBe(80);
    });

    it('maintains high precision for complex proportions', () => {
      // Arrangement
      const allocation = { amountAllocated: 333.33 };
      const invoice = { total: 1000 };
      const itemTax = { taxAmount: 160 };

      // Factor = 333.33 / 1000 = 0.33333
      // PaidAmount = 160 * 0.33333 = 53.3328

      // Act
      const result = calculatePaidTaxForItem(
        allocation.amountAllocated,
        invoice.total,
        itemTax.taxAmount
      );

      // Assert
      expect(result).toBeCloseTo(53.3328, 4);
    });

    it('returns 0 if invoice total is 0 to avoid division by zero', () => {
       const result = calculatePaidTaxForItem(100, 0, 16);
       expect(result).toBe(0);
    });
  });
});
