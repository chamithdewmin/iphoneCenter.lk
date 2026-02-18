import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Upload, AlertCircle, Package, RefreshCw, Building2 } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const Inventory = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(isAdmin ? 'all' : (user?.branchId ?? ''));
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
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
      toast({
        title: 'Failed to load inventory',
        description: data?.message || 'Please log in again.',
        variant: 'destructive',
      });
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
      category: row.category,
      base_price: row.base_price,
      basePrice: row.base_price,
      quantity: row.quantity ?? 0,
      barcode: row.barcode,
    })));
  }, [toast, selectedBranchId, isAdmin, user?.branchId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleQuantityChange = (productId, value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setProducts((prev) =>
      prev.map((p) => ((p.product_id ?? p.id) === productId ? { ...p, quantity: num } : p))
    );
  };

  const effectiveBranchId = isAdmin ? (selectedBranchId === 'all' ? null : selectedBranchId) : (user?.branchId ?? null);
  const canEdit = selectedBranchId !== 'all' && effectiveBranchId;

  const handleSaveQuantity = async (product) => {
    const productId = product.product_id ?? product.id;
    const quantity = product.quantity ?? 0;
    if (!effectiveBranchId) {
      toast({ title: 'Cannot edit', description: 'Select a specific branch to update stock.', variant: 'destructive' });
      return;
    }
    setSavingId(productId);
    const body = { productId, quantity, branchId: effectiveBranchId };
    const { ok, data } = await authFetch('/api/inventory/stock-quantity', {
      method: 'PUT',
      body: JSON.stringify(body),
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
      p.product_id ?? p.id,
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
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'View stock by branch or all branches' : 'Stock for your branch'}
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
            <p className="text-muted-foreground">Loading inventory…</p>
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
                  {products.map((row, index) => {
                    const productId = row.product_id ?? row.id;
                    const qty = row.quantity ?? 0;
                    return (
                      <motion.tr
                        key={productId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-secondary hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm">{productId}</td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-semibold">{row.name || row.sku || '—'}</div>
                            <div className="text-sm text-muted-foreground">{row.brand && `${row.brand}`}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">{row.sku || '—'}</td>
                        <td className="px-4 py-3">
                          LKR {(row.base_price ?? row.basePrice ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {canEdit && editingId === productId ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={qty}
                                onChange={(e) => handleQuantityChange(productId, e.target.value)}
                                className="w-20 px-2 py-1 bg-background border border-input rounded text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveQuantity(row)}
                                disabled={savingId === productId}
                              >
                                {savingId === productId ? 'Saving…' : 'Save'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : canEdit ? (
                            <button
                              type="button"
                              onClick={() => setEditingId(productId)}
                              className="font-medium text-primary hover:underline"
                            >
                              {qty}
                            </button>
                          ) : (
                            <span>{qty}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">{row.barcode || '—'}</td>
                        <td className="px-4 py-3">
                          {qty <= 0 && (
                            <span className="flex items-center gap-1 text-red-500 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              Out of stock
                            </span>
                          )}
                          {qty > 0 && qty <= 2 && (
                            <span className="flex items-center gap-1 text-amber-500 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              Low stock
                            </span>
                          )}
                          {qty > 2 && (
                            <span className="text-green-600 dark:text-green-400 text-sm">In stock</span>
                          )}
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

export default Inventory;
