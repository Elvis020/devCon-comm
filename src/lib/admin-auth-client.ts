export const ADMIN_LOGIN_COOLDOWN_STORAGE_KEY = 'devcon-admin-login-cooldown-until';

export interface AdminAuthResponsePayload {
  message: string;
  retryAfterMs: number | null;
}

export async function readAdminAuthResponsePayload(response: Response): Promise<AdminAuthResponsePayload> {
  try {
    const data = await response.json();
    return {
      message: typeof data.error === 'string' ? data.error : 'Unable to sign in',
      retryAfterMs: typeof data.retry_after_ms === 'number' ? data.retry_after_ms : null,
    };
  } catch {
    return {
      message: 'Unable to sign in. Please check your connection and try again.',
      retryAfterMs: null,
    };
  }
}

export function clearAdminLoginCooldown() {
  window.localStorage.removeItem(ADMIN_LOGIN_COOLDOWN_STORAGE_KEY);
}
