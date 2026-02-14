/**
 * API helper – only tokens are stored in localStorage; user data comes from the server.
 */

const getApiUrl = () => import.meta.env.VITE_API_URL || '';

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
 * Authenticated fetch – adds Bearer token from localStorage.
 * Use for all API calls that need auth.
 */
export const authFetch = async (path, options = {}) => {
  const base = getApiUrl().replace(/\/$/, '');
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearTokens();
    return { ok: false, status: 401, data: null };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};
