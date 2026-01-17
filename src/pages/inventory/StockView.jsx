import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';

const StockView = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadedProducts = getStorageData('products', []);
    setProducts(loadedProducts);
    setFilteredProducts(loadedProducts);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        (product.model || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-600 dark:text-red-400' };
    if (stock < 5) return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' };
    return { label: 'In Stock', color: 'bg-green-500/20 text-green-600 dark:text-green-400' };
  };

  return (
    <>
      <Helmet>
        <title>Product Stock View - iphone center.lk</title>
        <meta name="description" content="View product stock levels" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Product Stock View
          </h1>
          <p className="text-muted-foreground mt-1">View and monitor product stock levels</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
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
                <p className="text-2xl font-bold text-green-500">
                  {products.filter(p => (p.stock || 0) >= 5).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
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
                <p className="text-2xl font-bold text-yellow-500">
                  {products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 5).length}
                </p>
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
                <p className="text-2xl font-bold text-red-500">
                  {products.filter(p => (p.stock || 0) === 0).length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl p-4 border border-secondary shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">No products match your search criteria</p>
          </motion.div>
        ) : (
          <div className="bg-card rounded-xl border border-secondary overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const stockStatus = getStockStatus(product.stock || 0);
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-secondary hover:bg-secondary/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{product.model || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{product.id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{product.brand || product.make || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{product.stock || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-primary">
                          LKR {product.price?.toLocaleString() || '0'}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StockView;
