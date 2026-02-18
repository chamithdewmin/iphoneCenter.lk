import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Save, Package, X, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    branchId: '',
    brand: '',
    model: '',
    name: '',
    sku: '',
    year: new Date().getFullYear(),
    price: '',
    stock: '',
    imei: '',
    description: '',
    category: '',
  });

  const fetchBranches = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingBranches(true);
    const res = await authFetch('/api/branches');
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    setBranches(list);
    setFormData(prev => (prev.branchId ? prev : { ...prev, branchId: list[0]?.id?.toString() ?? '' }));
    setLoadingBranches(false);
  }, [isAdmin]);

  const fetchBrands = useCallback(async () => {
    setLoadingBrands(true);
    try {
      const { ok, data } = await authFetch('/api/brands');
      if (ok && Array.isArray(data?.data)) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    fetchBrands();
  }, [fetchBranches, fetchBrands]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name?.trim() || [formData.brand, formData.model].filter(Boolean).join(' ').trim();
    if (!name) {
      toast({ title: 'Validation Error', description: 'Product name is required', variant: 'destructive' });
      return;
    }
    if (isAdmin && !formData.branchId) {
      toast({ title: 'Validation Error', description: 'Please select a branch', variant: 'destructive' });
      return;
    }
    const sku = formData.sku?.trim() || formData.imei?.trim() || `SKU-${Date.now()}`;
    const basePrice = parseFloat(formData.price);
    if (isNaN(basePrice) || basePrice < 0) {
      toast({ title: 'Validation Error', description: 'Valid base price is required', variant: 'destructive' });
      return;
    }
    const initialQuantity = Math.max(0, parseInt(formData.stock, 10) || 0);
    const branchId = isAdmin ? formData.branchId : (user?.branchId ?? '');
    setLoading(true);
    const { ok, data } = await authFetch('/api/inventory/products', {
      method: 'POST',
      body: JSON.stringify({
        name,
        sku,
        description: formData.description || null,
        category: formData.category || null,
        brand: formData.brand || null,
        basePrice,
        initialQuantity,
        ...(branchId ? { branchId } : {}),
      }),
    });
    setLoading(false);
    if (!ok) {
      toast({ title: 'Could not add product', description: data?.message || 'Please try again', variant: 'destructive' });
      return;
    }
    toast({ title: 'Product Added', description: `${name} has been saved to the database` });
    navigate('/products/list');
  };

  return (
    <>
      <Helmet>
        <title>Add Product - iphone center.lk</title>
        <meta name="description" content="Add a new product to your inventory" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add Product
          </h1>
          <p className="text-muted-foreground mt-1">Add a new phone or accessory to your inventory</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-6">
              {/* Branch: Admin = dropdown, Manager/Staff = read-only */}
              <div className="border-b border-secondary pb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Branch</h2>
                </div>
                {isAdmin ? (
                  <div>
                    <Label htmlFor="branchId">Select Branch *</Label>
                    <select
                      id="branchId"
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleChange}
                      required
                      disabled={loadingBranches}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="">-- Select branch --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.code ? `(${b.code})` : ''}
                        </option>
                      ))}
                    </select>
                    {loadingBranches && <p className="text-sm text-muted-foreground mt-1">Loading branches…</p>}
                  </div>
                ) : (
                  <div>
                    <Label>Branch</Label>
                    <div className="mt-1 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground cursor-not-allowed">
                      {user?.branchName || user?.branchCode || 'Your branch'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Products are added to your branch only.</p>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <select
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                      disabled={loadingBrands}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="">-- Select brand --</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    {loadingBrands && <p className="text-sm text-muted-foreground mt-1">Loading brands…</p>}
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g., iPhone 15 Pro"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleChange}
                      min="2010"
                      max={new Date().getFullYear() + 1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <select
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="new">New</option>
                      <option value="used">Used</option>
                      <option value="refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Pricing & Stock</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (LKR) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Identification</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="imei">IMEI / Serial Number</Label>
                    <Input
                      id="imei"
                      name="imei"
                      value={formData.imei}
                      onChange={handleChange}
                      placeholder="IMEI or Serial Number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN (if applicable)</Label>
                    <Input
                      id="vin"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      placeholder="Vehicle Identification Number"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="colors">Colors (comma-separated)</Label>
                    <Input
                      id="colors"
                      name="colors"
                      value={formData.colors}
                      onChange={handleChange}
                      placeholder="e.g., Black, White, Blue"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Product description..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="images">Image URLs (comma-separated)</Label>
                    <Input
                      id="images"
                      name="images"
                      value={formData.images}
                      onChange={handleChange}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-secondary p-6 bg-secondary/30">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/products/list')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving…' : 'Save Product'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddProduct;
