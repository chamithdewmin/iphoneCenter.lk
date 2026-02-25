import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Navigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddDevices = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  if (user?.role && !isAdmin && !isManager) {
    return <Navigate to="/dashboard" replace />;
  }
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    branchId: '',
    imeiSingle: '',
    imeiBulk: '',
    purchasePrice: '',
  });

  const fetchUniqueProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { ok, data } = await authFetch('/api/inventory/products?inventory_type=unique');
      if (ok && Array.isArray(data?.data)) {
        setProducts(data.data);
        if (data.data.length > 0 && !formData.productId) {
          setFormData((prev) => ({ ...prev, productId: String(data.data[0].id) }));
        }
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingBranches(true);
    const res = await authFetch('/api/branches');
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    setBranches(list);
    if (list.length > 0 && !formData.branchId) {
      setFormData((prev) => ({ ...prev, branchId: String(list[0].id) }));
    }
    setLoadingBranches(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchUniqueProducts();
  }, [fetchUniqueProducts]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (!isAdmin && user?.branchId) {
      setFormData((prev) => ({ ...prev, branchId: String(user.branchId) }));
    }
  }, [isAdmin, user?.branchId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productId = formData.productId?.trim();
    if (!productId) {
      toast({ title: 'Validation Error', description: 'Select a product', variant: 'destructive' });
      return;
    }
    const branchId = formData.branchId || user?.branchId;
    if (!branchId) {
      toast({ title: 'Validation Error', description: 'Branch is required', variant: 'destructive' });
      return;
    }

    const single = formData.imeiSingle?.trim();
    const bulkLines = (formData.imeiBulk || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const imeiList = single ? [single, ...bulkLines] : bulkLines;

    if (imeiList.length === 0) {
      toast({ title: 'Validation Error', description: 'Enter at least one IMEI (single or bulk paste)', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const body = {
        productId: parseInt(productId, 10),
        imeis: imeiList,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
      };
      if (isAdmin && branchId) body.branchId = parseInt(branchId, 10);

      const { ok, data } = await authFetch('/api/inventory/imei', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setLoading(false);

      if (!ok) {
        toast({
          title: 'Could not add devices',
          description: data?.message || 'Please try again',
          variant: 'destructive',
        });
        return;
      }

      const added = data?.data?.added?.length ?? 0;
      const errors = data?.data?.errors?.length ?? 0;
      toast({
        title: 'Devices added',
        description: `${added} device(s) added${errors ? `; ${errors} failed (duplicate or invalid IMEI)` : ''}.`,
      });
      setFormData((prev) => ({ ...prev, imeiSingle: '', imeiBulk: '' }));
    } catch (err) {
      setLoading(false);
      toast({ title: 'Error', description: err?.message || 'Request failed', variant: 'destructive' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Add Devices (IMEI) - iphone center.lk</title>
        <meta name="description" content="Add devices (IMEI) for unique products" />
      </Helmet>

      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add Devices (IMEI)
          </h1>
          <p className="text-muted-foreground mt-1">
            Add stock for unique (IMEI-tracked) products. Only products with inventory type &quot;Unique&quot; appear here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-secondary shadow-sm p-6">
          {isAdmin && (
            <div className="mb-6">
              <Label htmlFor="branchId">Branch</Label>
              <select
                id="branchId"
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                required
                disabled={loadingBranches}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground mt-1"
              >
                <option value="">-- Select branch --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} {b.code ? `(${b.code})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <Label htmlFor="productId">Product (unique only)</Label>
            <select
              id="productId"
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              required
              disabled={loadingProducts}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground mt-1"
            >
              <option value="">-- Select product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
            {loadingProducts && <p className="text-sm text-muted-foreground mt-1">Loading products…</p>}
            {!loadingProducts && products.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">No unique products. Add a product with inventory type &quot;Unique&quot; first.</p>
            )}
          </div>

          <div className="mb-6">
            <Label htmlFor="imeiSingle">Single IMEI (15 digits)</Label>
            <Input
              id="imeiSingle"
              name="imeiSingle"
              value={formData.imeiSingle}
              onChange={handleChange}
              placeholder="e.g. 123456789012345"
              maxLength={20}
              className="mt-1 text-foreground bg-background"
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="imeiBulk">Bulk paste (one IMEI per line)</Label>
            <textarea
              id="imeiBulk"
              name="imeiBulk"
              value={formData.imeiBulk}
              onChange={handleChange}
              placeholder="Paste multiple IMEIs, one per line"
              rows={6}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm mt-1"
            />
          </div>

          <div className="mb-6">
            <Label htmlFor="purchasePrice">Cost price (optional, LKR)</Label>
            <Input
              id="purchasePrice"
              name="purchasePrice"
              type="number"
              value={formData.purchasePrice}
              onChange={handleChange}
              placeholder="Optional"
              min="0"
              step="0.01"
              className="mt-1 text-foreground bg-background"
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/inventory/stock-view')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || products.length === 0}>
              <Smartphone className="w-4 h-4 mr-2" />
              {loading ? 'Adding…' : 'Add devices'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddDevices;
