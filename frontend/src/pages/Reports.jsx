import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Reports = () => {
  const [salesByDay, setSalesByDay] = useState([]);
  const [revenueByBrand, setRevenueByBrand] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const orders = getStorageData('orders', []);
    const perOrders = getStorageData('perOrders', []);

    // Calculate totals
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const perOrderRevenue = perOrders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    setTotalRevenue(revenue + perOrderRevenue);
    setTotalOrders(orders.length + perOrders.length);

    // Sales by day (mock data for demo)
    const mockSalesByDay = [
      { date: 'Mon', sales: 45000, orders: 12 },
      { date: 'Tue', sales: 52000, orders: 15 },
      { date: 'Wed', sales: 38000, orders: 10 },
      { date: 'Thu', sales: 61000, orders: 18 },
      { date: 'Fri', sales: 48000, orders: 14 },
      { date: 'Sat', sales: 72000, orders: 22 },
      { date: 'Sun', sales: 55000, orders: 16 },
    ];
    setSalesByDay(mockSalesByDay);

    // Revenue by brand
    const brandRevenue = {};
    [...orders, ...perOrders].forEach(order => {
      const items = order.items || [];
      items.forEach(item => {
        const brand = item.brand || item.make || 'Unknown';
        if (!brandRevenue[brand]) {
          brandRevenue[brand] = 0;
        }
        brandRevenue[brand] += (item.price || 0) * (item.quantity || 1);
      });
    });

    const revenueData = Object.entries(brandRevenue)
      .map(([brand, revenue]) => ({ brand, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    setRevenueByBrand(revenueData);
  }, []);

  const COLORS = ['var(--primary)', '#f97316', '#10b981', '#f59e0b', '#ef4444'];

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Reports - iphone center.lk</title>
        <meta name="description" content="View sales analytics and reports" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">View your sales performance and insights</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">LKR {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Order Value</p>
                <p className="text-2xl font-bold">
                  LKR {totalOrders > 0 ? (totalRevenue / totalOrders).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <PieChartIcon className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales by day */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Sales by Day</h2>
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20" />
                <XAxis dataKey="date" stroke="currentColor" className="text-xs" />
                <YAxis stroke="currentColor" className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--card-foreground)',
                  }}
                />
                <Bar dataKey="sales" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Revenue by brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Revenue by Brand</h2>
              <PieChartIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            {revenueByBrand.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByBrand}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ brand, percent }) => `${brand} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {revenueByBrand.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      color: 'var(--card-foreground)',
                    }}
                    formatter={(value) => `LKR ${value.toLocaleString()}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No revenue data available</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Reports;
