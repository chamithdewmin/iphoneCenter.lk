/**
 * API helper – only tokens are stored in localStorage; user data comes from the server.
 * Pattern: same as Yala Wild Tusker – getApiUrl() = backend origin, getApiBaseUrl() = backend + /api.
 */

/** Backend origin, no trailing slash (e.g. https://backend.iphonecenter.logozodev.com or http://localhost:5000) */
export const getApiUrl = () => (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Backend API base (e.g. https://backend.iphonecenter.logozodev.com/api). Use with paths like getApiBaseUrl() + '/customers'. */
export const getApiBaseUrl = () => {
  const base = getApiUrl();
  return base ? `${base}/api` : '/api';
};

/** Read access token from localStorage (only token is stored, not user data) */
export const getAccessToken = () => localStorage.getItem('accessToken');

/** Read refresh token from localStorage */
export const getRefreshToken = () => localStorage.getItem('refreshToken');

/** Save only tokens to localStorage */
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

/** Clear tokens from localStorage */
export const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

/**
 * Call refresh endpoint and return new access token or null.
 */
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const base = getApiUrl();
  const url = base ? `${base}/api/auth/refresh` : '/api/auth/refresh';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.success && data?.data?.accessToken) {
      setTokens(data.data.accessToken, refreshToken);
      return data.data.accessToken;
    }
  } catch (_) {}
  return null;
}

/**
 * Authenticated fetch – adds Bearer token from localStorage.
 * On 401, tries to refresh the access token once and retries the request.
 * Tokens are stored in localStorage so login persists (production-style).
 */
export const authFetch = async (path, options = {}, retried = false) => {
  const base = getApiUrl();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && !retried) {
    const newToken = await refreshAccessToken();
    if (newToken) return authFetch(path, options, true);
    clearTokens();
    return { ok: false, status: 401, data: null };
  }
  if (res.status === 401) {
    clearTokens();
    return { ok: false, status: 401, data: null };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};
