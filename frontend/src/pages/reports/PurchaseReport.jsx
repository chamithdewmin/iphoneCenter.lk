import React from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { ShoppingCart, TrendingUp, FileText, DollarSign } from 'lucide-react';
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

const monthlyData = [
  { month: 'Jul', amount: 45000 },
  { month: 'Aug', amount: 52000 },
  { month: 'Sep', amount: 48000 },
  { month: 'Oct', amount: 61000 },
  { month: 'Nov', amount: 55000 },
  { month: 'Dec', amount: 67000 },
  { month: 'Jan', amount: 72000 },
  { month: 'Feb', amount: 58000 },
];

const categoryData = [
  { name: 'Raw Materials', value: 35 },
  { name: 'Packaging', value: 25 },
  { name: 'Equipment', value: 20 },
  { name: 'Services', value: 20 },
];

const COLORS = [
  'hsl(187,80%,48%)',
  'hsl(260,60%,55%)',
  'hsl(150,60%,45%)',
  'hsl(35,90%,55%)',
];

const recentPurchases = [
  { id: 'PO-1024', supplier: 'ABC Supplies', amount: '$12,500', date: 'Feb 24', status: 'Received' },
  { id: 'PO-1023', supplier: 'XYZ Materials', amount: '$8,300', date: 'Feb 22', status: 'In Transit' },
  { id: 'PO-1022', supplier: 'Global Parts', amount: '$15,700', date: 'Feb 20', status: 'Received' },
  { id: 'PO-1021', supplier: 'Tech Components', amount: '$6,200', date: 'Feb 18', status: 'Pending' },
  { id: 'PO-1020', supplier: 'Quality Goods', amount: '$9,800', date: 'Feb 16', status: 'Received' },
];

const PurchaseReport = () => (
  <ReportLayout
    title="Purchase Report"
    subtitle="Track and analyze all purchasing activities"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Purchases"
        value="$428,500"
        change="+12.5% from last month"
        changeType="up"
        icon={ShoppingCart}
      />
      <StatCard
        label="Purchase Orders"
        value="156"
        change="+8 this week"
        changeType="up"
        icon={FileText}
      />
      <StatCard
        label="Avg. Order Value"
        value="$2,747"
        change="-3.2% from last month"
        changeType="down"
        icon={DollarSign}
      />
      <StatCard
        label="Growth Rate"
        value="12.5%"
        change="Trending upward"
        changeType="up"
        icon={TrendingUp}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="report-card lg:col-span-2">
        <h3 className="text-foreground font-semibold mb-4">Monthly Purchase Trends</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
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
            <Bar dataKey="amount" fill="hsl(187,80%,48%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">Purchase by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={categoryData}
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              paddingAngle={4}
            >
              {categoryData.map((_, i) => (
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
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2">
          {categoryData.map((item, i) => (
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

    <div className="report-card">
      <h3 className="text-foreground font-semibold mb-4">Recent Purchase Orders</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Order ID</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Amount</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentPurchases.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 font-mono text-primary">{p.id}</td>
                <td className="py-3 px-2 text-foreground">{p.supplier}</td>
                <td className="py-3 px-2 text-foreground font-medium">{p.amount}</td>
                <td className="py-3 px-2 text-muted-foreground">{p.date}</td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'Received'
                        ? 'bg-success/10 text-success'
                        : p.status === 'In Transit'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
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

export default PurchaseReport;
