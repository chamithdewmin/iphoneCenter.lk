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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[var(--sidebar-width,240px)] transition-all duration-200">
        {/* Refresh button in its own row top-right (every page except dashboard) */}
        {pathname !== '/dashboard' && (
          <div className="flex justify-end px-4 pt-4 lg:px-6 lg:pt-6 pb-1">
            <RefreshButton />
          </div>
        )}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;