import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Plus, Eye, DollarSign, Calendar, Package, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStorageData, setStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadedPurchases = getStorageData('purchases', []);
    setPurchases(loadedPurchases);
    setFilteredPurchases(loadedPurchases);
    
    const spent = loadedPurchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
    setTotalSpent(spent);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = purchases.filter(purchase =>
        purchase.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        purchase.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPurchases(filtered);
    } else {
      setFilteredPurchases(purchases);
    }
  }, [searchQuery, purchases]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Helmet>
        <title>Purchase - iphone center.lk</title>
        <meta name="description" content="Manage purchase transactions" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Purchase
            </h1>
            <p className="text-muted-foreground mt-1">View and manage all purchase transactions</p>
          </div>
          <Link to="/trading/purchase/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Purchase
            </Button>
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Purchases</p>
                <p className="text-2xl font-bold">{filteredPurchases.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-500" />
              </div>
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
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-primary">LKR {totalSpent.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-500" />
              </div>
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
                <p className="text-sm text-muted-foreground mb-1">Average Purchase</p>
                <p className="text-2xl font-bold">
                  LKR {filteredPurchases.length > 0 ? (totalSpent / filteredPurchases.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by purchase ID or supplier name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Purchases List */}
        {filteredPurchases.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Purchases Found</h3>
            <p className="text-muted-foreground mb-6">
              {purchases.length === 0 
                ? "No purchase transactions have been recorded yet"
                : "No purchases match your search criteria"}
            </p>
            {purchases.length === 0 && (
              <Link to="/trading/purchase/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Purchase
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredPurchases.map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg font-mono">{purchase.id}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {purchase.supplierName || purchase.supplier?.name || 'Unknown Supplier'}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                          Received
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-medium">{formatDate(purchase.date || purchase.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Items</p>
                            <p className="font-medium">{purchase.items?.length || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-semibold text-primary">
                              LKR {(purchase.total || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
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

export default Purchase;
