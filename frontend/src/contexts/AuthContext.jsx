import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authFetch, setTokens, clearTokens, getAccessToken, getRefreshToken, getApiUrl, setOnUnauthorized } from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Fetch current user from API (main data stays on server, not in browser) */
  const fetchUser = useCallback(async () => {
    const { ok, status, data } = await authFetch('/api/auth/profile');
    if (ok && data?.success && data?.data) {
      const u = data.data;
      setUser({
        id: u.id,
        email: u.email,
        name: u.full_name || u.username,
        username: u.username,
        role: u.role,
        branchId: u.branch_id,
        branchName: u.branch_name,
        branchCode: u.branch_code,
      });
      setIsAuthenticated(true);
      return true;
    }
    if (status === 401) clearTokens();
    return false;
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  // When any authFetch gets 401 and clears tokens, log out in the UI so user is sent to login
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setIsAuthenticated(false);
    });
    return () => setOnUnauthorized(null);
  }, []);

  // Periodic session check: if admin deletes this user (or user deactivated), get 401 and redirect to login without refresh
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const intervalMs = 30 * 1000; // 30 seconds
    const interval = setInterval(async () => {
      const { ok, status } = await authFetch('/api/auth/profile');
      if (!ok && status === 401) {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const login = async (emailOrUsername, password) => {
    try {
      const base = getApiUrl();
      const url = base ? `${base}/api/auth/login` : '/api/auth/login';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: String(emailOrUsername || '').trim(), password: password ? String(password) : '' }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 405) {
        return {
          success: false,
          error: 'Login request reached the wrong server (405). Set VITE_API_URL to your backend URL (e.g. https://backend.iphonecenter.lk) when building the frontend, then redeploy.',
        };
      }

      if (!data.success || !data.data?.accessToken) {
        const message = data.message || (Array.isArray(data.errors) && data.errors.length
          ? data.errors.map((e) => e.message).join('. ')
          : null) || 'Invalid email or password. Please try again.';
        return { success: false, error: message };
      }

      const { accessToken, refreshToken, user: userData, adminSecurityAlert } = data.data;
      setTokens(accessToken, refreshToken);
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.fullName || userData.username,
        username: userData.username,
        role: userData.role,
        branchId: userData.branchId,
        branchName: userData.branchName,
        branchCode: userData.branchCode,
      });
      setIsAuthenticated(true);
      return { success: true, adminSecurityAlert };
    } catch (err) {
      const message = err.message || 'Network error';
      const isNetwork = message.includes('fetch') || message.includes('Network') || message === 'Failed to fetch';
      return { success: false, error: isNetwork ? 'Cannot connect to server. Check your connection and try again.' : message };
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();
    if (refreshToken || accessToken) {
      try {
        const base = getApiUrl();
        const url = base ? `${base}/api/auth/logout` : '/api/auth/logout';
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
          body: JSON.stringify({ refreshToken: refreshToken || undefined }),
        });
      } catch (_) {}
    }
    clearTokens();
    localStorage.removeItem('auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
