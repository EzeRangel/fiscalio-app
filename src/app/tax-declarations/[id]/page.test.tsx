/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaxDeclarationReviewPage from './page';
import { getTaxDeclarationById } from '@/data/tax-declarations';
import { getDeclarationInvoicesById } from '@/data/declaration-invoices';
import { getActiveOrganizationId } from '@/lib/session';

// Mock the AuditLogPane component
jest.mock('@/components/audit-log-pane', () => ({
  AuditLogPane: jest.fn(() => <div data-testid="audit-log-pane"></div>),
}));

// Mock data fetching functions
jest.mock('@/data/tax-declarations', () => ({
  getTaxDeclarationById: jest.fn(),
}));
jest.mock('@/data/declaration-invoices', () => ({
  getDeclarationInvoicesById: jest.fn(),
}));
jest.mock('@/lib/session', () => ({
  getActiveOrganizationId: jest.fn(),
}));

// Mock next/navigation notFound
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

describe('TaxDeclarationReviewPage', () => {
  const mockDeclaration = {
    id: 1,
    organizationId: 1,
    fiscalPeriod: new Date(),
    declarationType: 'monthly',
    totalIncome: '1000.00',
    deductibleExpenses: '200.00',
    isrBase: '800.00',
    isrRate: '0.10',
    isrCalculated: '80.00',
    isrWithheld: '10.00',
    isrProvisional: '5.00',
    isrBalance: '65.00',
    ivaCharged: '160.00',
    ivaCreditable: '30.00',
    ivaBalance: '130.00',
    status: 'draft',
    taxRegime: '612',
    acknowledgmentNumber: null,
    filedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockInvoices = [
    {
      id: 1,
      uuid: 'uuid1',
      invoiceSeries: 'A',
      invoiceNumber: '1',
      issuerName: 'Issuer 1',
      receiverName: 'Receiver 1',
      total: '100.00',
      date: new Date().toISOString(),
      type: 'income',
      auditLogs: [],
      organizationId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    (getActiveOrganizationId as jest.Mock).mockResolvedValue(1);
    (getTaxDeclarationById as jest.Mock).mockResolvedValue(mockDeclaration);
    (getDeclarationInvoicesById as jest.Mock).mockResolvedValue(mockInvoices);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render AuditLogPane when declaration exists', async () => {
    render(
      await TaxDeclarationReviewPage({
        params: Promise.resolve({ id: '1' }),
      })
    );

    await waitFor(() => {
      expect(screen.getByTestId('audit-log-pane')).toBeInTheDocument();
    });
  });

  it('should call notFound when declarationId is invalid', async () => {
    render(
      await TaxDeclarationReviewPage({
        params: Promise.resolve({ id: 'invalid' }),
      })
    );

    await waitFor(() => {
      expect(require('next/navigation').notFound).toHaveBeenCalled();
    });
  });

  it('should call notFound when declaration is not found', async () => {
    (getTaxDeclarationById as jest.Mock).mockResolvedValue(null);

    render(
      await TaxDeclarationReviewPage({
        params: Promise.resolve({ id: '999' }),
      })
    );

    await waitFor(() => {
      expect(require('next/navigation').notFound).toHaveBeenCalled();
    });
  });
});
