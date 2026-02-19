import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, User, Check, Plus } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const SelectCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { ok, data } = await authFetch('/api/customers');
      const list = ok && Array.isArray(data?.data) ? data.data : [];
      setCustomers(list);
      setFilteredCustomers(list);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredCustomers(customers.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(searchQuery) ||
      (c.email || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, customers]);

  const handleSelect = (customer) => {
    setSelectedCustomer(customer);
    toast({
      title: "Customer Selected",
      description: `${customer.name} has been selected`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Select Customer - iphone center.lk</title>
        <meta name="description" content="Select customer for sale" />
      </Helmet>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Select Customer
          </h1>
          <p className="text-muted-foreground mt-1">Select a customer for the current sale</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 icon-circle-gradient rounded-full flex items-center justify-center text-white font-bold">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
              </div>
              <Check className="w-6 h-6 text-primary" />
            </div>
          </motion.div>
        )}

        {filteredCustomers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Customers Found</h3>
            <p className="text-muted-foreground mb-6">
              {customers.length === 0 
                ? "No customers available"
                : "No customers match your search criteria"}
            </p>
            {customers.length === 0 && (
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelect(customer)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedCustomer?.id === customer.id
                    ? 'border-primary bg-primary/10'
                    : 'border-secondary hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{customer.name}</h3>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                  {selectedCustomer?.id === customer.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SelectCustomer;
