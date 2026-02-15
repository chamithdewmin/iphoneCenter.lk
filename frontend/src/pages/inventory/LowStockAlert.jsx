import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, Plus, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const qty = (p) => p.quantity ?? p.stock ?? 0;

const LowStockAlert = () => {
  const [products, setProducts] = useState([]);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await authFetch('/api/inventory/products');
    setLoading(false);
    if (!ok) {
      setProducts([]);
      return;
    }
    setProducts(Array.isArray(data?.data) ? data.data : []);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const lowStockProducts = products.filter(p => {
    const n = qty(p);
    return n < 5 && n >= 0;
  });

  const handleRestock = (product) => {
    setRestockProduct(product);
    setRestockQuantity('');
  };

  const handleConfirmRestock = async () => {
    const add = parseInt(restockQuantity, 10);
    if (!restockProduct || !restockQuantity || isNaN(add) || add <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }
    const newQty = qty(restockProduct) + add;
    setSaving(true);
    const { ok, data } = await authFetch('/api/inventory/stock-quantity', {
      method: 'PUT',
      body: JSON.stringify({ productId: restockProduct.id, quantity: newQty }),
    });
    setSaving(false);
    setRestockProduct(null);
    setRestockQuantity('');
    if (!ok) {
      toast({
        title: 'Restock failed',
        description: data?.message || 'Could not update stock',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Product restocked',
      description: `Added ${add} units to ${restockProduct.name || restockProduct.brand}`,
    });
    fetchProducts();
  };

  return (
    <>
      <Helmet>
        <title>Low Stock Alert - iphone center.lk</title>
        <meta name="description" content="View products with low stock" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Low Stock Alert
            </h1>
            <p className="text-muted-foreground mt-1">Products that need restocking (from database)</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Alert Summary */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                {lowStockProducts.length} Product{lowStockProducts.length !== 1 ? 's' : ''} Need Attention
              </h3>
              <p className="text-sm text-muted-foreground">
                These products have stock levels below 5 units
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        {loading ? (
          <div className="bg-card rounded-xl p-12 border border-secondary text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading…</p>
          </div>
        ) : lowStockProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-12 border border-secondary text-center"
          >
            <Package className="w-16 h-16 mx-auto text-green-500 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">All Good!</h3>
            <p className="text-muted-foreground">No products are running low on stock</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lowStockProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-yellow-500/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{product.name || product.sku || product.brand}</h3>
                      <p className="text-sm text-muted-foreground">{product.brand} · {product.sku}</p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Stock</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xl">
                        {qty(product)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold text-primary">
                        LKR {(product.base_price ?? product.basePrice ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleRestock(product)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Restock Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Restock Modal */}
        {restockProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl border border-secondary shadow-lg max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Restock Product</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Product</p>
                  <p className="font-semibold">{restockProduct.name || restockProduct.brand}</p>
                  <p className="text-sm text-muted-foreground">Current Stock: {qty(restockProduct)}</p>
                </div>
                <div>
                  <Label htmlFor="restockQuantity">Quantity to Add *</Label>
                  <Input
                    id="restockQuantity"
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setRestockProduct(null);
                      setRestockQuantity('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmRestock}
                    disabled={saving}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {saving ? 'Saving…' : 'Confirm Restock'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default LowStockAlert;
