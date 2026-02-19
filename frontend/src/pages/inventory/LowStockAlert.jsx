import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, Plus, RefreshCw, Building2 } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/components/Loading';

const qty = (p) => p.quantity ?? p.stock ?? 0;

const LowStockAlert = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(isAdmin ? 'all' : (user?.branchId ?? ''));
  const [products, setProducts] = useState([]);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingBranches(true);
    const res = await authFetch('/api/branches');
    setBranches(Array.isArray(res.data?.data) ? res.data.data : []);
    setLoadingBranches(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (!isAdmin && user?.branchId) setSelectedBranchId(String(user.branchId));
  }, [isAdmin, user?.branchId]);

  const fetchProducts = useCallback(async () => {
    const branchId = selectedBranchId || (isAdmin ? 'all' : user?.branchId);
    if (!branchId && !isAdmin) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = `/api/inventory/stock${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`;
    const { ok, data } = await authFetch(url);
    setLoading(false);
    if (!ok) {
      setProducts([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setProducts(list.map((row) => ({
      id: row.product_id ?? row.id,
      product_id: row.product_id ?? row.id,
      name: row.product_name ?? row.name,
      sku: row.sku,
      brand: row.brand,
      base_price: row.base_price,
      basePrice: row.base_price,
      quantity: row.quantity ?? 0,
    })));
  }, [selectedBranchId, isAdmin, user?.branchId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const lowStockProducts = products.filter((p) => {
    const n = qty(p);
    return n < 5 && n >= 0;
  });

  const effectiveBranchId = isAdmin ? (selectedBranchId === 'all' ? null : selectedBranchId) : (user?.branchId ?? null);
  const canRestock = effectiveBranchId != null && effectiveBranchId !== '';

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
    if (!canRestock) {
      toast({
        title: 'Cannot restock',
        description: 'Select a specific branch to restock.',
        variant: 'destructive',
      });
      return;
    }
    const productId = restockProduct.product_id ?? restockProduct.id;
    const newQty = qty(restockProduct) + add;
    setSaving(true);
    const { ok, data } = await authFetch('/api/inventory/stock-quantity', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity: newQty, branchId: effectiveBranchId }),
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
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Products with low stock by branch' : 'Low stock at your branch'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={!isAdmin}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isAdmin && <option value="all">All Branches</option>}
                {isAdmin && branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>
                ))}
                {!isAdmin && (
                  <option value={user?.branchId ?? ''}>
                    {user?.branchName || user?.branchCode || 'Your branch'}
                  </option>
                )}
              </select>
              {loadingBranches && <span className="text-sm text-muted-foreground">Loading…</span>}
            </div>
            <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
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
          <Loading text={null} fullScreen={false} />
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
                key={product.product_id ?? product.id}
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
                    disabled={!canRestock}
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
