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

  // On first load, restore analytics access window from localStorage if still valid
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = window.localStorage?.getItem('analyticsAccessUntil');
      if (!stored) return;
      const ts = Number(stored);
      if (Number.isFinite(ts) && ts > Date.now()) {
        setAnalyticsAccessUntil(ts);
      } else {
        window.localStorage?.removeItem('analyticsAccessUntil');
      }
    } catch {
      // ignore
    }
  }, []);

  // Expose analytics access time globally for convenience (optional)
  useEffect(() => {
    try {
      if (analyticsAccessUntil) {
        window.analyticsAccessUntil = analyticsAccessUntil;
        window.dispatchEvent(
          new CustomEvent('analytics-access-granted', { detail: analyticsAccessUntil })
        );
        try {
          window.localStorage?.setItem('analyticsAccessUntil', String(analyticsAccessUntil));
        } catch {
          // ignore
        }
      } else {
        window.analyticsAccessUntil = null;
        try {
          window.localStorage?.removeItem('analyticsAccessUntil');
        } catch {
          // ignore
        }
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
      setAnalyticsAccessUntil(null);
      setAnalyticsModalOpen(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('analytics-access-expired'));
      }
      return;
    }
    const timer = setTimeout(() => {
      setAnalyticsAccessUntil(null);
      setAnalyticsModalOpen(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('analytics-access-expired'));
      }
    }, remaining);
    return () => clearTimeout(timer);
  }, [pathname, analyticsAccessUntil]);

  // Allow reports pages or sidebar to explicitly request Analytics verification
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => {
      setAnalyticsModalOpen(true);
    };
    window.addEventListener('analytics-request-access', handler);
    return () => window.removeEventListener('analytics-request-access', handler);
  }, []);

  const isPOSFullScreen = pathname === '/phone-shop-pos';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={isPOSFullScreen ? 'h-screen overflow-hidden lg:pl-[var(--sidebar-width,240px)]' : 'lg:pl-[var(--sidebar-width,240px)] transition-all duration-200'}>
        {!isPOSFullScreen && <Topbar onMenuClick={() => setSidebarOpen(true)} />}
        <main className={isPOSFullScreen ? 'h-full overflow-hidden p-0' : 'px-4 py-4 lg:pl-8 lg:pr-6 lg:pt-6 lg:pb-6'}>
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