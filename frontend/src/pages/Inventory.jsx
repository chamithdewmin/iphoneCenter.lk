import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Upload, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await authFetch('/api/inventory/products');
    setLoading(false);
    if (!ok) {
      toast({
        title: 'Failed to load inventory',
        description: data?.message || 'Please log in again.',
        variant: 'destructive',
      });
      setProducts([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setProducts(list);
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleQuantityChange = (id, value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: num } : p))
    );
  };

  const handleSaveQuantity = async (product) => {
    const quantity = product.quantity ?? 0;
    setSavingId(product.id);
    const { ok, data } = await authFetch('/api/inventory/stock-quantity', {
      method: 'PUT',
      body: JSON.stringify({ productId: product.id, quantity }),
    });
    setSavingId(null);
    setEditingId(null);
    if (!ok) {
      toast({
        title: 'Update failed',
        description: data?.message || 'Could not update stock',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Stock updated', description: `Quantity saved for ${product.name || product.sku}` });
    fetchProducts();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'SKU', 'Brand', 'Category', 'Base Price', 'Quantity', 'Barcode'];
    const rows = products.map((p) => [
      p.id,
      p.name || '',
      p.sku || '',
      p.brand || '',
      p.category || '',
      p.base_price ?? p.basePrice ?? 0,
      p.quantity ?? 0,
      p.barcode || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: 'Export successful', description: 'Inventory exported to CSV' });
  };

  return (
    <>
      <Helmet>
        <title>Inventory - iphone center.lk</title>
        <meta name="description" content="Manage your phone and accessory inventory" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-muted-foreground mt-1">Products and stock from database (quantity is total across branches)</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={fetchProducts} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportCSV} variant="outline" disabled={products.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" disabled>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="bg-card rounded-xl p-12 border border-secondary text-center">
            <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading inventory from database…</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-card rounded-xl p-12 border border-secondary text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No products in inventory</h3>
            <p className="text-muted-foreground">Add products from Product List → Add Product. They will appear here with quantity 0 until you set stock.</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-secondary overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">SKU</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Base price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Barcode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-secondary hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">{product.id}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold">{product.name || product.sku || '—'}</div>
                          <div className="text-sm text-muted-foreground">{product.brand && `${product.brand}`}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{product.sku || '—'}</td>
                      <td className="px-4 py-3">
                        LKR {(product.base_price ?? product.basePrice ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={product.quantity ?? 0}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              className="w-20 px-2 py-1 bg-background border border-input rounded text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveQuantity(product)}
                              disabled={savingId === product.id}
                            >
                              {savingId === product.id ? 'Saving…' : 'Save'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingId(product.id)}
                            className="font-medium text-primary hover:underline"
                          >
                            {product.quantity ?? 0}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{product.barcode || '—'}</td>
                      <td className="px-4 py-3">
                        {(product.quantity ?? 0) <= 0 && (
                          <span className="flex items-center gap-1 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Out of stock
                          </span>
                        )}
                        {(product.quantity ?? 0) > 0 && (product.quantity ?? 0) <= 2 && (
                          <span className="flex items-center gap-1 text-amber-500 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Low stock
                          </span>
                        )}
                        {(product.quantity ?? 0) > 2 && (
                          <span className="text-green-600 dark:text-green-400 text-sm">In stock</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Inventory;
