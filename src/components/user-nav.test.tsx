/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserNav } from './user-nav';

// Mock Portal to render content inline for testing
jest.mock('@radix-ui/react-dropdown-menu', () => {
  const actual = jest.requireActual('@radix-ui/react-dropdown-menu');
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('UserNav', () => {
  it('should render user info', () => {
    render(<UserNav />);
    
    const trigger = screen.getByLabelText('Menú de usuario');
    fireEvent.click(trigger);

    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('demo@example.com')).toBeInTheDocument();
  });
});
