/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyModeProvider, usePrivacyMode } from './privacy-mode-provider';

// Mock the safe-action hooks to avoid ESM issues in Jest
jest.mock('next-safe-action/hooks', () => ({
  useAction: jest.fn(() => ({
    execute: jest.fn(),
  })),
}));

jest.mock('@/lib/privacy-mode', () => ({
  getPrivacyMode: jest.fn(),
}));

jest.mock('@/actions/privacy-mode', () => ({
  togglePrivacyModeAction: jest.fn(),
}));

// Helper component to test the hook
const TestComponent = () => {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacyMode();
  return (
    <div>
      <span data-testid="status">{isPrivacyMode ? 'ON' : 'OFF'}</span>
      <button onClick={() => togglePrivacyMode(!isPrivacyMode)}>Toggle</button>
    </div>
  );
};

describe('PrivacyModeProvider', () => {
  it('should initialize with value from cookie via props', () => {
    render(
      <PrivacyModeProvider initialEnabled={true}>
        <TestComponent />
      </PrivacyModeProvider>
    );
    expect(screen.getByTestId('status')).toHaveTextContent('ON');
  });

  it('should toggle privacy mode', async () => {
    render(
      <PrivacyModeProvider initialEnabled={false}>
        <TestComponent />
      </PrivacyModeProvider>
    );
    
    expect(screen.getByTestId('status')).toHaveTextContent('OFF');
    
    const button = screen.getByText('Toggle');
    await act(async () => {
      button.click();
    });
    
    expect(screen.getByTestId('status')).toHaveTextContent('ON');
  });
});