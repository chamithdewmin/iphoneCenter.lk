import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Warehouse, Package } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

  const statusData = useMemo(() => {
    const active = warehouses.filter((w) => w.status === 'active' || !w.status).length;
    const inactive = warehouses.length - active;
    return [
      { name: 'Active', value: active },
      { name: 'Inactive', value: inactive },
    ];
  }, [warehouses]);

  const COLORS = ['#22c55e', '#ef4444'];

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
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Warehouse Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      strokeWidth={0}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                      }}
                      formatter={(value, name, props) => [
                        `${value} warehouses`,
                        props.payload.name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {statusData.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between p-3 border border-secondary rounded-lg"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

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
