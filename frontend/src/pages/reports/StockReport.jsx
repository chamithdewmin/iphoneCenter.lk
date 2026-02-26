import React from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Warehouse, AlertTriangle, Package, TrendingDown } from 'lucide-react';
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

const stockLevels = [
  { category: 'Electronics', inStock: 4500, lowStock: 320 },
  { category: 'Machinery', inStock: 1200, lowStock: 150 },
  { category: 'Materials', inStock: 8200, lowStock: 580 },
  { category: 'Tools', inStock: 3100, lowStock: 210 },
  { category: 'Packaging', inStock: 6800, lowStock: 420 },
];

const stockTrend = [
  { month: 'Jul', level: 22000 },
  { month: 'Aug', level: 24500 },
  { month: 'Sep', level: 21000 },
  { month: 'Oct', level: 26000 },
  { month: 'Nov', level: 23500 },
  { month: 'Dec', level: 28000 },
  { month: 'Jan', level: 25000 },
  { month: 'Feb', level: 27500 },
];

const lowStockItems = [
  {
    name: 'Capacitor 100μF',
    sku: 'CAP-100',
    current: 15,
    reorder: 100,
    warehouse: 'WH-A',
    urgency: 'Critical',
  },
  {
    name: 'Steel Rod 10mm',
    sku: 'STL-010',
    current: 42,
    reorder: 200,
    warehouse: 'WH-B',
    urgency: 'Low',
  },
  {
    name: 'Circuit Board v3',
    sku: 'PCB-003',
    current: 8,
    reorder: 50,
    warehouse: 'WH-A',
    urgency: 'Critical',
  },
  {
    name: 'Rubber Seal M5',
    sku: 'RBS-M05',
    current: 120,
    reorder: 500,
    warehouse: 'WH-C',
    urgency: 'Medium',
  },
  {
    name: 'LED Module 5W',
    sku: 'LED-005',
    current: 35,
    reorder: 150,
    warehouse: 'WH-A',
    urgency: 'Low',
  },
];

const StockReport = () => (
  <ReportLayout
    title="Stock Report"
    subtitle="Monitor inventory levels and stock movements"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Stock Items"
        value="23,800"
        change="+1,200 this month"
        changeType="up"
        icon={Warehouse}
      />
      <StatCard
        label="Low Stock Alerts"
        value="47"
        change="Needs attention"
        changeType="down"
        icon={AlertTriangle}
      />
      <StatCard
        label="Stock Value"
        value="$1.2M"
        change="+5.8% from last month"
        changeType="up"
        icon={Package}
      />
      <StatCard
        label="Out of Stock"
        value="12"
        change="Critical items"
        changeType="down"
        icon={TrendingDown}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">Stock by Category</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stockLevels}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,15%)" />
            <XAxis dataKey="category" stroke="hsl(215,15%,55%)" fontSize={12} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'hsl(225,21%,7.5%)',
                border: '1px solid hsl(225,15%,15%)',
                borderRadius: '8px',
                color: 'hsl(210,20%,90%)',
              }}
            />
            <Bar dataKey="inStock" fill="hsl(187,80%,48%)" radius={[4, 4, 0, 0]} name="In Stock" />
            <Bar dataKey="lowStock" fill="hsl(35,90%,55%)" radius={[4, 4, 0, 0]} name="Low Stock" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">Stock Level Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={stockTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,15%)" />
            <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
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
      <h3 className="text-foreground font-semibold mb-4">Low Stock Alerts</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Item</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">SKU</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Current</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                Reorder Level
              </th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Warehouse</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Urgency</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map((item) => (
              <tr
                key={item.sku}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 text-foreground font-medium">{item.name}</td>
                <td className="py-3 px-2 font-mono text-primary">{item.sku}</td>
                <td className="py-3 px-2 text-foreground">{item.current}</td>
                <td className="py-3 px-2 text-muted-foreground">{item.reorder}</td>
                <td className="py-3 px-2 text-muted-foreground">{item.warehouse}</td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.urgency === 'Critical'
                        ? 'bg-destructive/10 text-destructive'
                        : item.urgency === 'Medium'
                        ? 'bg-warning/10 text-warning'
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

export default StockReport;
