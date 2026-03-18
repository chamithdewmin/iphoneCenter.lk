import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Users, Package, ShoppingBag, FolderTree } from 'lucide-react';
import { authFetch } from '@/lib/api';
import KpiCard from '@/components/KpiCard';
import { useBranchFilter } from '@/hooks/useBranchFilter';
import { BranchFilter } from '@/components/BranchFilter';

const Dashboard = () => {
  const { selectedBranchId, setSelectedBranchId } = useBranchFilter();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      const salesUrl = selectedBranchId ? `/api/billing/sales?branchId=${selectedBranchId}` : '/api/billing/sales';
      const [customersRes, productsRes, salesRes, categoriesRes] = await Promise.all([
        authFetch('/api/customers'),
        authFetch('/api/inventory/products'),
        authFetch(salesUrl),
        authFetch('/api/categories'),
      ]);
      const resList = [
        { name: 'Customers', res: customersRes },
        { name: 'Products', res: productsRes },
        { name: 'Sales', res: salesRes },
        { name: 'Categories', res: categoriesRes },
      ];
      const failed = resList.find((r) => !r.res.ok);
      if (failed) {
        const msg = failed.res.data?.message || failed.res.data?.detail || `Failed to load ${failed.name}`;
        setLoadError(msg);
      }
      const customers = Array.isArray(customersRes.data?.data) ? customersRes.data.data : [];
      const products = Array.isArray(productsRes.data?.data) ? productsRes.data.data : [];
      const sales = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
      const categories = Array.isArray(categoriesRes.data?.data) ? categoriesRes.data.data : [];
      setStats({
        totalCustomers: customers.length,
        totalProducts: products.length,
        totalOrders: sales.length,
        totalCategories: categories.length,
      });
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
          <BranchFilter id="dashboard-branch" value={selectedBranchId} onChange={setSelectedBranchId} />
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
              title="Total Categories"
              value={stats.totalCategories}
              icon={FolderTree}
              trend={null}
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
              title="Total Sale"
              value={stats.totalOrders}
              icon={ShoppingBag}
              trend={15.3}
              trendUp={true}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
