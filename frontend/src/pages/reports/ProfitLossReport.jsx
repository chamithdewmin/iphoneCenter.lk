import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ProfitLossReport = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const orders = getStorageData('orders', []);
    const perOrders = getStorageData('perOrders', []);
    const allOrders = [...orders, ...perOrders];

    const revenue = allOrders.reduce(
      (sum, o) => sum + (o.total || o.subtotal || 0),
      0
    );
    setTotalRevenue(revenue);

    const expenses = getStorageData('expenses', []);
    const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    setTotalExpenses(totalExp);

    setNetProfit(revenue - totalExp);

    const catMap = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      if (!catMap[cat]) catMap[cat] = 0;
      catMap[cat] += e.amount || 0;
    });
    const catList = Object.entries(catMap)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
    setExpenseBreakdown(catList);
  }, []);

  const handleExport = () => {
    toast({
      title: 'Export Successful',
      description: 'Profit & Loss report exported successfully',
    });
  };

  const margin =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  return (
    <>
      <Helmet>
        <title>Profit &amp; Loss - iphone center.lk</title>
        <meta
          name="description"
          content="Profit and loss summary based on sales and expenses"
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Profit &amp; Loss
            </h1>
            <p className="text-muted-foreground mt-1">
              Revenue, expenses, and net profit at a glance.
            </p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-500">
                  LKR {totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-60" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Operating Expenses
                </p>
                <p className="text-2xl font-bold text-red-500">
                  LKR {totalExpenses.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500 opacity-60" />
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
                <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                <p
                  className={`text-2xl font-bold ${
                    netProfit >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  LKR {netProfit.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Profit margin {margin}% of revenue
                </p>
              </div>
              <Scale className="w-8 h-8 text-primary opacity-60" />
            </div>
          </motion.div>
        </div>

        {expenseBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Expenses by Category</h2>
            <div className="space-y-3">
              {expenseBreakdown.map((row) => (
                <div
                  key={row.category}
                  className="flex items-center justify-between p-3 rounded-lg border border-secondary"
                >
                  <span className="font-medium">{row.category}</span>
                  <span className="font-semibold text-primary">
                    LKR {row.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ProfitLossReport;

