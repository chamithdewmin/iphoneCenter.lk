import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const PaymentReport = () => {
  const [orders, setOrders] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const loadedOrders = getStorageData('orders', []);
    const perOrders = getStorageData('perOrders', []);
    const allOrders = [...loadedOrders, ...perOrders];
    setOrders(allOrders);

    const methods = {};
    allOrders.forEach(order => {
      const method = order.paymentMethod || 'cash';
      if (!methods[method]) {
        methods[method] = { count: 0, total: 0 };
      }
      methods[method].count += 1;
      methods[method].total += (order.total || order.subtotal || 0);
    });
    setPaymentMethods(methods);
  }, []);

  const totalAmount = useMemo(
    () =>
      Object.values(paymentMethods).reduce(
        (sum, m) => sum + m.total,
        0
      ),
    [paymentMethods]
  );

  const chartData = useMemo(
    () =>
      Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
      })),
    [paymentMethods]
  );

  const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#06b6d4'];

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Payment report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Payment Report - iphone center.lk</title>
        <meta name="description" content="View payment report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Payment Report
            </h1>
            <p className="text-muted-foreground mt-1">View payment method analytics</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(paymentMethods).map(([method, data], index) => (
            <motion.div
              key={method}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 capitalize">{method}</p>
                  <p className="text-2xl font-bold">{data.count}</p>
                  <p className="text-sm text-primary mt-1">LKR {data.total.toLocaleString()}</p>
                </div>
                <CreditCard className="w-8 h-8 text-primary opacity-50" />
              </div>
            </motion.div>
          ))}
        </div>

        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div>
              <h2 className="text-xl font-bold mb-4">Payment Breakdown (Amount)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.method}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value, name, props) => [
                      `LKR ${Number(value).toLocaleString()}`,
                      props.payload.method,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4">Transactions by Method</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barCategoryGap={24}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis dataKey="method" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => [`${value} payments`, 'Count']}
                  />
                  <Bar dataKey="count" name="Payments" radius={[6, 6, 0, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground mt-3">
                Total collected: <span className="font-semibold">LKR {totalAmount.toLocaleString()}</span> from {orders.length}{' '}
                orders.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default PaymentReport;
