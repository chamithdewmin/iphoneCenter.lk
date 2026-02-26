import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
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
} from 'recharts';
import { ShoppingBag, TrendingUp, Target, Users, Download, RefreshCw } from 'lucide-react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BranchFilter } from '@/components/BranchFilter';
import { useBranchFilter } from '@/hooks/useBranchFilter';
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

const COLORS = [
  'hsl(187,80%,48%)',
  'hsl(260,60%,55%)',
  'hsl(150,60%,45%)',
  'hsl(35,90%,55%)',
];

const SaleReport = () => {
  const [sales, setSales] = useState([]);
  const [topProductsRaw, setTopProductsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId } = useBranchFilter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const salesUrl = selectedBranchId
        ? `/api/billing/sales?branchId=${selectedBranchId}&limit=500`
        : '/api/billing/sales?limit=500';
      const topUrl = selectedBranchId
        ? `/api/reports/top-products?limit=5&branchId=${selectedBranchId}`
        : '/api/reports/top-products?limit=5';
      const [salesRes, topRes] = await Promise.all([
        authFetch(salesUrl),
        authFetch(topUrl),
      ]);

      let salesData = salesRes.ok && Array.isArray(salesRes.data?.data)
        ? salesRes.data.data
        : [];
      if (selectedBranchId && salesData.length > 0) {
        salesData = salesData.filter(
          (s) => s.branch_id != null && String(s.branch_id) === String(selectedBranchId),
        );
      }
      const topData = topRes.ok && Array.isArray(topRes.data?.data)
        ? topRes.data.data
        : [];

      setSales(salesData);
      setTopProductsRaw(topData);
      setLoading(false);
    })();
  }, [selectedBranchId, refreshKey]);

  const {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    activeCustomers,
  } = useMemo(() => {
    let revenue = 0;
    const customerIds = new Set();
    for (const s of sales) {
      revenue += Number(s.total_amount) || 0;
      if (s.customer_id) customerIds.add(s.customer_id);
    }
    const orders = sales.length;
    return {
      totalRevenue: revenue,
      totalOrders: orders,
      avgOrderValue: orders > 0 ? revenue / orders : 0,
      activeCustomers: customerIds.size,
    };
  }, [sales]);

  const monthlySales = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      const raw = s.created_at;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      if (!map.has(key)) {
        map.set(key, { month: label, revenue: 0, orders: 0 });
      }
      const row = map.get(key);
      row.revenue += Number(s.total_amount) || 0;
      row.orders += 1;
    });
    const arr = Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v);
    return arr.slice(-8);
  }, [sales]);

  const channelData = useMemo(() => {
    const buckets = { paid: 0, partial: 0, due: 0 };
    let total = 0;
    sales.forEach((s) => {
      const status = (s.payment_status || '').toLowerCase();
      const amt = Number(s.total_amount) || 0;
      if (status === 'paid' || status === 'partial' || status === 'due') {
        buckets[status] += amt;
        total += amt;
      }
    });
    if (!total) return [];
    return [
      { name: 'Paid', value: Math.round((buckets.paid / total) * 100) },
      { name: 'Partial', value: Math.round((buckets.partial / total) * 100) },
      { name: 'Due', value: Math.round((buckets.due / total) * 100) },
    ].filter((x) => x.value > 0);
  }, [sales]);

  const regionData = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      const region = s.branch_name || `Branch ${s.branch_id}`;
      const amt = Number(s.total_amount) || 0;
      map.set(region, (map.get(region) || 0) + amt);
    });
    return Array.from(map.entries()).map(([region, value]) => ({
      region,
      sales: value,
    }));
  }, [sales]);

  const topProducts = useMemo(
    () =>
      topProductsRaw.map((p) => ({
        name: p.product_name || 'Unknown',
        units: Number(p.total_quantity_sold) || 0,
        revenue: `LKR ${(Number(p.total_revenue) || 0).toLocaleString()}`,
        growth: '—',
        trend: 'neutral',
      })),
    [topProductsRaw],
  );

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const csvRows = useMemo(
    () =>
      monthlySales.map((r) => ({
        month: r.month,
        revenue: r.revenue,
        orders: r.orders,
      })),
    [monthlySales],
  );
  const handleExportCsv = () => downloadCsv('sales-report.csv', csvRows);
  const handleDownloadPdf = () => {
    const rowsHtml = csvRows
      .map(
        (row) => `
        <tr>
          <td>${row.month}</td>
          <td>${row.revenue}</td>
          <td>${row.orders}</td>
        </tr>`,
      )
      .join('');
    const bodyHtml = `
      <h2>Sales Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Month</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Revenue</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Orders</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    const html = getPrintHtml(bodyHtml, { businessName: 'Sales Report' });
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
    <>
      <Helmet>
        <title>Sale Report - iphone center.lk</title>
        <meta name="description" content="View sales report" />
      </Helmet>

      <ReportLayout
        title="Sales Report"
        subtitle="Monitor sales performance, revenue trends and channel insights"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <BranchFilter id="sale-branch" />
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
            label="Total Revenue"
            value={loading ? '…' : `LKR ${totalRevenue.toLocaleString()}`}
            change=""
            changeType="up"
            icon={ShoppingBag}
          />
          <StatCard
            label="Total Orders"
            value={loading ? '…' : totalOrders.toLocaleString()}
            change=""
            changeType="up"
            icon={Target}
          />
          <StatCard
            label="Avg. Order Value"
            value={
              loading
                ? '…'
                : `LKR ${avgOrderValue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`
            }
            change=""
            changeType="up"
            icon={TrendingUp}
          />
          <StatCard
            label="Active Customers"
            value={loading ? '…' : activeCustomers.toString()}
            change=""
            changeType="up"
            icon={Users}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="report-card lg:col-span-2">
            <h3 className="text-foreground font-semibold mb-4">
              Revenue &amp; Orders Trend
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySales}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(187,80%,48%)"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card">
            <h3 className="text-foreground font-semibold mb-4">
              Sales by Payment Status
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={channelData}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(225,21%,7.5%)',
                    border: '1px solid hsl(225,15%,15%)',
                    borderRadius: '8px',
                    color: 'hsl(210,20%,90%)',
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {channelData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: COLORS[i] }}
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
              Sales by Branch
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={regionData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(225,15%,15%)"
                />
                <XAxis
                  dataKey="region"
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
                  dataKey="sales"
                  fill="hsl(260,60%,55%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="report-card">
            <h3 className="text-foreground font-semibold mb-4">
              Top Selling Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                      Product
                    </th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                      Units
                    </th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                      Revenue
                    </th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                      Growth
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p) => (
                    <tr
                      key={p.name}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-2 text-foreground font-medium">
                        {p.name}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {p.units.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-foreground font-medium">
                        {p.revenue}
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-muted-foreground">{p.growth}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ReportLayout>
    </>
  );
};

export default SaleReport;
