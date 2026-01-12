/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyBlur } from './privacy-blur';
import { usePrivacyMode } from './providers/privacy-mode-provider';

jest.mock('./providers/privacy-mode-provider', () => ({
  usePrivacyMode: jest.fn(),
}));

describe('PrivacyBlur', () => {
  it('should render children normally when privacy mode is OFF', () => {
    (usePrivacyMode as jest.Mock).mockReturnValue({ isPrivacyMode: false });
    
    render(<PrivacyBlur>Secret Data</PrivacyBlur>);
    
    const element = screen.getByText('Secret Data');
    expect(element).toBeInTheDocument();
    expect(element).not.toHaveClass('privacy-blur');
  });

  it('should apply privacy-blur class when privacy mode is ON', () => {
    (usePrivacyMode as jest.Mock).mockReturnValue({ isPrivacyMode: true });
    
    render(<PrivacyBlur>Secret Data</PrivacyBlur>);
    
    const element = screen.getByText('Secret Data');
    expect(element).toHaveClass('privacy-blur');
  });

  it('should apply privacy-blur class when active prop is true regardless of global state', () => {
    (usePrivacyMode as jest.Mock).mockReturnValue({ isPrivacyMode: false });
    
    render(<PrivacyBlur active={true}>Secret Data</PrivacyBlur>);
    
    const element = screen.getByText('Secret Data');
    expect(element).toHaveClass('privacy-blur');
  });
});
