/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyModeToggle } from './privacy-mode-toggle';
import { usePrivacyMode } from './providers/privacy-mode-provider';
import { useSidebar } from '@/components/ui/sidebar';

jest.mock('./providers/privacy-mode-provider', () => ({
  usePrivacyMode: jest.fn(),
}));

jest.mock('@/components/ui/sidebar', () => ({
  useSidebar: jest.fn(),
  SidebarFooter: ({ children, className }: { children: React.ReactNode, className?: string }) => <div data-testid="sidebar-footer" className={className}>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PrivacyModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render expanded view correctly', () => {
    (usePrivacyMode as jest.Mock).mockReturnValue({
      isPrivacyMode: false,
      togglePrivacyMode: jest.fn(),
    });
    (useSidebar as jest.Mock).mockReturnValue({ state: 'expanded' });

    render(<PrivacyModeToggle />);

    expect(screen.getByText('Modo Privacidad')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should render collapsed view correctly', () => {
    (usePrivacyMode as jest.Mock).mockReturnValue({
      isPrivacyMode: false,
      togglePrivacyMode: jest.fn(),
    });
    (useSidebar as jest.Mock).mockReturnValue({ state: 'collapsed' });

    render(<PrivacyModeToggle />);

    // In collapsed view, we have a button (from SidebarMenuButton)
    expect(screen.getByRole('button')).toBeInTheDocument();
    // And tooltip content (mocked to be visible)
    expect(screen.getByText('Modo Privacidad: Desactivado')).toBeInTheDocument();
  });

  it('should toggle privacy mode when clicked in expanded view', () => {
    const togglePrivacyMode = jest.fn();
    (usePrivacyMode as jest.Mock).mockReturnValue({
      isPrivacyMode: false,
      togglePrivacyMode,
    });
    (useSidebar as jest.Mock).mockReturnValue({ state: 'expanded' });

    render(<PrivacyModeToggle />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(togglePrivacyMode).toHaveBeenCalledWith(true);
  });
});
