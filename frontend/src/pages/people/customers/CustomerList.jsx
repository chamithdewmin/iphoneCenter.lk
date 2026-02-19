import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, Mail, Phone, MapPin, ShoppingBag, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Loading from '@/components/Loading';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    const { ok, data } = await authFetch('/api/customers');
    setLoading(false);
    if (!ok) {
      setError(data?.message || 'Failed to load customers.');
      setCustomers([]);
      setFilteredCustomers([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setCustomers(list);
    setFilteredCustomers(list);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const filtered = customers.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  return (
    <>
      <Helmet>
        <title>Customer List - iphone center.lk</title>
        <meta name="description" content="View and manage all customers" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Customer List
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all your customers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCustomers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/people/customers/add">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </Link>
          </div>
        </div>

        {error && <div className="text-destructive text-sm">{error}</div>}

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Customers Grid */}
        {loading ? (
          <Loading text={null} fullScreen={false} />
        ) : filteredCustomers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Customers Found</h3>
            <p className="text-muted-foreground mb-6">
              {customers.length === 0 
                ? "Get started by adding your first customer"
                : "No customers match your search criteria"}
            </p>
            {customers.length === 0 && (
              <Link to="/people/customers/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Customer
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  {/* Avatar and Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 icon-circle-gradient rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{customer.name}</h3>
                        <p className="text-xs text-muted-foreground">ID: {customer.id}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // View customer details
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Purchase History */}
                  <div className="pt-4 border-t border-secondary">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Purchases</span>
                      </div>
                      <span className="font-semibold">
                        {customer.purchaseHistory?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredCustomers.length > 0 && (
          <div className="bg-card rounded-xl p-4 border border-secondary">
            <p className="text-sm text-muted-foreground text-center">
              Showing <span className="font-semibold text-foreground">{filteredCustomers.length}</span> of{' '}
              <span className="font-semibold text-foreground">{customers.length}</span> customers
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerList;
