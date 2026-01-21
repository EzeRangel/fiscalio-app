import { calculateCashBasisSummary } from './cash-basis-utils';

describe('calculateCashBasisSummary', () => {
  it('should return zeros for empty allocations', () => {
    const result = calculateCashBasisSummary([]);
    expect(result).toEqual({
      totalPaid: 0,
      subtotalPaid: 0,
      taxesPaid: 0,
      withholdingsPaid: 0,
    });
  });

  it('should calculate proportional amounts for a single partial payment', () => {
    const allocations = [
      {
        amountAllocated: '580.00',
        invoice: {
          total: '1160.00',
          subtotal: '1000.00',
          totalTaxes: '160.00',
          totalWithholdings: '0.00',
        },
      },
    ];
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 580,
      subtotalPaid: 500,
      taxesPaid: 80,
      withholdingsPaid: 0,
    });
  });

  it('should handle multiple allocations for different invoices', () => {
    const allocations = [
      {
        amountAllocated: '580.00',
        invoice: {
          total: '1160.00',
          subtotal: '1000.00',
          totalTaxes: '160.00',
          totalWithholdings: '0.00',
        },
      },
      {
        amountAllocated: '1000.00',
        invoice: {
          total: '1000.00',
          subtotal: '1000.00',
          totalTaxes: '0.00',
          totalWithholdings: '0.00',
        },
      },
    ];
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 1580,
      subtotalPaid: 1500,
      taxesPaid: 80,
      withholdingsPaid: 0,
    });
  });

  it('should handle withholdings correctly', () => {
    const allocations = [
      {
        amountAllocated: '100.00',
        invoice: {
          total: '1000.00',
          subtotal: '1100.00',
          totalTaxes: '100.00',
          totalWithholdings: '200.00',
        },
      },
    ];
    // Ratio = 100 / 1000 = 0.1
    // Subtotal = 1100 * 0.1 = 110
    // Taxes = 100 * 0.1 = 10
    // Withholdings = 200 * 0.1 = 20
    // Total check: 110 + 10 - 20 = 100 (Correct)
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 100,
      subtotalPaid: 110,
      taxesPaid: 10,
      withholdingsPaid: 20,
    });
  });

  it('should handle zero total invoice to avoid division by zero', () => {
    const allocations = [
      {
        amountAllocated: '0.00',
        invoice: {
          total: '0.00',
          subtotal: '0.00',
          totalTaxes: '0.00',
          totalWithholdings: '0.00',
        },
      },
    ];
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 0,
      subtotalPaid: 0,
      taxesPaid: 0,
      withholdingsPaid: 0,
    });
  });

  it('should handle null totalTaxes or totalWithholdings', () => {
    const allocations = [
      {
        amountAllocated: '100.00',
        invoice: {
          total: '100.00',
          subtotal: '100.00',
          totalTaxes: null,
          totalWithholdings: undefined,
        },
      },
    ];
    const result = calculateCashBasisSummary(allocations as any);
    expect(result).toEqual({
      totalPaid: 100,
      subtotalPaid: 100,
      taxesPaid: 0,
      withholdingsPaid: 0,
    });
  });
});
