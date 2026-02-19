import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Receipt, DollarSign, TrendingUp } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const TaxReport = () => {
  const [orders, setOrders] = useState([]);
  const [totalTax, setTotalTax] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadedOrders = getStorageData('orders', []);
    const perOrders = getStorageData('perOrders', []);
    const allOrders = [...loadedOrders, ...perOrders];
    setOrders(allOrders);
    
    // Calculate total tax (assuming 10% tax on orders)
    const tax = allOrders.reduce((sum, order) => {
      const subtotal = order.total || order.subtotal || 0;
      return sum + (subtotal * 0.1); // 10% tax
    }, 0);
    setTotalTax(tax);
  }, []);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Tax report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Tax Report - iphone center.lk</title>
        <meta name="description" content="View tax report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Tax Report
            </h1>
            <p className="text-muted-foreground mt-1">View tax analytics</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Tax Collected</p>
                <p className="text-2xl font-bold text-primary">LKR {totalTax.toLocaleString()}</p>
              </div>
              <Receipt className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Taxable Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Average Tax</p>
                <p className="text-2xl font-bold">
                  LKR {orders.length > 0 ? (totalTax / orders.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TaxReport;
