import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CASHIER_ALLOWED_PATHS } from '@/constants/cashierPaths';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import AnalyticsOtpModal from '@/components/AnalyticsOtpModal';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsAccessUntil, setAnalyticsAccessUntil] = useState(null);
  useEffect(() => {
    if (user?.role === 'cashier' && !CASHIER_ALLOWED_PATHS.has(pathname)) {
      navigate('/dashboard', { replace: true });
    }
    if (user?.role === 'manager' && pathname.startsWith('/reports')) {
      navigate('/dashboard', { replace: true });
    }
    // Expense pages: admin only
    if (user?.role !== 'admin' && (pathname === '/expenses' || pathname.startsWith('/expense/'))) {
      navigate('/dashboard', { replace: true });
    }
    // Trading pages: admin only
    if (user?.role !== 'admin' && pathname.startsWith('/trading/')) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.role, pathname, navigate]);

  // Expose analytics access time globally for convenience (optional)
  useEffect(() => {
    try {
      if (analyticsAccessUntil) {
        window.analyticsAccessUntil = analyticsAccessUntil;
        window.dispatchEvent(
          new CustomEvent('analytics-access-granted', { detail: analyticsAccessUntil })
        );
      } else {
        window.analyticsAccessUntil = null;
      }
    } catch {
      // ignore
    }
  }, [analyticsAccessUntil]);

  // Auto‑reopen OTP modal when the 15‑minute window expires while user is on Analytics
  useEffect(() => {
    if (!pathname.startsWith('/reports')) return;
    if (!analyticsAccessUntil) return;
    const remaining = analyticsAccessUntil - Date.now();
    if (remaining <= 0) {
      setAnalyticsModalOpen(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('analytics-access-expired'));
      }
      return;
    }
    const timer = setTimeout(() => {
      setAnalyticsModalOpen(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('analytics-access-expired'));
      }
    }, remaining);
    return () => clearTimeout(timer);
  }, [pathname, analyticsAccessUntil]);

  const isPOSFullScreen = pathname === '/phone-shop-pos';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onRequireAnalyticsOtp={() => setAnalyticsModalOpen(true)}
      />
      <div className={isPOSFullScreen ? 'h-screen overflow-hidden lg:pl-[var(--sidebar-width,240px)]' : 'lg:pl-[var(--sidebar-width,240px)] transition-all duration-200'}>
        {!isPOSFullScreen && <Topbar onMenuClick={() => setSidebarOpen(true)} />}
        <main className={isPOSFullScreen ? 'h-full overflow-hidden p-0' : 'p-4 lg:p-6'}>
          <Outlet />
        </main>
      </div>
      {/* Analytics OTP modal – used by reports pages when needed */}
      <AnalyticsOtpModal
        open={analyticsModalOpen && pathname.startsWith('/reports')}
        onClose={() => setAnalyticsModalOpen(false)}
        onVerified={(grantedUntil) => {
          if (grantedUntil) {
            try {
              const ts = typeof grantedUntil === 'string'
                ? new Date(grantedUntil).getTime()
                : new Date(grantedUntil).getTime();
              setAnalyticsAccessUntil(ts);
            } catch {
              setAnalyticsAccessUntil(null);
            }
          } else {
            setAnalyticsAccessUntil(null);
          }
          setAnalyticsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Layout;