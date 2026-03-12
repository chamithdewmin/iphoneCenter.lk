import { useLocation } from "react-router-dom";
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
];

export const SidebarSectionDividersDemo = () => {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-[240px] flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-semibold tracking-wide">iPhone Center</span>
      </div>

      <NavList activeUrl={location.pathname} items={navItemsWithDividers} className="flex-1 overflow-y-auto" />
    </aside>
  );
};

export default SidebarSectionDividersDemo;

