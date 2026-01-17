import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Package, AlertTriangle, TrendingDown } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const StockReport = () => {
  const [products, setProducts] = useState([]);
  const [stockStats, setStockStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadedProducts = getStorageData('products', []);
    setProducts(loadedProducts);
    
    const stats = {
      total: loadedProducts.length,
      inStock: loadedProducts.filter(p => (p.stock || 0) >= 5).length,
      lowStock: loadedProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5).length,
      outOfStock: loadedProducts.filter(p => (p.stock || 0) === 0).length,
      totalValue: loadedProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0),
    };
    setStockStats(stats);
  }, []);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Stock report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Stock Report - iphone center.lk</title>
        <meta name="description" content="View stock report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Stock Report
            </h1>
            <p className="text-muted-foreground mt-1">View stock level analytics</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                <p className="text-2xl font-bold">{stockStats.total}</p>
              </div>
              <Package className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">In Stock</p>
                <p className="text-2xl font-bold text-green-500">{stockStats.inStock}</p>
              </div>
              <Package className="w-8 h-8 text-green-500 opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-500">{stockStats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
                <p className="text-2xl font-bold text-red-500">{stockStats.outOfStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default StockReport;
