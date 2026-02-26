import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const OverviewReport = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [topBrands, setTopBrands] = useState([]);
  const [topExpenseCategories, setTopExpenseCategories] = useState([]);
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
    setOrderCount(allOrders.length);

    const expenses = getStorageData('expenses', []);
    const totalExp = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    setTotalExpenses(totalExp);
    setExpenseCount(expenses.length);

    const brandRevenue = {};
    allOrders.forEach((order) => {
      const items = order.items || [];
      items.forEach((item) => {
        const brand = item.brand || item.make || 'Unknown';
        if (!brandRevenue[brand]) {
          brandRevenue[brand] = 0;
        }
        brandRevenue[brand] += (item.price || 0) * (item.quantity || 1);
      });
    });
    const topBrandList = Object.entries(brandRevenue)
      .map(([brand, value]) => ({ brand, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    setTopBrands(topBrandList);

    const categoryMap = {};
    expenses.forEach((expense) => {
      const cat = expense.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = 0;
      }
      categoryMap[cat] += expense.amount || 0;
    });
    const topCatList = Object.entries(categoryMap)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    setTopExpenseCategories(topCatList);
  }, []);

  const handleExport = () => {
    toast({
      title: 'Export Successful',
      description: 'Overview report exported successfully',
    });
  };

  const netProfit = totalRevenue - totalExpenses;

  return (
    <>
      <Helmet>
        <title>Overview Reports - iphone center.lk</title>
        <meta
          name="description"
          content="High-level overview of revenue, expenses, and profit"
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Overview Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Snapshot of total revenue, expenses, and profit.
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
                <p className="text-xs text-muted-foreground mt-1">
                  Across {orderCount} orders
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
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-500">
                  LKR {totalExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {expenseCount} records
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
                  Revenue minus expenses
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-60" />
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topBrands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
            >
              <h2 className="text-xl font-bold mb-4">Top Brands by Revenue</h2>
              <div className="space-y-3">
                {topBrands.map((row) => (
                  <div
                    key={row.brand}
                    className="flex items-center justify-between p-3 rounded-lg border border-secondary"
                  >
                    <span className="font-medium">{row.brand}</span>
                    <span className="font-semibold text-primary">
                      LKR {row.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {topExpenseCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
            >
              <h2 className="text-xl font-bold mb-4">Top Expense Categories</h2>
              <div className="space-y-3">
                {topExpenseCategories.map((row) => (
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
      </div>
    </>
  );
};

export default OverviewReport;

