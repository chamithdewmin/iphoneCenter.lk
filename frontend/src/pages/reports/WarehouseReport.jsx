import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BranchFilter } from '@/components/BranchFilter';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { Building2, PackageCheck, Truck, BarChart3, Download, RefreshCw } from 'lucide-react';
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
  'hsl(35,90%,55%)',
  'hsl(150,60%,45%)',
];

const WarehouseReport = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId, setSelectedBranchId } = useBranchFilter();

  useEffect(() => {
    const loaded = getStorageData('warehouses', []);
    let list = Array.isArray(loaded) ? loaded : [];
    if (selectedBranchId) {
      list = list.filter(
        (w) => w.branchId != null && String(w.branchId) === String(selectedBranchId),
      );
    }
    setWarehouses(list);
  }, [selectedBranchId, refreshKey]);

  const {
    totalWarehouses,
    totalItems,
    avgUtilization,
  } = useMemo(() => {
    const totalWarehouses = warehouses.length;
    let totalItems = 0;
    let utilSum = 0;

    warehouses.forEach((w) => {
      const items = Number(w.items) || 0;
      totalItems += items;
      const util =
        typeof w.capacity === 'string'
          ? parseFloat(w.capacity)
          : Number(w.capacity) || 0;
      utilSum += util;
    });

    const avgUtilization =
      totalWarehouses > 0 ? utilSum / totalWarehouses : 0;

    return { totalWarehouses, totalItems, avgUtilization };
  }, [warehouses]);

  const warehouseCapacity = useMemo(
    () =>
      warehouses.map((w) => ({
        name: w.name || w.id,
        capacity:
          typeof w.capacity === 'string'
            ? parseFloat(w.capacity)
            : Number(w.capacity) || 0,
      })),
    [warehouses],
  );

  const activityData = useMemo(
    () => [
      { name: 'Inbound', value: 40 },
      { name: 'Outbound', value: 35 },
      { name: 'Returns', value: 15 },
      { name: 'Transfers', value: 10 },
    ],
    [],
  );

  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const csvRows = useMemo(
    () =>
      warehouses.map((w) => ({
        id: w.id,
        name: w.name || w.id,
        location: w.location || '',
        capacity: w.capacity,
        items: w.items ?? '',
        status: w.status || 'Active',
      })),
    [warehouses],
  );
  const handleExportCsv = () => downloadCsv('warehouse-report.csv', csvRows);
  const handleDownloadPdf = () => {
    const rowsHtml = csvRows
      .map(
        (row) => `
        <tr><td>${row.id}</td><td>${row.name}</td><td>${row.location}</td><td>${row.capacity}</td><td>${row.items}</td><td>${row.status}</td></tr>`,
      )
      .join('');
    const bodyHtml = `
      <h2>Warehouse Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">ID</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Name</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Location</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Capacity</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Items</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Status</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    const html = getPrintHtml(bodyHtml, { businessName: 'Warehouse Report' });
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
      title="Warehouse Report"
      subtitle="Overview of warehouse operations and utilization"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <BranchFilter id="warehouse-branch" value={selectedBranchId} onChange={setSelectedBranchId} />
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
          label="Total Warehouses"
          value={totalWarehouses.toString()}
          change=""
          changeType="up"
          icon={Building2}
        />
        <StatCard
          label="Total Items Stored"
          value={totalItems.toLocaleString()}
          change=""
          changeType="up"
          icon={PackageCheck}
        />
        <StatCard
          label="Avg. Utilization"
          value={`${avgUtilization.toFixed(1)}%`}
          change=""
          changeType="up"
          icon={BarChart3}
        />
        <StatCard
          label="Active Warehouses"
          value={
            warehouses.filter(
              (w) =>
                (w.status || '').toLowerCase() === 'active' ||
                !w.status,
            ).length.toString()
          }
          change=""
          changeType="up"
          icon={Truck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Warehouse Capacity Utilization
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={warehouseCapacity}>
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
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(225,21%,7.5%)',
                  border: '1px solid hsl(225,15%,15%)',
                  borderRadius: '8px',
                  color: 'hsl(210,20%,90%)',
                }}
                formatter={(val) => `${val}%`}
              />
              <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
                {warehouseCapacity.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.capacity > 85
                        ? 'hsl(35,90%,55%)'
                        : 'hsl(187,80%,48%)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Activity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={activityData}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {activityData.map((_, i) => (
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
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {activityData.map((item, i) => (
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
          Warehouse Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  ID
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Name
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Location
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Capacity
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Items
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Manager
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 font-mono text-primary">
                    {w.id}
                  </td>
                  <td className="py-3 px-2 text-foreground font-medium">
                    {w.name}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {w.location}
                  </td>
                  <td className="py-3 px-2 text-foreground">
                    {w.capacity}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {w.items}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {w.manager}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (w.status || '').toLowerCase() === 'active'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {w.status || 'Unknown'}
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

export default WarehouseReport;
