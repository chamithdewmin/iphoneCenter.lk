import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  FileText,
  ArrowRightLeft,
  ShoppingBag,
  Receipt,
  Package,
  List,
  Tag,
  Barcode,
  FolderTree,
  PackageSearch,
  AlertTriangle,
  Settings as SettingsIcon,
  Warehouse,
  Users,
  Building2,
  TrendingDown,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import type { NavItemDividerType, NavItemType } from "@/components/application/app-navigation/config";
import { NavList } from "@/components/application/app-navigation/base-components/nav-list";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { NavAccountCard } from "@/components/application/app-navigation/base-components/nav-account-card";

const navItemsWithDividers: (NavItemType | NavItemDividerType)[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Billing Terminal",
    href: "/phone-shop-pos",
    icon: ShoppingCart,
  },
  {
    label: "Per Order",
    href: "/orders",
    icon: ClipboardList,
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    label: "Trading",
    href: "/trading",
    icon: ArrowRightLeft,
    items: [
      { label: "Sales", href: "/trading/sales", icon: ShoppingBag },
      { label: "Purchase", href: "/trading/purchase", icon: Receipt },
    ],
  },
  { divider: true },
  {
    label: "Products",
    href: "/products",
    icon: Package,
    items: [
      { label: "Add Product", href: "/products/add", icon: Package },
      { label: "Product List", href: "/products/list", icon: List },
      { label: "Brands", href: "/products/brands", icon: Tag },
      { label: "Generate Barcode", href: "/products/barcode", icon: Barcode },
    ],
  },
  {
    label: "Categories",
    href: "/categories",
    icon: FolderTree,
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: PackageSearch,
    items: [
      { label: "Add Devices (IMEI)", href: "/inventory/add-devices", icon: Package },
      { label: "Product Stock View", href: "/inventory/stock-view", icon: PackageSearch },
      { label: "Low Stock Alert", href: "/inventory/low-stock-alert", icon: AlertTriangle },
      { label: "Stock Adjustment", href: "/inventory/stock-adjustment", icon: SettingsIcon },
      { label: "Transfer Stock", href: "/inventory/transfer-stock", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Warehouses",
    href: "/warehouses",
    icon: Warehouse,
  },
  { divider: true },
  {
    label: "Customers",
    href: "/people/customers",
    icon: Users,
  },
  {
    label: "Suppliers",
    href: "/people/suppliers",
    icon: Building2,
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
  },
  { divider: true },
  {
    label: "Expenses",
    href: "/expenses",
    icon: TrendingDown,
  },
  {
    label: "Analytics",
    href: "/reports",
    icon: BarChart3,
    items: [
      { label: "Overview Reports", href: "/reports/overview" },
      { label: "Profit & Loss", href: "/reports/profit-loss" },
      { label: "Cash Flow", href: "/reports/cash-flow" },
      { label: "Sale Report", href: "/reports/sale" },
      { label: "Purchase Report", href: "/reports/purchase" },
      { label: "Payment Report", href: "/reports/payment" },
      { label: "Product Report", href: "/reports/product" },
      { label: "Stock Report", href: "/reports/stock" },
      { label: "Expense Report", href: "/reports/expense" },
      { label: "User Report", href: "/reports/user" },
      { label: "Customer Report", href: "/reports/customer" },
      { label: "Warehouse Report", href: "/reports/warehouse" },
      { label: "Supplier Report", href: "/reports/supplier" },
    ],
  },
  { divider: true },
  {
    label: "Messaging",
    href: "/sms",
    icon: MessageSquare,
  },
  {
    label: "Settings",
    href: "/settings/general",
    icon: SettingsIcon,
  },
  {
    label: "Support",
    href: "/support",
    icon: MessageSquare,
    badge: (
      <BadgeWithDot color="success" type="modern" size="sm">
        Online
      </BadgeWithDot>
    ),
  },
  {
    label: "Open in browser",
    href: "https://www.logozodev.com",
    icon: MessageSquare,
  },
];

export const UntitledSidebar = () => {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-secondary bg-primary px-3 py-3">
      {/* Logo */}
      <div className="flex items-center px-1 pb-3">
        <UntitledLogo />
      </div>

      {/* Search placeholder (to match Untitled UI layout) */}
      <div className="mb-2">
        <Link
          to="/search"
          className="flex h-9 w-full items-center gap-2 rounded-lg bg-primary px-3 text-xs text-fg-quaternary ring-1 ring-secondary_hover/40 hover:bg-primary_hover"
        >
          <span className="flex-1 text-left text-xs text-tertiary">Search</span>
          <span className="rounded-md border border-secondary px-1.5 py-0.5 text-[10px] text-tertiary">⌘K</span>
        </Link>
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto">
        <NavList activeUrl={location.pathname} items={navItemsWithDividers} />
      </div>

      {/* Account card */}
      <div className="mt-3">
        <NavAccountCard />
      </div>
    </aside>
  );
};

