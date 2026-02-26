import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BranchFilter } from '@/components/BranchFilter';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Package, TrendingUp, Star, BarChart3, Download, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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

const ProductReport = () => {
  const [products, setProducts] = useState([]);
  const [topProductsRaw, setTopProductsRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId } = useBranchFilter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const topUrl = selectedBranchId
        ? `/api/reports/top-products?limit=10&branchId=${selectedBranchId}`
        : '/api/reports/top-products?limit=10';
      const [prodRes, topRes] = await Promise.all([
        authFetch('/api/inventory/products'),
        authFetch(topUrl),
      ]);

      let prods =
        prodRes.ok && Array.isArray(prodRes.data?.data)
          ? prodRes.data.data
          : [];
      if (selectedBranchId && prods.some((p) => p.branch_id != null)) {
        prods = prods.filter(
          (p) => p.branch_id != null && String(p.branch_id) === String(selectedBranchId),
        );
      }
      const top =
        topRes.ok && Array.isArray(topRes.data?.data)
          ? topRes.data.data
          : [];

      setProducts(prods);
      setTopProductsRaw(top);
      setLoading(false);
    })();
  }, [selectedBranchId, refreshKey]);

  const { totalProducts, totalStockValue, topCategory } = useMemo(() => {
    const totalProducts = products.length;
    let totalStockValue = 0;
    const categoryTotals = new Map();

    products.forEach((p) => {
      const stock = Number(p.stock) || 0;
      const price =
        Number(p.retailPrice ?? p.basePrice ?? p.wholesalePrice) || 0;
      totalStockValue += stock * price;
      const cat = p.category || 'Uncategorized';
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + stock * price);
    });

    let topCategory = '—';
    let maxVal = 0;
    categoryTotals.forEach((val, key) => {
      if (val > maxVal) {
        maxVal = val;
        topCategory = key;
      }
    });

    return { totalProducts, totalStockValue, topCategory };
  }, [products]);

  const salesByProduct = useMemo(
    () =>
      topProductsRaw.map((p) => ({
        name: p.product_name || p.sku || 'Unknown',
        sales: Number(p.total_quantity_sold) || 0,
      })),
    [topProductsRaw],
  );

  const performanceData = useMemo(
    () =>
      topProductsRaw.map((p) => ({
        subject: p.product_name || p.sku || 'Unknown',
        A: Number(p.total_revenue) || 0,
      })),
    [topProductsRaw],
  );

  const tableProducts = useMemo(
    () =>
      topProductsRaw.map((p) => ({
        name: p.product_name || 'Unknown',
        sku: p.sku || '',
        price: '—',
        sold: Number(p.total_quantity_sold) || 0,
        revenue: `LKR ${(Number(p.total_revenue) || 0).toLocaleString()}`,
        rating: 0,
      })),
    [topProductsRaw],
  );

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const csvRows = useMemo(
    () =>
      tableProducts.map((p) => ({
        name: p.name,
        sku: p.sku,
        sold: p.sold,
        revenue: p.revenue,
      })),
    [tableProducts],
  );
  const handleExportCsv = () => downloadCsv('product-report.csv', csvRows);
  const handleDownloadPdf = () => {
    const rowsHtml = csvRows
      .map(
        (row) => `
        <tr><td>${row.name}</td><td>${row.sku}</td><td>${row.sold}</td><td>${row.revenue}</td></tr>`,
      )
      .join('');
    const bodyHtml = `
      <h2>Product Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Product</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">SKU</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Sold</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Revenue</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    const html = getPrintHtml(bodyHtml, { businessName: 'Product Report' });
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
      title="Product Report"
      subtitle="Analyze product performance and sales metrics"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <BranchFilter id="product-branch" />
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
          label="Total Products"
          value={loading ? '…' : totalProducts.toString()}
          change=""
          changeType="up"
          icon={Package}
        />
        <StatCard
          label="Stock Value"
          value={
            loading
              ? '…'
              : `LKR ${totalStockValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
          }
          change=""
          changeType="up"
          icon={TrendingUp}
        />
        <StatCard
          label="Avg. Rating"
          value="—"
          change=""
          changeType="neutral"
          icon={Star}
        />
        <StatCard
          label="Top Category"
          value={topCategory}
          change=""
          changeType="up"
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Sales by Product
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesByProduct} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                type="number"
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="hsl(215,15%,55%)"
                fontSize={12}
                width={120}
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
                  'Units Sold',
                ]}
              />
              <Bar
                dataKey="sales"
                fill="hsl(260,60%,55%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Revenue Radar
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="hsl(225,15%,15%)" />
              <PolarAngleAxis
                dataKey="subject"
                stroke="hsl(215,15%,55%)"
                fontSize={11}
              />
              <PolarRadiusAxis stroke="hsl(225,15%,15%)" />
              <Radar
                dataKey="A"
                stroke="hsl(187,80%,48%)"
                fill="hsl(187,80%,48%)"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Top Performing Products
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Product
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  SKU
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Sold
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {tableProducts.map((p) => (
                <tr
                  key={p.sku || p.name}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 text-foreground font-medium">
                    {p.name}
                  </td>
                  <td className="py-3 px-2 font-mono text-primary">
                    {p.sku}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {p.sold.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-foreground font-medium">
                    {p.revenue}
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

export default ProductReport;
