import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Building2, PackageCheck, Truck, BarChart3 } from 'lucide-react';
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

const COLORS = [
  'hsl(187,80%,48%)',
  'hsl(260,60%,55%)',
  'hsl(35,90%,55%)',
  'hsl(150,60%,45%)',
];

const WarehouseReport = () => {
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const loaded = getStorageData('warehouses', []);
    setWarehouses(Array.isArray(loaded) ? loaded : []);
  }, []);

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

  return (
    <ReportLayout
      title="Warehouse Report"
      subtitle="Overview of warehouse operations and utilization"
    >
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
