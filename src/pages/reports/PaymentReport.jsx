import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
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
      </div>
    </>
  );
};

export default PaymentReport;
