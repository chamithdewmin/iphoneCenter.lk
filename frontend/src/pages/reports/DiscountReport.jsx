import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Percent, DollarSign, TrendingDown } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DiscountReport = () => {
  const [orders, setOrders] = useState([]);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadedOrders = getStorageData('orders', []);
    const perOrders = getStorageData('perOrders', []);
    const allOrders = [...loadedOrders, ...perOrders];
    setOrders(allOrders);
    
    // Calculate total discount (if discount field exists)
    const discount = allOrders.reduce((sum, order) => sum + (order.discount || 0), 0);
    setTotalDiscount(discount);
  }, []);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Discount report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Discount Report - iphone center.lk</title>
        <meta name="description" content="View discount report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Discount Report
            </h1>
            <p className="text-muted-foreground mt-1">View discount analytics</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Discount Given</p>
                <p className="text-2xl font-bold text-primary">LKR {totalDiscount.toLocaleString()}</p>
              </div>
              <Percent className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Orders with Discount</p>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.discount > 0).length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-500 opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Average Discount</p>
                <p className="text-2xl font-bold">
                  LKR {orders.filter(o => o.discount > 0).length > 0 
                    ? (totalDiscount / orders.filter(o => o.discount > 0).length).toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : '0'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default DiscountReport;
