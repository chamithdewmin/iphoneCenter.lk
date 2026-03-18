import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Save, Package, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import WarrantySection from '@/components/warranty/WarrantySection';
import WarrantySummary from '@/components/warranty/WarrantySummary';
import {
  PRODUCT_TYPES,
  decodeWarrantyFromLegacy,
  encodeWarrantyToLegacy,
  WARRANTY_MODES,
} from '@/lib/warranty';
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/placeholder';
import appleLogoBlack from '@/assets/Apple_logo_black.svg';
import appleLogoWhite from '@/assets/Apple_logo_white.svg';

const AddProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isEditMode = !!id;
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    name: '',
    sku: '',
    year: new Date().getFullYear(),
    price: '',
    wholesalePrice: '',
    retailPrice: '',
    stock: '',
    description: '',
    colors: '',
    images: '',
    category: '',
    category_id: '',
    inventory_type: 'quantity',
    condition: 'new',
    // legacy fields kept for backwards compatibility
    warranty_types: [],
    warranty_months: '',
    branchId: '',
  });
  const [warrantyState, setWarrantyState] = useState({
    warranty_mode: WARRANTY_MODES.NONE,
    simple_duration_months: null,
    warranty_profile_id: null,
    complex_items: [],
  });

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

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { ok, data } = await authFetch('/api/categories');
      if (ok && Array.isArray(data?.data)) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    const isAdmin = user?.role === 'admin';
    if (!isAdmin) return;
    setLoadingBranches(true);
    try {
      const { ok, data } = await authFetch('/api/branches');
      if (ok && Array.isArray(data?.data)) {
        setBranches(data.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
    fetchBranches();
  }, [fetchBrands, fetchCategories, fetchBranches]);

  // Load product data if editing
  useEffect(() => {
    if (isEditMode) {
      const loadProduct = async () => {
        try {
          const { ok, data } = await authFetch(`/api/inventory/products/${id}`);
          if (ok && data?.data) {
            const product = data.data;
            const decodedWarranty = decodeWarrantyFromLegacy(product);
            setFormData({
              brand: product.brand || '',
              model: '',
              name: product.name || '',
              sku: product.sku || '',
              year: new Date().getFullYear(),
              price: product.base_price || product.basePrice || '',
              wholesalePrice: product.wholesale_price || '',
              retailPrice: product.retail_price || product.base_price || product.basePrice || '',
              stock: product.stock ?? product.quantity ?? '',
              description: product.description || '',
              colors: product.colors || '',
              images: product.images || '',
              category: product.category || product.category_name || '',
              category_id: product.category_id ?? '',
              inventory_type: product.inventory_type || 'quantity',
              condition: product.condition || 'new',
              warranty_types: [],
              warranty_months: product.warranty_months != null ? String(product.warranty_months) : '',
            });
            setWarrantyState({
              warranty_mode: decodedWarranty.warranty_mode,
              simple_duration_months: decodedWarranty.simple_duration_months,
              warranty_profile_id: decodedWarranty.warranty_profile_id,
              complex_items: decodedWarranty.complex_items || [],
            });
          }
        } catch (error) {
          console.error('Error loading product:', error);
          toast({
            title: "Error",
            description: "Failed to load product data",
            variant: "destructive",
          });
          navigate('/products/list');
        }
      };
      loadProduct();
    }
  }, [id, isEditMode, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If condition changes from new -> used/refurbished, drop Apple Care selection
    if (name === 'condition') {
      const nextCondition = value;
      setFormData((prev) => {
        const nextTypes =
          nextCondition === 'new'
            ? prev.warranty_types
            : prev.warranty_types.filter((t) => t !== 'apple_care');
        return { ...prev, condition: nextCondition, warranty_types: nextTypes };
      });
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWarrantyTypeToggle = (typeKey) => {
    setFormData((prev) => {
      const currentlySelected = prev.warranty_types || [];
      const hasType = currentlySelected.includes(typeKey);
      let nextTypes;
      if (hasType) {
        nextTypes = currentlySelected.filter((t) => t !== typeKey);
      } else {
        nextTypes = [...currentlySelected, typeKey];
      }
      // Apple Care always forces 12 months
      const nextWarrantyMonths =
        nextTypes.includes('apple_care') ? '12' : prev.warranty_months;
      return { ...prev, warranty_types: nextTypes, warranty_months: nextWarrantyMonths };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name?.trim() || [formData.brand, formData.model].filter(Boolean).join(' ').trim();
    if (!name) {
      toast({ title: 'Validation Error', description: 'Product name is required', variant: 'destructive' });
      return;
    }
    const sku = formData.sku?.trim() || `SKU-${Date.now()}`;
    const wholesale = formData.wholesalePrice !== '' ? Number(formData.wholesalePrice) : NaN;
    const retail = formData.retailPrice !== '' ? Number(formData.retailPrice) : NaN;
    // Encode the structured warranty state into legacy API fields
    const legacyWarranty = encodeWarrantyToLegacy(warrantyState);

    if (Number.isNaN(wholesale) || wholesale < 0) {
      toast({ title: 'Validation Error', description: 'Valid wholesale price is required', variant: 'destructive' });
      return;
    }

    if (Number.isNaN(retail) || retail < 0) {
      toast({ title: 'Validation Error', description: 'Valid retail price is required', variant: 'destructive' });
      return;
    }

    if (wholesale > retail) {
      toast({ title: 'Validation Error', description: 'Wholesale price cannot be higher than retail price', variant: 'destructive' });
      return;
    }

    const basePrice = retail;
    setLoading(true);

    if (isEditMode) {
      const payload = {
        name,
        sku,
        description: formData.description || null,
        category: formData.category || null,
        brand: formData.brand || null,
        basePrice: Number(basePrice),
        wholesalePrice: Number(wholesale),
        retailPrice: Number(retail),
        inventory_type: formData.inventory_type || 'quantity',
        category_id: formData.category_id || null,
        condition: formData.condition || 'new',
        warranty_type: legacyWarranty.warranty_type,
        warranty_months: legacyWarranty.warranty_months,
      };
      if (formData.inventory_type === 'quantity') {
        payload.stock = Math.max(0, parseInt(formData.stock, 10) || 0);
      }
      const { ok, data } = await authFetch(`/api/inventory/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setLoading(false);
      if (!ok) {
        toast({ title: 'Could not update product', description: data?.message || 'Please try again', variant: 'destructive' });
        return;
      }
      toast({ title: 'Product Updated', description: `${name} has been updated successfully` });
    } else {
      const branchId = user?.branchId ?? '';
      const initialQuantity = formData.inventory_type === 'quantity' ? Math.max(0, parseInt(formData.stock, 10) || 0) : 0;
      const effectiveBranchId =
        formData.inventory_type === 'quantity'
          ? (formData.branchId || user?.branchId || '')
          : '';
      const { ok, data, status } = await authFetch('/api/inventory/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          sku,
          description: formData.description || null,
          category: formData.category || null,
          brand: formData.brand || null,
          basePrice: Number(basePrice),
          wholesalePrice: Number(wholesale),
          retailPrice: Number(retail),
          inventory_type: formData.inventory_type || 'quantity',
          category_id: formData.category_id || null,
          condition: formData.condition || 'new',
          warranty_type: legacyWarranty.warranty_type,
          initialQuantity,
          stock: initialQuantity,
          warranty_months: legacyWarranty.warranty_months,
          ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
        }),
      });
      setLoading(false);
      if (!ok) {
        const msg = data?.message || 'Please try again';
        const detail = data?.detail ? ` (${data.detail})` : '';
        toast({ title: 'Could not add product', description: msg + detail, variant: 'destructive' });
        return;
      }
      toast({ title: 'Product Added', description: `${name} has been saved to the database` });
    }
    navigate('/products/list');
  };

  return (
    <>
      <Helmet>
        <title>Add Product - iphone center.lk</title>
        <meta name="description" content="Add a new product to your inventory" />
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {isEditMode ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Update product information' : 'Add a new phone or accessory to your inventory'}
          </p>
        </div>

        {/* Two-column layout: left form, right live preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form (left) */}
          <form onSubmit={handleSubmit} className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-secondary shadow-sm">
              <div className="p-6 lg:p-8 space-y-6 lg:space-y-8">
              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Basic Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <select
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      required
                      disabled={loadingBrands}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
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
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(e) => {
                        const opt = categories.find((c) => c.name === e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                          category_id: opt ? String(opt.id) : '',
                        }));
                      }}
                      disabled={loadingCategories}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="">-- Select category --</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {loadingCategories && <p className="text-sm text-muted-foreground mt-1">Loading categories…</p>}
                  </div>
                  <div>
                    <Label htmlFor="inventory_type">Inventory type</Label>
                    <select
                      id="inventory_type"
                      name="inventory_type"
                      value={formData.inventory_type || 'quantity'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, inventory_type: e.target.value }))}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="quantity">Quantity (normal stock)</option>
                      <option value="unique">Unique (IMEI / serial tracked)</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantity: stock by number. Unique: one device per IMEI; add devices on the Add Devices page.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g., iPhone 15 Pro"
                      className="mt-1 text-foreground bg-background"
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
                      className="mt-1 text-foreground bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <select
                      id="condition"
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="wholesalePrice">Wholesale price (LKR) *</Label>
                    <Input
                      id="wholesalePrice"
                      name="wholesalePrice"
                      type="number"
                      value={formData.wholesalePrice}
                      onChange={handleChange}
                      placeholder="Buying cost"
                      min="0"
                      step="0.01"
                      className="mt-1 text-foreground bg-background"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="retailPrice">Retail price (LKR) *</Label>
                    <Input
                      id="retailPrice"
                      name="retailPrice"
                      type="number"
                      value={formData.retailPrice}
                      onChange={handleChange}
                      placeholder="Selling price"
                      min="0"
                      step="0.01"
                      className="mt-1 text-foreground bg-background"
                      required
                    />
                  </div>
                  {formData.inventory_type === 'quantity' && user?.role === 'admin' && (
                    <div>
                      <Label htmlFor="branchId">Branch (for initial stock)</Label>
                      <select
                        id="branchId"
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleChange}
                        disabled={loadingBranches}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      >
                        <option value="">-- Select branch --</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} {b.code ? `(${b.code})` : ''}
                          </option>
                        ))}
                      </select>
                      {loadingBranches && (
                        <p className="text-sm text-muted-foreground mt-1">Loading branches…</p>
                      )}
                    </div>
                  )}
                  {formData.inventory_type === 'quantity' && (
                    <div>
                      <Label htmlFor="stock">Stock quantity</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        className="mt-1 text-foreground bg-background"
                      />
                    </div>
                  )}
                  {formData.inventory_type === 'unique' && (
                    <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                      Stock is managed via devices (IMEI). Add devices on the <strong>Add Devices</strong> page after saving this product.
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="border-t border-secondary pt-6">
                <h2 className="text-xl font-semibold mb-4">Additional Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Product description..."
                      rows="4"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                  </div>

                  {/* Warranty configuration */}
                  <div className="md:col-span-2 lg:col-span-3">
                    {(() => {
                      const categoryName = (formData.category || '').trim();
                      const isSmartPhoneCategory =
                        categoryName.toLowerCase() === 'smart phones';
                      const productType = isSmartPhoneCategory
                        ? PRODUCT_TYPES.PHONE
                        : PRODUCT_TYPES.NORMAL;
                      return (
                    <WarrantySection
                        productType={productType}
                        condition={formData.condition || 'new'}
                        warrantyState={warrantyState}
                        onWarrantyChange={(updater) => {
                          if (typeof updater === 'function') {
                            setWarrantyState((prev) => updater(prev));
                          } else {
                            setWarrantyState(updater);
                          }
                        }}
                        warrantyProfiles={[]}
                        isSmartPhoneCategory={isSmartPhoneCategory}
                      />
                      );
                    })()}
                  </div>

                  <div>
                    <Label htmlFor="colors">Colors (comma-separated)</Label>
                    <Input
                      id="colors"
                      name="colors"
                      value={formData.colors}
                      onChange={handleChange}
                      placeholder="e.g., Black, White, Blue"
                      className="mt-1 text-foreground bg-background"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="images">Image URLs (comma-separated)</Label>
                    <Input
                      id="images"
                      name="images"
                      value={formData.images}
                      onChange={handleChange}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      className="mt-1 text-foreground bg-background"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-secondary p-6 bg-secondary/30 mt-4 rounded-xl bg-gradient-to-t from-secondary/40 to-secondary/10">
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
                  {loading ? (isEditMode ? 'Updating…' : 'Saving…') : (isEditMode ? 'Update Product' : 'Save Product')}
                </Button>
              </div>
            </div>
            </div>
          </form>

          {/* Live Preview (right) */}
          <aside className="bg-card rounded-xl border border-secondary shadow-sm lg:sticky lg:top-20 overflow-hidden">
            <div className="border-b border-secondary px-5 py-4">
              <h2 className="text-base font-semibold">Product Preview</h2>
            </div>

            {(() => {
              const brand = (formData.brand || '').trim();
              const model = (formData.model || '').trim();
              const nameFallback = [brand, model].filter(Boolean).join(' ') || 'New Product';
              const categoryName = (formData.category || '').trim() || 'No category';
              const priceNumber = formData.retailPrice !== ''
                ? Number(formData.retailPrice)
                : formData.price !== ''
                  ? Number(formData.price)
                  : null;
              const images = (formData.images || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              const mainImage = images[0] || PLACEHOLDER_PRODUCT_IMAGE;

              const colors = (formData.colors || '')
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean);

              return (
                <div className="flex flex-col">
                  {/* Image */}
                  <div className="relative aspect-square bg-secondary overflow-hidden">
                    <img
                      src={mainImage}
                      alt={nameFallback}
                      className="w-full h-full object-cover"
                    />
                    {/* Category pill */}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur px-3 py-1">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/80 text-[10px] font-semibold text-white uppercase">
                        {categoryName.charAt(0) || 'C'}
                      </span>
                      <span className="text-[11px] font-medium text-white">
                        {categoryName}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold truncate">
                        {nameFallback}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formData.year || new Date().getFullYear()} ·{' '}
                        {formData.condition
                          ? formData.condition.charAt(0).toUpperCase() +
                            formData.condition.slice(1)
                          : 'New'}
                      </p>
                    </div>

                    {/* Price + stock summary */}
                    <div className="flex items-center justify-between border border-secondary rounded-lg px-3 py-2 bg-secondary/40">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-muted-foreground">
                          Retail price
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {priceNumber != null && !Number.isNaN(priceNumber)
                            ? `LKR ${priceNumber.toLocaleString()}`
                            : 'Not set'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground block">
                          Initial stock
                        </span>
                        <span className="text-sm font-semibold">
                          {formData.stock !== '' ? formData.stock : 0}
                        </span>
                      </div>
                    </div>

                    {/* Warranty summary */}
                    <div className="border border-secondary rounded-lg px-3 py-2 bg-secondary/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Warranty</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/60 border border-secondary text-muted-foreground">
                          Live preview
                        </span>
                      </div>
                      <div className="mt-1">
                        <WarrantySummary warranty={warrantyState} />
                      </div>
                    </div>

                    {/* Brand + colors */}
                    <div className="border border-secondary rounded-lg px-3 py-2 bg-secondary/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">
                            Brand
                          </span>
                          <span className="text-sm font-semibold">
                            {brand || 'Not set'}
                          </span>
                        </div>
                      </div>

                      {colors.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[11px] text-muted-foreground block mb-1">
                            Colors
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {colors.slice(0, 5).map((color, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 rounded-full border border-white/60 shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                            {colors.length > 5 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{colors.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </aside>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
