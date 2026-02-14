import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authFetch, setTokens, clearTokens, getAccessToken } from '@/lib/api';

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

  const login = async (emailOrUsername, password) => {
    try {
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const url = `${base}/api/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: String(emailOrUsername || '').trim(), password: password ? String(password) : '' }),
      });
      const data = await res.json().catch(() => ({}));

      if (!data.success || !data.data?.accessToken) {
        const message = data.message || (Array.isArray(data.errors) && data.errors.length
          ? data.errors.map((e) => e.message).join('. ')
          : null) || 'Invalid email or password. Please try again.';
        return { success: false, error: message };
      }

      const { accessToken, refreshToken, user: userData } = data.data;
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
      return { success: true };
    } catch (err) {
      const message = err.message || 'Network error';
      const isNetwork = message.includes('fetch') || message.includes('Network') || message === 'Failed to fetch';
      return { success: false, error: isNetwork ? 'Cannot connect to server. Check your connection and try again.' : message };
    }
  };

  const logout = () => {
    clearTokens();
    localStorage.removeItem('auth'); // legacy: remove old full-auth storage
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
