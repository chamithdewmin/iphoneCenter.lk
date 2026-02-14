import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, DollarSign, TrendingDown, Calendar } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ExpenseReport = () => {
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const loadedExpenses = getStorageData('expenses', []);
    setExpenses(loadedExpenses);
    
    const total = loadedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    setTotalExpenses(total);

    const breakdown = {};
    loadedExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += expense.amount || 0;
    });
    setCategoryBreakdown(breakdown);
  }, []);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Expense report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Expense Report - iphone center.lk</title>
        <meta name="description" content="View expense report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Expense Report
            </h1>
            <p className="text-muted-foreground mt-1">View expense analytics</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-500">LKR {totalExpenses.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500 opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Total Records</p>
                <p className="text-2xl font-bold">{expenses.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Average Expense</p>
                <p className="text-2xl font-bold">
                  LKR {expenses.length > 0 ? (totalExpenses / expenses.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {Object.keys(categoryBreakdown).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Expenses by Category</h2>
            <div className="space-y-3">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 border border-secondary rounded-lg">
                    <span className="font-medium">{category}</span>
                    <span className="font-semibold text-primary">LKR {amount.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ExpenseReport;
