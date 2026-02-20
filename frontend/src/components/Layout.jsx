import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CASHIER_ALLOWED_PATHS } from '@/constants/cashierPaths';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const adminSecurityAlert = location.state?.adminSecurityAlert;

  useEffect(() => {
    if (user?.role === 'cashier' && !CASHIER_ALLOWED_PATHS.has(pathname)) {
      navigate('/dashboard', { replace: true });
    }
    if (user?.role === 'manager' && pathname.startsWith('/reports')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.role, pathname, navigate]);

  const dismissAdminAlert = () => {
    navigate(pathname, { replace: true, state: {} });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[var(--sidebar-width,240px)] transition-all duration-200">
        {adminSecurityAlert && (
          <div
            role="alert"
            className="mx-4 mt-4 lg:mx-6 lg:mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 shadow-sm"
          >
            <div className="flex items-start gap-3 p-4">
              <span className="text-2xl flex-shrink-0" aria-hidden>🔐</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-200 text-sm uppercase tracking-wide mb-1">
                  Admin Security Alert
                </p>
                <p className="text-amber-100/95 text-sm whitespace-pre-line leading-relaxed">
                  {adminSecurityAlert.message}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissAdminAlert}
                className="flex-shrink-0 p-1 rounded-lg text-amber-300/80 hover:text-amber-200 hover:bg-amber-500/20 transition-colors"
                aria-label="Dismiss"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
        <RefreshButton />
      </div>
    </div>
  );
};

export default Layout;