import Cookies from 'js-cookie';
import { getPrivacyMode, setPrivacyMode, PRIVACY_MODE_COOKIE } from './privacy-mode';

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

describe('Privacy Mode Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get privacy mode as false by default', () => {
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    expect(getPrivacyMode()).toBe(false);
  });

  it('should get privacy mode as true when cookie is "true"', () => {
    (Cookies.get as jest.Mock).mockReturnValue('true');
    expect(getPrivacyMode()).toBe(true);
  });

  it('should get privacy mode as false when cookie is "false"', () => {
    (Cookies.get as jest.Mock).mockReturnValue('false');
    expect(getPrivacyMode()).toBe(false);
  });

  it('should set privacy mode cookie', () => {
    setPrivacyMode(true);
    expect(Cookies.set).toHaveBeenCalledWith(PRIVACY_MODE_COOKIE, 'true', expect.any(Object));
    
    setPrivacyMode(false);
    expect(Cookies.set).toHaveBeenCalledWith(PRIVACY_MODE_COOKIE, 'false', expect.any(Object));
  });
});
