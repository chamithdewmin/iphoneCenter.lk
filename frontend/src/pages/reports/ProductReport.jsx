import React, { useEffect, useMemo, useState } from 'react';
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
import { authFetch } from '@/lib/api';

const ProductReport = () => {
  const [products, setProducts] = useState([]);
  const [topProductsRaw, setTopProductsRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [prodRes, topRes] = await Promise.all([
        authFetch('/api/inventory/products'),
        authFetch('/api/reports/top-products?limit=10'),
      ]);

      const prods =
        prodRes.ok && Array.isArray(prodRes.data?.data)
          ? prodRes.data.data
          : [];
      const top =
        topRes.ok && Array.isArray(topRes.data?.data)
          ? topRes.data.data
          : [];

      setProducts(prods);
      setTopProductsRaw(top);
      setLoading(false);
    })();
  }, []);

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

  return (
    <ReportLayout
      title="Product Report"
      subtitle="Analyze product performance and sales metrics"
    >
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
