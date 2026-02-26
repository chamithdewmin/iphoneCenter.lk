import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BranchFilter } from '@/components/BranchFilter';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { ShoppingCart, TrendingUp, FileText, DollarSign, Download, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getStorageData } from '@/utils/storage';
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

const PurchaseReport = () => {
  const [purchases, setPurchases] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId, setSelectedBranchId } = useBranchFilter();

  useEffect(() => {
    const loaded = getStorageData('purchases', []);
    let list = Array.isArray(loaded) ? loaded : [];
    if (selectedBranchId) {
      list = list.filter(
        (p) => p.branchId != null && String(p.branchId) === String(selectedBranchId),
      );
    }
    setPurchases(list);
  }, [selectedBranchId, refreshKey]);

  const { totalSpent, totalOrders, avgOrder } = useMemo(() => {
    const totalSpent = purchases.reduce(
      (sum, p) => sum + (Number(p.total) || 0),
      0,
    );
    const totalOrders = purchases.length;
    const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0;
    return { totalSpent, totalOrders, avgOrder };
  }, [purchases]);

  const monthlyData = useMemo(() => {
    const map = new Map();
    purchases.forEach((p) => {
      const raw = p.date || p.createdAt;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      if (!map.has(key)) {
        map.set(key, { month: label, amount: 0 });
      }
      const row = map.get(key);
      row.amount += Number(p.total) || 0;
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v)
      .slice(-8);
  }, [purchases]);

  const supplierData = useMemo(() => {
    const agg = new Map();
    let total = 0;
    purchases.forEach((p) => {
      const name = p.supplierName || p.supplier?.name || 'Other';
      const amt = Number(p.total) || 0;
      total += amt;
      agg.set(name, (agg.get(name) || 0) + amt);
    });
    if (!total) return [];
    const rows = Array.from(agg.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100),
      }));
    return rows;
  }, [purchases]);

  const recentPurchases = useMemo(
    () =>
      [...purchases]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.date || 0) -
            new Date(a.createdAt || a.date || 0),
        )
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          supplier: p.supplierName || p.supplier?.name || 'Unknown',
          amount: `LKR ${(Number(p.total) || 0).toLocaleString()}`,
          date: p.date
            ? new Date(p.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'N/A',
          status: 'Recorded',
        })),
    [purchases],
  );

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const csvRows = useMemo(
    () =>
      monthlyData.map((r) => ({ month: r.month, amount: r.amount })),
    [monthlyData],
  );
  const handleExportCsv = () => downloadCsv('purchase-report.csv', csvRows);
  const handleDownloadPdf = () => {
    const rowsHtml = csvRows
      .map(
        (row) => `
        <tr><td>${row.month}</td><td>${row.amount}</td></tr>`,
      )
      .join('');
    const bodyHtml = `
      <h2>Purchase Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Month</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Amount</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    const html = getPrintHtml(bodyHtml, { businessName: 'Purchase Report' });
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
      title="Purchase Report"
      subtitle="Track and analyze all purchasing activities"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <BranchFilter id="purchase-branch" value={selectedBranchId} onChange={setSelectedBranchId} />
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
          label="Total Purchases"
          value={`LKR ${totalSpent.toLocaleString()}`}
          change=""
          changeType="up"
          icon={ShoppingCart}
        />
        <StatCard
          label="Purchase Orders"
          value={totalOrders.toString()}
          change=""
          changeType="up"
          icon={FileText}
        />
        <StatCard
          label="Avg. Order Value"
          value={
            totalOrders > 0
              ? `LKR ${avgOrder.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
              : 'LKR 0'
          }
          change=""
          changeType="neutral"
          icon={DollarSign}
        />
        <StatCard
          label="Suppliers Used"
          value={
            new Set(
              purchases.map(
                (p) => p.supplierId || p.supplierName || p.supplier?.id,
              ),
            ).size.toString()
          }
          change=""
          changeType="up"
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Monthly Purchase Trends
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
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
                  'Total',
                ]}
              />
              <Bar
                dataKey="amount"
                fill="hsl(187,80%,48%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Purchases by Supplier
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={supplierData}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {supplierData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
            {supplierData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
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

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Recent Purchase Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Order ID
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Supplier
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Amount
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Date
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentPurchases.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 font-mono text-primary">
                    {p.id}
                  </td>
                  <td className="py-3 px-2 text-foreground">{p.supplier}</td>
                  <td className="py-3 px-2 text-foreground font-medium">
                    {p.amount}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {p.date}
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {p.status}
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

export default PurchaseReport;
