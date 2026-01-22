import { backfillPuePayments } from './pue-backfill-utils';
import { payments, paymentAllocations, invoices } from '@/db/schema';
import { logAction } from '@/lib/audit-service';

jest.mock('@/lib/audit-service', () => ({
  logAction: jest.fn(),
}));

// Mock types
type MockDb = {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  transaction: jest.Mock;
  query: {
    invoices: {
        findMany: jest.Mock;
    }
  }
};

describe('backfillPuePayments', () => {
  let mockDb: MockDb;
  let mockInsertValues: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdateWhere: jest.Mock;

  beforeEach(() => {
    mockInsertReturning = jest.fn().mockResolvedValue([{ id: 100 }]);
    mockInsertValues = jest.fn().mockReturnValue({
        returning: mockInsertReturning
    });

    mockUpdateWhere = jest.fn();
    mockUpdateSet = jest.fn().mockReturnValue({
        where: mockUpdateWhere
    });

    mockDb = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnValue({
          values: mockInsertValues
      }),
      update: jest.fn().mockReturnValue({
          set: mockUpdateSet
      }),
      transaction: jest.fn((callback) => callback(mockDb)),
      query: {
          invoices: {
              findMany: jest.fn()
          }
      }
    } as unknown as MockDb;

    (logAction as jest.Mock).mockClear();
  });

  it('should identify PUE invoices with no payment allocations', async () => {
    // Setup mock data
    const mockInvoices = [
      {
        id: 1,
        organizationId: 1,
        partnerId: 2,
        paymentMethod: 'PUE',
        invoiceType: 'income',
        total: '1160.00',
        currency: 'MXN',
        invoiceDate: new Date('2023-01-01'),
        allocations: [], // No allocations
      },
    ];

    mockDb.query.invoices.findMany.mockResolvedValue(mockInvoices);

    await backfillPuePayments(mockDb as any);

    // Verify invoice query
    expect(mockDb.query.invoices.findMany).toHaveBeenCalledWith(expect.objectContaining({
      with: {
        allocations: true,
      },
    }));

    // Verify payment creation
    expect(mockDb.insert).toHaveBeenCalledWith(payments);
    expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
            paymentType: 'income',
            amount: '1160.00'
        })
    );
    
    // Verify allocation creation
    expect(mockDb.insert).toHaveBeenCalledWith(paymentAllocations);
    
    // Verify invoice update
    expect(mockDb.update).toHaveBeenCalledWith(invoices);
    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({
        paymentStatus: 'paid'
    }));

    // Verify logAction
    expect(logAction).toHaveBeenCalledTimes(2); 
    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'payment',
        action: 'created'
    }));
  });

  it('should skip PUE invoices that already have allocations', async () => {
      const mockInvoices = [
      {
        id: 2,
        organizationId: 1,
        partnerId: 2,
        paymentMethod: 'PUE',
        total: '100.00',
        allocations: [{ id: 1 }], // Has allocations
      },
    ];
    
    mockDb.query.invoices.findMany.mockResolvedValue(mockInvoices);

    await backfillPuePayments(mockDb as any);

    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(logAction).not.toHaveBeenCalled();
  });
});
