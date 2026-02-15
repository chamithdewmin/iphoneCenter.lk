import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRolePermissions } from '@/contexts/RolePermissionsContext';
import { getPermissionForPath } from '@/constants/rolePermissions';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { getPermissionsForRole } = useRolePermissions();

  useEffect(() => {
    const role = (user?.role || '').toLowerCase();
    if (role === 'admin') return;
    const permissions = getPermissionsForRole(role);
    const required = getPermissionForPath(pathname);
    if (required && !permissions[required]) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.role, pathname, navigate, getPermissionsForRole]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;