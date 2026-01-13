/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useBreadcrumbs } from './use-breadcrumbs';
import { usePathname } from 'next/navigation';

// Mock usePathname
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('useBreadcrumbs', () => {
  it('should always start with Dashboard', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current[0]).toEqual({
      label: 'Dashboard',
      href: '/',
      active: true,
    });
  });

  it('should generate breadcrumbs from path segments', () => {
    (usePathname as jest.Mock).mockReturnValue('/section/subsection');
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(3);
    expect(result.current[0].label).toBe('Dashboard');
    expect(result.current[1]).toEqual({
      label: 'section',
      href: '/section',
      active: false,
    });
    expect(result.current[2]).toEqual({
      label: 'subsection',
      href: '/section/subsection',
      active: true,
    });
  });

  it('should use friendly names from config', () => {
    // We rely on 'invoices' mapping to 'Facturas' in our config
    (usePathname as jest.Mock).mockReturnValue('/invoices');
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current[1].label).toBe('Facturas');
  });

  it('should handle IDs correctly', () => {
     (usePathname as jest.Mock).mockReturnValue('/invoices/123');
     const { result } = renderHook(() => useBreadcrumbs());

     expect(result.current[2].label).toBe('123');
  });
});
