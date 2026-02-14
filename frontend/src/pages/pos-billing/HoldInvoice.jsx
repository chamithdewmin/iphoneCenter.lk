import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Pause, Play, Eye, Trash2, Calendar } from 'lucide-react';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const HoldInvoice = () => {
  const [heldInvoices, setHeldInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadedHeld = getStorageData('heldInvoices', []);
    setHeldInvoices(loadedHeld);
    setFilteredInvoices(loadedHeld);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = heldInvoices.filter(invoice =>
        invoice.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(heldInvoices);
    }
  }, [searchQuery, heldInvoices]);

  const handleResume = (invoiceId) => {
    toast({
      title: "Resume Invoice",
      description: "Invoice resumed for completion",
    });
  };

  const handleDelete = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this held invoice?')) {
      const updated = heldInvoices.filter(inv => inv.id !== invoiceId);
      setHeldInvoices(updated);
      setFilteredInvoices(updated);
      setStorageData('heldInvoices', updated);
      toast({
        title: "Invoice Deleted",
        description: "Held invoice has been deleted",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Hold Invoice - iphone center.lk</title>
        <meta name="description" content="Hold invoice for later" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Hold Invoice
          </h1>
          <p className="text-muted-foreground mt-1">View and manage held invoices</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by invoice ID or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Pause className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Held Invoices</h3>
            <p className="text-muted-foreground">
              {heldInvoices.length === 0 
                ? "No invoices are currently on hold"
                : "No held invoices match your search criteria"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg font-mono">{invoice.id}</h3>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                          On Hold
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {invoice.customerName || 'Unknown Customer'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(invoice.heldAt || invoice.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="font-semibold text-primary">
                          LKR {(invoice.total || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleResume(invoice.id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(invoice.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HoldInvoice;
