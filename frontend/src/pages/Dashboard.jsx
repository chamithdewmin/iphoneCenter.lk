import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, DollarSign, Package, ShoppingBag, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { authFetch } from '@/lib/api';
import KpiCard from '@/components/KpiCard';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { BranchFilter } from '@/components/BranchFilter';

const Dashboard = () => {
  const { selectedBranchId } = useBranchFilter();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalOrders: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const salesUrl = selectedBranchId ? `/api/billing/sales?branchId=${selectedBranchId}` : '/api/billing/sales';
      const dailyUrl = selectedBranchId ? `/api/reports/daily-summary?branchId=${selectedBranchId}` : '/api/reports/daily-summary';
      const [customersRes, productsRes, salesRes, dailyRes] = await Promise.all([
        authFetch('/api/customers'),
        authFetch('/api/inventory/products'),
        authFetch(salesUrl),
        authFetch(dailyUrl),
      ]);
      const customers = Array.isArray(customersRes.data?.data) ? customersRes.data.data : [];
      const products = Array.isArray(productsRes.data?.data) ? productsRes.data.data : [];
      const sales = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
      const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);
      const daily = dailyRes.data?.data || [];
      setStats({
        totalCustomers: customers.length,
        totalRevenue,
        totalProducts: products.length,
        totalOrders: sales.length,
      });
      if (Array.isArray(daily) && daily.length > 0) {
        const chartData = daily.map(d => ({ name: d.date || d.label, sales: d.sale_count || 0, revenue: parseFloat(d.total_sales) || 0 }));
        setSalesData(chartData);
        setRevenueData(chartData);
      } else {
        const fallback = [{ name: 'Total', sales: sales.length, revenue: totalRevenue }];
        setSalesData(fallback);
        setRevenueData(fallback);
      }
      setLoading(false);
    })();
  }, [selectedBranchId]);

  return (
    <>
      <Helmet>
        <title>Dashboard - iphone center.lk</title>
        <meta name="description" content="iphone center.lk dashboard with sales analytics and key metrics" />
      </Helmet>

      <div className="space-y-6">
        {/* Header + Branch filter (Admin only) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
          </div>
          <BranchFilter id="dashboard-branch" />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <KpiCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={Users}
              trend={12.5}
              trendUp={true}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <KpiCard
              title="Total Revenue"
              value={`LKR ${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              trend={8.2}
              trendUp={true}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <KpiCard
              title="Total Products"
              value={stats.totalProducts}
              icon={Package}
              trend={-2.4}
              trendUp={false}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <KpiCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              trend={15.3}
              trendUp={true}
            />
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Sales Overview</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Orders</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
                <XAxis dataKey="name" stroke="currentColor" className="text-xs" />
                <YAxis stroke="currentColor" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--card-foreground)',
                  }}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Revenue Trend</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Revenue (LKR)</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
                <XAxis dataKey="name" stroke="currentColor" className="text-xs" />
                <YAxis stroke="currentColor" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--card-foreground)',
                  }}
                  formatter={(value) => `LKR ${value.toLocaleString()}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(142 76% 36%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 76% 36%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-card rounded-xl p-6 border border-secondary shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Order Value</p>
                <p className="text-2xl font-bold">
                  LKR {stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 border border-secondary shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Products in Stock</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 border border-secondary shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Customers</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Dashboard;
