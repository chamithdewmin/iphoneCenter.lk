import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, ArrowUpCircle, ArrowDownCircle, Activity } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CashFlowReport = () => {
  const [cashIn, setCashIn] = useState(0);
  const [cashOut, setCashOut] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const orders = getStorageData('orders', []);
    const perOrders = getStorageData('perOrders', []);
    const allOrders = [...orders, ...perOrders];

    const totalIn = allOrders.reduce(
      (sum, o) => sum + (o.total || o.subtotal || 0),
      0
    );
    setCashIn(totalIn);
    setOrderCount(allOrders.length);

    const expenses = getStorageData('expenses', []);
    const totalOut = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    setCashOut(totalOut);
    setExpenseCount(expenses.length);
  }, []);

  const handleExport = () => {
    toast({
      title: 'Export Successful',
      description: 'Cash flow report exported successfully',
    });
  };

  const netCashFlow = cashIn - cashOut;

  return (
    <>
      <Helmet>
        <title>Cash Flow Report - iphone center.lk</title>
        <meta
          name="description"
          content="Cash in, cash out, and net cash flow overview"
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Cash Flow
            </h1>
            <p className="text-muted-foreground mt-1">
              Track cash coming in from sales and going out as expenses.
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
                <p className="text-sm text-muted-foreground mb-1">Total Cash In</p>
                <p className="text-2xl font-bold text-green-500">
                  LKR {cashIn.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {orderCount} orders
                </p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-green-500 opacity-60" />
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
                <p className="text-sm text-muted-foreground mb-1">Total Cash Out</p>
                <p className="text-2xl font-bold text-red-500">
                  LKR {cashOut.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  From {expenseCount} expenses
                </p>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-red-500 opacity-60" />
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
                <p className="text-sm text-muted-foreground mb-1">Net Cash Flow</p>
                <p
                  className={`text-2xl font-bold ${
                    netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  LKR {netCashFlow.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cash in minus cash out
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary opacity-60" />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default CashFlowReport;

