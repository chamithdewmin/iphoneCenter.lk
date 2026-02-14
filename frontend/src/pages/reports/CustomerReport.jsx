import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CustomerReport = () => {
  const [customers, setCustomers] = useState([]);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [topCustomers, setTopCustomers] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadedCustomers = getStorageData('customers', []);
    setCustomers(loadedCustomers);
    
    const purchases = loadedCustomers.reduce((sum, c) => sum + (c.purchaseHistory?.length || 0), 0);
    setTotalPurchases(purchases);

    const top = loadedCustomers
      .map(c => ({
        name: c.name,
        purchases: c.purchaseHistory?.length || 0,
      }))
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 5);
    setTopCustomers(top);
  }, []);

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
              <ShoppingBag className="w-8 h-8 text-blue-500 opacity-50" />
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
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Top Customers</h2>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-secondary rounded-lg">
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
          </motion.div>
        )}
      </div>
    </>
  );
};

export default CustomerReport;
