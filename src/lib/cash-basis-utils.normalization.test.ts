import { calculateCashBasisSummary, normalizeToMXN } from './cash-basis-utils';

describe('normalizeToMXN', () => {
  it('should return the amount multiplied by the exchange rate', () => {
    expect(normalizeToMXN(100, 20)).toBe(2000);
    expect(normalizeToMXN('100', '20')).toBe(2000);
  });

  it('should default exchange rate to 1.0 if not provided', () => {
    expect(normalizeToMXN(100)).toBe(100);
  });

  it('should handle zero amounts', () => {
    expect(normalizeToMXN(0, 20)).toBe(0);
  });
});

describe('calculateCashBasisSummary with Currency Normalization', () => {
  it('should normalize amounts to MXN using the provided exchange rate', () => {
    const allocations = [
      {
        amountAllocated: '100.00', // 100 USD
        exchangeRate: '20.00', // @ 20 MXN/USD
        invoice: {
          total: '100.00',
          subtotal: '90.00',
          taxes: [
            {
              taxType: 'transferred',
              taxCode: '002', // IVA
              rate: '0.111111',
              amount: '10.00',
            }
          ]
        },
      },
    ];

    // Expected:
    // Total Paid: 100 * 20 = 2000 MXN
    // Subtotal: 90 * 20 = 1800 MXN
    // Taxes: 10 * 20 = 200 MXN

    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 2000,
      subtotalPaid: 1800,
      taxesPaid: 200,
      withholdingsPaid: 0,
      taxBreakdown: [
        {
          taxType: 'transferred',
          taxCode: '002',
          rate: '0.111111',
          amount: 200,
        }
      ]
    });
  });

  it('should handle mixed currency allocations (MXN and USD)', () => {
    const allocations = [
      {
        // Allocation 1: MXN (Implicit rate 1.0)
        amountAllocated: '1000.00',
        exchangeRate: '1.0',
        invoice: {
          total: '1160.00',
          subtotal: '1000.00',
          taxes: [{ taxType: 'transferred', taxCode: '002', rate: '0.16', amount: '160.00' }]
        },
      },
      {
        // Allocation 2: USD (Rate 20.0)
        amountAllocated: '50.00', // 50 USD = 1000 MXN
        exchangeRate: '20.00',
        invoice: {
          total: '58.00', // 50 sub + 8 tax
          subtotal: '50.00',
          taxes: [{ taxType: 'transferred', taxCode: '002', rate: '0.16', amount: '8.00' }]
        },
      },
    ];

    // Calc for Alloc 1 (MXN):
    // Ratio: 1000/1160 = 0.862... wait, simpler: I'll simulate a full payment for clarity in this test logic or stick to the function's logic.
    // Let's adjust inputs to be "full payments" to avoid ratio math confusion in this specific test, or just trust the ratio.
    // Alloc 1 is partial: 1000 paid of 1160 total.
    // Ratio 1 = 1000/1160 = 0.8620689655
    // Subtotal 1 = 1000 * 0.862... = 862.07
    // Tax 1 = 160 * 0.862... = 137.93
    // Total 1 = 1000
    
    // Alloc 2 is partial: 50 paid of 58 total.
    // Ratio 2 = 50/58 = 0.8620689655
    // Subtotal 2 (USD) = 50 * 0.862... = 43.10 USD
    // Tax 2 (USD) = 8 * 0.862... = 6.90 USD
    // Total 2 (USD) = 50 USD
    
    // Normalized Alloc 2 (MXN):
    // Total = 50 * 20 = 1000
    // Subtotal = 43.10 * 20 = 862.00
    // Tax = 6.90 * 20 = 138.00
    
    // Grand Total:
    // Total Paid = 1000 + 1000 = 2000
    // Subtotal = 862.068... + 862.068... = 1724.137... -> 1724.14
    // Taxes = 137.931... + 137.931... = 275.862... -> 275.86

    const result = calculateCashBasisSummary(allocations as any);
    
    expect(result.totalPaid).toBeCloseTo(2000.00, 2);
    expect(result.subtotalPaid).toBeCloseTo(1724.14, 2);
    expect(result.taxesPaid).toBeCloseTo(275.86, 2);
  });
});
