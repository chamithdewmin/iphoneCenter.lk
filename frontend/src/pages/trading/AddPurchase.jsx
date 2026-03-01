import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Save, ShoppingCart, X, Plus, Minus, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStorageData, setStorageData } from '@/utils/storage';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const AddPurchase = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [purchaseItems, setPurchaseItems] = useState([]);

  useEffect(() => {
    const loadedSuppliers = getStorageData('suppliers', []);
    setSuppliers(loadedSuppliers);
  }, []);

  useEffect(() => {
    (async () => {
      setProductsLoading(true);
      const { ok, data } = await authFetch('/api/inventory/products');
      setProductsLoading(false);
      const list = (ok && Array.isArray(data?.data)) ? data.data : [];
      setProducts(list);
      setFilteredProducts(list);
    })();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        (product.name || '').toLowerCase().includes(searchLower) ||
        (product.brand || product.make || '').toLowerCase().includes(searchLower) ||
        (product.sku || '').toLowerCase().includes(searchLower) ||
        (product.model || '').toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const getWholesalePrice = (product) =>
    product.wholesale_price != null ? Number(product.wholesale_price)
      : product.wholesalePrice != null ? Number(product.wholesalePrice)
      : product.base_price != null ? Number(product.base_price)
      : product.basePrice != null ? Number(product.basePrice)
      : product.price != null ? Number(product.price) : 0;

  const handleAddProduct = (product) => {
    const wholesale = getWholesalePrice(product);
    const existingItem = purchaseItems.find(item => item.id === product.id);
    if (existingItem) {
      setPurchaseItems(purchaseItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setPurchaseItems([...purchaseItems, {
        ...product,
        quantity: 1,
        unitPrice: wholesale,
      }]);
    }
    toast({
      title: "Product Added",
      description: `${product.name || product.model || product.brand} added to purchase`,
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const qty = Math.max(1, parseInt(newQuantity, 10) || 1);
    setPurchaseItems(purchaseItems.map(item =>
      item.id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const updateUnitPrice = (productId, value) => {
    const num = parseFloat(value);
    const price = Number.isNaN(num) || num < 0 ? 0 : num;
    setPurchaseItems(purchaseItems.map(item =>
      item.id === productId ? { ...item, unitPrice: price } : item
    ));
  };

  const removeItem = (productId) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => {
      const up = item.unitPrice != null ? item.unitPrice : (item.price || 0);
      return sum + up * (item.quantity || 0);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    if (purchaseItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add products to the purchase",
        variant: "destructive",
      });
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);
    const newPurchase = {
      id: `PUR-${Date.now()}`,
      supplierId: formData.supplierId,
      supplierName: supplier?.name || 'Unknown',
      supplier: supplier,
      items: purchaseItems.map((item) => ({
        id: item.id,
        name: item.name || item.model || item.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice != null ? item.unitPrice : (item.price || 0),
        subtotal: (item.unitPrice != null ? item.unitPrice : (item.price || 0)) * item.quantity,
      })),
      total: calculateTotal(),
      date: formData.date,
      notes: formData.notes || '',
      createdAt: new Date().toISOString(),
    };

    const purchases = getStorageData('purchases', []);
    setStorageData('purchases', [...purchases, newPurchase]);

    // Update local product stock if still using storage elsewhere (optional)
    const updatedProducts = products.map(product => {
      const purchaseItem = purchaseItems.find(item => item.id === product.id);
      if (purchaseItem) {
        return { ...product, stock: (product.stock || 0) + purchaseItem.quantity };
      }
      return product;
    });
    setStorageData('products', updatedProducts);

    toast({
      title: "Purchase Added",
      description: `Purchase ${newPurchase.id} has been recorded successfully`,
    });

    navigate('/trading/purchase');
  };

  return (
    <>
      <Helmet>
        <title>Add Purchase - iphone center.lk</title>
        <meta name="description" content="Add a new purchase transaction" />
      </Helmet>

      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Add Purchase
          </h1>
          <p className="text-muted-foreground mt-1">Record a new purchase transaction</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supplier Selection */}
              <div className="bg-card rounded-xl border border-secondary shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Supplier Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supplierId">Supplier *</Label>
                    <select
                      id="supplierId"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      required
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="date">Purchase Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-card rounded-xl border border-secondary shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Add Products</h2>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {productsLoading ? (
                    <p className="text-sm text-muted-foreground py-4">Loading products...</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No products found</p>
                  ) : (
                    filteredProducts.map(product => {
                      const wholesale = getWholesalePrice(product);
                      const retail = product.retail_price ?? product.base_price ?? product.basePrice ?? product.price ?? 0;
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleAddProduct(product)}
                          className="p-3 border border-secondary rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{product.name || product.model || product.brand}</p>
                              <p className="text-sm text-muted-foreground">
                                {(product.brand || product.make) && `${product.brand || product.make} · `}
                                Retail: LKR {Number(retail).toLocaleString()} · Wholesale: LKR {wholesale.toLocaleString()}
                              </p>
                            </div>
                            <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-secondary shadow-sm sticky top-6">
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">Purchase Items</h2>
                  {purchaseItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items added yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {purchaseItems.map(item => {
                        const unitPrice = item.unitPrice != null ? item.unitPrice : (item.price || 0);
                        const lineTotal = unitPrice * (item.quantity || 0);
                        return (
                          <div key={item.id} className="p-3 border border-secondary rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{item.name || item.model || item.brand}</p>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">Qty</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, e.target.value)}
                                  className="h-8 mt-0.5"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Wholesale / unit (LKR)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={unitPrice}
                                  onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                                  className="h-8 mt-0.5"
                                />
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-primary">
                              Line total: LKR {lineTotal.toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {purchaseItems.length > 0 && (
                    <div className="pt-4 border-t border-secondary">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-lg text-primary">
                          LKR {calculateTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-secondary space-y-3">
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Purchase notes..."
                        rows="3"
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate('/trading/purchase')}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save Purchase
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddPurchase;
