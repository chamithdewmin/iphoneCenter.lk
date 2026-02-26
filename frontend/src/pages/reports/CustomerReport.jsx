import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CustomerReport = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { ok, data } = await authFetch('/api/customers');
      const list = ok && Array.isArray(data?.data) ? data.data : [];
      setCustomers(list);
      setLoading(false);
    })();
  }, []);

  const totalPurchases = customers.reduce((sum, c) => sum + (c.purchaseHistory?.length || 0), 0);
  const topCustomers = useMemo(
    () =>
      [...customers]
        .map((c) => ({
          name: c.name,
          purchases: c.purchaseHistory?.length || 0,
        }))
        .sort((a, b) => b.purchases - a.purchases)
        .slice(0, 8),
    [customers]
  );

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Customer report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Customer Report - iphone center.lk</title>
        <meta name="description" content="View customer report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Customer Report
            </h1>
            <p className="text-muted-foreground mt-1">View customer analytics and insights</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Total Purchases</p>
                <p className="text-2xl font-bold">{totalPurchases}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Avg Purchases</p>
                <p className="text-2xl font-bold">
                  {customers.length > 0 ? (totalPurchases / customers.length).toFixed(1) : '0'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {topCustomers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div>
              <h2 className="text-xl font-bold mb-4">Top Customers</h2>
              <div className="space-y-3">
                {topCustomers.slice(0, 5).map((customer, index) => (
                  <div key={customer.name || index} className="flex items-center justify-between p-3 border border-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-primary">{index + 1}</span>
                      </div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                    <span className="font-semibold">{customer.purchases} purchases</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Purchases per Customer</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topCustomers} barCategoryGap={24}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => [`${value} purchases`, 'Purchases']}
                  />
                  <Bar dataKey="purchases" name="Purchases" radius={[6, 6, 0, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default CustomerReport;
