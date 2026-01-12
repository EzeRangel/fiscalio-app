import { togglePrivacyMode } from './privacy-mode';
import { cookies } from 'next/headers';

// Mock the safe-action client to avoid ESM issues in Jest
jest.mock('@/lib/safe-action', () => ({
  actionClient: {
    inputSchema: jest.fn().mockReturnThis(),
    action: jest.fn((fn) => fn),
  },
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Privacy Mode Server Actions', () => {
  it('should toggle privacy mode to true', async () => {
    const mockCookies = {
      set: jest.fn(),
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookies);

    // When calling a safe action directly in this mocked setup:
    // togglePrivacyMode is now the function passed to .action()
    await (togglePrivacyMode as any)({ parsedInput: { enabled: true } });

    expect(mockCookies.set).toHaveBeenCalledWith('privacy-mode', 'true', expect.any(Object));
  });

  it('should toggle privacy mode to false', async () => {
    const mockCookies = {
      set: jest.fn(),
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookies);

    await (togglePrivacyMode as any)({ parsedInput: { enabled: false } });

    expect(mockCookies.set).toHaveBeenCalledWith('privacy-mode', 'false', expect.any(Object));
  });
});