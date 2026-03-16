import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FileText,
  TrendingDown,
  BarChart3,
  UserCog,
  Settings,
  Menu,
  ChevronLeft,
} from 'lucide-react';

const getColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    border: isDark ? '#171717' : '#e2e8f0',
    text: isDark ? '#ffffff' : '#0f172a',
    textMuted: isDark ? '#8b9ab0' : '#64748b',
    cardBg: isDark ? '#0a0a0a' : '#ffffff',
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    blue: '#0e5cff',
  };
};

const SidebarSimple = () => {
  const [colors, setColors] = useState(getColors);
  const [collapsed, setCollapsed] = useState(false);
  const c = colors;

  useEffect(() => {
    const updateColors = () => setColors(getColors());
    window.addEventListener('theme-change', updateColors);
    return () => window.removeEventListener('theme-change', updateColors);
  }, []);

  // Use existing system routes; only design is borrowed
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/phone-shop-pos', label: 'Billing Terminal', icon: <ShoppingCart size={18} /> },
    { to: '/people/customers', label: 'Customers', icon: <Users size={18} /> },
    { to: '/invoices', label: 'Invoices', icon: <FileText size={18} /> },
    { to: '/expenses', label: 'Expenses', icon: <TrendingDown size={18} /> },
    { to: '/reports/overview', label: 'Reports', icon: <BarChart3 size={18} /> },
    { to: '/users', label: 'Users', icon: <UserCog size={18} /> },
    { to: '/settings/general', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside
      style={{
        width: collapsed ? 72 : 220,
        transition: 'width 0.2s ease',
        background: c.cardBg,
        borderRight: `1px solid ${c.border}`,
        padding: '16px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Logo + collapse button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '4px 6px',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: c.text, fontSize: 16, fontWeight: 700 }}>iPhone Center</span>
            <span style={{ color: c.textMuted, fontSize: 11 }}>Business Dashboard</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          style={{
            background: 'transparent',
            border: `1px solid ${c.border}`,
            borderRadius: 999,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: c.textMuted,
          }}
        >
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 10px',
              borderRadius: 999,
              textDecoration: 'none',
              color: isActive ? c.blue : c.textMuted,
              background: isActive ? c.hoverBg : 'transparent',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
            })}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 999,
                background: 'transparent',
                color: 'inherit',
              }}
            >
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom summary (optional) */}
      {!collapsed && (
        <div
          style={{
            marginTop: 'auto',
            padding: '10px 10px',
            borderRadius: 16,
            border: `1px solid ${c.border}`,
            background: c.hoverBg,
          }}
        >
          <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>This month</div>
          <div style={{ fontSize: 14, color: c.text, fontWeight: 600 }}>LKR 0.00</div>
        </div>
      )}
    </aside>
  );
};

export default SidebarSimple;

