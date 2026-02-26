import React from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Truck, Star, Clock, CheckCircle } from 'lucide-react';
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

const supplierSpend = [
  { name: 'ABC Supplies', spend: 85000 },
  { name: 'XYZ Materials', spend: 62000 },
  { name: 'Global Parts', spend: 78000 },
  { name: 'Tech Comp.', spend: 45000 },
  { name: 'Quality Goods', spend: 53000 },
];

const supplierPerformance = [
  { metric: 'Quality', score: 88 },
  { metric: 'Delivery', score: 82 },
  { metric: 'Pricing', score: 75 },
  { metric: 'Response', score: 90 },
  { metric: 'Compliance', score: 85 },
  { metric: 'Innovation', score: 70 },
];

const suppliers = [
  {
    name: 'ABC Supplies',
    category: 'Raw Materials',
    rating: 4.8,
    orders: 234,
    onTime: '96%',
    totalSpend: '$85,000',
    status: 'Preferred',
  },
  {
    name: 'XYZ Materials',
    category: 'Packaging',
    rating: 4.5,
    orders: 178,
    onTime: '92%',
    totalSpend: '$62,000',
    status: 'Approved',
  },
  {
    name: 'Global Parts',
    category: 'Components',
    rating: 4.7,
    orders: 156,
    onTime: '94%',
    totalSpend: '$78,000',
    status: 'Preferred',
  },
  {
    name: 'Tech Components',
    category: 'Electronics',
    rating: 4.2,
    orders: 98,
    onTime: '88%',
    totalSpend: '$45,000',
    status: 'Approved',
  },
  {
    name: 'Quality Goods',
    category: 'General',
    rating: 4.4,
    orders: 134,
    onTime: '91%',
    totalSpend: '$53,000',
    status: 'Under Review',
  },
];

const SupplierReport = () => (
  <ReportLayout
    title="Supplier Report"
    subtitle="Evaluate supplier performance and relationships"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Active Suppliers"
        value="48"
        change="+5 new partnerships"
        changeType="up"
        icon={Truck}
      />
      <StatCard
        label="Avg. Rating"
        value="4.5★"
        change="Above benchmark"
        changeType="up"
        icon={Star}
      />
      <StatCard
        label="On-Time Delivery"
        value="92.2%"
        change="+2.1% improvement"
        changeType="up"
        icon={Clock}
      />
      <StatCard
        label="Quality Score"
        value="88/100"
        change="Excellent rating"
        changeType="up"
        icon={CheckCircle}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="report-card lg:col-span-2">
        <h3 className="text-foreground font-semibold mb-4">Spend by Supplier</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={supplierSpend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,15%)" />
            <XAxis dataKey="name" stroke="hsl(215,15%,55%)" fontSize={12} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'hsl(225,21%,7.5%)',
                border: '1px solid hsl(225,15%,15%)',
                borderRadius: '8px',
                color: 'hsl(210,20%,90%)',
              }}
            />
            <Bar dataKey="spend" fill="hsl(150,60%,45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">Performance Radar</h3>
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
      <h3 className="text-foreground font-semibold mb-4">Supplier Directory</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Supplier</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Category</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Rating</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Orders</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">On-Time</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Total Spend</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr
                key={s.name}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 text-foreground font-medium">{s.name}</td>
                <td className="py-3 px-2 text-muted-foreground">{s.category}</td>
                <td className="py-3 px-2">
                  <span className="text-warning">
                    {'★'.repeat(Math.floor(s.rating))}
                  </span>{' '}
                  {s.rating}
                </td>
                <td className="py-3 px-2 text-foreground">{s.orders}</td>
                <td className="py-3 px-2 text-foreground">{s.onTime}</td>
                <td className="py-3 px-2 text-foreground font-medium">{s.totalSpend}</td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.status === 'Preferred'
                        ? 'bg-success/10 text-success'
                        : s.status === 'Approved'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {s.status}
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

export default SupplierReport;
