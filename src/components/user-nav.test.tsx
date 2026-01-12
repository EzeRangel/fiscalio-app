/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserNav } from './user-nav';
import { usePrivacyMode } from './providers/privacy-mode-provider';

jest.mock('./providers/privacy-mode-provider', () => ({
  usePrivacyMode: jest.fn(),
}));

// Mock Portal to render content inline for testing
jest.mock('@radix-ui/react-dropdown-menu', () => {
  const actual = jest.requireActual('@radix-ui/react-dropdown-menu');
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('UserNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the toggle correctly based on privacy mode state', () => {
    (usePrivacyMode as jest.Mock).mockReturnValue({
      isPrivacyMode: false,
      togglePrivacyMode: jest.fn(),
    });

    render(<UserNav />);
    
    const trigger = screen.getByLabelText('Menú de usuario');
    fireEvent.click(trigger);

    expect(screen.getByText('Modo Privacidad')).toBeInTheDocument();
    const toggle = screen.getByRole('switch');
    expect(toggle).not.toBeChecked();
  });

  it('should call togglePrivacyMode when switch is clicked', () => {
    const togglePrivacyMode = jest.fn();
    (usePrivacyMode as jest.Mock).mockReturnValue({
      isPrivacyMode: false,
      togglePrivacyMode,
    });

    render(<UserNav />);
    
    const trigger = screen.getByLabelText('Menú de usuario');
    fireEvent.click(trigger);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(togglePrivacyMode).toHaveBeenCalledWith(true);
  });
});