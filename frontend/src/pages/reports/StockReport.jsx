import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BranchFilter } from '@/components/BranchFilter';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Warehouse, AlertTriangle, Package, TrendingDown, Download, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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

const StockReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId, setSelectedBranchId } = useBranchFilter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const url = selectedBranchId
        ? `/api/reports/stock?branchId=${selectedBranchId}`
        : '/api/reports/stock';
      const res = await authFetch(url);
      let data = res.ok && Array.isArray(res.data?.data) ? res.data.data : [];
      if (selectedBranchId && data.length > 0) {
        data = data.filter(
          (r) => r.branch_id != null && String(r.branch_id) === String(selectedBranchId),
        );
      }
      setRows(data);
      setLoading(false);
    })();
  }, [selectedBranchId, refreshKey]);

  const {
    totalItems,
    lowStockCount,
    outOfStockCount,
    stockValue,
  } = useMemo(() => {
    let totalItems = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let stockValue = 0;

    rows.forEach((r) => {
      const qty = Number(r.available_quantity ?? r.quantity) || 0;
      const min = Number(r.min_stock_level) || 0;
      const price = Number(r.base_price) || 0;
      totalItems += qty;
      if (qty <= 0) outOfStockCount += 1;
      if (qty <= min) lowStockCount += 1;
      stockValue += qty * price;
    });

    return { totalItems, lowStockCount, outOfStockCount, stockValue };
  }, [rows]);

  const stockLevels = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const cat = r.category || 'Uncategorized';
      const qty = Number(r.available_quantity ?? r.quantity) || 0;
      const min = Number(r.min_stock_level) || 0;
      const prev = map.get(cat) || { category: cat, inStock: 0, lowStock: 0 };
      prev.inStock += qty;
      if (qty <= min) prev.lowStock += qty;
      map.set(cat, prev);
    });
    return Array.from(map.values());
  }, [rows]);

  const stockTrend = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const branch = r.branch_name || r.branch_code || `#${r.branch_id}`;
      const qty = Number(r.available_quantity ?? r.quantity) || 0;
      map.set(branch, (map.get(branch) || 0) + qty);
    });
    return Array.from(map.entries()).map(([branch, level]) => ({
      month: branch,
      level,
    }));
  }, [rows]);

  const lowStockItems = useMemo(
    () =>
      rows
        .filter((r) => {
          const qty = Number(r.available_quantity ?? r.quantity) || 0;
          const min = Number(r.min_stock_level) || 0;
          return qty <= min;
        })
        .slice(0, 20)
        .map((r) => ({
          name: r.product_name || r.sku || 'Unknown',
          sku: r.sku || '',
          current: Number(r.available_quantity ?? r.quantity) || 0,
          reorder: Number(r.min_stock_level) || 0,
          warehouse: r.branch_name || r.branch_code || `#${r.branch_id}`,
          urgency:
            (Number(r.available_quantity ?? r.quantity) || 0) <= 0
              ? 'Critical'
              : 'Low',
        })),
    [rows],
  );

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const csvRows = useMemo(
    () =>
      lowStockItems.map((r) => ({
        name: r.name,
        sku: r.sku,
        current: r.current,
        reorder: r.reorder,
        warehouse: r.warehouse,
        urgency: r.urgency,
      })),
    [lowStockItems],
  );
  const handleExportCsv = () => downloadCsv('stock-report.csv', csvRows);
  const handleDownloadPdf = () => {
    const rowsHtml = csvRows
      .map(
        (row) => `
        <tr><td>${row.name}</td><td>${row.sku}</td><td>${row.current}</td><td>${row.reorder}</td><td>${row.warehouse}</td><td>${row.urgency}</td></tr>`,
      )
      .join('');
    const bodyHtml = `
      <h2>Stock Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Item</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">SKU</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Current</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Reorder</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Branch</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Urgency</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    const html = getPrintHtml(bodyHtml, { businessName: 'Stock Report' });
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
      title="Stock Report"
      subtitle="Monitor inventory levels and stock movements"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <BranchFilter id="stock-branch" value={selectedBranchId} onChange={setSelectedBranchId} />
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
          label="Total Stock Items"
          value={loading ? '…' : totalItems.toString()}
          change=""
          changeType="up"
          icon={Warehouse}
        />
        <StatCard
          label="Low Stock Alerts"
          value={loading ? '…' : lowStockCount.toString()}
          change=""
          changeType="down"
          icon={AlertTriangle}
        />
        <StatCard
          label="Stock Value"
          value={
            loading
              ? '…'
              : `LKR ${stockValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
          }
          change=""
          changeType="up"
          icon={Package}
        />
        <StatCard
          label="Out of Stock"
          value={loading ? '…' : outOfStockCount.toString()}
          change=""
          changeType="down"
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Stock by Category
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stockLevels}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                dataKey="category"
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
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()} units`,
                  name,
                ]}
              />
              <Bar
                dataKey="inStock"
                fill="hsl(187,80%,48%)"
                radius={[4, 4, 0, 0]}
                name="In Stock"
              />
              <Bar
                dataKey="lowStock"
                fill="hsl(35,90%,55%)"
                radius={[4, 4, 0, 0]}
                name="Low Stock"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Stock by Branch
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stockTrend}>
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
                  `${Number(value).toLocaleString()} units`,
                  'Stock',
                ]}
              />
              <Line
                type="monotone"
                dataKey="level"
                stroke="hsl(150,60%,45%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(150,60%,45%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Low Stock Alerts
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Item
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  SKU
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Current
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Reorder Level
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Branch
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Urgency
                </th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr
                  key={item.sku || item.name}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 text-foreground font-medium">
                    {item.name}
                  </td>
                  <td className="py-3 px-2 font-mono text-primary">
                    {item.sku}
                  </td>
                  <td className="py-3 px-2 text-foreground">
                    {item.current}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {item.reorder}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {item.warehouse}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.urgency === 'Critical'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {item.urgency}
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

export default StockReport;
