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

// Production-style: tokens stored in localStorage so login persists across refresh and browser close
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'iphone_center_access_token',
  REFRESH_TOKEN: 'iphone_center_refresh_token',
};

function migrateOldTokens() {
  try {
    const oldAccess = localStorage.getItem('accessToken');
    const oldRefresh = localStorage.getItem('refreshToken');
    if (oldAccess && !localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, oldAccess);
      localStorage.removeItem('accessToken');
    }
    if (oldRefresh && !localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, oldRefresh);
      localStorage.removeItem('refreshToken');
    }
  } catch (_) {}
}

/** Read access token from localStorage */
export const getAccessToken = () => {
  try {
    let token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      migrateOldTokens();
      token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
    return token;
  } catch (_) {
    return null;
  }
};

/** Read refresh token from localStorage */
export const getRefreshToken = () => {
  try {
    let token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!token) {
      migrateOldTokens();
      token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return token;
  } catch (_) {
    return null;
  }
};

/** Save tokens to localStorage (called on login – persists until logout or expiry) */
export const setTokens = (accessToken, refreshToken) => {
  try {
    if (accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } catch (e) {
    console.warn('Could not save tokens to localStorage', e?.message);
  }
};

/** Clear tokens from localStorage (called on logout or when refresh fails) */
export const clearTokens = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (_) {}
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
