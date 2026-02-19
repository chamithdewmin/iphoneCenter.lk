import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowRightLeft, Save, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Loading from '@/components/Loading';

const TransferStock = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fromBranchId: '',
    toBranchId: '',
    productId: '',
    quantity: '',
    notes: '',
  });
  const { toast } = useToast();

  const fetchBranchesAndProducts = useCallback(async () => {
    setLoading(true);
    const [branchesRes, productsRes] = await Promise.all([
      authFetch('/api/branches?forTransfer=1'),
      authFetch('/api/inventory/products'),
    ]);
    const branchList = Array.isArray(branchesRes.data?.data) ? branchesRes.data.data : [];
    const productList = Array.isArray(productsRes.data?.data) ? productsRes.data.data : [];
    setBranches(branchList);
    setProducts(productList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBranchesAndProducts();
  }, [fetchBranchesAndProducts]);

  const toBranchOptions = branches.filter((b) => String(b.id) !== String(formData.fromBranchId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fromBranchId || !formData.toBranchId || !formData.productId || !formData.quantity || Number(formData.quantity) < 1) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in From warehouse, To location, Product, and Quantity.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    const { ok, data } = await authFetch('/api/inventory/transfers', {
      method: 'POST',
      body: JSON.stringify({
        fromBranchId: formData.fromBranchId,
        toBranchId: formData.toBranchId,
        productId: formData.productId,
        quantity: Number(formData.quantity),
        notes: formData.notes || undefined,
      }),
    });
    setSubmitting(false);
    if (!ok) {
      toast({
        title: 'Transfer failed',
        description: data?.message || 'Could not complete transfer.',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Stock transferred',
      description: data?.message || 'Transfer completed successfully.',
    });
    setFormData({
      fromBranchId: '',
      toBranchId: '',
      productId: '',
      quantity: '',
      notes: '',
    });
  };

  return (
    <>
      <Helmet>
        <title>Transfer Stock - iphone center.lk</title>
        <meta name="description" content="Transfer stock between warehouse and shop" />
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Transfer Stock
          </h1>
          <p className="text-muted-foreground mt-1">Transfer stock between branches (warehouses)</p>
        </div>

        {loading ? (
          <Loading text={null} fullScreen={false} />
        ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Transfer Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromBranchId">From Warehouse *</Label>
                    <select
                      id="fromBranchId"
                      name="fromBranchId"
                      value={formData.fromBranchId}
                      onChange={(e) => setFormData({ ...formData, fromBranchId: e.target.value, toBranchId: '' })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="">Select warehouse</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="toBranchId">To Location *</Label>
                    <select
                      id="toBranchId"
                      name="toBranchId"
                      value={formData.toBranchId}
                      onChange={(e) => setFormData({ ...formData, toBranchId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="">Select destination</option>
                      {toBranchOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Product Selection</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productId">Product *</Label>
                    <select
                      id="productId"
                      name="productId"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || p.sku} {p.sku ? `(${p.sku})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      min="1"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Transfer notes..."
                      rows="3"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-secondary p-6 bg-secondary/30">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Transfer Stock
              </Button>
            </div>
          </div>
        </form>
        )}
      </div>
    </>
  );
};

export default TransferStock;
