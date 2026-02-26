import React from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Users, UserPlus, Heart, TrendingUp } from 'lucide-react';
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

const customerGrowth = [
  { month: 'Jul', customers: 1200 },
  { month: 'Aug', customers: 1350 },
  { month: 'Sep', customers: 1480 },
  { month: 'Oct', customers: 1620 },
  { month: 'Nov', customers: 1780 },
  { month: 'Dec', customers: 1950 },
  { month: 'Jan', customers: 2100 },
  { month: 'Feb', customers: 2340 },
];

const revenueBySegment = [
  { segment: 'Enterprise', revenue: 125000 },
  { segment: 'SMB', revenue: 85000 },
  { segment: 'Retail', revenue: 62000 },
  { segment: 'Wholesale', revenue: 48000 },
];

const topCustomers = [
  {
    name: 'Acme Corporation',
    segment: 'Enterprise',
    totalOrders: 156,
    revenue: '$245,800',
    lastOrder: 'Feb 25',
    status: 'Active',
  },
  {
    name: 'Beta Industries',
    segment: 'Enterprise',
    totalOrders: 98,
    revenue: '$178,500',
    lastOrder: 'Feb 24',
    status: 'Active',
  },
  {
    name: 'Gamma Retail',
    segment: 'Retail',
    totalOrders: 234,
    revenue: '$142,300',
    lastOrder: 'Feb 23',
    status: 'Active',
  },
  {
    name: 'Delta Trading',
    segment: 'Wholesale',
    totalOrders: 67,
    revenue: '$98,700',
    lastOrder: 'Feb 20',
    status: 'Inactive',
  },
  {
    name: 'Epsilon Tech',
    segment: 'SMB',
    totalOrders: 45,
    revenue: '$67,200',
    lastOrder: 'Feb 18',
    status: 'Active',
  },
];

const CustomerReport = () => (
  <ReportLayout
    title="Customer Report"
    subtitle="Understand customer behavior and retention"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Customers"
        value="2,340"
        change="+240 this month"
        changeType="up"
        icon={Users}
      />
      <StatCard
        label="New Customers"
        value="142"
        change="+28% growth"
        changeType="up"
        icon={UserPlus}
      />
      <StatCard
        label="Retention Rate"
        value="94.2%"
        change="+1.8% improvement"
        changeType="up"
        icon={Heart}
      />
      <StatCard
        label="Avg. Lifetime Value"
        value="$12,450"
        change="+$1,200 increase"
        changeType="up"
        icon={TrendingUp}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">Customer Growth</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={customerGrowth}>
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
              dataKey="customers"
              stroke="hsl(187,80%,48%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(187,80%,48%)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">Revenue by Segment</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueBySegment}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,15%)" />
            <XAxis dataKey="segment" stroke="hsl(215,15%,55%)" fontSize={12} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'hsl(225,21%,7.5%)',
                border: '1px solid hsl(225,15%,15%)',
                borderRadius: '8px',
                color: 'hsl(210,20%,90%)',
              }}
            />
            <Bar dataKey="revenue" fill="hsl(260,60%,55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="report-card">
      <h3 className="text-foreground font-semibold mb-4">Top Customers</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Customer</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Segment</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Orders</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Revenue</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                Last Order
              </th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c) => (
              <tr
                key={c.name}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 text-foreground font-medium">{c.name}</td>
                <td className="py-3 px-2 text-muted-foreground">{c.segment}</td>
                <td className="py-3 px-2 text-foreground">{c.totalOrders}</td>
                <td className="py-3 px-2 text-foreground font-medium">{c.revenue}</td>
                <td className="py-3 px-2 text-muted-foreground">{c.lastOrder}</td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'Active'
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground'
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

export default CustomerReport;
