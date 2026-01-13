/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteBreadcrumb } from './site-breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import * as useMobileHook from '@/hooks/use-mobile';

jest.mock('@/hooks/use-breadcrumbs');
jest.mock('@/hooks/use-mobile');

describe('SiteBreadcrumb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMobileHook.useIsMobile as jest.Mock).mockReturnValue(false);
  });

  it('should return null if there is only one item (Dashboard)', () => {
    (useBreadcrumbs as jest.Mock).mockReturnValue([{ label: 'Dashboard', href: '/', active: true }]);
    const { container } = render(<SiteBreadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it('should render breadcrumb items', () => {
    (useBreadcrumbs as jest.Mock).mockReturnValue([
      { label: 'Dashboard', href: '/', active: false },
      { label: 'Facturas', href: '/invoices', active: true },
    ]);
    render(<SiteBreadcrumb />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Facturas')).toBeInTheDocument();
  });

  it('should render ellipsis on mobile with many items', () => {
    (useMobileHook.useIsMobile as jest.Mock).mockReturnValue(true);
    (useBreadcrumbs as jest.Mock).mockReturnValue([
      { label: 'Dashboard', href: '/', active: false },
      { label: 'Level 1', href: '/1', active: false },
      { label: 'Level 2', href: '/1/2', active: false },
      { label: 'Level 3', href: '/1/2/3', active: true },
    ]);
    render(<SiteBreadcrumb />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Level 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Level 2')).not.toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument(); // sr-only text in BreadcrumbEllipsis
  });
});