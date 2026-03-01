import React, { useState, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import sidebarLogoWhite from '@/assets/side bar white logo.png';
import sidebarLogoBlack from '@/assets/side bar black logo.png';
import appleLogoWhite from '@/assets/Apple_logo_white.svg';
import appleLogoBlack from '@/assets/Apple_logo_black.svg';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  LayoutDashboard, 
  Package,
  ShoppingBag,
  TrendingDown,
  Users,
  UserCog,
  FolderTree,
  FileText,
  Warehouse,
  Settings,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  List,
  Tag,
  Barcode,
  ArrowRightLeft,
  Receipt,
  CreditCard,
  Building2,
  UserPlus,
  FolderPlus,
  BarChart3,
  ScanLine,
  Percent,
  PackageSearch,
  AlertTriangle,
  ArrowLeftRight,
  MessageSquare,
  Send,
  Mail,
  LogOut,
  ShoppingCart,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRolePermissions } from '@/constants/rolePermissions';
import { useRolePermissionsVersion } from '@/contexts/RolePermissionsContext';

/** Menu structure with groups */
const menuGroups = [
  {
    label: 'Core Operations',
    items: [
      { type: 'link', to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'dashboard' },
      { type: 'link', to: '/phone-shop-pos', icon: ShoppingCart, label: 'Billing Terminal', permission: 'orders', excludeRoles: ['admin'] },
      { type: 'link', to: '/orders', icon: ClipboardList, label: 'Per Order', permission: 'orders' },
      { type: 'link', to: '/invoices', icon: FileText, label: 'Invoices', permission: 'orders' },
      {
        type: 'menu',
        icon: ArrowRightLeft,
        label: 'Trading',
        permission: 'orders',
        includeRoles: ['admin'],
        children: [
          { to: '/trading/sales', label: 'Sales', icon: ShoppingBag },
          { to: '/trading/purchase', label: 'Purchase', icon: Receipt },
        ],
      },
    ],
  },
  {
    label: 'Inventory Management',
    items: [
      {
        type: 'menu',
        icon: Package,
        label: 'Products',
        includeRoles: ['admin'],
        children: [
          { to: '/products/add', label: 'Add Product', icon: Plus },
          { to: '/products/list', label: 'Product List', icon: List },
          { to: '/products/brands', label: 'Brands', icon: Tag },
          { to: '/products/barcode', label: 'Generate Barcode', icon: Barcode },
        ],
      },
      { type: 'link', to: '/categories', icon: FolderTree, label: 'Categories', includeRoles: ['admin'] },
      {
        type: 'menu',
        icon: PackageSearch,
        label: 'Inventory',
        permission: 'inventory',
        children: [
          { to: '/inventory/add-devices', label: 'Add Devices (IMEI)', icon: Package, includeRoles: ['admin', 'manager'] },
          { to: '/inventory/stock-view', label: 'Product Stock View', icon: Package },
          { to: '/inventory/low-stock-alert', label: 'Low Stock Alert', icon: AlertTriangle },
          { to: '/inventory/stock-adjustment', label: 'Stock Adjustment', icon: Settings },
          { to: '/inventory/transfer-stock', label: 'Transfer Stock (Warehouse → Shop)', icon: ArrowLeftRight },
        ],
      },
      { type: 'link', to: '/warehouses', icon: Warehouse, label: 'Warehouses', permission: 'products', includeRoles: ['admin'] },
    ],
  },
  {
    label: 'People & Partners',
    items: [
      { type: 'link', to: '/people/customers', icon: Users, label: 'Customers', permission: 'customers' },
      { type: 'link', to: '/people/suppliers', icon: Building2, label: 'Suppliers', permission: 'customers' },
      { type: 'link', to: '/users', icon: UserCog, label: 'Users', permission: 'users' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { type: 'link', to: '/expenses', icon: TrendingDown, label: 'Expenses', permission: 'settings', includeRoles: ['admin'] },
      {
        type: 'menu',
        icon: BarChart3,
        label: 'Analytics',
        permission: 'reports',
        excludeRoles: ['manager'],
        children: [
          { to: '/reports/overview', label: 'Overview Reports', icon: FileText },
          { to: '/reports/profit-loss', label: 'Profit & Loss', icon: FileText },
          { to: '/reports/cash-flow', label: 'Cash Flow', icon: FileText },
          { to: '/reports/sale', label: 'Sale Report', icon: FileText },
          { to: '/reports/purchase', label: 'Purchase Report', icon: FileText },
          { to: '/reports/payment', label: 'Payment Report', icon: FileText },
          { to: '/reports/product', label: 'Product Report', icon: FileText },
          { to: '/reports/stock', label: 'Stock Report', icon: FileText },
          { to: '/reports/expense', label: 'Expense Report', icon: FileText },
          { to: '/reports/user', label: 'User Report', icon: FileText },
          { to: '/reports/customer', label: 'Customer Report', icon: FileText },
          { to: '/reports/warehouse', label: 'Warehouse Report', icon: FileText },
          { to: '/reports/supplier', label: 'Supplier Report', icon: FileText },
        ],
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      { type: 'link', to: '/sms', icon: MessageSquare, label: 'Messaging', permission: 'customers' },
    ],
  },
  {
    label: 'System',
    items: [
      { type: 'link', to: '/settings/general', icon: Settings, label: 'Settings', permission: 'settings' },
      { type: 'link', to: '/audit-log', icon: ClipboardList, label: 'Audit Log', permission: 'settings', includeRoles: ['admin'] },
    ],
  },
];

/** Filter menu by role permissions: show item only if user has the required permission (admin has all). */
function filterMenuByPermissions(items, permissions, userRole) {
  if (!permissions) return items;
  return items.filter((item) => {
    if (item.includeRoles && item.includeRoles.length > 0) {
      if (!userRole || !item.includeRoles.includes(userRole.toLowerCase())) return false;
    }
    if (item.excludeRoles && userRole && item.excludeRoles.includes(userRole.toLowerCase())) {
      return false;
    }
    const required = item.permission;
    if (required && permissions[required] !== true) return false;
    if (item.children?.length) {
      const filteredChildren = item.children.filter((child) => {
        if (child.includeRoles?.length && (!userRole || !child.includeRoles.includes(userRole.toLowerCase()))) return false;
        if (child.excludeRoles?.length && userRole && child.excludeRoles.includes(userRole.toLowerCase())) return false;
        return true;
      });
      item.children = filteredChildren;
    }
    return true;
  });
}

/** Filter menu groups: show group only if it has at least one visible item */
function filterMenuGroups(groups, permissions, userRole) {
  return groups
    .map((group) => ({
      ...group,
      items: filterMenuByPermissions(group.items, permissions, userRole),
    }))
    .filter((group) => group.items.length > 0);
}

const MenuItem = ({ item, onClose, level = 0, parentPath = '', isCollapsed = false }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Check if any child is active to auto-expand
  React.useEffect(() => {
    if (item.type === 'menu' || item.type === 'submenu') {
      const hasActiveChild = item.children?.some(child => {
        if (child.type === 'submenu') {
          return child.children?.some(subChild => 
            location.pathname === (parentPath + subChild.to)
          );
        }
        return location.pathname === (parentPath + child.to);
      });
      if (hasActiveChild) {
        setIsOpen(true);
      }
    }
  }, [location.pathname, item, parentPath]);

  if (item.type === 'link') {
    const isActive = location.pathname === item.to;
    return (
      <NavLink
        to={item.to}
        onClick={() => onClose()}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-base font-medium",
            "hover:bg-secondary",
            isActive
              ? "bg-primary-gradient text-primary-foreground"
              : "text-secondary-foreground hover:text-primary"
          )
        }
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className="w-5 h-5 flex-shrink-0 opacity-85" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  }

  if (item.type === 'menu' || item.type === 'submenu') {
    const hasActiveChild = item.children?.some(child => {
      if (child.type === 'submenu') {
        return child.children?.some(subChild => 
          location.pathname === (parentPath + subChild.to)
        );
      }
      return location.pathname === (parentPath + child.to);
    });

    if (isCollapsed) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center justify-center px-3 py-2.5 rounded-md transition-all duration-150",
                "hover:bg-secondary",
                hasActiveChild
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-secondary-foreground hover:text-primary"
              )}
              title={item.label}
            >
              <item.icon className="w-5 h-5 opacity-85" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            {item.children?.map((child, idx) => (
              <DropdownMenuItem key={idx} asChild>
                <NavLink
                  to={parentPath + child.to}
                  onClick={() => onClose()}
                  className="flex items-center gap-2"
                >
                  {child.icon && <child.icon className="w-4 h-4" />}
                  <span>{child.label}</span>
                </NavLink>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-base font-medium",
            "hover:bg-secondary",
            hasActiveChild
              ? "bg-primary/10 text-primary border-l-2 border-primary"
              : "text-secondary-foreground hover:text-primary"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5 flex-shrink-0 opacity-85" />
            <span className="truncate">{item.label}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className={cn("pl-4 space-y-0.5 mt-0.5", level > 0 && "pl-8")}>
                {item.children?.map((child, idx) => (
                  <MenuItem
                    key={idx}
                    item={child}
                    onClose={onClose}
                    level={level + 1}
                    parentPath={parentPath}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Regular sub-item
  const isActive = location.pathname === (parentPath + item.to);
  return (
    <NavLink
      to={parentPath + item.to}
      onClick={() => onClose()}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 text-sm",
          "hover:bg-secondary",
          isActive
            ? "bg-primary-gradient text-primary-foreground"
            : "text-secondary-foreground hover:text-primary"
        )
      }
      title={isCollapsed ? item.label : undefined}
    >
      {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const permissionsVersion = useRolePermissionsVersion();
  const [collapsed, setCollapsed] = useState(false);
  const isDark = theme === 'dark';
  const sidebarLogo = isDark ? sidebarLogoWhite : sidebarLogoBlack;
  const appleLogo = isDark ? appleLogoWhite : appleLogoBlack;

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };
  
  const displayGroups = useMemo(() => {
    const permissions = getRolePermissions(user?.role);
    return filterMenuGroups(menuGroups, permissions, user?.role);
  }, [user?.role, permissionsVersion]);

  const sidebarWidth = collapsed ? 56 : 240;

  // Update CSS variable for sidebar width
  React.useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-card border-r border-secondary transition-all duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-4 border-b border-secondary min-h-[56px] relative">
            {collapsed ? (
              <>
                <div className="w-7 h-7 flex items-center justify-center mx-auto flex-shrink-0">
                  <img src={appleLogo} alt="iPhone Center" className="w-6 h-6 object-contain" />
                </div>
                <button
                  onClick={() => setCollapsed(false)}
                  className="w-7 h-7 rounded-md border border-secondary bg-transparent hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 absolute right-2 top-1/2 -translate-y-1/2 lg:block hidden"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                  <img src={sidebarLogo} alt="iPhone Center" className="h-7 w-auto max-w-full object-contain object-left flex-shrink-0" />
                </div>
                <button
                  onClick={() => setCollapsed(true)}
                  className="w-7 h-7 rounded-md border border-secondary bg-transparent hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 lg:block hidden"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-secondary rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto sidebar-scroll">
            {displayGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-4">
                {!collapsed && (
                  <div className="px-2 py-1.5 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-60">
                      {group.label}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item, idx) => (
                    <MenuItem key={idx} item={item} onClose={onClose} isCollapsed={collapsed} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer - User Profile */}
          <div className="border-t-2 border-border px-3 py-3">
            {collapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="w-full flex items-center justify-center p-2 rounded-md hover:bg-secondary transition-colors"
                    title={user?.name || user?.username || 'User'}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-foreground text-sm font-semibold">
                          {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <div className="px-2 py-1.5 border-b border-secondary mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      {user?.name || user?.username || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || '—'}
                    </p>
                  </div>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-secondary transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-foreground text-sm font-semibold">
                            {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0 text-left overflow-hidden">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {user?.name || user?.username || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || '—'}
                        </p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <a
                  href="https://logozodev.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-2"
                >
                  Powered by LogozoDev
                </a>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
