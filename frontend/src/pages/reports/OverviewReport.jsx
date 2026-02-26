import React, { useEffect, useMemo, useState } from "react";
import ReportLayout from "@/components/ReportLayout";
import StatCard from "@/components/StatCard";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { authFetch } from "@/lib/api";
import { getStorageData } from "@/utils/storage";

const COLORS = [
  "hsl(187,80%,48%)",
  "hsl(260,60%,55%)",
  "hsl(150,60%,45%)",
  "hsl(35,90%,55%)",
  "hsl(340,65%,55%)",
];

function getMonthKeyLabel(raw) {
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const label = d.toLocaleDateString("en-US", { month: "short" });
  return { key, label };
}

const OverviewReport = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [salesRes, custRes, prodRes] = await Promise.all([
          authFetch("/api/billing/sales?limit=1000"),
          authFetch("/api/customers"),
          authFetch("/api/inventory/products"),
        ]);

        if (cancelled) return;

        const salesData =
          salesRes.ok && Array.isArray(salesRes.data?.data)
            ? salesRes.data.data
            : [];
        setSales(salesData);

        const customers =
          custRes.ok && Array.isArray(custRes.data?.data)
            ? custRes.data.data
            : [];
        setCustomersCount(customers.length);

        const products =
          prodRes.ok && Array.isArray(prodRes.data?.data)
            ? prodRes.data.data
            : [];
        setProductsCount(products.length);

        const loadedExpenses = getStorageData("expenses", []);
        setExpenses(Array.isArray(loadedExpenses) ? loadedExpenses : []);
        const loadedPurchases = getStorageData("purchases", []);
        setPurchases(Array.isArray(loadedPurchases) ? loadedPurchases : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyOverview = useMemo(() => {
    const map = new Map();

    sales.forEach((s) => {
      const info = getMonthKeyLabel(s.created_at || s.date);
      if (!info) return;
      const existing =
        map.get(info.key) || {
          month: info.label,
          revenue: 0,
          expenses: 0,
          profit: 0,
        };
      existing.revenue += Number(s.total_amount) || 0;
      map.set(info.key, existing);
    });

    expenses.forEach((e) => {
      const info = getMonthKeyLabel(e.date || e.createdAt);
      if (!info) return;
      const existing =
        map.get(info.key) || {
          month: info.label,
          revenue: 0,
          expenses: 0,
          profit: 0,
        };
      existing.expenses += Number(e.amount) || 0;
      map.set(info.key, existing);
    });

    purchases.forEach((p) => {
      const info = getMonthKeyLabel(p.date || p.createdAt);
      if (!info) return;
      const existing =
        map.get(info.key) || {
          month: info.label,
          revenue: 0,
          expenses: 0,
          profit: 0,
        };
      existing.expenses += Number(p.total) || 0;
      map.set(info.key, existing);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => ({
        ...v,
        profit: v.revenue - v.expenses,
      }))
      .slice(-8);
  }, [sales, expenses, purchases]);

  const kpiTrends = useMemo(() => {
    const map = new Map();

    sales.forEach((s) => {
      const info = getMonthKeyLabel(s.created_at || s.date);
      if (!info) return;
      const existing =
        map.get(info.key) || {
          month: info.label,
          customersSet: new Set(),
          orders: 0,
        };
      if (s.customer_id) {
        existing.customersSet.add(s.customer_id);
      }
      existing.orders += 1;
      map.set(info.key, existing);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => ({
        month: v.month,
        customers: v.customersSet.size,
        orders: v.orders,
        products: productsCount,
      }))
      .slice(-8);
  }, [sales, productsCount]);

  const totals = useMemo(() => {
    const totalRevenue = sales.reduce(
      (sum, s) => sum + (Number(s.total_amount) || 0),
      0,
    );
    const totalExpenses =
      expenses.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0,
      ) +
      purchases.reduce(
        (sum, p) => sum + (Number(p.total) || 0),
        0,
      );
    const netProfit = totalRevenue - totalExpenses;

    const totalOrders = sales.length;
    const uniqueCustomers = new Set(
      sales.map((s) => s.customer_id).filter(Boolean),
    ).size;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      totalOrders,
      uniqueCustomers,
    };
  }, [sales, expenses, purchases]);

  const departmentData = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      const branch = s.branch_name || s.branch_code || "Main";
      map.set(branch, (map.get(branch) || 0) + (Number(s.total_amount) || 0));
    });
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 5);
    const total = top.reduce((sum, [, v]) => sum + v, 0) || 1;
    return top.map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100),
    }));
  }, [sales]);

  const recentActivities = useMemo(() => {
    const items = [];

    sales
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0),
      )
      .slice(0, 4)
      .forEach((s) => {
        items.push({
          action: `Invoice ${s.invoice_number || s.id}`,
          value: `LKR ${(Number(s.total_amount) || 0).toLocaleString()}`,
          time: s.created_at
            ? new Date(s.created_at).toLocaleString()
            : "",
          type: "order",
        });
      });

    expenses
      .slice()
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt || 0) -
          new Date(a.date || a.createdAt || 0),
      )
      .slice(0, 2)
      .forEach((e) => {
        items.push({
          action: e.description || e.category || "Expense",
          value: `LKR ${(Number(e.amount) || 0).toLocaleString()}`,
          time: e.date
            ? new Date(e.date).toLocaleDateString()
            : "",
          type: "expense",
        });
      });

    return items.slice(0, 6);
  }, [sales, expenses]);

  return (
    <ReportLayout
      title="Overview Report"
      subtitle="Complete business performance at a glance"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={
            loading
              ? "Loading..."
              : `LKR ${totals.totalRevenue.toLocaleString()}`
          }
          change=""
          changeType="up"
          icon={DollarSign}
        />
        <StatCard
          label="Net Profit"
          value={
            loading
              ? "Loading..."
              : `LKR ${totals.netProfit.toLocaleString()}`
          }
          change=""
          changeType="up"
          icon={TrendingUp}
        />
        <StatCard
          label="Total Orders"
          value={loading ? "Loading..." : totals.totalOrders.toString()}
          change=""
          changeType="up"
          icon={ShoppingBag}
        />
        <StatCard
          label="Active Customers"
          value={
            loading
              ? "Loading..."
              : totals.uniqueCustomers.toString()
          }
          change=""
          changeType="up"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Revenue vs Expenses vs Profit
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyOverview}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                dataKey="month"
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(225,21%,7.5%)",
                  border: "1px solid hsl(225,15%,15%)",
                  borderRadius: "8px",
                  color: "hsl(210,20%,90%)",
                }}
              />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="hsl(187,80%,48%)"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
              <Bar
                dataKey="expenses"
                fill="hsl(260,60%,55%)"
                radius={[4, 4, 0, 0]}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="hsl(150,60%,45%)"
                strokeWidth={2}
                name="Profit"
                dot={{ fill: "hsl(150,60%,45%)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Revenue by Branch
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={departmentData}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {departmentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(225,21%,7.5%)",
                  border: "1px solid hsl(225,15%,15%)",
                  borderRadius: "8px",
                  color: "hsl(210,20%,90%)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {departmentData.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            KPI Trends
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={kpiTrends}>
              <defs>
                <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(187,80%,48%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(187,80%,48%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(260,60%,55%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(260,60%,55%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                dataKey="month"
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(225,21%,7.5%)",
                  border: "1px solid hsl(225,15%,15%)",
                  borderRadius: "8px",
                  color: "hsl(210,20%,90%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="customers"
                stroke="hsl(187,80%,48%)"
                fill="url(#custGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="hsl(260,60%,55%)"
                fill="url(#ordGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivities.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="text-foreground text-sm font-medium">
                    {a.action}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {a.time}
                  </p>
                </div>
                <span className="text-sm font-mono font-medium text-foreground">
                  {a.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default OverviewReport;

