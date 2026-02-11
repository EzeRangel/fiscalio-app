import {
  calculateCashBasisSummary,
  normalizeToMXN,
  getEffectiveExchangeRate,
  getTaxClassification,
  getPeriodDateRange,
} from "./cash-basis-utils";

describe('normalizeToMXN', () => {
  it('should return the same amount if exchangeRate is 1.0 or null', () => {
    expect(normalizeToMXN(100)).toBe(100);
    expect(normalizeToMXN('100', 1.0)).toBe(100);
    expect(normalizeToMXN(100, null)).toBe(100);
  });

  it('should multiply amount by exchangeRate', () => {
    expect(normalizeToMXN(100, 20.5)).toBe(2050);
    expect(normalizeToMXN('100.50', '20.00')).toBe(2010);
  });

  it('should handle zero or invalid amounts/rates', () => {
    expect(normalizeToMXN(0, 20)).toBe(0);
    expect(normalizeToMXN(100, 0)).toBe(0);
    expect(normalizeToMXN('invalid', 20)).toBe(0);
  });
});

describe('getEffectiveExchangeRate', () => {
  it('should return 1.0 for MXN even if providedRate is different (though it shouldnt be)', () => {
    expect(getEffectiveExchangeRate('MXN', '20.0', '19.0')).toBe('20');
  });

  it('should return providedRate if currency is USD and providedRate is not 1.0', () => {
    expect(getEffectiveExchangeRate('USD', '20.5', '19.0')).toBe('20.5');
  });

  it('should fallback to invoiceRate if currency is USD and providedRate is effectively 1.0', () => {
    expect(getEffectiveExchangeRate('USD', '1.0', '19.5')).toBe('19.5');
    expect(getEffectiveExchangeRate('USD', 1.0000001, '19.5')).toBe('19.5');
  });

  it('should return providedRate if providedRate is not 1.0, even if invoiceRate exists', () => {
    expect(getEffectiveExchangeRate('USD', '20.0', '19.5')).toBe('20');
  });
});

describe('getTaxClassification', () => {
  it('should return correct category and multiplier for each type', () => {
    expect(getTaxClassification('income')).toEqual({ category: 'income', multiplier: 1 });
    expect(getTaxClassification('credit_note_issued')).toEqual({ category: 'income', multiplier: -1 });
    expect(getTaxClassification('expense')).toEqual({ category: 'expense', multiplier: 1 });
    expect(getTaxClassification('credit_note_received')).toEqual({ category: 'expense', multiplier: -1 });
    expect(getTaxClassification('other')).toEqual({ category: 'other', multiplier: 0 });
  });
});

describe('getPeriodDateRange', () => {
  it('should return correct startDate and endDate for a fiscal period', () => {
    const { startDate, endDate } = getPeriodDateRange('2026-01');
    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(0); // Jan
    expect(startDate.getDate()).toBe(1);

    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(1); // Feb
    expect(endDate.getDate()).toBe(1);
  });
});

describe('calculateCashBasisSummary', () => {
  it('should return zeros for empty allocations', () => {
    const result = calculateCashBasisSummary([]);
    expect(result).toEqual({
      totalPaid: 0,
      subtotalPaid: 0,
      taxesPaid: 0,
      withholdingsPaid: 0,
      taxBreakdown: [],
    });
  });

  it('should calculate proportional amounts and tax breakdown for a single partial payment', () => {
    const allocations = [
      {
        amountAllocated: '580.00',
        invoice: {
          total: '1160.00',
          subtotal: '1000.00',
          taxes: [
            {
              taxType: 'transferred',
              taxCode: '002', // IVA
              rate: '0.160000',
              amount: '160.00',
            }
          ]
        },
      },
    ];
    // Ratio = 0.5
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 580,
      subtotalPaid: 500,
      taxesPaid: 80,
      withholdingsPaid: 0,
      taxBreakdown: [
        {
          taxType: 'transferred',
          taxCode: '002',
          rate: '0.160000',
          amount: 80,
        }
      ]
    });
  });

  it('should handle mixed tax rates and withholdings', () => {
    // Invoice: 
    // Subtotal: 1000
    // + IVA 16%: 160
    // - ISR Ret 10%: 100
    // - IVA Ret 10.66%: 106.67
    // Total: 1000 + 160 - 100 - 106.67 = 953.33
    
    // Payment: 476.67 (approx 50%)
    
    const allocations = [
      {
        amountAllocated: '476.665', 
        invoice: {
          total: '953.33',
          subtotal: '1000.00',
          taxes: [
            { taxType: 'transferred', taxCode: '002', rate: '0.160000', amount: '160.00' },
            { taxType: 'withheld', taxCode: '001', rate: '0.100000', amount: '100.00' }, // ISR
            { taxType: 'withheld', taxCode: '002', rate: '0.106666', amount: '106.67' }, // IVA Ret
          ]
        },
      },
    ];

    const result = calculateCashBasisSummary(allocations as any);
    
    // Check totals
    expect(result.totalPaid).toBeCloseTo(476.67, 2);
    expect(result.subtotalPaid).toBeCloseTo(500.00, 2);
    expect(result.taxesPaid).toBeCloseTo(80.00, 2);
    expect(result.withholdingsPaid).toBeCloseTo(103.34, 2); // 50 + 53.335

    // Check breakdown
    expect(result.taxBreakdown).toHaveLength(3);
    
    const iva = result.taxBreakdown.find(t => t.taxCode === '002' && t.taxType === 'transferred');
    expect(iva?.amount).toBeCloseTo(80.00, 2);

    const isrRet = result.taxBreakdown.find(t => t.taxCode === '001' && t.taxType === 'withheld');
    expect(isrRet?.amount).toBeCloseTo(50.00, 2);
    
    const ivaRet = result.taxBreakdown.find(t => t.taxCode === '002' && t.taxType === 'withheld');
    expect(ivaRet?.amount).toBeCloseTo(53.34, 2);
  });

  it('should use fallback totals if granular taxes are missing', () => {
    const allocations = [
      {
        amountAllocated: '580.00',
        invoice: {
          total: '1160.00',
          subtotal: '1000.00',
          totalTaxes: '160.00',
          totalWithholdings: '0.00',
          taxes: [] // Empty
        },
      },
    ];
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 580,
      subtotalPaid: 500,
      taxesPaid: 80,
      withholdingsPaid: 0,
      taxBreakdown: []
    });
  });

  it('should handle null values in fallback logic', () => {
    const allocations = [
      {
        amountAllocated: '100.00',
        invoice: {
          total: '100.00',
          subtotal: '100.00',
          totalTaxes: null,
          totalWithholdings: undefined,
          taxes: undefined // Missing
        },
      },
    ];
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 100,
      subtotalPaid: 100,
      taxesPaid: 0,
      withholdingsPaid: 0,
      taxBreakdown: []
    });
  });
});
