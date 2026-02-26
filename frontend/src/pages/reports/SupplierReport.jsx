import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BranchFilter } from '@/components/BranchFilter';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Truck, Star, Clock, CheckCircle, Download, RefreshCw } from 'lucide-react';
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

const SupplierReport = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId } = useBranchFilter();

  useEffect(() => {
    const loaded = getStorageData('suppliers', []);
    let list = Array.isArray(loaded) ? loaded : [];
    if (selectedBranchId) {
      list = list.filter(
        (s) => s.branchId != null && String(s.branchId) === String(selectedBranchId),
      );
    }
    setSuppliers(list);
  }, [selectedBranchId, refreshKey]);

  const activeCount = useMemo(
    () =>
      suppliers.filter(
        (s) => (s.status || '').toLowerCase() !== 'inactive',
      ).length,
    [suppliers],
  );

  const supplierSpend = useMemo(
    () =>
      suppliers.map((s) => ({
        name: s.name || 'Supplier',
        spend: Number(s.totalSpend) || 0,
      })),
    [suppliers],
  );

  const supplierPerformance = useMemo(
    () =>
      suppliers.map((s) => ({
        metric: s.name || 'Supplier',
        score: (Number(s.rating) || 0) * 20,
      })),
    [suppliers],
  );

  const avgRating = useMemo(() => {
    if (suppliers.length === 0) return 0;
    const sum = suppliers.reduce(
      (acc, s) => acc + (Number(s.rating) || 0),
      0,
    );
    return sum / suppliers.length;
  }, [suppliers]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const csvRows = useMemo(
    () =>
      supplierSpend.map((r) => ({ name: r.name, spend: r.spend })),
    [supplierSpend],
  );
  const handleExportCsv = () => downloadCsv('supplier-report.csv', csvRows);
  const handleDownloadPdf = () => {
    const rowsHtml = csvRows
      .map(
        (row) => `<tr><td>${row.name}</td><td>${row.spend}</td></tr>`,
      )
      .join('');
    const bodyHtml = `
      <h2>Supplier Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Supplier</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Spend</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    const html = getPrintHtml(bodyHtml, { businessName: 'Supplier Report' });
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
      title="Supplier Report"
      subtitle="Evaluate supplier performance and relationships"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <BranchFilter id="supplier-branch" />
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
          label="Active Suppliers"
          value={activeCount.toString()}
          change=""
          changeType="up"
          icon={Truck}
        />
        <StatCard
          label="Avg. Rating"
          value={avgRating ? `${avgRating.toFixed(1)}★` : '—'}
          change=""
          changeType="up"
          icon={Star}
        />
        <StatCard
          label="On-Time Delivery"
          value="—"
          change=""
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          label="Total Suppliers"
          value={suppliers.length.toString()}
          change=""
          changeType="up"
          icon={CheckCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Spend by Supplier
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={supplierSpend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                dataKey="name"
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
                  'Spend',
                ]}
              />
              <Bar
                dataKey="spend"
                fill="hsl(150,60%,45%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Performance Radar
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={supplierPerformance}>
              <PolarGrid stroke="hsl(225,15%,15%)" />
              <PolarAngleAxis
                dataKey="metric"
                stroke="hsl(215,15%,55%)"
                fontSize={11}
              />
              <PolarRadiusAxis stroke="hsl(225,15%,15%)" />
              <Radar
                dataKey="score"
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
          Supplier Directory
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Supplier
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Category
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Rating
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Phone
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Email
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s.id || s.name}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 text-foreground font-medium">
                    {s.name}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {s.category || '—'}
                  </td>
                  <td className="py-3 px-2">
                    {s.rating ? (
                      <>
                        <span className="text-warning">
                          {'★'.repeat(Math.round(Number(s.rating)))}
                        </span>{' '}
                        {Number(s.rating).toFixed(1)}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {s.phone || '—'}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {s.email || '—'}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (s.status || '').toLowerCase() === 'preferred'
                          ? 'bg-success/10 text-success'
                          : (s.status || '').toLowerCase() === 'approved'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {s.status || 'Active'}
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

export default SupplierReport;

