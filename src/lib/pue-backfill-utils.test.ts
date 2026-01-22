import { backfillPuePayments } from './pue-backfill-utils';
import { payments, paymentAllocations } from '@/db/schema';

// Mock types
type MockDb = {
  select: jest.Mock;
  insert: jest.Mock;
  transaction: jest.Mock;
  query: {
    invoices: {
        findMany: jest.Mock;
    }
  }
};

type MockAuditService = {
  log: jest.Mock;
};

describe('backfillPuePayments', () => {
  let mockDb: MockDb;
  let mockAuditService: MockAuditService;
  let mockInsertValues: jest.Mock;
  let mockInsertReturning: jest.Mock;

  beforeEach(() => {
    mockInsertReturning = jest.fn().mockResolvedValue([{ id: 100 }]);
    mockInsertValues = jest.fn().mockReturnValue({
        returning: mockInsertReturning
    });

    mockDb = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnValue({
          values: mockInsertValues
      }),
      transaction: jest.fn((callback) => callback(mockDb)),
      query: {
          invoices: {
              findMany: jest.fn()
          }
      }
    } as unknown as MockDb;

    mockAuditService = {
      log: jest.fn(),
    };
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

    await backfillPuePayments(mockDb as any, mockAuditService as any);

    // Verify invoice query
    expect(mockDb.query.invoices.findMany).toHaveBeenCalledWith({
      where: expect.anything(),
      with: {
        allocations: true,
      },
    });

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
    expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
            paymentId: 100,
            invoiceId: 1,
            amountAllocated: '1160.00'
        })
    );

    // Verify audit log
    expect(mockAuditService.log).toHaveBeenCalledTimes(2); // Payment + Allocation
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

    await backfillPuePayments(mockDb as any, mockAuditService as any);

    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditService.log).not.toHaveBeenCalled();
  });
  
    it('should skip non-PUE invoices (filtered by query)', async () => {
      mockDb.query.invoices.findMany.mockResolvedValue([]);

      await backfillPuePayments(mockDb as any, mockAuditService as any);

      expect(mockDb.insert).not.toHaveBeenCalled();
    });
});