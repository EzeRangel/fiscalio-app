import Cookies from 'js-cookie';

export const PRIVACY_MODE_COOKIE = 'privacy-mode';

export function getPrivacyMode(): boolean {
  const value = Cookies.get(PRIVACY_MODE_COOKIE);
  return value === 'true';
}

export function setPrivacyMode(enabled: boolean): void {
  Cookies.set(PRIVACY_MODE_COOKIE, String(enabled), {
    path: '/',
    // No 'expires' makes it a session cookie
    sameSite: 'lax',
  });
}
