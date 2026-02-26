import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BranchFilter } from '@/components/BranchFilter';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Users, UserPlus, Heart, TrendingUp, Download, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { authFetch } from '@/lib/api';
import { getPrintHtml } from '@/utils/pdfPrint';

const downloadCsv = (filename, rows) => {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(','),
    ...rows.map((row) =>
      header
        .map((key) => {
          const val = row[key] ?? '';
          const str = typeof val === 'number' ? String(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const CustomerReport = () => {
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId } = useBranchFilter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const salesUrl = selectedBranchId
        ? `/api/billing/sales?branchId=${selectedBranchId}&limit=1000`
        : '/api/billing/sales?limit=1000';
      const [custRes, salesRes] = await Promise.all([
        authFetch('/api/customers'),
        authFetch(salesUrl),
      ]);
      const cust =
        custRes.ok && Array.isArray(custRes.data?.data)
          ? custRes.data.data
          : [];
      let s =
        salesRes.ok && Array.isArray(salesRes.data?.data)
          ? salesRes.data.data
          : [];
      if (selectedBranchId && s.length > 0) {
        s = s.filter(
          (x) => x.branch_id != null && String(x.branch_id) === String(selectedBranchId),
        );
      }
      setCustomers(cust);
      setSales(s);
      setLoading(false);
    })();
  }, [selectedBranchId, refreshKey]);

  const {
    totalCustomers,
    newCustomers,
    retentionRate,
    avgLTV,
  } = useMemo(() => {
    const totalCustomers = customers.length;
    const now = new Date();
    const newCustomers = customers.filter((c) => {
      const d = c.created_at ? new Date(c.created_at) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      const days = (now - d) / 86400000;
      return days <= 30;
    }).length;

    const byCustomer = new Map();
    sales.forEach((s) => {
      const id = s.customer_id;
      if (!id) return;
      const total = Number(s.total_amount) || 0;
      const entry =
        byCustomer.get(id) || { revenue: 0, orders: 0, lastOrder: null };
      entry.revenue += total;
      entry.orders += 1;
      const d = s.created_at ? new Date(s.created_at) : null;
      if (d && !Number.isNaN(d.getTime())) {
        if (!entry.lastOrder || d > entry.lastOrder) entry.lastOrder = d;
      }
      byCustomer.set(id, entry);
    });

    const allRevenues = Array.from(byCustomer.values()).map(
      (v) => v.revenue,
    );
    const avgLTV =
      allRevenues.length > 0
        ? allRevenues.reduce((a, b) => a + b, 0) / allRevenues.length
        : 0;

    // Rough retention: customers with >1 order
    const retained = Array.from(byCustomer.values()).filter(
      (v) => v.orders > 1,
    ).length;
    const retentionRate =
      byCustomer.size > 0 ? (retained / byCustomer.size) * 100 : 0;

    return {
      totalCustomers,
      newCustomers,
      retentionRate,
      avgLTV,
    };
  }, [customers, sales]);

  const customerGrowth = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => {
      const d = c.created_at ? new Date(c.created_at) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      if (!map.has(key)) {
        map.set(key, { month: label, customers: 0 });
      }
      const row = map.get(key);
      row.customers += 1;
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
  }, [customers]);

  const revenueBySegment = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      const seg = (s.branch_name || 'Branch').toString();
      const amt = Number(s.total_amount) || 0;
      map.set(seg, (map.get(seg) || 0) + amt);
    });
    return Array.from(map.entries()).map(([segment, revenue]) => ({
      segment,
      revenue,
    }));
  }, [sales]);

  const topCustomers = useMemo(() => {
    const byCustomer = new Map();
    sales.forEach((s) => {
      const id = s.customer_id;
      if (!id) return;
      const total = Number(s.total_amount) || 0;
      const entry =
        byCustomer.get(id) || {
          name: s.customer_name || `Customer ${id}`,
          totalOrders: 0,
          revenue: 0,
          lastOrder: null,
        };
      entry.totalOrders += 1;
      entry.revenue += total;
      const d = s.created_at ? new Date(s.created_at) : null;
      if (d && !Number.isNaN(d.getTime())) {
        if (!entry.lastOrder || d > entry.lastOrder) entry.lastOrder = d;
      }
      byCustomer.set(id, entry);
    });

    return Array.from(byCustomer.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((c) => ({
        ...c,
        revenueFormatted: `LKR ${c.revenue.toLocaleString()}`,
        lastOrderFormatted: c.lastOrder
          ? c.lastOrder.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'N/A',
        status: c.totalOrders > 1 ? 'Active' : 'New',
      }));
  }, [sales]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const csvRows = useMemo(
    () =>
      topCustomers.map((c) => ({
        name: c.name,
        totalOrders: c.totalOrders,
        revenue: c.revenueFormatted,
        lastOrder: c.lastOrderFormatted,
        status: c.status,
      })),
    [topCustomers],
  );
  const handleExportCsv = () => downloadCsv('customer-report.csv', csvRows);
  const handleDownloadPdf = () => {
    const rowsHtml = csvRows
      .map(
        (row) => `
        <tr><td>${row.name}</td><td>${row.totalOrders}</td><td>${row.revenue}</td><td>${row.lastOrder}</td><td>${row.status}</td></tr>`,
      )
      .join('');
    const bodyHtml = `
      <h2>Customer Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Customer</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Orders</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Revenue</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Last Order</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    const html = getPrintHtml(bodyHtml, { businessName: 'Customer Report' });
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  return (
    <ReportLayout
      title="Customer Report"
      subtitle="Understand customer behavior and retention"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <BranchFilter id="customer-branch" />
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Customers"
          value={loading ? '…' : totalCustomers.toString()}
          change=""
          changeType="up"
          icon={Users}
        />
        <StatCard
          label="New Customers (30d)"
          value={loading ? '…' : newCustomers.toString()}
          change=""
          changeType="up"
          icon={UserPlus}
        />
        <StatCard
          label="Retention (multi-order)"
          value={
            loading
              ? '…'
              : `${retentionRate.toFixed(1).toString()}%`
          }
          change=""
          changeType="up"
          icon={Heart}
        />
        <StatCard
          label="Avg. Lifetime Revenue"
          value={
            loading
              ? '…'
              : `LKR ${avgLTV.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
          }
          change=""
          changeType="up"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Customer Growth (signups)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={customerGrowth}>
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
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(225,21%,7.5%)',
                  border: '1px solid hsl(225,15%,15%)',
                  borderRadius: '8px',
                  color: 'hsl(210,20%,90%)',
                }}
              />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="hsl(187,80%,48%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(187,80%,48%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Revenue by Branch (from customers)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueBySegment}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                dataKey="segment"
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(215,15%,55%)"
                fontSize={12}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(225,21%,7.5%)',
                  border: '1px solid hsl(225,15%,15%)',
                  borderRadius: '8px',
                  color: 'hsl(210,20%,90%)',
                }}
                formatter={(value) => [
                  `LKR ${Number(value).toLocaleString()}`,
                  'Revenue',
                ]}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(260,60%,55%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Top Customers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Customer
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Orders
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Revenue
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Last Order
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c) => (
                <tr
                  key={c.name}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 text-foreground font-medium">
                    {c.name}
                  </td>
                  <td className="py-3 px-2 text-foreground">
                    {c.totalOrders}
                  </td>
                  <td className="py-3 px-2 text-foreground font-medium">
                    {c.revenueFormatted}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {c.lastOrderFormatted}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.status === 'Active'
                          ? 'bg-success/10 text-success'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  );
};

export default CustomerReport;
