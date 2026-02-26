import React from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { Package, TrendingUp, Star, BarChart3 } from 'lucide-react';
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

const salesByProduct = [
  { name: 'Widget A', sales: 4200 },
  { name: 'Widget B', sales: 3800 },
  { name: 'Gadget X', sales: 5100 },
  { name: 'Part Y', sales: 2900 },
  { name: 'Tool Z', sales: 3500 },
  { name: 'Kit M', sales: 4600 },
];

const performanceData = [
  { subject: 'Sales', A: 85 },
  { subject: 'Quality', A: 92 },
  { subject: 'Delivery', A: 78 },
  { subject: 'Returns', A: 65 },
  { subject: 'Reviews', A: 88 },
  { subject: 'Margin', A: 75 },
];

const products = [
  {
    name: 'Gadget X Pro',
    sku: 'GX-1001',
    price: '$149.99',
    sold: 1240,
    revenue: '$185,988',
    rating: 4.8,
  },
  {
    name: 'Widget A Plus',
    sku: 'WA-2003',
    price: '$89.99',
    sold: 980,
    revenue: '$88,190',
    rating: 4.5,
  },
  {
    name: 'Kit M Standard',
    sku: 'KM-3005',
    price: '$249.99',
    sold: 620,
    revenue: '$154,994',
    rating: 4.7,
  },
  {
    name: 'Tool Z Elite',
    sku: 'TZ-4002',
    price: '$59.99',
    sold: 1580,
    revenue: '$94,784',
    rating: 4.3,
  },
  {
    name: 'Part Y Basic',
    sku: 'PY-5001',
    price: '$29.99',
    sold: 2100,
    revenue: '$62,979',
    rating: 4.1,
  },
];

const ProductReport = () => (
  <ReportLayout
    title="Product Report"
    subtitle="Analyze product performance and sales metrics"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Products"
        value="248"
        change="+12 new this month"
        changeType="up"
        icon={Package}
      />
      <StatCard
        label="Total Revenue"
        value="$586,935"
        change="+18.2% growth"
        changeType="up"
        icon={TrendingUp}
      />
      <StatCard
        label="Avg. Rating"
        value="4.5★"
        change="Based on 3.2k reviews"
        changeType="up"
        icon={Star}
      />
      <StatCard
        label="Top Category"
        value="Electronics"
        change="42% of total sales"
        changeType="up"
        icon={BarChart3}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="report-card lg:col-span-2">
        <h3 className="text-foreground font-semibold mb-4">Sales by Product</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={salesByProduct} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,15%)" />
            <XAxis type="number" stroke="hsl(215,15%,55%)" fontSize={12} />
            <YAxis
              dataKey="name"
              type="category"
              stroke="hsl(215,15%,55%)"
              fontSize={12}
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(225,21%,7.5%)',
                border: '1px solid hsl(225,15%,15%)',
                borderRadius: '8px',
                color: 'hsl(210,20%,90%)',
              }}
            />
            <Bar dataKey="sales" fill="hsl(260,60%,55%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">Performance Radar</h3>
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
      <h3 className="text-foreground font-semibold mb-4">Top Performing Products</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Product</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">SKU</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Price</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Sold</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Revenue</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.sku}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 text-foreground font-medium">{p.name}</td>
                <td className="py-3 px-2 font-mono text-primary">{p.sku}</td>
                <td className="py-3 px-2 text-foreground">{p.price}</td>
                <td className="py-3 px-2 text-muted-foreground">
                  {p.sold.toLocaleString()}
                </td>
                <td className="py-3 px-2 text-foreground font-medium">{p.revenue}</td>
                <td className="py-3 px-2">
                  <span className="text-warning">
                    {'★'.repeat(Math.floor(p.rating))}
                  </span>{' '}
                  {p.rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </ReportLayout>
);

export default ProductReport;
