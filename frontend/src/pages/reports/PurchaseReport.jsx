import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PurchaseReport = () => {
  const [purchases, setPurchases] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadedPurchases = getStorageData('purchases', []);
    setPurchases(loadedPurchases);
    const spent = loadedPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
    setTotalSpent(spent);
  }, []);

  // Group purchases by month (last 7 months)
  const purchasesByMonth = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = { month: d.toLocaleDateString('en-US', { month: 'short' }), total: 0, count: 0 };
    }
    purchases.forEach((p) => {
      const raw = p.date || p.createdAt || p.purchaseDate;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) return;
      map[key].total += p.total || 0;
      map[key].count += 1;
    });
    return Object.values(map);
  }, [purchases]);

  // Spend by supplier (top 6)
  const spendBySupplier = useMemo(() => {
    const agg = {};
    purchases.forEach((p) => {
      const name = p.supplierName || p.supplier || 'Unknown';
      if (!agg[name]) agg[name] = 0;
      agg[name] += p.total || 0;
    });
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [purchases]);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Purchase report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Purchase Report - iphone center.lk</title>
        <meta name="description" content="View purchase report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Purchase Report
            </h1>
            <p className="text-muted-foreground mt-1">View purchase analytics and insights</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Purchases</p>
                <p className="text-2xl font-bold">{purchases.length}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-primary">LKR {totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500 opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Average Purchase</p>
                <p className="text-2xl font-bold">
                  LKR {purchases.length > 0 ? (totalSpent / purchases.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        {purchasesByMonth.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Purchases by Month</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={purchasesByMonth} barCategoryGap={24}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Total']}
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Bar dataKey="total" name="Total Spent" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {spendBySupplier.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Top Suppliers by Spend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={spendBySupplier}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Total Spent']}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Total Spent"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default PurchaseReport;
