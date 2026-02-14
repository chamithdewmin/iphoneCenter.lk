import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Warehouse, Package, DollarSign } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const WarehouseReport = () => {
  const [warehouses, setWarehouses] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadedWarehouses = getStorageData('warehouses', []);
    setWarehouses(loadedWarehouses);
  }, []);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Warehouse report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Warehouse Report - iphone center.lk</title>
        <meta name="description" content="View warehouse report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Warehouse Report
            </h1>
            <p className="text-muted-foreground mt-1">View warehouse analytics</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Warehouses</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
              <Warehouse className="w-8 h-8 text-primary opacity-50" />
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
                <p className="text-sm text-muted-foreground mb-1">Active Warehouses</p>
                <p className="text-2xl font-bold text-green-500">
                  {warehouses.filter(w => w.status === 'active' || !w.status).length}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {warehouses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Warehouse List</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map((warehouse, index) => (
                <div key={warehouse.id} className="p-4 border border-secondary rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Warehouse className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold">{warehouse.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{warehouse.code}</p>
                    </div>
                  </div>
                  {warehouse.manager && (
                    <p className="text-sm text-muted-foreground">Manager: {warehouse.manager}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default WarehouseReport;
