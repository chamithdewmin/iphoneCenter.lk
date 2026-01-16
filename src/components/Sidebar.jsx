import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Plus,
  List,
  Tag,
  Ruler,
  Barcode,
  ArrowRightLeft,
  Receipt,
  CreditCard,
  Building2,
  UserPlus,
  ShieldCheck,
  FolderPlus,
  BarChart3,
  ScanLine,
  Percent,
  ShoppingCart,
  Printer,
  Pause,
  RotateCcw,
  PackageSearch,
  AlertTriangle,
  ArrowLeftRight,
  MessageSquare,
  Send,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    type: 'link',
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    type: 'menu',
    icon: ShoppingCart,
    label: 'POS Billing',
    children: [
      { to: '/pos-billing/new-sale', label: 'New Sale (POS Screen)', icon: ShoppingCart },
      { to: '/pos-billing/scan-barcode', label: 'Scan Barcode', icon: ScanLine },
      { to: '/pos-billing/add-product', label: 'Add Product to Cart', icon: Plus },
      { to: '/pos-billing/apply-discount', label: 'Apply Discount', icon: Percent },
      { to: '/pos-billing/apply-tax', label: 'Apply Tax', icon: Receipt },
      { to: '/pos-billing/select-customer', label: 'Select Customer', icon: Users },
      { to: '/pos-billing/payment-methods', label: 'Payment Methods (Cash / Card / QR)', icon: CreditCard },
      { to: '/pos-billing/print-invoice', label: 'Print Invoice', icon: Printer },
      { to: '/pos-billing/hold-invoice', label: 'Hold Invoice', icon: Pause },
      { to: '/pos-billing/return-refund', label: 'Return / Refund', icon: RotateCcw },
      { to: '/pos-billing/reprint-invoice', label: 'Reprint Invoice', icon: Printer },
    ],
  },
  {
    type: 'menu',
    icon: Package,
    label: 'Products',
    children: [
      { to: '/products/add', label: 'Add Product', icon: Plus },
      { to: '/products/list', label: 'Product List', icon: List },
      { to: '/products/brands', label: 'Brands', icon: Tag },
      { to: '/products/unit-value', label: 'Unit / Value', icon: Ruler },
      { to: '/products/barcode', label: 'Generate Barcode', icon: Barcode },
    ],
  },
  {
    type: 'menu',
    icon: ArrowRightLeft,
    label: 'Trading',
    children: [
      { to: '/trading/sales', label: 'Sales', icon: ShoppingBag },
      { to: '/trading/purchase', label: 'Purchase', icon: Receipt },
    ],
  },
  {
    type: 'menu',
    icon: PackageSearch,
    label: 'Inventory',
    children: [
      { to: '/inventory/stock-view', label: 'Product Stock View', icon: Package },
      { to: '/inventory/low-stock-alert', label: 'Low Stock Alert', icon: AlertTriangle },
      { to: '/inventory/stock-adjustment', label: 'Stock Adjustment', icon: Settings },
      { to: '/inventory/warehouse-stock', label: 'Warehouse-wise Stock', icon: Warehouse },
      { to: '/inventory/transfer-stock', label: 'Transfer Stock (Warehouse → Shop)', icon: ArrowLeftRight },
      { to: '/inventory/barcode-scan-check', label: 'Barcode Scan Stock Check', icon: ScanLine },
    ],
  },
  {
    type: 'menu',
    icon: TrendingDown,
    label: 'Expense',
    children: [
      { to: '/expense/add', label: 'Add Expense', icon: Plus },
      { to: '/expense/list', label: 'Expense List', icon: List },
    ],
  },
  {
    type: 'menu',
    icon: Users,
    label: 'People',
    children: [
      {
        type: 'submenu',
        label: 'Customers',
        icon: Users,
        children: [
          { to: '/people/customers/add', label: 'Add Customer', icon: Plus },
          { to: '/people/customers/list', label: 'Customer List', icon: List },
        ],
      },
      {
        type: 'submenu',
        label: 'Suppliers',
        icon: Building2,
        children: [
          { to: '/people/suppliers/add', label: 'Add Supplier', icon: Plus },
          { to: '/people/suppliers/list', label: 'Supplier List', icon: List },
        ],
      },
      {
        type: 'submenu',
        label: 'Billers',
        icon: Receipt,
        children: [
          { to: '/people/billers/add', label: 'Add Biller', icon: Plus },
          { to: '/people/billers/list', label: 'Biller List', icon: List },
        ],
      },
    ],
  },
  {
    type: 'menu',
    icon: UserCog,
    label: 'User Manage',
    children: [
      { to: '/users/add', label: 'Add User', icon: UserPlus },
      { to: '/users/list', label: 'User List', icon: List },
      { to: '/users/roles', label: 'Roles', icon: ShieldCheck },
    ],
  },
  {
    type: 'menu',
    icon: FolderTree,
    label: 'Categories',
    children: [
      { to: '/categories/add', label: 'Add Category', icon: FolderPlus },
      { to: '/categories/list', label: 'Category List', icon: List },
    ],
  },
  {
    type: 'menu',
    icon: BarChart3,
    label: 'Reports',
    children: [
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
      { to: '/reports/discount', label: 'Discount Report', icon: FileText },
      { to: '/reports/tax', label: 'Tax Report', icon: FileText },
      { to: '/reports/shipping', label: 'Shipping Charge Report', icon: FileText },
    ],
  },
  {
    type: 'menu',
    icon: Warehouse,
    label: 'Warehouses',
    children: [
      { to: '/warehouses/add', label: 'Add Warehouse', icon: Plus },
      { to: '/warehouses/list', label: 'Warehouse List', icon: List },
    ],
  },
  {
    type: 'menu',
    icon: MessageSquare,
    label: 'SMS',
    children: [
      { to: '/sms/send-customer', label: 'Send SMS to Customer', icon: Send },
      { to: '/sms/bulk', label: 'Bulk SMS', icon: Mail },
      { to: '/sms/invoice', label: 'Invoice SMS', icon: Receipt },
      { to: '/sms/promotion', label: 'Promotion SMS', icon: Tag },
      { to: '/sms/due-payment-reminder', label: 'Due Payment Reminder', icon: AlertTriangle },
      { to: '/sms/custom-message', label: 'Custom Message', icon: MessageSquare },
    ],
  },
  {
    type: 'menu',
    icon: Settings,
    label: 'Settings',
    children: [
      { to: '/settings/general', label: 'General Setting', icon: Settings },
      { to: '/settings/permission', label: 'Permission Setting', icon: ShieldCheck },
    ],
  },
];

const MenuItem = ({ item, onClose, level = 0, parentPath = '' }) => {
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
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            "hover:bg-secondary hover:translate-x-1",
            isActive
              ? "bg-primary text-white shadow-lg"
              : "text-secondary-foreground"
          )
        }
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
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

    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200",
            "hover:bg-secondary hover:translate-x-1",
            hasActiveChild
              ? "bg-primary/10 text-primary"
              : "text-secondary-foreground"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
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
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={cn("pl-4 space-y-1", level > 0 && "pl-8")}>
                {item.children?.map((child, idx) => (
                  <MenuItem
                    key={idx}
                    item={child}
                    onClose={onClose}
                    level={level + 1}
                    parentPath={parentPath}
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
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm",
          "hover:bg-secondary hover:translate-x-1",
          isActive
            ? "bg-primary text-white shadow-lg"
            : "text-secondary-foreground"
        )
      }
    >
      {item.icon && <item.icon className="w-4 h-4" />}
      <span>{item.label}</span>
    </NavLink>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
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
          "fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r border-secondary transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-secondary">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 814 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" className="text-foreground" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-foreground">iphone center.lk</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-secondary rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item, idx) => (
              <MenuItem key={idx} item={item} onClose={onClose} />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
