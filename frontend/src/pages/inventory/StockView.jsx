import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Package, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const StockView = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await authFetch('/api/inventory/products');
    setLoading(false);
    if (!ok) {
      setProducts([]);
      setFilteredProducts([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setProducts(list);
    setFilteredProducts(list);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredProducts(products.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    ));
  }, [searchQuery, products]);

  const getStockStatus = (stock) => {
    const qty = stock ?? 0;
    if (qty === 0) return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-600 dark:text-red-400' };
    if (qty < 5) return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' };
    return { label: 'In Stock', color: 'bg-green-500/20 text-green-600 dark:text-green-400' };
  };

  const qty = (p) => p.quantity ?? p.stock ?? 0;

  return (
    <>
      <Helmet>
        <title>Product Stock View - iphone center.lk</title>
        <meta name="description" content="View product stock levels" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Product Stock View
            </h1>
            <p className="text-muted-foreground mt-1">View and monitor product stock levels from database</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                  {products.filter(p => qty(p) >= 5).length}
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
                  {products.filter(p => qty(p) > 0 && qty(p) < 5).length}
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
                  {products.filter(p => qty(p) === 0).length}
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
        {loading ? (
          <div className="bg-card rounded-xl p-12 border border-secondary text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading stock…</p>
          </div>
        ) : filteredProducts.length === 0 ? (
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
                    const stockStatus = getStockStatus(qty(product));
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
                            <p className="font-medium">{product.name || product.sku || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{product.brand || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{qty(product)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-primary">
                          LKR {(product.base_price ?? product.basePrice ?? 0).toLocaleString()}
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
