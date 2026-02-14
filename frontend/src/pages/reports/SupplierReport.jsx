import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Building2, Phone, Mail } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SupplierReport = () => {
  const [suppliers, setSuppliers] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadedSuppliers = getStorageData('suppliers', []);
    setSuppliers(loadedSuppliers);
  }, []);

  const handleExport = () => {
    toast({
      title: "Export Successful",
      description: "Supplier report exported successfully",
    });
  };

  return (
    <>
      <Helmet>
        <title>Supplier Report - iphone center.lk</title>
        <meta name="description" content="View supplier report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Supplier Report
            </h1>
            <p className="text-muted-foreground mt-1">View supplier analytics</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="bg-card rounded-xl p-6 border border-secondary shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Suppliers</p>
              <p className="text-2xl font-bold">{suppliers.length}</p>
            </div>
            <Building2 className="w-12 h-12 text-primary opacity-50" />
          </div>
        </div>

        {suppliers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Supplier Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier, index) => (
                <div key={supplier.id} className="p-4 border border-secondary rounded-lg">
                  <h3 className="font-semibold mb-2">{supplier.name}</h3>
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
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

export default SupplierReport;
